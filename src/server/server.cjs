"use strict";

// ─── Core dependencies ────────────────────────────────────────────────────────
const express        = require("express");
const http           = require("http");
const mongoose       = require("mongoose");
const cors           = require("cors");
const jwt            = require("jsonwebtoken");
const { request }    = require("undici");
const socketIo       = require("socket.io");
const nodemailer     = require("nodemailer");
const { v4: uuidv4 } = require("uuid");
const cookieParser   = require("cookie-parser");
const rateLimit      = require("express-rate-limit");
const { gunzipSync, brotliDecompressSync, inflateSync } = require("zlib");
const crypto         = require("crypto");
const cloudinary     = require("cloudinary").v2;
const multer         = require("multer");
const path = require('path');

// ─── App setup ────────────────────────────────────────────────────────────────
const app    = express();
app.use(express.static(path.join(__dirname, "../../dist")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../../dist", "index.html"));
});
const server = http.createServer(app);

app.use(cookieParser());
app.use(express.json());
app.use(cors());

// ─── Socket.IO ────────────────────────────────────────────────────────────────
const io = socketIo(server, {
  cors: {
    origin:  "https://insajder.tips",
    methods: ["GET", "POST"],
  },
});

// ─── Constants ────────────────────────────────────────────────────────────────
const JWT_SECRET = "unlockstheworld.";

const MONTH_NAMES = [
  "January", "February", "March",     "April",   "May",      "June",
  "July",    "August",   "September", "October", "November", "December",
];

// ─── Cloudinary ───────────────────────────────────────────────────────────────
cloudinary.config({
  cloud_name: "dq2bh78fn",
  api_key:    "587517854453255",
  api_secret: "2GWL_DTDDBTzdX8YwZwGt73efN0",
});
const DROPPING_ODDS_URL =
  "https://www.oddsmath.com/api/v1/dropping-odds.json/";

// ─── Nodemailer ───────────────────────────────────────────────────────────────
// Each action uses a different app password, so we create a fresh transport per send.
async function sendMail({ pass, ...options }) {
  const transport = nodemailer.createTransport({
    service: "gmail",
    auth: { user: "insajderxtips@gmail.com", pass },
  });
  return transport.sendMail(options);
}

// ─── Multer ───────────────────────────────────────────────────────────────────
// Limit uploads to a single ≤5 MB image/PDF so the payment endpoint can't be
// used to push arbitrary large files to Cloudinary.
const uploadZ = multer({
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    const ok = /^image\//.test(file.mimetype) || file.mimetype === "application/pdf";
    cb(ok ? null : new Error("Nepodržan tip fajla."), ok);
  },
});

// ─── MongoDB ──────────────────────────────────────────────────────────────────
mongoose
  .connect(
    "mongodb://insajderxtips_db_user:Teemo123321_@ac-44n6phc-shard-00-00.fj78zbs.mongodb.net:27017,ac-44n6phc-shard-00-01.fj78zbs.mongodb.net:27017,ac-44n6phc-shard-00-02.fj78zbs.mongodb.net:27017/?ssl=true&replicaSet=atlas-yi3jdt-shard-0&authSource=admin&appName=InsajderCluster"
  )
  .then(() => console.log("Successfully connected to MongoDB."))
  .catch((err) => console.error("MongoDB connection error:", err));

// ─── Schemas & Models ─────────────────────────────────────────────────────────
const UserSchema = new mongoose.Schema(
  {
    email:    { type: String, required: true, unique: true },
    password: { type: String, required: true },
    username: { type: String, required: true, unique: true },

    lastUsernameChange:   { type: Date,    default: null },
    tier:                 { type: String,  default: "free" },
    isVerified:           { type: Boolean, required: true, default: false },
    verificationCode:     { type: String },
    codeExpiresAt:        { type: Date },
    resetPasswordToken:   { type: String },
    resetPasswordExpires: { type: Date },
    defaultCurrency:      { type: String, default: "EUR" },

    statistics: {
      totalBets:   { type: Number, default: 0 },
      totalWins:   { type: Number, default: 0 },
      totalLosses: { type: Number, default: 0 },
      winRate:     { type: Number, default: 0 },
      totalProfit: { type: Number, default: 0 },
      initialInvestment: { type: Number, default: null },

      monthlyStats: {
        type: [
          {
            month:         { type: String, required: true },
            totalBets:     { type: Number, default: 0 },
            totalWins:     { type: Number, default: 0 },
            totalLosses:   { type: Number, default: 0 },
            monthlyProfit: { type: Number, default: 0 },
            bets:          { type: Array,  default: [] },
          },
        ],
        default: MONTH_NAMES.map((month) => ({
          month,
          totalBets: 0, totalWins: 0, totalLosses: 0, monthlyProfit: 0, bets: [],
        })),
      },

      avgBetAmount:              { type: Number, default: 0 },
      averageReturnOnInvestment: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

const TipSchema = new mongoose.Schema({
  tipTitle:          { type: String,  required: true },
  tip:               { type: String,  required: true },
  type:              { type: String,  enum: ["free", "premium"], required: true, index: true },
  active:            { type: Boolean, default: true, index: true },
  league:            String,
  date:              Date,
  confidencePercent: { type: Number, min: 0, max: 100 },
  stars:             { type: Number, min: 1, max: 5 },
  home:              { type: String, required: true },
  away:              { type: String, required: true },
  homeLogo:          String,
  awayLogo:          String,
  analysis:          String,
  stats: {
    possession: String,
    shots:      String,
    form:       String,
  },
  lineups:  { home: [String], away: [String] },
  injuries: { home: [String], away: [String] },
});

const tipStatSchema = new mongoose.Schema(
  {
    id:     String,
    match:  String,
    tip:    String,
    odds:   String,
    stake:  String,
    status: String,
    date:   String,
    sport:  String,
    profit: Number,
    grupa:  String,
  },
  { collection: "stats" }
);

const PaymentSchema = new mongoose.Schema({
  imageUrl:    { type: String },
  userEmail:   { type: String, required: true },
  userName:    { type: String, required: true },
  paymentType: { type: String, required: true },
  mtcn:        { type: String },
});

const User    = mongoose.model("User",    UserSchema);
const Tip     = mongoose.model("Tip",     TipSchema);
const TipStat = mongoose.model("TipStat", tipStatSchema);
const Payment = mongoose.model("Payment", PaymentSchema);

// ─── Rate limiters ────────────────────────────────────────────────────────────
const oddsLimiter = rateLimit({ windowMs: 1000, max: 1 });

const paymentLimiter = rateLimit({
  windowMs:        300_000,
  max:             3,
  message:         "Previše zahteva za plaćanje s ove IP adrese, pokušajte ponovo kasnije (za 12 sati) ili nas kontaktirajte",
  standardHeaders: true,
  legacyHeaders:   false,
});

// Throttle auth + email-sending routes to curb brute force and email bombing.
const authLimiter = rateLimit({
  windowMs:        15 * 60 * 1000, // 15 minutes
  max:             10,
  message:         { message: "Previše pokušaja. Pokušajte ponovo kasnije." },
  standardHeaders: true,
  legacyHeaders:   false,
});

// ─── Auth middleware ──────────────────────────────────────────────────────────
const verifyToken = (req, res, next) => {
  const authHeader = req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Doslo je do greske. Probajte se ponovo ulogovati." });
  }

  const token = authHeader.replace("Bearer ", "");

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    console.error("JWT error:", err.message);
    return res.status(401).json({ message: "Doslo je do greske. Probajte se ponovo ulogovati." });
  }
};

// ─── Shared helpers ───────────────────────────────────────────────────────────

/** Generates a 6-digit string verification code. */
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/** Returns a blank monthly-stats array for all 12 months. */
function buildDefaultMonthlyStats() {
  return MONTH_NAMES.map((month) => ({
    month,
    bets:          [],
    monthlyProfit: 0,
    totalBets:     0,
    totalWins:     0,
    totalLosses:   0,
  }));
}

/**
 * Maps shared bet-type IDs to a bookmaker key on the `odds` object.
 *
 * Most bookmakers (soccerBet, maxBet, oktagon, merkur, brazil) use the exact
 * same numeric bet-type codes. Only the value accessor differs:
 *   - "direct" sources (maxBet, oktagon, merkur, brazil): currentOdds[code]
 *   - "betMap" source  (soccerBet):                       betMap[code]?.NULL?.ov
 *
 * @param {object}   odds      - The shared odds accumulator object.
 * @param {string}   bookmaker - Key to write into, e.g. "soccerBet".
 * @param {function} get       - (code: string) => value
 */
function applySharedOdds(odds, bookmaker, get) {
  // ── Konačan ishod ──────────────────────────────────────────────────────────
  odds.ki["1"][bookmaker]                 = get("1");
  odds.ki["x"][bookmaker]                 = get("2");
  odds.ki["2"][bookmaker]                 = get("3");
  odds.ki.doubleChance_1X[bookmaker]      = get("7");
  odds.ki.doubleChance_12[bookmaker]      = get("8");
  odds.ki.doubleChance_X2[bookmaker]      = get("9");
  odds.ki.w1[bookmaker]                   = get("264");
  odds.ki.w2[bookmaker]                   = get("265");
  odds.ki.homeAnd3Plus[bookmaker]         = get("287");
  odds.ki.homeAnd4Plus[bookmaker]         = get("314");
  odds.ki.awayAnd3Plus[bookmaker]         = get("288");
  odds.ki.awayAnd4Plus[bookmaker]         = get("315");
  odds.ki.homeAndGG[bookmaker]            = get("365");
  odds.ki.awayAndGG[bookmaker]            = get("366");
  odds.ki.homeAndHome3Plus[bookmaker]     = get("50266");
  odds.ki.awayAndAway3Plus[bookmaker]     = get("50267");
  odds.ki.winBothHalves1[bookmaker]       = get("295");
  odds.ki.winBothHalves2[bookmaker]       = get("296");
  odds.ki.winToNil1[bookmaker]            = get("282");
  odds.ki.winToNil2[bookmaker]            = get("283");

  // Only maxBet carries these two
  if (bookmaker === "maxBet") {
    odds.ki.homeAndHome2Plus[bookmaker]   = get("419");
    odds.ki.awayAndAway2Plus[bookmaker]   = get("420");
  }

  // ── Goals ──────────────────────────────────────────────────────────────────
  odds.goals.over1_5[bookmaker]           = get("242");
  odds.goals.over2_5[bookmaker]           = get("24");
  odds.goals.over_3_5[bookmaker]          = get("25");
  odds.goals.over_4_5[bookmaker]          = get("27");
  odds.goals.over_5_5[bookmaker]          = get("223");
  odds.goals.over_6_5[bookmaker]          = get("28");
  odds.goals.under1_5[bookmaker]          = get("21");
  odds.goals.under2_5[bookmaker]          = get("22");
  odds.goals.under3_5[bookmaker]          = get("219");
  odds.goals.gg[bookmaker]                = get("272");
  odds.goals.ng[bookmaker]                = get("273");
  odds.goals.gg3[bookmaker]               = get("303");
  odds.goals.gg4[bookmaker]               = get("304");
  odds.goals.oneToTwo[bookmaker]          = get("278");
  odds.goals.oneToThree[bookmaker]        = get("279");
  odds.goals.oneToFour[bookmaker]         = get("280");
  odds.goals.twoToThree[bookmaker]        = get("23");
  odds.goals.twoToFour[bookmaker]         = get("243");
  odds.goals.twoToFive[bookmaker]         = get("333");
  odds.goals.twoToSix[bookmaker]          = get("220");
  odds.goals.threeToFour[bookmaker]       = get("244");
  odds.goals.threeToFive[bookmaker]       = get("281");
  odds.goals.threeToSix[bookmaker]        = get("382");
  odds.goals.firstMore[bookmaker]         = get("29");
  odds.goals.secondMore[bookmaker]        = get("31");
  odds.goals.equalGoals[bookmaker]        = get("30");
  odds.goals.even[bookmaker]              = get("231");
  odds.goals.odd[bookmaker]               = get("232");

  // ── Home goals ─────────────────────────────────────────────────────────────
  odds.homeGoals.over_0_5[bookmaker]      = get("238");
  odds.homeGoals.over_1_5[bookmaker]      = get("248");
  odds.homeGoals.over_2_5[bookmaker]      = get("276");
  odds.homeGoals.over_3_5[bookmaker]      = get("555");
  odds.homeGoals.zeroToOne[bookmaker]     = get("247");
  odds.homeGoals.zeroToTwo[bookmaker]     = get("551");
  odds.homeGoals.first_0_5[bookmaker]     = get("307");
  odds.homeGoals.first_1_5[bookmaker]     = get("274");
  odds.homeGoals.second_0_5[bookmaker]    = get("312");
  odds.homeGoals.second_1_5[bookmaker]    = get("297");

  // ── Away goals ─────────────────────────────────────────────────────────────
  odds.awayGoals.over_0_5[bookmaker]      = get("240");
  odds.awayGoals.over_1_5[bookmaker]      = get("250");
  odds.awayGoals.over_2_5[bookmaker]      = get("277");
  odds.awayGoals.over_3_5[bookmaker]      = get("556");
  odds.awayGoals.zeroToOne[bookmaker]     = get("249");
  odds.awayGoals.first_0_5[bookmaker]     = get("308");
  odds.awayGoals.first_1_5[bookmaker]     = get("275");
  odds.awayGoals.second_0_5[bookmaker]    = get("313");
  odds.awayGoals.second_1_5[bookmaker]    = get("298");

  // ── First half ─────────────────────────────────────────────────────────────
  odds.firstHalf.ki1[bookmaker]             = get("4");
  odds.firstHalf.kix[bookmaker]             = get("5");
  odds.firstHalf.ki2[bookmaker]             = get("6");
  odds.firstHalf.gg[bookmaker]              = get("291");
  odds.firstHalf.over_0_5[bookmaker]        = get("207");
  odds.firstHalf.over_1_5[bookmaker]        = get("208");
  odds.firstHalf.over_2_5[bookmaker]        = get("209");
  odds.firstHalf.over_3_5[bookmaker]        = get("210");
  odds.firstHalf.zeroToOne[bookmaker]       = get("211");
  odds.firstHalf.zeroToTwo[bookmaker]       = get("472");
  odds.firstHalf.oneToTwo[bookmaker]        = get("476");
  odds.firstHalf.oneToThree[bookmaker]      = get("477");
  odds.firstHalf.twoToThree[bookmaker]      = get("212");

  // pg1 / pg2 use different codes per bookmaker
  if (bookmaker === "soccerBet") {
    odds.firstHalf.pg1[bookmaker] = get("792");
    odds.firstHalf.pg2[bookmaker] = get("794");
  } else if (bookmaker === "maxBet") {
    odds.firstHalf.pg1[bookmaker] = get("204");
    odds.firstHalf.pg2[bookmaker] = get("206");
  }

  // ── Second half ────────────────────────────────────────────────────────────
  odds.secondHalf.ki1[bookmaker]       = get("235");
  odds.secondHalf.kix[bookmaker]       = get("236");
  odds.secondHalf.ki2[bookmaker]       = get("237");
  odds.secondHalf.over_0_5[bookmaker]  = get("213");
  odds.secondHalf.over_1_5[bookmaker]  = get("214");
  odds.secondHalf.over_2_5[bookmaker]  = get("215");
  odds.secondHalf.over_3_5[bookmaker]  = get("216");
  odds.secondHalf.zeroToOne[bookmaker] = get("217");
  odds.secondHalf.zeroToTwo[bookmaker] = get("474");
  odds.secondHalf.oneToTwo[bookmaker]  = get("606");
  odds.secondHalf.oneToThree[bookmaker]= get("607");
  odds.secondHalf.twoToThree[bookmaker]= get("218");
  odds.secondHalf.gg[bookmaker]        = get("299");

  // ── HT/FT ──────────────────────────────────────────────────────────────────
  odds.htft.hh[bookmaker] = get("10");
  odds.htft.hx[bookmaker] = get("11");
  odds.htft.ha[bookmaker] = get("12");
  odds.htft.xh[bookmaker] = get("13");
  odds.htft.xx[bookmaker] = get("14");
  odds.htft.xa[bookmaker] = get("15");
  odds.htft.ah[bookmaker] = get("16");
  odds.htft.ax[bookmaker] = get("17");
  odds.htft.aa[bookmaker] = get("18");

  // ── Correct score (Tačan rezultat) ──────────────────────────────────────────
  odds.correctScore.s00[bookmaker] = get("51");
  odds.correctScore.s10[bookmaker] = get("52");
  odds.correctScore.s01[bookmaker] = get("53");
  odds.correctScore.s11[bookmaker] = get("67");
  odds.correctScore.s20[bookmaker] = get("54");
  odds.correctScore.s02[bookmaker] = get("55");
  odds.correctScore.s21[bookmaker] = get("68");
  odds.correctScore.s12[bookmaker] = get("69");
  odds.correctScore.s22[bookmaker] = get("82");
  odds.correctScore.s30[bookmaker] = get("56");
  odds.correctScore.s03[bookmaker] = get("57");
  odds.correctScore.s31[bookmaker] = get("70");
  odds.correctScore.s13[bookmaker] = get("71");
  odds.correctScore.s32[bookmaker] = get("83");
  odds.correctScore.s23[bookmaker] = get("84");
  odds.correctScore.s40[bookmaker] = get("58");
  odds.correctScore.s04[bookmaker] = get("59");

  // ── Goals per half (combos), exact goals, Asian handicap ────────────────────
  odds.halfGoalCombos.i1ii1[bookmaker] = get("363");
  odds.halfGoalCombos.i1ii2[bookmaker] = get("316");
  odds.halfGoalCombos.i2ii1[bookmaker] = get("317");
  odds.halfGoalCombos.i2ii2[bookmaker] = get("364");

  odds.exactGoals.g1[bookmaker] = get("320");
  odds.exactGoals.g2[bookmaker] = get("221");
  odds.exactGoals.g3[bookmaker] = get("222");
  odds.exactGoals.g4[bookmaker] = get("321");
  odds.exactGoals.g5[bookmaker] = get("322");

  // European handicap (three match-specific lines: a=hd2, b=handicap2, c=handicap3)
  odds.handicap.h1a[bookmaker] = get("201");
  odds.handicap.hxa[bookmaker] = get("202");
  odds.handicap.h2a[bookmaker] = get("203");
  odds.handicap.h1b[bookmaker] = get("421");
  odds.handicap.hxb[bookmaker] = get("422");
  odds.handicap.h2b[bookmaker] = get("423");
  odds.handicap.h1c[bookmaker] = get("424");
  odds.handicap.hxc[bookmaker] = get("425");
  odds.handicap.h2c[bookmaker] = get("426");

  // ── Korneri 1X2 (which team wins the corner count) ──────────────────────────
  // Shared SVN codes (verified vs Betole site + Meridian, two matches): 51102 =
  // home more corners, 51103 = equal, 51104 = away more corners.
  odds.cornersWinner.home[bookmaker] = get("51102");
  odds.cornersWinner.none[bookmaker] = get("51103");
  odds.cornersWinner.away[bookmaker] = get("51104");

  // First corner (which team wins corner #1)
  odds.firstCorner.home[bookmaker] = get("50057");
  odds.firstCorner.away[bookmaker] = get("50058");

  // ── Gol Gol (BTTS variants; codes verified by two-match intersection) ────────
  odds.btts.gg[bookmaker]         = get("272");
  odds.btts.ng[bookmaker]         = get("273");
  odds.btts.ggIp[bookmaker]       = get("291");
  odds.btts.ngIp[bookmaker]       = get("292");
  odds.btts.ggIIp[bookmaker]      = get("299");
  odds.btts.ngIIp[bookmaker]      = get("300");
  odds.btts.gg3[bookmaker]        = get("303");
  odds.btts.gg4[bookmaker]        = get("304");
  odds.btts.gg2to3[bookmaker]     = get("50314");
  odds.btts.ggBoth2[bookmaker]    = get("50219");
  odds.btts.ggEachHalf[bookmaker] = get("55203");
}

/**
 * Safely reads an undici response body as JSON.
 * Returns null (and logs a warning) if the response is not JSON or parsing fails,
 * so one bad bookmaker never crashes the whole odds request.
 *
 * @param {object} response  - undici response object
 * @param {string} label     - bookmaker name for logging
 * @returns {object|null}
 */
async function safeParseUndiciJson(response, label) {
  try {
    const contentType = response.headers["content-type"] || "";
    // undici's `request` does NOT auto-decompress (unlike fetch), and some books
    // (e.g. SoccerBet) gzip unconditionally — so decode by content-encoding first.
    const enc = String(response.headers["content-encoding"] || "").toLowerCase();
    const buf = Buffer.from(await response.body.arrayBuffer());
    const text = enc.includes("br")
      ? brotliDecompressSync(buf).toString("utf-8")
      : enc.includes("gzip")
      ? gunzipSync(buf).toString("utf-8")
      : enc.includes("deflate")
      ? inflateSync(buf).toString("utf-8")
      : buf.toString("utf-8");

    if (!contentType.includes("application/json")) {
      console.warn(`[${label}] Non-JSON response (${response.statusCode}):`, text.slice(0, 200));
      return null;
    }
    return JSON.parse(text);
  } catch (err) {
    console.warn(`[${label}] Failed to parse response:`, err.message);
    return null;
  }
}

/**
 * Normalizes a team name for fuzzy cross-bookmaker comparison
 * (lowercase, strip diacritics & punctuation, drop common club suffixes).
 */
function normalizeTeamName(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\b(fc|fk|kk|cf|sc|ac|if|bk|nk|sk|club|women|u19|u20|u21|u23|ii)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Similarity score between two team names: shared tokens (>=3 chars) + containment bonus. */
function teamSimilarity(a, b) {
  const na = normalizeTeamName(a);
  const nb = normalizeTeamName(b);
  if (!na || !nb) return 0;
  const ta = new Set(na.split(" ").filter((t) => t.length >= 3));
  const tb = new Set(nb.split(" ").filter((t) => t.length >= 3));
  let shared = 0;
  for (const t of ta) if (tb.has(t)) shared++;
  const containment = na.includes(nb) || nb.includes(na) ? 1 : 0;
  return shared + containment;
}

// Outright / special-market wording (tournament & group winners, top scorer, exact
// points, elimination phase, placement, multi-team combos, …). Used to keep both the
// search results and the match-picker to real head-to-head fixtures only.
const OUTRIGHT_RE = /(winner|pobednik|pobednic|prvak|grupa|grupi|grupe|šampion|sampion|top ?\d|strelac|igrac|igrač|specijal|special|trostruk|dvojna|mesto|plasman|prolaz|kvalif|faza|eliminacij|reprezentac|najbolji|bodova|finale|polufinale|osvaja|test)/i;

// True when an esMatch is an outright/special rather than a real two-team fixture.
// The tell-tale sign is no real opponent: away is empty / "." / "-" / "out", teams
// listed with "/", or special wording in the team/league names.
function isOutrightMatch(m) {
  const home = String(m.home || "");
  const away = String(m.away || "").trim();
  if (!away || [".", "-", "out"].includes(away.toLowerCase())) return true;
  if (home.includes("/") || away.includes("/")) return true;
  return OUTRIGHT_RE.test(home) || OUTRIGHT_RE.test(away) ||
         OUTRIGHT_RE.test(m.leagueName || "") || OUTRIGHT_RE.test(m.leagueToken || "");
}

/**
 * Picks the football match from a bookmaker's esMatches that corresponds to the
 * selected game. Matches on sport (football only), kickoff time, and — when several
 * games share a kickoff — disambiguates by team-name similarity. This prevents
 * attaching a basketball game's or a different match's odds to the wrong selection.
 *
 * @returns {object|null} the best-matching esMatch, or null if none is convincing.
 */
function pickFootballMatch(esMatches, { date, home, away }) {
  if (!Array.isArray(esMatches)) return null;

  const targetTs = Number(date);

  const isValidFootball = (m) =>
    m &&
    m.sport === "S" &&
    !m.blocked &&
    m.status === 0 &&
    m.ticketPrintType === 0 &&
    !isOutrightMatch(m);

  const football = esMatches.filter(isValidFootball);
  if (football.length === 0) return null;

  // Keep candidates near the target kickoff so we don't grab a different fixture
  // between the same teams; team-name similarity is the primary ranking signal
  // (we no longer let an exact-kickoff special crowd out the real match).
  const windowed = football.filter((m) => Math.abs(Number(m.kickOffTime) - targetTs) <= 6 * 3600 * 1000);
  const pool = windowed.length ? windowed : football;

  let best = null;
  let bestScore = -1;
  let bestDelta = Infinity;
  for (const m of pool) {
    // Score by team similarity, also trying the swapped orientation in case the
    // bookmaker lists home/away reversed.
    const direct  = teamSimilarity(m.home, home) + teamSimilarity(m.away, away);
    const swapped = teamSimilarity(m.home, away) + teamSimilarity(m.away, home);
    const score   = Math.max(direct, swapped);
    const delta   = Math.abs(Number(m.kickOffTime) - targetTs);
    if (score > bestScore || (score === bestScore && delta < bestDelta)) {
      best = m;
      bestScore = score;
      bestDelta = delta;
    }
  }

  // Require at least one solid team-name overlap (e.g. "Canada") to trust the pick.
  // This tolerates cross-bookmaker spelling drift on the other side (Bosnia/Bosna,
  // Herzegovina/Hercegovina) while still rejecting unrelated fixtures.
  if (bestScore < 2) return null;
  return best;
}

/**
 * Fetches a bookmaker's match detail page (oktagon / merkur / brazil pattern),
 * finds the correct football match (by kickoff + teams), then maps odds via applySharedOdds.
 * Fails silently so one bookmaker never blocks the rest.
 */
async function fetchAndApplyDetailOdds({ searchJson, date, home, away, matchUrl, bookmaker, odds }) {
  if (!searchJson?.esMatches) return;

  const match = pickFootballMatch(searchJson.esMatches, { date, home, away });
  if (!match) return;

  const url = matchUrl(match.id);

  try {
    const response    = await fetch(url);
    const contentType = response.headers.get("content-type") || "";

    if (!contentType.includes("application/json")) {
      const text = await response.text();
      console.warn(`[${bookmaker}] Detail endpoint returned non-JSON (${response.status}):`, text.slice(0, 200));
      return;
    }

    const detailJson  = await response.json();
    const currentOdds = detailJson.odds;

    if (currentOdds) {
      applySharedOdds(odds, bookmaker, (code) => currentOdds[code]);
    }

    // European-handicap line labels (the SVN match detail carries the line values;
    // grp 4498→hd2, 5060→handicap2, 5061→handicap3). First detail with a line wins.
    applyHandicapLineLabels(odds, detailJson.params);
  } catch (err) {
    console.error(`[${bookmaker}] Detail fetch failed:`, err.message);
  }
}

// Sets the European-handicap reference labels (e.g. "H1 (-1)") from SVN match params.
function applyHandicapLineLabels(odds, params) {
  if (!odds.handicap || !params) return;
  const fmt = (v) => { const n = Number(v); return Number.isFinite(n) ? (n > 0 ? `+${n}` : `${n}`) : ""; };
  const setLine = (suffix, raw) => {
    const lbl = fmt(raw);
    // Only set once (don't let a less-complete book overwrite an already-labelled line).
    if (!lbl || odds.handicap[`h1${suffix}`].reference !== "H1") return;
    odds.handicap[`h1${suffix}`].reference = `H1 (${lbl})`;
    odds.handicap[`hx${suffix}`].reference = `HX (${lbl})`;
    odds.handicap[`h2${suffix}`].reference = `H2 (${lbl})`;
  };
  setLine("a", params.hd2);
  setLine("b", params.handicap2);
  setLine("c", params.handicap3);
}

/* ───────────────────────── MeridianBet ─────────────────────────────────────
 * Meridian's API is gated behind an anonymous OAuth token.
 *   1. Token:  POST https://auth.meridianbet.com/oauth/token
 *              Authorization: Basic base64(CLIENT_NAME ":" sha512(CLIENT_ID + utc"YYYYMMDDHH"))
 *              body: grant_type=general&username=&password=
 *      (CLIENT_NAME/CLIENT_ID are XOR-obfuscated in their bundle; decrypted values
 *       are hardcoded below. The client secret rotates hourly via the sha512 hash.)
 *   2. Search: GET  https://online.meridianbet.com/betshop/api/v4/search?term=..&page=0&sportId=58
 *              headers: Authorization: Bearer <token>, Accept-Language: sr, HTTP-Language: sr
 *              → payload.events / payload.bets : [{ id, sportId(58=football), rivals:[home,away], startTime(ms), offerType }]
 *   3. Odds:   GET  https://online.meridianbet.com/betshop/api/v2/events/{id}/markets?gameGroupId=all
 *              → payload: { <n>: { marketName, markets:[{ overUnder, selections:[{ name, price, state }] }] } }
 * Odds value = selection.price; mapped by (marketName, selection.name [, overUnder]).
 * --------------------------------------------------------------------------- */
const MERIDIAN_CLIENT_NAME = "web-serbia";
const MERIDIAN_CLIENT_ID   = "zF9zVU3LsdjvpHv";
const MERIDIAN_AUTH        = "https://auth.meridianbet.com";
const MERIDIAN_API         = "https://online.meridianbet.com/betshop";
const MERIDIAN_HEADERS     = { "Accept": "application/json", "Accept-Language": "sr", "HTTP-Language": "sr" };

// Token cache (the access_token is reused until ~1 min before expiry).
let _meridianToken = { value: null, expiresAt: 0 };

function meridianBasicAuth() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  const stamp = `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}${p(d.getUTCHours())}`;
  const secret = crypto.createHash("sha512").update(MERIDIAN_CLIENT_ID + stamp).digest("hex");
  return "Basic " + Buffer.from(`${MERIDIAN_CLIENT_NAME}:${secret}`).toString("base64");
}

async function getMeridianToken() {
  if (_meridianToken.value && Date.now() < _meridianToken.expiresAt) return _meridianToken.value;
  const res = await request(`${MERIDIAN_AUTH}/oauth/token`, {
    method: "POST",
    headers: { "Authorization": meridianBasicAuth(), "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=general&username=&password=",
  });
  if (res.statusCode !== 200) {
    console.warn(`[meridian] token failed: ${res.statusCode}`);
    return null;
  }
  const json = await res.body.json();
  _meridianToken = {
    value: json.access_token,
    expiresAt: Date.now() + Math.max(0, (Number(json.expires_in) || 600) - 60) * 1000,
  };
  return _meridianToken.value;
}

// Picks the football event from Meridian search results matching our selected game.
function pickMeridianMatch(events, { date, home, away }) {
  if (!Array.isArray(events)) return null;
  const targetTs = Number(date);
  const football = events.filter(
    (e) =>
      e && e.sportId === 58 && Array.isArray(e.rivals) && e.rivals.length === 2 &&
      e.offerType === "STANDARD_BET" &&
      !/Pobednik|Strelac|Prvenstvo|Najbolji|Plasman|Grupa/i.test(e.rivals.join(" "))
  );
  if (!football.length) return null;
  const exact = football.filter((e) => Number(e.startTime) === targetTs);
  const pool = exact.length ? exact : football.filter((e) => Math.abs(Number(e.startTime) - targetTs) <= 6 * 3600 * 1000);
  if (!pool.length) return null;
  let best = null, bestScore = -1;
  for (const e of pool) {
    const score = teamSimilarity(e.rivals[0], home) + teamSimilarity(e.rivals[1], away);
    if (score > bestScore) { bestScore = score; best = e; }
  }
  if (!exact.length && bestScore < 2) return null;
  return best;
}

// Maps Meridian's markets payload onto the shared odds accumulator under the "meridian" key.
function applyMeridianOdds(odds, payload, bm = "meridian", homeName = "", awayName = "") {
  const groups = payload && typeof payload === "object" ? Object.values(payload) : [];
  const norm = (s) => String(s || "").replace(/\s+/g, " ").trim().toLowerCase();
  const get = (marketName, selName, ou) => {
    const want = norm(marketName);
    for (const g of groups) {
      if (norm(g.marketName) !== want) continue;
      for (const m of (g.markets || [])) {
        if (ou != null && Number(m.overUnder) !== ou) continue;
        const sel = (m.selections || []).find(
          (s) => (s.name || "").trim() === selName && typeof s.price === "number" && s.state === "ACTIVE"
        );
        if (sel) return sel.price;
      }
    }
    return undefined;
  };

  // Konačan ishod (1X2) + double chance
  odds.ki["1"][bm]            = get("Konačan Ishod", "1");
  odds.ki["x"][bm]            = get("Konačan Ishod", "X");
  odds.ki["2"][bm]            = get("Konačan Ishod", "2");
  odds.ki.doubleChance_1X[bm] = get("Dupla Šansa", "1X");
  odds.ki.doubleChance_12[bm] = get("Dupla Šansa", "12");
  odds.ki.doubleChance_X2[bm] = get("Dupla Šansa", "X2");

  // Korneri 1X2 (which team wins the corner count): selections 1 / X / 2
  odds.cornersWinner.home[bm] = get("Korneri 1x2", "1");
  odds.cornersWinner.none[bm] = get("Korneri 1x2", "X");
  odds.cornersWinner.away[bm] = get("Korneri 1x2", "2");
  odds.firstCorner.home[bm]   = get("Korner Broj 1", "1");
  odds.firstCorner.away[bm]   = get("Korner Broj 1", "2");

  // Gol Gol (BTTS), half-BTTS and combos — exact Meridian market/selection names.
  odds.btts.gg[bm]         = get("Oba Tima Daju Gol", "GG");
  odds.btts.ng[bm]         = get("Oba Tima Daju Gol", "NG");
  odds.btts.ggIp[bm]       = get("Prvo Poluvreme - Oba Tima Daju Gol", "I GG");
  odds.btts.ngIp[bm]       = get("Prvo Poluvreme - Oba Tima Daju Gol", "I NG");
  odds.btts.ggIIp[bm]      = get("Drugo Poluvreme - Oba Tima Daju Gol", "II GG");
  odds.btts.ngIIp[bm]      = get("Drugo Poluvreme - Oba Tima Daju Gol", "II NG");
  odds.btts.gg3[bm]        = get("Oba Tima Daju Gol I Ukupno Golova", "GG&3+");
  odds.btts.gg4[bm]        = get("Kombinacije Golova", "GG&4+");
  odds.btts.gg2to3[bm]     = get("Oba Tima Daju Gol I Kombinacije Golova", "GG&2-3");
  odds.btts.ggBoth2[bm]    = get("Kombinacije Golova", "D2+&G2+");

  // Goals (totals + GG/NG)
  odds.goals.over1_5[bm]  = get("Ukupno golova", "Više", 1.5);
  odds.goals.over2_5[bm]  = get("Ukupno golova", "Više", 2.5);
  odds.goals.over_3_5[bm] = get("Ukupno golova", "Više", 3.5);
  odds.goals.over_4_5[bm] = get("Ukupno golova", "Više", 4.5);
  odds.goals.over_5_5[bm] = get("Ukupno golova", "Više", 5.5);
  odds.goals.under1_5[bm] = get("Ukupno golova", "Manje", 1.5);
  odds.goals.under2_5[bm] = get("Ukupno golova", "Manje", 2.5);
  odds.goals.under3_5[bm] = get("Ukupno golova", "Manje", 3.5);
  odds.goals.gg[bm]       = get("Oba Tima Daju Gol", "GG");
  odds.goals.ng[bm]       = get("Oba Tima Daju Gol", "NG");
  odds.goals.gg3[bm]      = get("Oba Tima Daju Gol I Ukupno Golova", "GG&3+");
  odds.goals.gg4[bm]      = get("Kombinacije Golova", "GG&4+");
  // Which half has more goals (Najefikasnije Poluvreme): 1> / 2 > / 1=2
  odds.goals.firstMore[bm]  = get("Najefikasnije Poluvreme", "1>");
  odds.goals.secondMore[bm] = get("Najefikasnije Poluvreme", "2 >");
  odds.goals.equalGoals[bm] = get("Najefikasnije Poluvreme", "1=2");

  // First half (exact Meridian names: "Prvo Poluvreme - …")
  odds.firstHalf.ki1[bm]        = get("Prvo Poluvreme - Konačan Ishod", "1");
  odds.firstHalf.kix[bm]        = get("Prvo Poluvreme - Konačan Ishod", "X");
  odds.firstHalf.ki2[bm]        = get("Prvo Poluvreme - Konačan Ishod", "2");
  odds.firstHalf.over_0_5[bm]   = get("Prvo Poluvreme - Ukupno Golova", "Više", 0.5);
  odds.firstHalf.over_1_5[bm]   = get("Prvo Poluvreme - Ukupno Golova", "Više", 1.5);
  odds.firstHalf.over_2_5[bm]   = get("Prvo Poluvreme - Ukupno Golova", "Više", 2.5);
  odds.firstHalf.zeroToOne[bm]  = get("Prvo Poluvreme - Ukupno Golova", "Manje", 1.5);
  odds.firstHalf.zeroToTwo[bm]  = get("Prvo Poluvreme - Ukupno Golova", "Manje", 2.5);
  odds.firstHalf.oneToTwo[bm]   = get("Prvo Poluvreme - Multigolovi", "1-2");
  odds.firstHalf.oneToThree[bm] = get("Prvo Poluvreme - Multigolovi", "1-3");
  odds.firstHalf.twoToThree[bm] = get("Prvo Poluvreme - Multigolovi", "2-3");
  odds.firstHalf.gg[bm]         = get("Prvo Poluvreme - Oba Tima Daju Gol", "I GG");
  odds.firstHalf.pg1[bm]        = get("Prvo Poluvreme - Daje Prvi Gol", "1");
  odds.firstHalf.pg2[bm]        = get("Prvo Poluvreme - Daje Prvi Gol", "2");

  // Second half (exact Meridian names: "Drugo Poluvreme - …")
  odds.secondHalf.ki1[bm]        = get("Drugo Poluvreme - Konačan Ishod", "1");
  odds.secondHalf.kix[bm]        = get("Drugo Poluvreme - Konačan Ishod", "X");
  odds.secondHalf.ki2[bm]        = get("Drugo Poluvreme - Konačan Ishod", "2");
  odds.secondHalf.over_0_5[bm]   = get("Drugo Poluvreme - Ukupno Golova", "Više", 0.5);
  odds.secondHalf.over_1_5[bm]   = get("Drugo Poluvreme - Ukupno Golova", "Više", 1.5);
  odds.secondHalf.over_2_5[bm]   = get("Drugo Poluvreme - Ukupno Golova", "Više", 2.5);
  odds.secondHalf.zeroToOne[bm]  = get("Drugo Poluvreme - Ukupno Golova", "Manje", 1.5);
  odds.secondHalf.zeroToTwo[bm]  = get("Drugo Poluvreme - Ukupno Golova", "Manje", 2.5);
  odds.secondHalf.oneToTwo[bm]   = get("Drugo Poluvreme - Multigolovi", "1-2");
  odds.secondHalf.oneToThree[bm] = get("Drugo Poluvreme - Multigolovi", "1-3");
  odds.secondHalf.twoToThree[bm] = get("Drugo Poluvreme - Multigolovi", "2-3");
  odds.secondHalf.gg[bm]         = get("Drugo Poluvreme - Oba Tima Daju Gol", "II GG");

  // HT/FT (Poluvreme - Kraj, full 3×3)
  odds.htft.hh[bm] = get("Poluvreme - Kraj", "1-1");
  odds.htft.hx[bm] = get("Poluvreme - Kraj", "1-X");
  odds.htft.ha[bm] = get("Poluvreme - Kraj", "1-2");
  odds.htft.xh[bm] = get("Poluvreme - Kraj", "X-1");
  odds.htft.xx[bm] = get("Poluvreme - Kraj", "X-X");
  odds.htft.xa[bm] = get("Poluvreme - Kraj", "X-2");
  odds.htft.ah[bm] = get("Poluvreme - Kraj", "2-1");
  odds.htft.ax[bm] = get("Poluvreme - Kraj", "2-X");
  odds.htft.aa[bm] = get("Poluvreme - Kraj", "2-2");

  // Correct score (market "Tačan Rezultat", selections "H:A")
  odds.correctScore.s00[bm] = get("Tačan Rezultat", "0:0");
  odds.correctScore.s10[bm] = get("Tačan Rezultat", "1:0");
  odds.correctScore.s01[bm] = get("Tačan Rezultat", "0:1");
  odds.correctScore.s11[bm] = get("Tačan Rezultat", "1:1");
  odds.correctScore.s20[bm] = get("Tačan Rezultat", "2:0");
  odds.correctScore.s02[bm] = get("Tačan Rezultat", "0:2");
  odds.correctScore.s21[bm] = get("Tačan Rezultat", "2:1");
  odds.correctScore.s12[bm] = get("Tačan Rezultat", "1:2");
  odds.correctScore.s22[bm] = get("Tačan Rezultat", "2:2");
  odds.correctScore.s30[bm] = get("Tačan Rezultat", "3:0");
  odds.correctScore.s03[bm] = get("Tačan Rezultat", "0:3");
  odds.correctScore.s31[bm] = get("Tačan Rezultat", "3:1");
  odds.correctScore.s13[bm] = get("Tačan Rezultat", "1:3");
  odds.correctScore.s32[bm] = get("Tačan Rezultat", "3:2");
  odds.correctScore.s23[bm] = get("Tačan Rezultat", "2:3");
  odds.correctScore.s40[bm] = get("Tačan Rezultat", "4:0");
  odds.correctScore.s04[bm] = get("Tačan Rezultat", "0:4");

  // Goals per half combos
  odds.halfGoalCombos.i1ii1[bm] = get("Kombinacije Golova Prvo i Drugo Poluvreme", "I1+&II1+");
  odds.halfGoalCombos.i1ii2[bm] = get("Kombinacije Golova Prvo i Drugo Poluvreme", "I1+&II2+");
  odds.halfGoalCombos.i2ii1[bm] = get("Kombinacije Golova Prvo i Drugo Poluvreme", "I2+&II1+");
  odds.halfGoalCombos.i2ii2[bm] = get("Kombinacije Golova Prvo i Drugo Poluvreme", "I2+&II2+");

  // Exact total goals
  odds.exactGoals.g1[bm] = get("Tačno Golova", "1");
  odds.exactGoals.g2[bm] = get("Tačno Golova", "2");
  odds.exactGoals.g3[bm] = get("Tačno Golova", "3");
  odds.exactGoals.g4[bm] = get("Tačno Golova", "4");
  odds.exactGoals.g5[bm] = get("Tačno Golova", "5");

  // Par / nepar (even/odd) + Draw No Bet (winner)
  odds.goals.even[bm] = get("Nepar/Par Golova", "Par");
  odds.goals.odd[bm]  = get("Nepar/Par Golova", "Nepar");
  odds.ki.w1[bm]      = get("Draw No Bet", "1");
  odds.ki.w2[bm]      = get("Draw No Bet", "2");

  // Result + goals / GG combos
  odds.ki.homeAndGG[bm]        = get("Konačan Ishod I Oba Tima Daju Gol", "1 & GG");
  odds.ki.awayAndGG[bm]        = get("Konačan Ishod I Oba Tima Daju Gol", "2 & GG");
  odds.ki.homeAnd3Plus[bm]     = get("Konačan Ishod i Ukupno Golova (2.5)", "1&3+");
  odds.ki.awayAnd3Plus[bm]     = get("Konačan Ishod i Ukupno Golova (2.5)", "2&3+");
  odds.ki.homeAnd4Plus[bm]     = get("Konačan Ishod i Ukupno Golova (3.5)", "1&4+");
  odds.ki.awayAnd4Plus[bm]     = get("Konačan Ishod i Ukupno Golova (3.5)", "2&4+");
  odds.ki.homeAndHome3Plus[bm] = get("Konačan Ishod i Domaćin/Gost Ukupno Golova", "1&D3+");
  odds.ki.awayAndAway3Plus[bm] = get("Konačan Ishod i Domaćin/Gost Ukupno Golova", "2&G3+");
  odds.firstHalf.pg1[bm]       = get("Prvo Poluvreme - Daje Prvi Gol", "1");
  odds.firstHalf.pg2[bm]       = get("Prvo Poluvreme - Daje Prvi Gol", "2");

  // Goal ranges (Multigolovi)
  odds.goals.oneToTwo[bm]   = get("Multigolovi", "1-2");
  odds.goals.oneToThree[bm] = get("Multigolovi", "1-3");
  odds.goals.oneToFour[bm]  = get("Multigolovi", "1-4");
  odds.goals.twoToThree[bm] = get("Multigolovi", "2-3");
  odds.goals.twoToFour[bm]  = get("Multigolovi", "2-4");
  odds.goals.twoToFive[bm]  = get("Multigolovi", "2-5");
  odds.goals.twoToSix[bm]   = get("Multigolovi", "2-6");
  odds.goals.threeToFour[bm] = get("Multigolovi", "3-4");
  odds.goals.threeToFive[bm] = get("Multigolovi", "3-5");
  odds.goals.threeToSix[bm]  = get("Multigolovi", "3-6");

  // First-half GG, second-half 1X2 + GG
  odds.firstHalf.gg[bm]   = get("Prvo Poluvreme - Oba Tima Daju Gol", "I GG");
  odds.secondHalf.ki1[bm] = get("Drugo Poluvreme - Konačan Ishod", "1");
  odds.secondHalf.kix[bm] = get("Drugo Poluvreme - Konačan Ishod", "X");
  odds.secondHalf.ki2[bm] = get("Drugo Poluvreme - Konačan Ishod", "2");
  odds.secondHalf.gg[bm]  = get("Drugo Poluvreme - Oba Tima Daju Gol", "II GG");

  // Team total goals (markets are prefixed with the team name)
  if (homeName) {
    odds.homeGoals.over_0_5[bm]  = get(`${homeName} Ukupno Golova`, "Više", 0.5);
    odds.homeGoals.over_1_5[bm]  = get(`${homeName} Ukupno Golova`, "Više", 1.5);
    odds.homeGoals.over_2_5[bm]  = get(`${homeName} Ukupno Golova`, "Više", 2.5);
    odds.homeGoals.over_3_5[bm]  = get(`${homeName} Ukupno Golova`, "Više", 3.5);
    odds.homeGoals.first_0_5[bm] = get(`I Pol.- ${homeName} Ukupno Golova`, "Više", 0.5);
    odds.homeGoals.first_1_5[bm] = get(`I Pol.- ${homeName} Ukupno Golova`, "Više", 1.5);
    odds.homeGoals.second_0_5[bm] = get(`Drugo Poluvreme - ${homeName} Ukupno Golova`, "Više", 0.5);
    odds.homeGoals.second_1_5[bm] = get(`Drugo Poluvreme - ${homeName} Ukupno Golova`, "Više", 1.5);
  }
  if (awayName) {
    odds.awayGoals.over_0_5[bm]  = get(`${awayName} Ukupno Golova`, "Više", 0.5);
    odds.awayGoals.over_1_5[bm]  = get(`${awayName} Ukupno Golova`, "Više", 1.5);
    odds.awayGoals.over_2_5[bm]  = get(`${awayName} Ukupno Golova`, "Više", 2.5);
    odds.awayGoals.over_3_5[bm]  = get(`${awayName} Ukupno Golova`, "Više", 3.5);
    odds.awayGoals.first_0_5[bm] = get(`I Pol.- ${awayName} Ukupno Golova`, "Više", 0.5);
    odds.awayGoals.first_1_5[bm] = get(`I Pol.- ${awayName} Ukupno Golova`, "Više", 1.5);
    odds.awayGoals.second_0_5[bm] = get(`Drugo Poluvreme - ${awayName} Ukupno Golova`, "Više", 0.5);
    odds.awayGoals.second_1_5[bm] = get(`Drugo Poluvreme - ${awayName} Ukupno Golova`, "Više", 1.5);
  }
}

/**
 * Finds the match on Meridian (token → search → match-pick) and applies its odds.
 * Fails silently so Meridian never blocks the other bookmakers.
 */
async function fetchAndApplyMeridianOdds({ date, home, away, searchQuery, odds }) {
  try {
    const token = await getMeridianToken();
    if (!token) return;
    const headers = { ...MERIDIAN_HEADERS, "Authorization": `Bearer ${token}` };

    const term = encodeURIComponent(searchQuery || home || "");
    const sres = await request(`${MERIDIAN_API}/api/v4/search?term=${term}&page=0&sportId=58`, { headers });
    if (sres.statusCode !== 200) return;
    const sjson = await sres.body.json();
    const p = sjson.payload || {};
    const events = [...(p.events || []), ...(p.bets || [])];

    const match = pickMeridianMatch(events, { date, home, away });
    if (!match) return;

    const mres = await request(`${MERIDIAN_API}/api/v2/events/${match.id}/markets?gameGroupId=all`, { headers });
    if (mres.statusCode !== 200) return;
    const mjson = await mres.body.json();
    if (mjson?.payload) {
      // rivals[0]=home, rivals[1]=away — used for team-specific market names.
      applyMeridianOdds(odds, mjson.payload, "meridian", match.rivals?.[0] || "", match.rivals?.[1] || "");
    }
  } catch (err) {
    console.warn("[meridian] odds fetch failed:", err.message);
  }
}

/* ───────────────────────── BalkanBet ───────────────────────────────────────
 * Balkanbet runs NSoft "Seven". The public distribution API needs no auth — only
 * the public companyUuid.
 *   - List:  GET sports-sm-distribution-api.../api/v1/events?companyUuid=..&filter[sportId]=18
 *            &filter[from]=YYYY-MM-DDTHH:mm:ss&filter[to]=..&filter[marketId]=6 (1X2 only → light list)
 *            → data.events[]: { id, name "Home - Away", startsAt(ISO), competitors:[{name,type 1=home/2=away}] }
 *   - Odds:  GET .../api/v1/events/{id}?companyUuid=..  → data.markets[]: { marketId, outcomes:[{name, odd, active}] }
 * Odds value = outcome.odd; mapped by (marketId, outcome.name). sportId 18 = football.
 * The lightweight football list is cached briefly (no per-team search exists).
 * --------------------------------------------------------------------------- */
const BALKAN_COMPANY = "4f54c6aa-82a9-475d-bf0e-dc02ded89225";
const BALKAN_API     = "https://sports-sm-distribution-api.de-2.nsoftcdn.com";
const BALKAN_HEADERS = {
  "Accept": "application/json, text/plain, */*",
  "Origin": "https://sports-sm-web.7platform.net",
  "Referer": "https://sports-sm-web.7platform.net/",
};
const BALKAN_LANG = encodeURIComponent(JSON.stringify({ default: "sr-Latn", events: "sr-Latn", team: "sr-Latn", market: "sr-Latn" }));
const BALKAN_FMT  = encodeURIComponent(JSON.stringify({ default: "array", markets: "array", events: "array" }));
const BALKAN_FOOTBALL_SPORT = 18;

let _balkanCache = { events: [], expiresAt: 0 };

// Formats a Date as "YYYY-MM-DDTHH:mm:ss" in Europe/Belgrade local time (what the API expects).
function balkanStamp(d) {
  const s = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Belgrade", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  }).format(d);
  return s.replace(" ", "T");
}

// Returns (and caches ~3 min) the lightweight football offer: [{ id, home, away, ts }].
async function getBalkanbetFootballEvents() {
  if (_balkanCache.events.length && Date.now() < _balkanCache.expiresAt) return _balkanCache.events;
  const from = balkanStamp(new Date());
  const to   = balkanStamp(new Date(Date.now() + 2 * 86400 * 1000)).slice(0, 10) + "T23:59:59";
  const url =
    `${BALKAN_API}/api/v1/events?companyUuid=${BALKAN_COMPANY}&language=${BALKAN_LANG}` +
    `&timezone=Europe%2FBelgrade&dataFormat=${BALKAN_FMT}&filter[sportId]=${BALKAN_FOOTBALL_SPORT}` +
    `&filter[from]=${encodeURIComponent(from)}&filter[to]=${encodeURIComponent(to)}&filter[marketId]=6`;
  try {
    const res = await request(url, { headers: BALKAN_HEADERS });
    if (res.statusCode !== 200) return _balkanCache.events;
    const json = await res.body.json();
    const events = (json?.data?.events || []).map((e) => {
      const comps = e.competitors || [];
      const homeC = comps.find((c) => c.type === 1);
      const awayC = comps.find((c) => c.type === 2);
      // `competitors` are localized (sr-Latn, e.g. "Meksiko"); `name` is often the
      // English form ("Mexico - Serbia"). Keep both so matching tolerates either language.
      const [n1, n2] = String(e.name || "").split(" - ");
      return {
        id: e.id,
        home: (homeC && homeC.name) || n1 || (comps[0] && comps[0].name) || "",
        away: (awayC && awayC.name) || n2 || (comps[1] && comps[1].name) || "",
        homeAlt: (n1 || "").trim(),
        awayAlt: (n2 || "").trim(),
        ts: Date.parse(e.startsAt) || 0,
      };
    });
    _balkanCache = { events, expiresAt: Date.now() + 3 * 60 * 1000 };
    return events;
  } catch (err) {
    console.warn("[balkan] list fetch failed:", err.message);
    return _balkanCache.events;
  }
}

// Transliteration key: collapses common Serbian↔English spelling differences so
// "Mexico" and "Meksiko" reduce to the same skeleton (x→ks, c→k, w→v, y→i, ph→f,
// doubled letters collapsed, lone w/z women/youth markers dropped).
function translitKey(s) {
  return normalizeTeamName(s)
    .replace(/\b[wz]\b/g, " ")
    .replace(/ph/g, "f").replace(/x/g, "ks").replace(/q/g, "k")
    .replace(/w/g, "v").replace(/y/g, "i").replace(/c/g, "k")
    .replace(/(.)\1+/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}
function translitSimilarity(a, b) {
  const na = translitKey(a), nb = translitKey(b);
  if (!na || !nb) return 0;
  const ta = new Set(na.split(" ").filter((t) => t.length >= 3));
  const tb = new Set(nb.split(" ").filter((t) => t.length >= 3));
  let shared = 0;
  for (const t of ta) if (tb.has(t)) shared++;
  return shared + (na.includes(nb) || nb.includes(na) ? 1 : 0);
}

// Picks the Balkanbet football event matching our selection.
function pickBalkanbetMatch(events, { date, home, away }) {
  if (!Array.isArray(events) || !events.length) return null;
  const targetTs = Number(date);

  // Best team-match score, trying both Balkanbet name forms (localized + English)
  // and both plain-token and transliteration-aware comparison.
  const scoreOf = (e) =>
    Math.max(
      teamSimilarity(e.home, home) + teamSimilarity(e.away, away),
      teamSimilarity(e.homeAlt, home) + teamSimilarity(e.awayAlt, away),
      translitSimilarity(e.home, home) + translitSimilarity(e.away, away),
      translitSimilarity(e.homeAlt, home) + translitSimilarity(e.awayAlt, away)
    );

  const exact = events.filter((e) => e.ts === targetTs);
  const pool = exact.length ? exact : events.filter((e) => Math.abs(e.ts - targetTs) <= 6 * 3600 * 1000);
  if (!pool.length) return null;

  let best = null, bestScore = -1;
  for (const e of pool) {
    const score = scoreOf(e);
    if (score > bestScore) { bestScore = score; best = e; }
  }
  // Balkanbet's pool is the WHOLE offer (not a team-filtered search), so many unrelated
  // matches share the same kickoff. Require at least one team to genuinely match on an
  // exact-kickoff pool (rejects e.g. "Sabadell" vs a same-time "Španija"), and a stronger
  // match on the fuzzy ±6h fallback.
  const threshold = exact.length ? 1 : 2;
  return bestScore >= threshold ? best : null;
}

// Maps Balkanbet's markets array onto the shared odds accumulator under the "balkan" key.
function applyBalkanbetOdds(odds, markets, bm = "balkan") {
  const byId = {};
  for (const m of (markets || [])) (byId[m.marketId] = byId[m.marketId] || []).push(m);
  const get = (marketId, name) => {
    for (const m of (byId[marketId] || [])) {
      const o = (m.outcomes || []).find((x) => (x.name || "").trim() === name && typeof x.odd === "number" && x.active);
      if (o) return o.odd;
    }
    return undefined;
  };

  // Konačan ishod (1X2) + double chance
  odds.ki["1"][bm]            = get(6, "1");
  odds.ki["x"][bm]            = get(6, "X");
  odds.ki["2"][bm]            = get(6, "2");
  odds.ki.doubleChance_1X[bm] = get(368, "1X");
  odds.ki.doubleChance_12[bm] = get(368, "12");
  odds.ki.doubleChance_X2[bm] = get(368, "X2");

  // Goals (totals, ranges, GG/NG)
  odds.goals.over1_5[bm]    = get(443, "2+");
  odds.goals.over2_5[bm]    = get(443, "3+");
  odds.goals.over_3_5[bm]   = get(443, "4+");
  odds.goals.over_4_5[bm]   = get(443, "5+");
  odds.goals.over_5_5[bm]   = get(443, "6+");
  odds.goals.under1_5[bm]   = get(443, "0-1");
  odds.goals.under2_5[bm]   = get(443, "0-2");
  odds.goals.under3_5[bm]   = get(443, "0-3");
  odds.goals.oneToTwo[bm]   = get(443, "1-2");
  odds.goals.oneToThree[bm] = get(443, "1-3");
  odds.goals.oneToFour[bm]  = get(443, "1-4");
  odds.goals.twoToThree[bm] = get(443, "2-3");
  odds.goals.twoToFour[bm]  = get(443, "2-4");
  odds.goals.twoToFive[bm]  = get(443, "2-5");
  odds.goals.twoToSix[bm]   = get(443, "2-6");
  odds.goals.threeToFour[bm] = get(443, "3-4");
  odds.goals.threeToFive[bm] = get(443, "3-5");
  odds.goals.threeToSix[bm]  = get(443, "3-6");
  odds.goals.over_6_5[bm]   = get(443, "7+");
  odds.goals.gg[bm]         = get(425, "GG");
  odds.goals.ng[bm]         = get(425, "NG");
  odds.goals.gg3[bm]        = get(425, "GG&3+");
  odds.goals.gg4[bm]        = get(425, "GG&4+");

  // Home / away totals
  odds.homeGoals.over_0_5[bm]  = get(419, "D1+");
  odds.homeGoals.over_1_5[bm]  = get(419, "D2+");
  odds.homeGoals.over_2_5[bm]  = get(419, "D3+");
  odds.homeGoals.over_3_5[bm]  = get(419, "D4+");
  odds.homeGoals.zeroToOne[bm] = get(419, "D0-1");
  odds.homeGoals.zeroToTwo[bm] = get(419, "D0-2");
  odds.awayGoals.over_0_5[bm]  = get(422, "G1+");
  odds.awayGoals.over_1_5[bm]  = get(422, "G2+");
  odds.awayGoals.over_2_5[bm]  = get(422, "G3+");
  odds.awayGoals.over_3_5[bm]  = get(422, "G4+");
  odds.awayGoals.zeroToOne[bm] = get(422, "G0-1");

  // First half
  odds.firstHalf.ki1[bm]        = get(371, "I 1");
  odds.firstHalf.kix[bm]        = get(371, "I X");
  odds.firstHalf.ki2[bm]        = get(371, "I 2");
  odds.firstHalf.over_0_5[bm]   = get(428, "I 1+");
  odds.firstHalf.over_1_5[bm]   = get(428, "I 2+");
  odds.firstHalf.over_2_5[bm]   = get(428, "I 3+");
  odds.firstHalf.over_3_5[bm]   = get(428, "I 4+");
  odds.firstHalf.zeroToOne[bm]  = get(428, "I 0-1");
  odds.firstHalf.zeroToTwo[bm]  = get(428, "I 0-2");
  odds.firstHalf.oneToTwo[bm]   = get(428, "I 1-2");
  odds.firstHalf.oneToThree[bm] = get(428, "I 1-3");
  odds.firstHalf.twoToThree[bm] = get(428, "I 2-3");
  odds.firstHalf.gg[bm]         = get(425, "I GG");

  // Second half
  odds.secondHalf.ki1[bm]       = get(383, "II 1");
  odds.secondHalf.kix[bm]       = get(383, "II X");
  odds.secondHalf.ki2[bm]       = get(383, "II 2");
  odds.secondHalf.over_0_5[bm]  = get(431, "II 1+");
  odds.secondHalf.over_1_5[bm]  = get(431, "II 2+");
  odds.secondHalf.over_2_5[bm]  = get(431, "II 3+");
  odds.secondHalf.over_3_5[bm]  = get(431, "II 4+");
  odds.secondHalf.zeroToOne[bm] = get(431, "II 0-1");
  odds.secondHalf.zeroToTwo[bm] = get(431, "II 0-2");
  odds.secondHalf.oneToTwo[bm]  = get(431, "II 1-2");
  odds.secondHalf.oneToThree[bm]= get(431, "II 1-3");
  odds.secondHalf.twoToThree[bm]= get(431, "II 2-3");
  odds.secondHalf.gg[bm]        = get(425, "II GG");

  // HT/FT
  odds.htft.hh[bm] = get(398, "1-1");
  odds.htft.hx[bm] = get(398, "1-X");
  odds.htft.ha[bm] = get(398, "1-2");
  odds.htft.xh[bm] = get(398, "X-1");
  odds.htft.xx[bm] = get(398, "X-X");
  odds.htft.xa[bm] = get(398, "X-2");
  odds.htft.ah[bm] = get(398, "2-1");
  odds.htft.ax[bm] = get(398, "2-X");
  odds.htft.aa[bm] = get(398, "2-2");

  // Correct score (mId 686 "TAČAN REZULTAT", outcome names "H:A")
  odds.correctScore.s00[bm] = get(686, "0:0");
  odds.correctScore.s10[bm] = get(686, "1:0");
  odds.correctScore.s01[bm] = get(686, "0:1");
  odds.correctScore.s11[bm] = get(686, "1:1");
  odds.correctScore.s20[bm] = get(686, "2:0");
  odds.correctScore.s02[bm] = get(686, "0:2");
  odds.correctScore.s21[bm] = get(686, "2:1");
  odds.correctScore.s12[bm] = get(686, "1:2");
  odds.correctScore.s22[bm] = get(686, "2:2");
  odds.correctScore.s30[bm] = get(686, "3:0");
  odds.correctScore.s03[bm] = get(686, "0:3");
  odds.correctScore.s31[bm] = get(686, "3:1");
  odds.correctScore.s13[bm] = get(686, "1:3");
  odds.correctScore.s32[bm] = get(686, "3:2");
  odds.correctScore.s23[bm] = get(686, "2:3");
  odds.correctScore.s40[bm] = get(686, "4:0");
  odds.correctScore.s04[bm] = get(686, "0:4");

  // Win both halves (mId 392) / win to nil (mId 395)
  odds.ki.winBothHalves1[bm] = get(392, "DP1");
  odds.ki.winBothHalves2[bm] = get(392, "DP2");
  odds.ki.winToNil1[bm]      = get(395, "SP1");
  odds.ki.winToNil2[bm]      = get(395, "SP2");

  // Goals per half combos (mId 434)
  odds.halfGoalCombos.i1ii1[bm] = get(434, "I1+&II1+");
  odds.halfGoalCombos.i1ii2[bm] = get(434, "I1+&II2+");
  odds.halfGoalCombos.i2ii1[bm] = get(434, "I2+&II1+");
  odds.halfGoalCombos.i2ii2[bm] = get(434, "I2+&II2+");

  // Draw No Bet (X vraća ulog) → winner
  odds.ki.w1[bm] = get(389, "W1");
  odds.ki.w2[bm] = get(389, "W2");

  // Result + goals / GG combos
  odds.ki.homeAndGG[bm]        = get(2237, "1&GG");
  odds.ki.awayAndGG[bm]        = get(2237, "2&GG");
  odds.ki.homeAnd3Plus[bm]     = get(455, "1&3+");
  odds.ki.homeAnd4Plus[bm]     = get(455, "1&4+");
  odds.ki.awayAnd3Plus[bm]     = get(455, "2&3+");
  odds.ki.awayAnd4Plus[bm]     = get(455, "2&4+");
  odds.ki.homeAndHome3Plus[bm] = get(455, "1&D3+");
  odds.ki.awayAndAway3Plus[bm] = get(455, "2&G3+");

  // Which half has more goals (Pada više golova)
  odds.goals.firstMore[bm]  = get(437, "I >");
  odds.goals.secondMore[bm] = get(437, "II >");
  odds.goals.equalGoals[bm] = get(437, "I = II");

  // Home goals per half (mId 407/410), away goals per half (mId 413/416)
  odds.homeGoals.first_0_5[bm]  = get(407, "DI 1+");
  odds.homeGoals.first_1_5[bm]  = get(407, "DI 2+");
  odds.homeGoals.second_0_5[bm] = get(410, "DII 1+");
  odds.homeGoals.second_1_5[bm] = get(410, "DII 2+");
  odds.awayGoals.first_0_5[bm]  = get(413, "GI 1+");
  odds.awayGoals.first_1_5[bm]  = get(413, "GI 2+");
  odds.awayGoals.second_0_5[bm] = get(416, "GII 1+");
  odds.awayGoals.second_1_5[bm] = get(416, "GII 2+");

  // Korneri 1X2 (mId 264) + first corner (mId 1676)
  odds.cornersWinner.home[bm] = get(264, "Korneri 1");
  odds.cornersWinner.none[bm] = get(264, "Korneri X");
  odds.cornersWinner.away[bm] = get(264, "Korneri 2");
  odds.firstCorner.home[bm]   = get(1676, "PRKO 1");
  odds.firstCorner.away[bm]   = get(1676, "PRKO 2");

  // Gol Gol (BTTS) + half BTTS + combos (mId 425, exact Balkan outcome names)
  odds.btts.gg[bm]         = get(425, "GG");
  odds.btts.ng[bm]         = get(425, "NG");
  odds.btts.ggIp[bm]       = get(425, "I GG");
  odds.btts.ngIp[bm]       = get(425, "NE I GG");
  odds.btts.ggIIp[bm]      = get(425, "II GG");
  odds.btts.ngIIp[bm]      = get(425, "NE II GG");
  odds.btts.gg3[bm]        = get(425, "GG&3+");
  odds.btts.gg4[bm]        = get(425, "GG&4+");
  odds.btts.gg2to3[bm]     = get(425, "GG&2-3");
  odds.btts.ggBoth2[bm]    = get(425, "D2+&G2+");
  odds.btts.ggEachHalf[bm] = get(425, "GG&I1+II1+");

  // Par/Nepar — odd/even total goals (mId 665)
  odds.goals.even[bm] = get(665, "Par");
  odds.goals.odd[bm]  = get(665, "Nepar");

  // Prvi gol 1. poluvreme — first goal in the 1st half (mId 1655)
  odds.firstHalf.pg1[bm] = get(1655, "PDG 1 I");
  odds.firstHalf.pg2[bm] = get(1655, "PDG 2 I");

  // Evropski hendikep — single main line (mId 728) → handicap line "a"
  odds.handicap.h1a[bm] = get(728, "EH1");
  odds.handicap.hxa[bm] = get(728, "EHX");
  odds.handicap.h2a[bm] = get(728, "EH2");
}

/**
 * Finds the match on Balkanbet (cached football list → match-pick) and applies its odds.
 * Fails silently so Balkanbet never blocks the other bookmakers.
 */
async function fetchAndApplyBalkanbetOdds({ date, home, away, odds }) {
  try {
    const events = await getBalkanbetFootballEvents();
    const match = pickBalkanbetMatch(events, { date, home, away });
    if (!match) return;

    const url = `${BALKAN_API}/api/v1/events/${match.id}?companyUuid=${BALKAN_COMPANY}&id=${match.id}` +
      `&language=${BALKAN_LANG}&timezone=Europe%2FBelgrade&dataFormat=${BALKAN_FMT}`;
    const res = await request(url, { headers: BALKAN_HEADERS });
    if (res.statusCode !== 200) return;
    const json = await res.body.json();
    const markets = json?.data?.markets;
    if (markets) applyBalkanbetOdds(odds, markets);
  } catch (err) {
    console.warn("[balkan] odds fetch failed:", err.message);
  }
}


// ─── Socket.IO ────────────────────────────────────────────────────────────────
const messages    = [];
const onlineUsers = new Set();

io.on("connection", (socket) => {
  socket.emit("previous_messages", messages.slice(-100));

  socket.on("send_message", (msg) => {
    const text = typeof msg?.text === "string" ? msg.text.slice(0, 1000).trim() : "";
    if (!text) return;

    const message = {
      id:        Date.now(),
      text,
      sender:    msg?.sender || "Anonymous",
      timestamp: new Date(),
      tier:      msg.tier,
    };

    messages.push(message);
    if (messages.length > 100) messages.shift();

    socket.data.username = message.sender;
    onlineUsers.add(message.sender);

    io.emit("new_message",  message);
    io.emit("online_users", Array.from(onlineUsers));
  });

  socket.on("disconnect", () => {
    const username = socket.data.username;
    if (username) {
      // Only drop them if no other socket for this user is still connected.
      const stillConnected = Array.from(io.sockets.sockets.values()).some(
        (s) => s.id !== socket.id && s.data.username === username
      );
      if (!stillConnected) {
        onlineUsers.delete(username);
        io.emit("online_users", Array.from(onlineUsers));
      }
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Routes
// ═══════════════════════════════════════════════════════════════════════════════

// ── Auth ──────────────────────────────────────────────────────────────────────

app.post("/login", authLimiter, async (req, res) => {
  const { email, password, rememberMe } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email i sifra su obavezni." });
  }

  try {
    const user = await User.findOne({ email, password }).lean();
    if (!user) {
      return res.status(404).json({ message: "Pogresan email ili sifra." });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, tier: user.tier },
      JWT_SECRET,
      { expiresIn: rememberMe ? "7d" : "24h" }
    );

    return res.json({ token });
  } catch (err) {
    console.error("POST /login error:", err);
    return res.status(500).json({ message: "Greška na serveru." });
  }
});


// Sportovi koje povlačimo sa LiveScore CDN-a. `slug` je putanja na njihovom API-ju,
// `sport` je oznaka koju frontend koristi za grupisanje/ikonice.
const LIVESCORE_SPORTS = [
  { sport: 'fudbal',   slug: 'soccer' },
  { sport: 'kosarka',  slug: 'basketball' },
  { sport: 'tenis',    slug: 'tennis' },
  { sport: 'hokej',    slug: 'hockey' },
];

const LIVESCORE_HEADERS = {
  'accept': '*/*',
  'accept-language': 'en-US,en;q=0.9',
  'origin': 'https://www.livescore.com',
  'referer': 'https://www.livescore.com/',
  'sec-ch-ua': '"Chromium";v="148", "Google Chrome";v="148", "Not/A)Brand";v="99"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"Windows"',
  'sec-fetch-dest': 'empty',
  'sec-fetch-mode': 'cors',
  'sec-fetch-site': 'same-site',
  'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36'
};

// Povlači jedan sport za zadati datum. Vraća niz sekcija (Sctns) sa dodatim `sport` poljem,
// ili prazan niz ako sport nije dostupan (da jedan pad ne sruši ceo odgovor).
async function fetchSportSections(slug, sport, date) {
  const url = `https://prod-cdn-mev-api.livescore.com/api/v2/date/${slug}/${date}/2?paging=false&locale=en`;
  try {
    const response = await fetch(url, { method: 'GET', headers: LIVESCORE_HEADERS });
    if (!response.ok) {
      console.warn(`[matches] ${sport} (${slug}) -> status ${response.status}, preskačem.`);
      return [];
    }
    const data = await response.json();
    if (!data || !Array.isArray(data.Sctns)) return [];
    // Tagiramo svaku sekciju sportom da frontend može da grupiše.
    return data.Sctns.map((section) => ({ ...section, sport }));
  } catch (err) {
    console.warn(`[matches] ${sport} (${slug}) pao: ${err.message}`);
    return [];
  }
}

// Vraća utakmice za više sportova, objedinjeno u { success, Sctns } strukturu.
app.get('/matches', async (req, res) => {
  const { date } = req.query;

  if (!date) {
    return res.status(400).json({ success: false, message: 'Datum je obavezan parametar.' });
  }

  try {
    const results = await Promise.all(
      LIVESCORE_SPORTS.map(({ slug, sport }) => fetchSportSections(slug, sport, date))
    );
    const Sctns = results.flat();
    console.log(`[matches] ${date} -> ${Sctns.length} sekcija iz ${LIVESCORE_SPORTS.length} sportova.`);
    return res.json({ success: true, Sctns });
  } catch (error) {
    console.error('[ GREŠKA NA /matches RUTI ]', error.message);
    return res.status(500).json({ success: false, error: error.message, Sctns: [] });
  }
});



app.post("/register", authLimiter, async (req, res) => {
  const { email, password, username, defaultCurrency } = req.body;

  if (!email || !password || !username || !defaultCurrency) {
    return res.status(400).json({ message: "Doslo je do greske. Unesite svako polje." });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Taj email se vec koristi." });
    }

    const verificationCode = generateVerificationCode();
    const codeExpiresAt    = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const newUser = new User({
      email,
      password,
      username,
      defaultCurrency: defaultCurrency.toUpperCase(),
      tier:            "free",
      isVerified:      false,
      verificationCode,
      codeExpiresAt,
      statistics: {
        totalBets: 0, totalWins: 0, totalLosses: 0,
        winRate: 0, totalProfit: 0, initialInvestment: null,
        monthlyStats: buildDefaultMonthlyStats(),
      },
    });

    await newUser.save();

    await sendMail({
      pass:    "eysx xdex jamb vujp",
      from:    "Insajder verifikacija (:",
      to:      email,
      subject: "InsajderTips | Verifikacioni Kod",
      text:    `Vaš verifikacioni kod za registraciju je: ${verificationCode}`,
    });

    return res.status(201).json({ message: "Registracija uspesna! Proverite email za kod." });
  } catch (err) {
    console.error("POST /register error:", err);
    return res.status(500).json({ message: err.message || "Doslo je do greske sa registracijom." });
  }
});

app.post("/resend-code", authLimiter, async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Doslo je do greske. Unesite email." });
  }

  let newCode;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Korisnik sa tim emailom nije pronadjen." });
    }

    if (user.isVerified) {
      return res.status(200).json({ message: "Nalog je već verifikovan." });
    }

    newCode                = generateVerificationCode();
    user.verificationCode  = newCode;
    user.codeExpiresAt     = new Date(Date.now() + 180 * 60 * 1000); // 3 hours
    await user.save();
  } catch (err) {
    console.error("POST /resend-code DB error:", err);
    return res.status(500).json({ message: "Doslo je do greske na serveru. Pokusajte ponovo." });
  }

  // Email is best-effort: DB code is already saved so the user can verify even
  // if the mail transport has a transient failure.
  try {
    await sendMail({
      pass:    "eysx xdex jamb vujp",
      from:    "Insajder Tips <insajderxtips@gmail.com>",
      to:      email,
      subject: "InsajderTips | Novi Verifikacioni Kod",
      text:    `Vaš novi verifikacioni kod je: ${newCode}\n\nKod važi 3 sata.`,
    });
  } catch (mailErr) {
    console.error("POST /resend-code mail error:", mailErr.message);
    // Still return success — the code is in the DB; inform user to check spam or retry.
    return res.status(200).json({
      message: "Kod je generisan, ali email nije mogao biti poslat. Proverite spam folder ili pokušajte ponovo.",
    });
  }

  return res.status(200).json({ message: "Novi verifikacioni kod je uspešno poslat na vaš email!" });
});

app.post("/verification", async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ message: "Email i kod su obavezni." });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Korisnik nije pronađen." });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "Nalog je već verifikovan." });
    }

    if (String(user.verificationCode).trim() !== String(code).trim()) {
      return res.status(400).json({ message: "Neispravan verifikacioni kod." });
    }

    if (user.codeExpiresAt && user.codeExpiresAt.getTime() < Date.now()) {
      return res.status(400).json({ message: "Verifikacioni kod je istekao. Zatražite novi." });
    }

    user.isVerified       = true;
    user.verificationCode = undefined;
    user.codeExpiresAt    = undefined;
    await user.save();

    return res.status(200).json({ message: "Nalog uspešno verifikovan!" });
  } catch (err) {
    console.error("POST /verification error:", err);
    return res.status(500).json({ message: "Greška na serveru." });
  }
});

app.post("/requestPasswordResetCode", authLimiter, async (req, res) => {
  const { email } = req.body;

  if (!email || !email.includes("@")) {
    return res.status(400).json({ message: "Nevalidan email." });
  }

  try {
    const user = await User.findOne({ email });

    // Always respond the same way – don't leak whether the account exists
    if (!user) {
      return res.status(200).json({ message: "Ako email postoji, reset link je poslat." });
    }

    const token      = uuidv4();
    const tokenExpiry = Date.now() + 60 * 60 * 1000; // 1 hour

    user.resetPasswordToken   = token;
    user.resetPasswordExpires = tokenExpiry;
    await user.save();

    const resetLink = `http://insajder.tips/#/reset-password?token=${token}`;

    await sendMail({
      pass:    "jyyc nkmw uvsp plmn",
      from:    '"Insajder Tips" <insajderxtips@gmail.com>',
      to:      email,
      subject: "Insajder Tips | Resetujte Šifru",
      text:    `Da biste resetovali sifru, kliknite na sledeći link: ${resetLink}`,
    });

    return res.status(200).json({ message: "Ako email postoji, reset link je poslat." });
  } catch (err) {
    console.error("POST /requestPasswordResetCode error:", err);
    return res.status(500).json({ message: "Greška na serveru." });
  }
});

app.post("/resetPassword", async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ message: "Token i lozinka su obavezni." });
  }

  try {
    const user = await User.findOne({
      resetPasswordToken:   token,
      resetPasswordExpires: { $gt: Date.now() }, // reject expired tokens
    });

    if (!user) {
      return res.status(404).json({ message: "Nevalidan ili istekao token." });
    }

    user.password             = newPassword;
    user.resetPasswordToken   = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return res.status(200).json({ message: "Lozinka uspešno resetovana." });
  } catch (err) {
    console.error("POST /resetPassword error:", err);
    return res.status(500).json({ message: "Greška na serveru." });
  }
});

// ── User ──────────────────────────────────────────────────────────────────────
// Endpoint za praćenje pada kvota (Dropping Odds) preko čistog Node fetch-a
// Endpoint za praćenje pada kvota (Dropping Odds) sa console logovima
// Novi endpoint sa proširenim zaglavljima za zaobilazak 403 restrikcije
// Endpoint za Dropping Odds sa tvojim autentičnim browser zaglavljima
// Vraćamo se na GET rutu, potpuno nezavisnu od korisnika i njegovog browsera
// Novi, čist i autonoman endpoint koji vuče podatke sa Kickoffscore API-ja
app.get('/dropping-odds', async (req, res) => {
  try {
    const url = 'https://api.kickoffscore.com/api/odds/dropping?period=24&minDrop=5&market=all&limit=50&sort=drop';
    
    const response = await fetch(url);
    const result = await response.json();
    
    // Samo vrati ono što si dobio. Ništa ne menjaj.
    // Kickoffscore obično vraća direktan niz ili objekat sa "data" ključem.
    return res.json({ 
      success: true, 
      data: result.data || result 
    });
  } catch (error) {
    console.error("Greška:", error.message);
    return res.status(500).json({ success: false, data: [] });
  }
});

// ── Teaser odds (public) ────────────────────────────────────────────────────
// A small, cached set of upcoming football matches with headline odds, used on the
// logged-out landing page to entice registration. No auth required.
let _teaserCache = { data: [], expiresAt: 0 };

// Fetches & gzip-decodes a SoccerBet (SVN) JSON endpoint.
async function fetchSvnJson(url) {
  const r = await request(url, {
    headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json", "Accept-Encoding": "gzip" },
  });
  const buf = Buffer.from(await r.body.arrayBuffer());
  const txt = r.headers["content-encoding"] === "gzip" ? gunzipSync(buf).toString("utf-8") : buf.toString("utf-8");
  return JSON.parse(txt);
}

const TEASER_BOOK_LABELS = {
  soccerBet: "SoccerBet", maxBet: "MaxBet", oktagon: "Oktagon", merkur: "Merkur",
  brazil: "BrazilBet", betole: "Betole", meridian: "Meridian", balkan: "Balkan",
};

// Market tabs for the teaser. Each column = [display label, odds category, odds key].
const TEASER_MARKETS = [
  { key: "1x2", label: "Konacan ishod", cols: [["1", "ki", "1"], ["X", "ki", "x"], ["2", "ki", "2"]] },
  { key: "dc", label: "Dvojka", cols: [["1X", "ki", "doubleChance_1X"], ["12", "ki", "doubleChance_12"], ["X2", "ki", "doubleChance_X2"]] },
  { key: "golovi", label: "Golovi", cols: [["GG", "goals", "gg"], ["NG", "goals", "ng"], ["2+", "goals", "over1_5"], ["3+", "goals", "over2_5"], ["4+", "goals", "over_3_5"]] },
  { key: "pp", label: "1. poluvreme", cols: [["1", "firstHalf", "ki1"], ["X", "firstHalf", "kix"], ["2", "firstHalf", "ki2"], ["1+", "firstHalf", "over_0_5"], ["2+", "firstHalf", "over_1_5"]] },
  { key: "dp", label: "2. poluvreme", cols: [["1", "secondHalf", "ki1"], ["X", "secondHalf", "kix"], ["2", "secondHalf", "ki2"], ["1+", "secondHalf", "over_0_5"], ["2+", "secondHalf", "over_1_5"]] },
];

app.get("/teaser-odds", async (req, res) => {
  if (_teaserCache.data.length && Date.now() < _teaserCache.expiresAt) {
    return res.json(_teaserCache.data);
  }
  try {
    const V = "2.36.3.14";
    const offer = await fetchSvnJson(
      `https://www.soccerbet.rs/restapi/offer/sr/sport/S/mob?mobileVersion=${V}&locale=sr`
    );
    const now = Date.now();
    const candidates = (offer.esMatches || [])
      .filter(
        (m) =>
          m.sport === "S" && !m.blocked && m.status === 0 &&
          m.kickOffTime > now && Number(m.oddsCount || 0) > 300 &&
          m.ticketPrintType === 0 && (m.away || "") !== "."
      )
      .sort((a, b) => Number(b.oddsCount) - Number(a.oddsCount)) // biggest matches first
      .slice(0, 3);

    const bookKeys = Object.keys(TEASER_BOOK_LABELS);

    // For each featured match, run the real multi-bookmaker comparison, split into tabs.
    const featured = (
      await Promise.all(
        candidates.map(async (m) => {
          try {
            const odds = await buildComparison({
              home: m.home, away: m.away, date: m.kickOffTime,
              soccerId: m.id, searchQuery: (m.home || "").split(" ")[0],
            });

            const markets = TEASER_MARKETS.map((mk) => {
              const rows = bookKeys
                .map((b) => ({
                  name: TEASER_BOOK_LABELS[b],
                  vals: mk.cols.map(([, cat, key]) => odds[cat]?.[key]?.[b] ?? null),
                }))
                .filter((r) => r.vals.some((v) => typeof v === "number"));
              // Best (highest) odd per column + the bookmaker offering it.
              const best = mk.cols.map((_, ci) => {
                let bv = 0, bn = null;
                for (const r of rows) {
                  const v = Number(r.vals[ci]);
                  if (v > bv) { bv = v; bn = r.name; }
                }
                return bn;
              });
              return { key: mk.key, label: mk.label, outcomes: mk.cols.map((c) => c[0]), rows, best };
            }).filter((mk) => mk.rows.length >= 2);

            if (!markets.length) return null;
            return {
              home: m.home, away: m.away, league: m.leagueName,
              kickOff: m.kickOffTime, oddsCount: m.oddsCount, markets,
            };
          } catch {
            return null;
          }
        })
      )
    ).filter(Boolean);

    if (featured.length) _teaserCache = { data: featured, expiresAt: Date.now() + 10 * 60 * 1000 };
    return res.json(featured);
  } catch (err) {
    console.error("GET /teaser-odds error:", err.message);
    return res.json(_teaserCache.data || []);
  }
});

app.get("/user", verifyToken, async (req, res) => {
  try {
    const userData = await User.findById(req.user.userId).select("-password");
    if (!userData) {
      return res.status(404).json({ message: "Korisnik nije pronadjen." });
    }
    return res.status(200).json({ user: userData });
  } catch (err) {
    console.error("GET /user error:", err);
    return res.status(500).json({ message: "Greška na serveru." });
  }
});

app.get("/statistics/:user", verifyToken, async (req, res) => {
  const requestedUsername = req.params.user;

  if (!requestedUsername) {
    return res.status(400).json({ message: "Doslo je do greske. Molimo prijavite nasoj podrsci." });
  }

  try {
    const actualUser = await User.findById(req.user.userId);
    if (!actualUser) {
      return res.status(404).json({ message: "Korisnik nije pronadjen." });
    }

    if (requestedUsername !== actualUser.username) {
      return res.status(403).json({ message: "Nemate pristup ovom korisniku." });
    }

    return res.status(200).json(actualUser);
  } catch (err) {
    console.error("GET /statistics error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

app.put("/updateName", verifyToken, async (req, res) => {
  const { oldName, newName } = req.body;
  const userId               = req.user.userId;

  if (!oldName || !newName) {
    return res.status(400).json({ error: "Both oldName and newName are required" });
  }
  if (oldName === newName) {
    return res.status(400).json({ error: "New name must be different" });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    if (user.username !== oldName) {
      return res.status(400).json({ error: "Old name does not match current name" });
    }

    if (user.lastUsernameChange) {
      const hoursSince = (Date.now() - user.lastUsernameChange.getTime()) / (1000 * 60 * 60);
      if (hoursSince < 24) {
        return res.status(429).json({ error: "Username can only be changed once every 24 hours" });
      }
    }

    user.username           = newName;
    user.lastUsernameChange = new Date();
    await user.save();

    return res.status(200).json({ message: "Name updated successfully", newName: user.username });
  } catch (err) {
    console.error("PUT /updateName error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

app.put("/api/user/currency", verifyToken, async (req, res) => {
  const { userId }   = req.user;
  const { currency } = req.body;

  if (!currency) {
    return res.status(400).json({ message: "Currency is required." });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    user.defaultCurrency = currency.toLowerCase();
    await user.save();

    return res.status(200).json({
      message:         `Currency updated to ${currency.toUpperCase()}`,
      defaultCurrency: user.defaultCurrency,
    });
  } catch (err) {
    console.error("PUT /api/user/currency error:", err);
    return res.status(500).json({ message: "Server error while updating currency." });
  }
});

// ── Statistics & bets ─────────────────────────────────────────────────────────

app.put("/updateCapital", verifyToken, async (req, res) => {
  const { userId }            = req.user;
  const { initialInvestment } = req.body;

  if (initialInvestment == null || isNaN(Number(initialInvestment))) {
    return res.status(400).json({ message: "Doslo je do greske sa serverom." });
  }

  try {
    await User.findByIdAndUpdate(userId, {
      $set: { "statistics.initialInvestment": initialInvestment },
    });
    return res.status(200).json({ message: "Uspesno!" });
  } catch (err) {
    console.error("PUT /updateCapital error:", err);
    return res.status(500).json({ message: "Doslo je do greske sa serverom." });
  }
});

app.post("/updateBalance", verifyToken, async (req, res) => {
  const { balance } = req.body;
  const { userId }  = req.user;

  try {
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { "statistics.initialInvestment": Number(balance) } },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found in database" });
    }

    return res.status(200).json({
      success:           true,
      initialInvestment: updatedUser.statistics.initialInvestment,
    });
  } catch (err) {
    console.error("POST /updateBalance error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

app.put("/updateStatistics", verifyToken, async (req, res) => {
  const { userId }  = req.user;
  const { updates } = req.body;

  if (!updates || !Array.isArray(updates) || updates.length === 0) {
    return res.status(400).json({ message: "Doslo je do greske sa serverom." });
  }

  // Validate all paths up front before touching the DB
  for (const update of updates) {
    if (!update.updatePath?.startsWith("statistics")) {
      return res.status(400).json({ message: "Invalid path. Must be under .statistics." });
    }
  }

  try {
    // Collapse all updates into a single atomic DB write
    const $set  = {};
    const $inc  = {};
    const $push = {};

    for (const { updatePath, newValue, increment, push } of updates) {
      if (push) {
        if (newValue && Object.keys(newValue).length > 0) {
          $push[updatePath] = newValue;
        }
      } else if (increment) {
        $inc[updatePath] = newValue;
      } else {
        $set[updatePath] = newValue;
      }
    }

    const mongoOp = {};
    if (Object.keys($set).length)  mongoOp.$set  = $set;
    if (Object.keys($inc).length)  mongoOp.$inc  = $inc;
    if (Object.keys($push).length) mongoOp.$push = $push;

    await User.findByIdAndUpdate(userId, mongoOp);

    return res.status(200).json({ message: "Successfully updated." });
  } catch (err) {
    console.error("PUT /updateStatistics error:", err);
    return res.status(500).json({ message: "Server error while updating stats." });
  }
});

app.put("/resetStatistics", verifyToken, async (req, res) => {
  const { userId } = req.user;

  try {
    await User.findByIdAndUpdate(userId, {
      $set: {
        statistics: {
          totalBets: 0, totalWins: 0, totalLosses: 0,
          winRate: 0, totalProfit: 0, initialInvestment: 0, avgBetAmount: 0,
          monthlyStats: buildDefaultMonthlyStats(),
        },
      },
    });

    return res.status(200).json({ message: "Statistics successfully reset." });
  } catch (err) {
    console.error("PUT /resetStatistics error:", err);
    return res.status(500).json({ message: "Server error while resetting statistics." });
  }
});

app.put("/updateBet", verifyToken, async (req, res) => {
  const { userId }                           = req.user;
  const { betId, date, newStatus, isParlay } = req.body.bet;

  if (!betId || !date || !newStatus) {
    return res.status(400).json({ message: "Missing required parameters." });
  }

  const [month, day] = date.split("/");

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const daybets = user.statistics?.monthlyStats[month - 1]?.bets[day];
    if (!daybets) {
      return res.status(406).json({ message: "No bets found for the given date." });
    }

    const betToUpdate = daybets.find((bet) =>
      isParlay ? bet[0]?.parlayId === betId : bet?.betId === betId
    );

    if (!betToUpdate) {
      return res.status(404).json({ message: `Bet with ID ${betId} not found.` });
    }

    if (isParlay) {
      betToUpdate[0].status = newStatus;
    } else {
      betToUpdate.status = newStatus;
    }

    user.markModified("statistics.monthlyStats");
    await user.save();

    return res.status(200).json({ message: "Bet status updated successfully!", betId, newStatus });
  } catch (err) {
    console.error("PUT /updateBet error:", err);
    return res.status(500).json({ message: "Server error while updating bet status.", errorDetails: err.message });
  }
});

app.put("/removeBet", verifyToken, async (req, res) => {
  const { userId }          = req.user;
  const { betId, isParlay } = req.body;

  if (!userId || !betId) {
    return res.status(400).json({ message: "Invalid request." });
  }

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found." });

    let betToRemove = null;
    let foundMonth  = null;

    for (const month of user.statistics?.monthlyStats ?? []) {
      if (!month.bets) continue;

      for (let dayIndex = 0; dayIndex < month.bets.length; dayIndex++) {
        const dayBets = month.bets[dayIndex];
        if (!dayBets?.length) continue;

        const target = dayBets.find((b) =>
          isParlay ? b[0]?.parlayId === betId : b?.betId === betId
        );

        if (target) {
          betToRemove          = target;
          foundMonth           = month;
          month.bets[dayIndex] = dayBets.filter((b) =>
            isParlay ? b[0]?.parlayId !== betId : b?.betId !== betId
          );
          break;
        }
      }
      if (betToRemove) break;
    }

    if (betToRemove) {
      const stats          = user.statistics;
      const betsToProcess  = isParlay ? betToRemove : [betToRemove];

      for (const b of betsToProcess) {
        const stake  = Number(b.stake) || 0;
        const odds   = Number(b.odds)  || 0;
        const profit = stake * (odds - 1);

        stats.totalBets -= 1;

        if (b.status === "active") {
          // Stake was deducted when bet was placed; add it back
          stats.initialInvestment += stake;
        } else if (b.status === "win") {
          stats.totalWins         -= 1;
          stats.initialInvestment -= profit;
          if (foundMonth) foundMonth.monthlyProfit -= profit;
        } else if (b.status === "loss") {
          stats.totalLosses       -= 1;
          // Stake was already deducted; add it back
          stats.initialInvestment += stake;
          if (foundMonth) foundMonth.monthlyProfit += stake;
        }

        if (foundMonth) {
          foundMonth.totalBets   -= 1;
          foundMonth.totalWins   -= b.status === "win"  ? 1 : 0;
          foundMonth.totalLosses -= b.status === "loss" ? 1 : 0;
        }
      }

      stats.winRate                   = stats.totalBets > 0 ? stats.totalWins / stats.totalBets : 0;
      stats.averageReturnOnInvestment = stats.totalBets > 0 ? stats.initialInvestment / stats.totalBets : 0;

      user.markModified("statistics");
      await user.save();
    }

    return res.status(200).json({ message: "Bet removed successfully." });
  } catch (err) {
    console.error("PUT /removeBet error:", err);
    return res.status(500).json({ message: "Server error." });
  }
});

// ── Tips ──────────────────────────────────────────────────────────────────────

app.get("/tips/:type", async (req, res) => {
  const { type } = req.params;

  if (!["free", "premium"].includes(type)) {
    return res.status(400).json({ message: "Invalid tip type." });
  }

  // Premium tips require a valid token AND a premium account – the paywall is
  // enforced server-side, not just hidden in the UI.
  if (type === "premium") {
    const authHeader = req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Potrebna je prijava." });
    }
    try {
      const decoded = jwt.verify(authHeader.replace("Bearer ", ""), JWT_SECRET);
      const requester = await User.findById(decoded.userId).select("tier").lean();
      if (!requester || requester.tier !== "premium") {
        return res.status(403).json({ message: "Premium pristup je obavezan." });
      }
    } catch {
      return res.status(401).json({ message: "Nevalidan token." });
    }
  }

  try {
    const tips = await Tip.find({ type, active: true }).lean();
    if (!tips || tips.length === 0) {
      return res.status(404).json({ message: `Nije pronadjen ni jedan ${type} tip.` });
    }
    return res.json(tips);
  } catch (err) {
    console.error(`GET /tips/${type} error:`, err);
    return res.status(500).json({ message: "Greska do servera." });
  }
});

app.get("/tipStats", async (req, res) => {
  try {
    const allTips = await TipStat.find();
    return res.status(200).json(allTips);
  } catch (err) {
    console.error("GET /tipStats error:", err);
    return res.status(500).json({ message: "Greška na serveru." });
  }
});

// ── Payments ──────────────────────────────────────────────────────────────────

app.post("/addPayment", paymentLimiter, uploadZ.single("file"), async (req, res) => {
  const { userEmail, userName, paymentType, mtcn } = req.body;
  const imageFile = req.file;

  if (!userEmail || !userName || !paymentType || !imageFile) {
    return res.status(400).json({ message: "Nedostaju podaci ili slika." });
  }

  try {
    const b64     = Buffer.from(imageFile.buffer).toString("base64");
    const dataURI = `data:${imageFile.mimetype};base64,${b64}`;

    const result = await cloudinary.uploader.upload(dataURI, { folder: "payments" });

    const payment = await Payment.create({
      imageUrl:    result.secure_url,
      userEmail,
      userName,
      paymentType,
      mtcn,
    });

    return res.status(200).json(payment);
  } catch (err) {
    console.error("POST /addPayment error:", err);
    return res.status(500).json({ message: "Greška pri čuvanju slike na serveru." });
  }
});

// ── OddsChecker ───────────────────────────────────────────────────────────────

app.get("/oddsChecker/getSearch/:query", async (req, res) => {
  const { query } = req.params;
  const api = `https://www.soccerbet.rs/restapi/offer/sr/search/${query}/mob?annex=0&mobileVersion=2.36.3.14&locale=sr`;

  try {
    const response    = await request(api);
    const contentType = response.headers["content-type"] || "";

    if (!contentType.includes("application/json")) {
      const raw = await response.body.text();
      console.error("Non-JSON response from soccerbet:", raw.slice(0, 500));
      return res.status(502).json({ error: "External API did not return JSON" });
    }

    const data     = await response.body.json();
    const filtered = (data?.esMatches ?? []).filter((match) => {
      // Only football/soccer ("S"). All other sports (basketball "B", tennis, etc.) are excluded.
      if (match.sport !== "S") return false;

      // Drop outright/special markets ("… vs out": top scorer, exact points, group
      // placement, elimination phase, …) — we only want real team-vs-team fixtures.
      if (isOutrightMatch(match)) return false;

      if (
        match.ticketPrintType !== 0 ||
        match.oddsCount <= 5         ||
        match.blocked                ||
        match.status !== 0
      ) {
        return false;
      }

      return true;
    });

    return res.status(200).json(filtered);
  } catch (err) {
    console.error("GET /oddsChecker/getSearch error:", err);
    return res.status(500).json({ error: "Internal server error", message: err.message });
  }
});

// Builds the full multi-bookmaker odds comparison object for one football match.
// Reused by the /oddsChecker/getOdds route and the landing-page teaser.
async function buildComparison({ home, away, date, soccerId, searchQuery }) {
    // ── Odds accumulator ──────────────────────────────────────────────────────
    const odds = {
      ki: {
        name: "Konačan ishod",
        "1":                  { reference: "1"      },
        x:                    { reference: "x"      },
        "2":                  { reference: "2"      },
        doubleChance_1X:      { reference: "1x"     },
        doubleChance_X2:      { reference: "x2"     },
        doubleChance_12:      { reference: "12"     },
        w1:                   { reference: "W1"     },
        w2:                   { reference: "W2"     },
        homeAndHome2Plus:     { reference: "1&D2+"  },
        homeAndHome3Plus:     { reference: "1&D3+"  },
        awayAndAway2Plus:     { reference: "2&G2+"  },
        awayAndAway3Plus:     { reference: "2&G3+"  },
        homeAnd3Plus:         { reference: "1&3+"   },
        homeAnd4Plus:         { reference: "1&4+"   },
        awayAnd3Plus:         { reference: "2&3+"   },
        awayAnd4Plus:         { reference: "2&4+"   },
        homeAndGG:            { reference: "1&gg"   },
        awayAndGG:            { reference: "2&gg"   },
        winBothHalves1:       { reference: "1 oba pol."   },
        winBothHalves2:       { reference: "2 oba pol."   },
        winToNil1:            { reference: "1 bez prim."  },
        winToNil2:            { reference: "2 bez prim."  },
      },
      cornersWinner: {
        name: "Korneri 1X2",
        home: { reference: "kor1" },
        none: { reference: "korx" },
        away: { reference: "kor2" },
      },
      firstCorner: {
        name: "Prvi korner",
        home: { reference: "fk1" },
        away: { reference: "fk2" },
      },
      btts: {
        name: "Gol Gol",
        gg:         { reference: "GG" },
        ng:         { reference: "NG" },
        ggIp:       { reference: "GG 1.pol" },
        ngIp:       { reference: "NG 1.pol" },
        ggIIp:      { reference: "GG 2.pol" },
        ngIIp:      { reference: "NG 2.pol" },
        gg3:        { reference: "GG & 3+" },
        gg4:        { reference: "GG & 4+" },
        gg2to3:     { reference: "GG & 2-3" },
        ggBoth2:    { reference: "Oba tima 2+" },
        ggEachHalf: { reference: "GG & 1+ po pol." },
      },
      goals: {
        name:        "Golovi",
        over1_5:     { reference: "2+"    },
        over2_5:     { reference: "3+"    },
        over_3_5:    { reference: "4+"    },
        over_4_5:    { reference: "5+"    },
        over_5_5:    { reference: "6+"    },
        over_6_5:    { reference: "7+"    },
        gg:          { reference: "GG"    },
        ng:          { reference: "NG"    },
        gg3:         { reference: "GG3+"  },
        gg4:         { reference: "GG4+"  },
        under1_5:    { reference: "0-1"   },
        under2_5:    { reference: "0-2"   },
        under3_5:    { reference: "0-3"   },
        oneToTwo:    { reference: "1-2"   },
        oneToThree:  { reference: "1-3"   },
        oneToFour:   { reference: "1-4"   },
        twoToThree:  { reference: "2-3"   },
        twoToFour:   { reference: "2-4"   },
        twoToFive:   { reference: "2-5"   },
        twoToSix:    { reference: "2-6"   },
        threeToFour: { reference: "3-4"   },
        threeToFive: { reference: "3-5"   },
        threeToSix:  { reference: "3-6"   },
        firstMore:   { reference: "1>"    },
        secondMore:  { reference: "2>"    },
        equalGoals:  { reference: "1=2"   },
        even:        { reference: "Par"   },
        odd:         { reference: "Nepar" },
      },
      homeGoals: {
        name:       "Domacin golova",
        over_0_5:   { reference: "D1+"       },
        over_1_5:   { reference: "D2+"       },
        over_2_5:   { reference: "D3+"       },
        over_3_5:   { reference: "D4+"       },
        zeroToOne:  { reference: "D0-1"      },
        zeroToTwo:  { reference: "D0-2"      },
        first_0_5:  { reference: "1.POL D1+" },
        first_1_5:  { reference: "1.POL D2+" },
        second_0_5: { reference: "2.POL D1+" },
        second_1_5: { reference: "2.POL D2+" },
      },
      awayGoals: {
        name:       "Gost golova",
        over_0_5:   { reference: "G1+"       },
        over_1_5:   { reference: "G2+"       },
        over_2_5:   { reference: "G3+"       },
        over_3_5:   { reference: "G4+"       },
        zeroToOne:  { reference: "G0-1"      },
        first_0_5:  { reference: "1.POL G1+" },
        first_1_5:  { reference: "1.POL G2+" },
        second_0_5: { reference: "2.POL G1+" },
        second_1_5: { reference: "2.POL G2+" },
      },
      firstHalf: {
        name:               "Prvo poluvreme",
        over_0_5:           { reference: "PP1+"           },
        over_1_5:           { reference: "PP2+"           },
        over_2_5:           { reference: "PP3+"           },
        over_3_5:           { reference: "PP4+"           },
        zeroToOne:          { reference: "I 0-1"          },
        zeroToTwo:          { reference: "I 0-2"          },
        oneToTwo:           { reference: "I 1-2"          },
        oneToThree:         { reference: "I 1-3"          },
        twoToThree:         { reference: "I 2-3"          },
        gg:                 { reference: "GG1"            },
        ki1:                { reference: "Ishod PP. 1"    },
        ki2:                { reference: "Ishod PP. 2"    },
        kix:                { reference: "Ishod PP. X"    },
        pg1:                { reference: "Prvi Gol PP. 1" },
        pg2:                { reference: "Prvi Gol PP. 2" },
      },
      secondHalf: {
        name:     "Drugo poluvreme",
        over_0_5: { reference: "2P1+"        },
        over_1_5: { reference: "2P2+"        },
        over_2_5: { reference: "2P3+"        },
        over_3_5: { reference: "2P4+"        },
        zeroToOne:  { reference: "II 0-1"    },
        zeroToTwo:  { reference: "II 0-2"    },
        oneToTwo:   { reference: "II 1-2"    },
        oneToThree: { reference: "II 1-3"    },
        twoToThree: { reference: "II 2-3"    },
        gg:       { reference: "GG2"         },
        ki1:      { reference: "Ishod 2P. 1" },
        ki2:      { reference: "Ishod 2P. 2" },
        kix:      { reference: "Ishod 2P. X" },
      },
      htft: {
        name: "Prelazi",
        hh: { reference: "1-1" },
        hx: { reference: "1-X" },
        ha: { reference: "1-2" },
        aa: { reference: "2-2" },
        ax: { reference: "2-X" },
        ah: { reference: "2-1" },
        xh: { reference: "X-1" },
        xx: { reference: "X-X" },
        xa: { reference: "X-2" },
      },
      correctScore: {
        name: "Tačan rezultat",
        s00: { reference: "0:0" },
        s10: { reference: "1:0" },
        s01: { reference: "0:1" },
        s11: { reference: "1:1" },
        s20: { reference: "2:0" },
        s02: { reference: "0:2" },
        s21: { reference: "2:1" },
        s12: { reference: "1:2" },
        s22: { reference: "2:2" },
        s30: { reference: "3:0" },
        s03: { reference: "0:3" },
        s31: { reference: "3:1" },
        s13: { reference: "1:3" },
        s32: { reference: "3:2" },
        s23: { reference: "2:3" },
        s40: { reference: "4:0" },
        s04: { reference: "0:4" },
      },
      halfGoalCombos: {
        name: "Golovi po poluvremenima",
        i1ii1: { reference: "I1+ & II1+" },
        i1ii2: { reference: "I1+ & II2+" },
        i2ii1: { reference: "I2+ & II1+" },
        i2ii2: { reference: "I2+ & II2+" },
      },
      exactGoals: {
        name: "Tačno golova",
        g1: { reference: "1 gol"  },
        g2: { reference: "2 gola" },
        g3: { reference: "3 gola" },
        g4: { reference: "4 gola" },
        g5: { reference: "5 gol." },
      },
      handicap: {
        // European handicap. The three lines are match-specific; their reference
        // labels are filled in dynamically below from the source match params.
        name: "Hendikep",
        h1a: { reference: "H1" },
        hxa: { reference: "HX" },
        h2a: { reference: "H2" },
        h1b: { reference: "H1" },
        hxb: { reference: "HX" },
        h2b: { reference: "H2" },
        h1c: { reference: "H1" },
        hxc: { reference: "HX" },
        h2c: { reference: "H2" },
      },
    };



    const [
      soccerResponse,
      maxbetSearchResponse,
      oktagonSearchResponse,
      merkurSearchResponse,
      brazilSearchResponse,
      betoleSearchResponse,
    ] = await Promise.all([
      request(`https://www.soccerbet.rs/restapi/offer/sr/match/${soccerId}?annex=0&desktopVersion=2.36.3.14&locale=sr`),
      request(`https://www.maxbet.rs/restapi/offer/sr/search/${searchQuery}/mob?mobileVersion=1.2.1.14&locale=sr`),
      request(`https://www.oktagonbet.com/restapi/offer/sr/search/${searchQuery}/mob?annex=1&mobileVersion=2.38.5.1&locale=sr`),
      request(`https://www.merkurxtip.rs/restapi/offer/sr/search/${searchQuery}/mob?annex=0&mobileVersion=1.16.2.18&locale=sr`, {
        method:  "GET",
        headers: {
          "Accept":           "application/json",
          "Accept-Encoding":  "gzip",
          "X-Requested-With": "XMLHttpRequest",
          "User-Agent":       "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1",
        },
      }),
      request(`https://www.brazilbet.rs/restapi/offer/sr/search/${searchQuery}/mob?annex=51&mobileVersion=2.44.9.7&locale=sr`),
      request(`https://www.betole.com/restapi/offer/sr/search/${searchQuery}/mob?annex=0&mobileVersion=2.36.3.14&locale=sr`),
    ]);

    // ── Parse responses (each bookmaker fails independently) ──────────────────
    // Note: merkurSearchResponse is NOT included here – it uses gzip and is
    // decompressed manually below.
    const [soccerJson, maxbetJson, oktagonJson, brazilJson, betoleJson] = await Promise.all([
      safeParseUndiciJson(soccerResponse,        "soccerBet"),
      safeParseUndiciJson(maxbetSearchResponse,  "maxBet"),
      safeParseUndiciJson(oktagonSearchResponse, "oktagon"),
      safeParseUndiciJson(brazilSearchResponse,  "brazil"),
      safeParseUndiciJson(betoleSearchResponse,  "betole"),
    ]);

    // Merkur uses gzip encoding – decompress manually
    let merkurJson = null;
    try {
      const merkurBuffer       = Buffer.from(await merkurSearchResponse.body.arrayBuffer());
      const merkurDecompressed = merkurSearchResponse.headers["content-encoding"] === "gzip"
        ? gunzipSync(merkurBuffer).toString("utf-8")
        : merkurBuffer.toString("utf-8");
      merkurJson = JSON.parse(merkurDecompressed);
    } catch (err) {
      console.warn("[merkur] Failed to parse response:", err.message);
    }

    // ── Apply odds from each bookmaker ────────────────────────────────────────

    // SoccerBet – betMap[code]?.NULL?.ov
    if (soccerJson?.betMap) {
      const betMap = soccerJson.betMap;
      applySharedOdds(odds, "soccerBet", (code) => betMap[code]?.NULL?.ov);
    }

    // MaxBet – odds are inline on the search result (no detail fetch needed)
    if (maxbetJson?.esMatches) {
      const match = pickFootballMatch(maxbetJson.esMatches, { date, home, away });
      if (match?.odds) {
        applySharedOdds(odds, "maxBet", (code) => match.odds[code]);
      }
    }

    // Oktagon, Merkur, Brazil – each needs a second detail fetch via shared helper.
    // Mozzart – uses its own dedicated function (different response shape).
    await Promise.all([
      fetchAndApplyDetailOdds({
        searchJson: oktagonJson,
        date, home, away,
        matchUrl:   (id) => `https://www.oktagonbet.com/restapi/offer/sr/match/${id}?annex=1&mobileVersion=2.38.5.1&locale=sr`,
        bookmaker:  "oktagon",
        odds,
      }),
      fetchAndApplyDetailOdds({
        searchJson: merkurJson,
        date, home, away,
        matchUrl:   (id) => `https://www.merkurxtip.rs/restapi/offer/sr/match/${id}?annex=0&mobileVersion=1.16.2.18&locale=sr`,
        bookmaker:  "merkur",
        odds,
      }),
      fetchAndApplyDetailOdds({
        searchJson: brazilJson,
        date, home, away,
        matchUrl:   (id) => `https://www.brazilbet.rs/restapi/offer/sr/match/${id}?annex=51&mobileVersion=2.44.9.7&locale=sr`,
        bookmaker:  "brazil",
        odds,
      }),
      // Betole – same SVN/ibet platform & shared bet-codes; detail endpoint returns full `odds`
      fetchAndApplyDetailOdds({
        searchJson: betoleJson,
        date, home, away,
        matchUrl:   (id) => `https://www.betole.com/restapi/offer/sr/match/${id}?annex=0&mobileVersion=2.36.3.14&locale=sr`,
        bookmaker:  "betole",
        odds,
      }),
      // Meridian – separate auth + search + markets flow (different API shape)
      fetchAndApplyMeridianOdds({ date, home, away, searchQuery, odds }),
      // Balkanbet – NSoft Seven distribution API (cached football list → event markets)
      fetchAndApplyBalkanbetOdds({ date, home, away, odds }),
    ]);


    return odds;
}

app.post("/oddsChecker/getOdds/", oddsLimiter, async (req, res) => {
  const { home, away, date, soccerId, searchQuery, sport } = req.body;
  if (!home || !away || !date || !soccerId || !searchQuery || !sport) {
    return res.status(400).json({ error: "Missing required parameters" });
  }
  if (sport !== "S") return res.status(200).json(null);
  try {
    const odds = await buildComparison({ home, away, date, soccerId, searchQuery });
    return res.status(200).json(odds);
  } catch (err) {
    console.error("POST /oddsChecker/getOdds error:", err);
    return res.status(500).json({ error: "Failed to fetch odds data" });
  }
});

// ─── Start server ─────────────────────────────────────────────────────────────
server.listen(1337, () => console.log("Listening on port 1337."));
