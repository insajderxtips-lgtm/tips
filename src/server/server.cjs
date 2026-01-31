const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { request } = require("undici");
const http = require("http");
const socketIo = require("socket.io");
const nodemailer = require("nodemailer");
const { v4: uuidv4 } = require("uuid");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const {gunzipSync} = require("zlib")
const cloudinary = require('cloudinary').v2;
const axios = require('axios');
const FormData = require('form-data');
const multer = require('multer');
const uploadZ = multer();


app.use(cookieParser());
app.use(express.json());
app.use(cors());
const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: "https://insajder.tips",
    methods: ["GET", "POST"],
  },
});

mongoose
  .connect(
    "mongodb+srv://bogdandjakovic123:WXhytqY263CV7naU@insajdercluster.hpjtu.mongodb.net/insiderDb?retryWrites=true&w=majority&appName=insajderCluster"
  )
  .then(() => console.log("Successfully connected to MongoDB."))
  .catch((err) => console.log("Connection error:", err));

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
cloudinary.config({
  cloud_name: 'dq2bh78fn',
  api_key: '587517854453255',
  api_secret: '2GWL_DTDDBTzdX8YwZwGt73efN0'
});
const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },

    username: { type: String, required: true, unique: true },

    lastUsernameChange: {
      type: Date,
      default: null
    },

    tier: { type: String, default: "free" },

    isVerified: { type: Boolean, required: true, default: false },
    verificationCode: { type: String },
    codeExpiresAt: { type: Date },

    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },

    defaultCurrency: { type: String, default: "EUR" },

    statistics: {
      totalBets: { type: Number, default: 0 },
      totalWins: { type: Number, default: 0 },
      totalLosses: { type: Number, default: 0 },
      winRate: { type: Number, default: 0 },
      totalProfit: { type: Number, default: 0 },
      initialInvestment: { type: Number, default: null },

      monthlyStats: {
        type: [
          {
            month: { type: String, required: true },
            totalBets: { type: Number, default: 0 },
            totalWins: { type: Number, default: 0 },
            totalLosses: { type: Number, default: 0 },
            monthlyProfit: { type: Number, default: 0 },
            bets: { type: Array, default: [] }
          }
        ],
        default: months.map((month) => ({
          month,
          totalBets: 0,
          totalWins: 0,
          totalLosses: 0,
          monthlyProfit: 0,
          bets: []
        }))
      },

      avgBetAmount: { type: Number, default: 0 },
      averageReturnOnInvestment: { type: Number, default: 0 }
    }
  },
  { timestamps: true }
);
const oddsLimiter = rateLimit({
  windowMs: 1000, // 3 seconds
  max: 1
});
const TipSchema = new mongoose.Schema({
  tipTitle: { type: String, required: true },
  tip: { type: String, required: true },

  // CORE FILTERING FIELDS
  type: {
    type: String,
    enum: ["free", "premium"],
    required: true,
    index: true, // Indexing this field for fast queries like 'type: "free"'
  },
  active: {
    type: Boolean,
    default: true,
    index: true, // Indexing this for fast 'active: true' queries
  },

  // OTHER CORE DISPLAY FIELDS
  league: String,
  date: Date,
  confidencePercent: { type: Number, min: 0, max: 100 },
  stars: { type: Number, min: 1, max: 5 },
  home: { type: String, required: true },
  away: { type: String, required: true },
  homeLogo: String,
  awayLogo: String,

  // EXPANDED DETAIL FIELDS (Kept embedded as you requested in the first step)
  analysis: String,
  stats: {
    possession: String,
    shots: String,
    form: String,
  },
  lineups: {
    home: [String],
    away: [String],
  },
  injuries: {
    home: [String],
    away: [String],
  },
});
const tipStatSchema = new mongoose.Schema(
  {
    id: String,
    match: String,
    tip: String,
    odds: String,
    stake: String,
    status: String,
    date: String,
    sport: String,
    profit: Number,
    grupa: String,
  },
  { collection: "stats" }
);
const PaymentSchema = new mongoose.Schema({
  imageUrl: { type: String, required: false },
  userEmail: { type: String, required: true },
  userName: { type: String, required: true },
  paymentType: { type: String, required: true },
  mtcn: { type: String, required: false },
});
const Payment = mongoose.model("Payment", PaymentSchema);
const User = mongoose.model("User", UserSchema);
const Tip = mongoose.model("Tip", TipSchema);
const TipStat = mongoose.model("TipStat", tipStatSchema);

const JWT_SECRET = "unlockstheworld.";
const paymentLimiter = rateLimit({
  windowMs: 300000, // 15 minutes
  max: 3, // Limit each IP to 5 payment submission requests per 15 minutes
  message:
    "Previše zahteva za plaćanje s ove IP adrese, pokušajte ponovo kasnije (za 12 sati) ili nas kontaktirajte", // Message when max is exceeded
  standardHeaders: true,
  legacyHeaders: false,
});
const verifyToken = (req, res, next) => {
  const authHeader = req.header("Authorization");

  // Log 1: Check if Nginx is actually passing the header
  console.log("🛡️ Auth Header:", authHeader ? "Received" : "MISSING");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.error("❌ Auth Header missing or incorrectly formatted");
    return res.status(401).json({ message: "Doslo je do greske. Probajte se ponovo ulogovati." });
  }

  const token = authHeader.replace("Bearer ", "");

  try {
    // Log 2: Check the secret being used
    // NOTE: Don't log the whole secret for security, just the length or first 3 chars
    console.log("🔑 Using Secret starting with:", JWT_SECRET.substring(0, 3));

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    
    console.log("✅ Token verified for user ID:", decoded.userId);
    next();
  } catch (err) {
    // Log 3: Why did it fail? (Expired? Invalid signature?)
    console.error("❌ JWT Error:", err.message);
    
    return res.status(401).json({ message: "Doslo je do greske. Probajte se ponovo ulogovati." });
  }
};
let messages = [];
let onlineUsers = new Set(); // Using Set to avoid duplicates

io.on("connection", (socket) => {
  console.log("New connection!");

  // Extract username from message sender (fallback to 'Anonymous')
  const getUsername = (msg) => msg?.sender || "Anonymous";

  // Send initial data
  socket.emit("previous_messages", messages.slice(-100));

  // When receiving a message
  socket.on("send_message", (msg) => {
    const message = {
      id: Date.now(),
      text: msg.text,
      sender: getUsername(msg),
      timestamp: new Date(),
      tier: msg.tier,
    };

    // Update messages (max 100)
    messages.push(message);
    if (messages.length > 100) messages.shift();

    // Add sender to online users if not already present
    onlineUsers.add(message.sender);

    // Broadcast updates
    io.emit("new_message", message);
    io.emit("online_users", Array.from(onlineUsers)); // Send array of usernames
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("User disconnected");
    // Note: We can't reliably remove users here since we track by message senders
    // This is a limitation of not having auth IDs
  });
});

app.post("/login", async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body; // Read the flag

    // This is your original user lookup method, kept intact
    const user = await User.findOne({
      email: email,
      password: password,
    }).lean();

    if (!user) {
      return res.status(404).json({ message: "Pogresan email ili sifra." });
    }

    // --- "Remember Me" Logic ---
    // Set the token's lifetime based on the flag
    const expiresIn = rememberMe ? "7d" : "24h";

    const payload = { userId: user._id, email: user.email, tier: user.tier };

    // Create the token with the correct expiration
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn });
    // --- End of "Remember Me" Logic ---

    // Send the token back in the JSON response, as your client expects
    res.send({ token });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Greška na serveru." });
  }
});
app.post("/resend-code", async (req, res) => {
  // Only need the email for resending the code
  const { email } = req.body;

  // Check if the required field is present
  if (!email) {
    return res
      .status(401)
      .json({ message: "Doslo je do greske. Unesite email." });
  }

  try {
    // 1. Find the existing user by email
    // (Assumes User model is available in scope)
    const existingUser = await User.findOne({ email });

    if (!existingUser) {
      return res
        .status(404)
        .json({ message: "Korisnik sa tim emailom nije pronadjen." });
    }

    // 2. Generate new verification code and expiration time
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();
    const codeExpiresAt = new Date(Date.now() + 180 * 60 * 1000); // Code expires in 10 minutes

    // 3. Update the existing user's verification fields
    existingUser.verificationCode = verificationCode;
    existingUser.codeExpiresAt = codeExpiresAt;
    existingUser.isVerified = false; // Ensure verification status is reset upon resend

    // Save the updated user object to the database
    await existingUser.save();

    // 4. Set up email transport and send the new code
    // (Replicating the transport setup from your register function)
    const transport = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "insajderxtips@gmail.com",
        pass: "uyvb dtaf wyma lrdr",
      },
    });

    await transport.sendMail({
      from: "Insajder verifikacija (:",
      to: email,
      subject: "InsajderTips | NOVI Verifikacioni Kod",
      text: "Vaš novi verifikacioni kod je: " + verificationCode,
    });

    // 5. Send success response
    res
      .status(200)
      .json({ message: "Novi verifikacioni kod je uspesno poslat!" });
  } catch (err) {
    console.error("Greska pri ponovnom slanju koda:", err);
    res
      .status(500)
      .json({ message: "Doslo je do greske na serveru prilikom slanja koda." });
  }
});
app.post("/register", async (req, res) => {
  const { email, password, username, defaultCurrency } = req.body;

  if (!email || !password || !username || !defaultCurrency) {
    return res
      .status(400)
      .json({ message: "Doslo je do greske. Unesite svako polje." });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Taj email se vec koristi." });
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const codeExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const newUser = new User({
      email,
      password,
      username,
      defaultCurrency: defaultCurrency.toUpperCase(),
      tier: "free",
      isVerified: false,
      verificationCode,
      codeExpiresAt,
      statistics: {
        totalBets: 0,
        totalWins: 0,
        totalLosses: 0,
        winRate: 0,
        totalProfit: 0,
        initialInvestment: null,
        monthlyStats: Array.from({ length: 12 }).map((_, i) => ({
          month: new Date(0, i).toLocaleString("en", { month: "long" }),
          totalBets: 0,
          totalWins: 0,
          totalLosses: 0,
          monthlyProfit: 0,
        })),
      },
    });

    await newUser.save();

    const transport = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "insajderxtips@gmail.com",
        pass: "eysx xdex jamb vujp",
      },
    });

    await transport.sendMail({
      from: "Insajder verifikacija (:",
      to: email,
      subject: "InsajderTips | Verifikacioni Kod",
      text: "Vaš verifikacioni kod za registraciju je: " + verificationCode,
    });

    res.status(201).json({ message: "Registracija uspesna! Proverite email za kod." });

  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({ message: err.message || "Doslo je do greske sa registracijom." });
  }
});

app.post("/verification", async (req, res) => {
  console.log("📩 POST /verification called");
  console.log("🔍 Request body:", req.body);

  const { email, code } = req.body;

  // Basic type checks
  console.log("📧 Email:", email, " | Type:", typeof email);
  console.log("🧾 Code:", code, " | Type:", typeof code);

  if (!email || !code) {
    return res.status(400).json({ message: "Email i kod su obavezni." });
  }

  const user = await User.findOne({ email });
  console.log("👤 Found user:", user ? user.email : "None");

  if (!user) {
    console.log("❌ User not found.");
    return res.status(404).json({ message: "Korisnik nije pronađen." });
  }

  if (user.isVerified) {
    console.log("✅ User already verified.");
    return res.status(400).json({ message: "Nalog je već verifikovan." });
  }

  console.log(
    "📤 Stored code:",
    user.verificationCode,
    "| Type:",
    typeof user.verificationCode
  );
  console.log("📥 Received code:", code, "| Type:", typeof code);

  // Compare as strings (optional: trim just in case)
  if (String(user.verificationCode).trim() !== String(code).trim()) {
    console.log("❌ Kod nije tačan.");
    return res.status(400).json({ message: "Neispravan verifikacioni kod." });
  }

  // Finalize verification
  user.isVerified = true;
  user.verificationCode = undefined;
  user.codeExpiresAt = undefined;
  await user.save();

  console.log("🎉 Verification successful for:", email);
  return res.status(200).json({ message: "Nalog uspešno verifikovan!" });
});

app.get("/user", verifyToken, async (req, res) => {
  // fetches the current user provided by the verifyToken middleware
  try {
    const userData = await User.findById(req.user.userId).select("-password");
    res.status(200).json({ user: userData });
  } catch (err) {}
});
app.get("/tips/:type", async (req, res) => {
  try {
    const { type } = req.params;
    if (!["free", "premium"].includes(type)) {
      return res.status(400).json({ message: "Invalid tip type." });
    }

    const tips = await Tip.find({ type, active: true }).lean();

    if (!tips || tips.length === 0) {
      return res
        .status(404)
        .json({ message: `Nije pronadjen ni jedan ${type} tip.` });
    }

    res.json(tips);
  } catch (err) {
    console.error(`/tips/${req.params.type} error:`, err);
    res.status(500).json({ message: "Greska do servera." });
  }
});

app.get("/statistics/:user", verifyToken, async (req, res) => {
  const { user } = req.params;
  console.log("📩 Statistics requested for username:", user);
  console.log("🔑 User ID from Token:", req.user?.userId);

  if (!user) {
    return res.status(400).json({ message: "Doslo je do greske. Molimo prijavite nasoj podrsci." });
  }

  const actualUserId = req.user.userId;
  try {
    const actualUser = await User.findById(actualUserId);
    console.log("👤 Found user in DB:", actualUser ? actualUser.username : "NOT FOUND");

    if (!actualUser) {
      return res.status(404).json({ message: "Korisnik nije pronadjen." });
    }

    if (user !== actualUser.username) {
      console.warn(`🚫 Access Denied: ${actualUser.username} tried to view ${user}`);
      return res.status(403).json({ message: "Nemate pristup ovom korisniku." });
    }

    const statistics = await User.findOne({ _id: actualUserId });
    console.log("✅ Statistics sent successfully");
    return res.status(200).json(statistics);
  } catch (err) {
    console.error("❌ Database Error in /statistics:", err);
    return res.status(500).json({ message: "Server error" });
  }
});
app.put("/updateCapital", verifyToken, async (req, res) => {
  const userId = req.user.userId;
  const initialInvestment = req.body.initialInvestment;
  if (!userId || !initialInvestment) {
    return res.status(400).json({ message: "Doslo je do greske sa serverom." });
  }

  try {
    await User.findByIdAndUpdate(userId, {
      $set: { "statistics.initialInvestment": initialInvestment },
    });
    return res.status(200).json({ message: "Uspesno!" });
  } catch (err) {
    return res.status(400).json({ message: "Doslo je do greske sa serverom." });
  }
});
app.put("/updateStatistics", verifyToken, async (req, res) => {
  const { userId } = req.user;
  const { updates } = req.body;

  if (!userId || !updates || !Array.isArray(updates)) {
    return res.status(400).json({ message: "Doslo je do greske sa serverom." });
  }

  try {
    for (const update of updates) {
      const { updatePath, newValue, increment, push } = update;

      if (!updatePath.startsWith("statistics")) {
        return res
          .status(400)
          .json({ message: "Invalid path. Must be under .statistics." });
      }

      if (push) {
        if (newValue && Object.keys(newValue).length > 0) {
          // Make sure newValue is not empty or null
          const pushUpdate = { [updatePath]: newValue };
          await User.findByIdAndUpdate(userId, { $push: pushUpdate });
        } else {
          console.log(
            "New value is empty or invalid, skipping push operation."
          );
        }
      } else if (increment) {
        const incrementUpdate = { [updatePath]: newValue };
        await User.findByIdAndUpdate(userId, { $inc: incrementUpdate });
      } else {
        const setUpdate = { [updatePath]: newValue };
        await User.findByIdAndUpdate(userId, { $set: setUpdate });
      }
    }

    return res.status(200).json({ message: "Successfully updated." });
  } catch (err) {
    console.error("Error updating statistics:", err);
    return res
      .status(500)
      .json({ message: "Server error while updating stats." });
  }
});

app.put("/updateBet", verifyToken, async (req, res) => {
  const { userId } = req.user;
  const { betId, date, newStatus, isParlay } = req.body.bet;

  // Input validation
  if (!betId || !date || !newStatus) {
    return res.status(400).json({ message: "Missing required parameters." });
  }

  const [month, day] = date.split("/");

  try {
    const getUser = await User.findById(userId);

    if (!getUser) {
      return res.status(404).json({ message: "User not found." });
    }

    const daybets = getUser.statistics?.monthlyStats[month - 1]?.bets[day];

    if (!daybets) {
      return res
        .status(406)
        .json({ message: "No bets found for the given date." });
    }

    const betToUpdate = daybets.find((bet) =>
      isParlay ? bet[0]?.parlayId === betId : bet?.betId === betId
    );

    if (!betToUpdate) {
      return res
        .status(404)
        .json({ message: `Bet with ID ${betId} not found.` });
    }

    // Update the bet status based on whether it's a parlay or single bet
    if (isParlay) {
      betToUpdate[0].status = newStatus; // parlay status
    } else {
      betToUpdate.status = newStatus; //  single bet outcome
    }

    getUser.markModified("statistics.monthlyStats");

    await getUser.save();

    return res.status(200).json({
      message: "Bet status updated successfully!",
      betId: betId,
      newStatus: newStatus,
    });
  } catch (err) {
    console.error("Error updating bet status:", err);
    return res.status(500).json({
      message: "Server error while updating bet status.",
      errorDetails: err.message,
    });
  }
});
app.put("/removeBet", verifyToken, async (req, res) => {
  const { userId } = req.user;
  const { betId, isParlay } = req.body;

  if (!userId || !betId) {
    return res.status(400).json({ message: "Invalid request." });
  }

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found." });

    let betToRemove = null;
    let foundMonth = null;

    if (user.statistics?.monthlyStats) {
      for (const month of user.statistics.monthlyStats) {
        if (!month.bets) continue;

        for (let dayIndex = 0; dayIndex < month.bets.length; dayIndex++) {
          const dayBets = month.bets[dayIndex];
          if (!dayBets || !dayBets.length) continue;

          const target = dayBets.find((b) =>
            isParlay ? b[0]?.parlayId === betId : b?.betId === betId
          );

          if (target) {
            betToRemove = target;
            foundMonth = month;
            // Remove it from the array
            month.bets[dayIndex] = dayBets.filter((b) =>
              isParlay ? b[0]?.parlayId !== betId : b?.betId !== betId
            );
            break;
          }
        }
        if (betToRemove) break;
      }
    }

    if (betToRemove) {
      const stats = user.statistics;
      const betsToProcess = isParlay ? betToRemove : [betToRemove];

      betsToProcess.forEach((b) => {
        const stake = Number(b.stake) || 0;
        const odds = Number(b.odds) || 0;
        const profit = stake * (odds - 1);

        stats.totalBets -= 1;

        if (b.status === "active") {
          stats.initialInvestment -= -stake; // Reversing the negative
        } else if (b.status === "win") {
          stats.totalWins -= 1;
          stats.initialInvestment -= profit;
          if (foundMonth) foundMonth.monthlyProfit -= profit;
        } else if (b.status === "loss") {
          stats.totalLosses -= 1;
          stats.initialInvestment -= -stake;
          if (foundMonth) foundMonth.monthlyProfit -= -stake;
        }

        if (foundMonth) {
          foundMonth.totalBets -= 1;
          foundMonth.totalWins -= b.status === "win" ? 1 : 0;
          foundMonth.totalLosses -= b.status === "loss" ? 1 : 0;
        }
      });

      // Recalculate derived stats
      stats.winRate = stats.totalBets > 0 ? stats.totalWins / stats.totalBets : 0;
      stats.averageReturnOnInvestment = stats.totalBets > 0 ? stats.initialInvestment / stats.totalBets : 0;

      // Force Mongoose to recognize the nested update
      user.markModified("statistics");
      await user.save();
    }

    return res.status(200).json({ message: "Bet removed successfully." });
  } catch (err) {
    console.error("Error removing bet:", err);
    return res.status(500).json({ message: "Server error." });
  }
});

// PUT /api/user/currency
app.put("/api/user/currency", verifyToken, async (req, res) => {
  const { userId } = req.user; // from your token
  const { currency } = req.body;

  if (!currency) {
    return res.status(400).json({ message: "Currency is required." });
  }

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Update currency
    user.defaultCurrency = currency.toLowerCase(); // normalize
    await user.save();

    return res.status(200).json({
      message: `Currency updated to ${currency.toUpperCase()}`,
      defaultCurrency: user.defaultCurrency,
    });
  } catch (err) {
    console.error("Error updating currency:", err);
    return res
      .status(500)
      .json({ message: "Server error while updating currency." });
  }
});

app.put("/updateName", verifyToken, async (req, res) => {
  try {
    const { oldName, newName } = req.body;
    const userId = req.user.userId;

    if (!oldName || !newName) {
      return res.status(400).json({ error: "Both oldName and newName are required" });
    }

    if (oldName === newName) {
      return res.status(400).json({ error: "New name must be different" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.username !== oldName) {
      return res.status(400).json({ error: "Old name does not match current name" });
    }

    // ⏱ Rate limit: once per 24h
    if (user.lastUsernameChange) {
      const hoursSince =
        (Date.now() - user.lastUsernameChange.getTime()) / (1000 * 60 * 60);

      if (hoursSince < 24) {
        return res.status(429).json({
          error: "Username can only be changed once every 24 hours"
        });
      }
    }

    user.username = newName;
    user.lastUsernameChange = new Date();
    await user.save();

    return res.status(200).json({
      message: "Name updated successfully",
      newName: user.username
    });
  } catch (error) {
    console.error("Error updating name:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/requestPasswordResetCode", async (req, res) => {
  const { email } = req.body;
  console.log("Password reset request received for:", email);

  if (!email || !email.includes("@")) {
    return res.status(400).json({ message: "Nevalidan email." });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res
      .status(200)
      .json({ message: "Ako email postoji, reset link je poslat." });
  }

  // 1. Generate UUID token
  const token = uuidv4();
  const tokenExpiry = Date.now() + 1000 * 60 * 60; // 1 hour

  // 2. Save token and expiry to DB
  user.resetPasswordToken = token;
  user.resetPasswordExpires = tokenExpiry;
  await user.save();

  // 3. Compose reset link
  const resetLink = `http://insajder.tips/#/reset-password?token=${token}`;

  // 4. Send email with link
 const transport = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "insajderxtips@gmail.com",
      pass: "jyyc nkmw uvsp plmn",
    },
  });

await transport.sendMail({
  from: '"Insajder Tips" <insajderxtips@gmail.com>', // Correct format
  to: email,
  subject: "Insajder Tips | Resetujte Šifru",
  text: `Da biste resetovali sifru, kliknite na sledeći link: ${resetLink}`,
});

  return res
    .status(200)
    .json({ message: "Ako email postoji, reset link je poslat." });
});
app.put("/resetStatistics", verifyToken, async (req, res) => {
  try {
    const { userId } = req.user;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required." });
    }

    // Create empty monthly stats for all 12 months
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    const monthlyStats = monthNames.map((monthName, index) => ({
      month: monthName,
      bets: [],
      monthlyProfit: 0,
      totalBets: 0,
      totalWins: 0,
      totalLosses: 0,
    }));

    // Reset statistics to default values
    const defaultStats = {
      totalBets: 0,
      totalWins: 0,
      totalLosses: 0,
      winRate: 0,
      totalProfit: 0,
      initialInvestment: 0,
      avgBetAmount: 0,
      monthlyStats: monthlyStats,
    };

    await User.findByIdAndUpdate(userId, {
      $set: { statistics: defaultStats },
    });

    return res.status(200).json({ message: "Statistics successfully reset." });
  } catch (err) {
    console.error("Error resetting statistics:", err);

    // Check if it's an authentication error
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ message: "Authentication failed. Please log in again." });
    }

    return res
      .status(500)
      .json({ message: "Server error while resetting statistics." });
  }
});
app.post("/resetPassword", async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ message: "Token i lozinka su obavezni." });
  }

  try {
    const user = await User.findOne({ resetPasswordToken: token });

    if (!user) {
      return res.status(404).json({ message: "Nevalidan ili istekao token." });
    }

    user.password = newPassword; // ✅ not hashed, raw password
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;

    await user.save();

    res.status(200).json({ message: "Lozinka uspešno resetovana." });
  } catch (err) {
    console.error("Greška:", err);
    res.status(500).json({ message: "Greška na serveru." });
  }
});
// OddsChecker
app.get("/oddsChecker/getSearch/:query", async (req, res) => {
  const query = req.params.query;

  const api = `https://www.soccerbet.rs/restapi/offer/sr/search/${query}/mob?annex=0&mobileVersion=2.36.3.14&locale=sr`;

  try {
    const response = await request(api);
    const ctp = response.headers["content-type"];

    if (ctp && ctp.includes("application/json")) {
      const data = await response.body.json();

      // Debug: Log all matches with sport and leagueName
/*
      data?.esMatches.forEach((match, index) => {
        console.log(`Match #${index + 1}:`, match.sport, "-", match.leagueName);
      });
      */

      // Filter out any matches where leagueName or leagueToken contains "Igrači"
      // Also keep only sport S or B, apply extra filters to basketball leagues
    const filtered = data?.esMatches.filter((match) => {
  const leagueNameLower = (match.leagueName || "").toLowerCase();
  const leagueTokenLower = (match.leagueToken || "").toLowerCase();

  if (
    leagueNameLower.includes("igrači") ||
    leagueTokenLower.includes("igrači") ||
    leagueNameLower.includes("pobednik") ||
    leagueTokenLower.includes("pobednik") ||
    leagueNameLower.includes("winner") ||
    leagueTokenLower.includes("winner") ||
    leagueNameLower.includes("test") ||
    match.away === "." ||
    match.ticketPrintType !== 0 ||
    match.oddsCount <= 5 ||
    match.blocked ||
    match.status !== 0
  ) {
    return false;
  }

  // football
  if (match.sport === "S") {
    return true;
  }

  // basketball
  if (match.sport === "B") {
    if (
      leagueNameLower.includes("nba") ||
      leagueNameLower.includes("evroliga") // ✅ FIXED
    ) {
      return false;
    }
    return true;
  }

  return false;
});

      return res.status(200).json(filtered);
    }
  } catch (err) {
    console.error("Error in /oddsChecker/getSearch/:query:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});
app.post("/updateBalance", verifyToken, async (req, res) => {
  try {
    const { balance } = req.body;
    
    // According to your debug_payload, the key is 'userId'
    const idFromToken = req.user.userId; 

    if (!idFromToken) {
      return res.status(401).json({ 
        message: "No User ID found in token",
        payload_received: req.user 
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      idFromToken,
      {
        $set: {
          "statistics.initialInvestment": Number(balance),
        },
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found in database" });
    }

    res.status(200).json({
      success: true,
      initialInvestment: updatedUser.statistics.initialInvestment,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

app.post("/oddsChecker/getOdds/", oddsLimiter, async (req, res) => {

  const { home, away, date, soccerId, searchQuery, sport } = req.body;
  // the info we will use to find the actual game

  if (!home || !away || !date || !soccerId || !searchQuery || !sport) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  try {
    const odds = {
      ki: {
        name: "Konačan ishod",
        1: { reference: "1" },
        x: { reference: "x" },
        2: { reference: "2" },
        doubleChance_1X: { reference: "1x" },
        doubleChance_X2: { reference: "x2" },
        doubleChance_12: { reference: "12" },
         w1: { reference: "W1" },
          w2: { reference: "W2" },
        homeAndHome2Plus: { reference: "1&D2+" }, // new
        homeAndHome3Plus: { reference: "1&D3+" }, // new
        awayAndAway2Plus: { reference: "2&G2+" }, // new
        awayAndAway3Plus: { reference: "2&G3+" }, // new
        homeAnd3Plus: { reference: "1&3+" },
        homeAnd4Plus: { reference: "1&4+" },
        awayAnd3Plus: { reference: "2&3+" },
        awayAnd4Plus: { reference: "2&4+" },
        homeAndGG: { reference: "1&gg" }, // new
        awayAndGG: { reference: "2&gg" },
      },

      goals: {
        name: "Golovi",
        over1_5: { reference: "2+" },
        over2_5: { reference: "3+" },
        over_3_5: { reference: "4+" },
        over_4_5: { reference: "5+" },
          over_5_5: { reference: "6+" }, //new1
          gg: { reference: "GG" },
          ng: { reference: "NG" },
          gg3: { reference: "GG3+" },
        under1_5: { reference: "0-1" },
        under2_5: { reference: "0-2" },
        under3_5: { reference: "0-3" }, // new1
        
 oneToTwo: { reference: "1-2" }, // new1
  oneToThree: { reference: "1-3" }, // new1
   oneToFour: { reference: "1-4" }, // new1




        twoToThree: { reference: "2-3" }, // new1
        twoToFour: { reference: "2-4" },
         twoToFive: { reference: "2-5" }, //new1
        twoToSix: { reference: "2-6" },
        threeToFour: { reference: "3-4" }, //new1
          threeToFive: { reference: "3-5" }, //new1
        threeToSix: { reference: "3-6" },
        firstMore: { reference: "1>" },
        secondMore: { reference: "2>" },
        equalGoals: { reference: "1=2" },
            even: { reference: "Par" }, // new1
                odd: { reference: "Nepar" }, // new1
      },

      homeGoals: {
        name: "Domacin golova",
        over_0_5: { reference: "D1+" },
        over_1_5: { reference: "D2+" },
        over_2_5: { reference: "D3+" },
        over_3_5: { reference: "D4+" },
        zeroToOne: { reference: "D0-1" },
        zeroToTwo: { reference: "D0-2" },
        first_0_5: { reference: "1.POL D1+" },
        first_1_5: { reference: "1.POL D2+" },
        second_0_5: { reference: "2.POL D1+" },
        second_1_5: { reference: "2.POL D2+" },
      },

      awayGoals: {
        name: "Gost golova",
        over_0_5: { reference: "G1+" },
        over_1_5: { reference: "G2+" },
        over_2_5: { reference: "G3+" },
        over_3_5: { reference: "G4+" },
        zeroToOne: { reference: "G0-1" },
        first_0_5: { reference: "1.POL G1+" },
        first_1_5: { reference: "1.POL G2+" },
          second_0_5: { reference: "2.POL G1+" },
        second_1_5: { reference: "2.POL G2+" },
      },

      firstHalf: {
        name: "Prvo poluvreme",
        over_0_5: { reference: "PP1+" },
        over_1_5: { reference: "PP2+" },
        over_2_5: { reference: "PP3+" },
        gg: { reference: "GG1" },
        over_0_5_both: { reference: "I1+ & II1+" },
        first05Second15: { reference: "I1+ & II2+" },
        ki1: { reference: "Ishod PP. 1" },
        ki2: { reference: "Ishod PP. 2" },
        kix: { reference: "Ishod PP. X" },
        pg1: { reference: "Prvi Gol PP. 1" },
        pg2: { reference: "Prvi Gol PP. 2" },
      },
      secondHalf: {
        name: "Drugo poluvreme",
        over_0_5: { reference: "2P1+" },
        over_1_5: { reference: "2P2+" },
        over_2_5: { reference: "2P3+" },
        gg: { reference: "GG2" },
        ki1: { reference: "Ishod 2P. 1" },
        ki2: { reference: "Ishod 2P. 2" },
        kix: { reference: "Ishod 2P. X" },
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
    };



    // odds structure that we will return upon finding the odds 1: {soccerBet: 1.50} example

    // Define both API URLs
    const soccerApi = `https://www.soccerbet.rs/restapi/offer/sr/match/${soccerId}?annex=0&desktopVersion=2.36.3.14&locale=sr`;
    const maxbetSearch = `https://www.maxbet.rs/restapi/offer/sr/search/${searchQuery}/mob?mobileVersion=1.2.1.14&locale=sr`;
    const mozzartSearch = `https://www.mozzartbet.com/betting/search?term=${searchQuery}`;
    const oktagonSearch = `https://www.oktagonbet.com/restapi/offer/sr/search/${searchQuery}/mob?annex=1&mobileVersion=2.38.5.1&locale=sr`;
    const merkurSearch = `https://www.merkurxtip.rs/restapi/offer/sr/search/${searchQuery}/mob?annex=0&mobileVersion=1.16.2.18&locale=sr`;
    const brazilSearch = `https://www.brazilbet.rs/restapi/offer/sr/search/${searchQuery}/mob?annex=51&mobileVersion=2.44.9.7&locale=sr`;
    // Fetch both API responses in parallel

 const [
  soccerResponse,
  maxbetSearchResponse,
  mozzartResponse,
  oktagonSearchResponse,
  merkurSearchResponse,
  brazilSearchResponse,
] = await Promise.all([
  request(soccerApi),
  request(maxbetSearch),
  request(mozzartSearch, {
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Medium": "WEB",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36",
      "Referer": "https://www.mozzartbet.com/sr/kladjenje/sport/1?date=today",
      "X-Requested-With": "XMLHttpRequest",
    },
  }),
  request(oktagonSearch),
  request(merkurSearch, {
    method: "GET",
    headers: {
      "Accept": "application/json",
      "Accept-Encoding": "gzip",
      "X-Requested-With": "XMLHttpRequest",
      "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1",
    },
  }),
  request(brazilSearch),
]); 

const soccerJson = await soccerResponse.body.json();
const maxbetJson = await maxbetSearchResponse.body.json();
const mozzartJson = await mozzartResponse.body.json();
const oktagonJson = await oktagonSearchResponse.body.json();
const brazilJson = await brazilSearchResponse.body.json();
const merkurBuffer = Buffer.from(
  await merkurSearchResponse.body.arrayBuffer()
);

const merkurDecompressed =
  merkurSearchResponse.headers["content-encoding"] === "gzip"
    ? gunzipSync(merkurBuffer).toString("utf-8")
    : merkurBuffer.toString("utf-8");

const merkurJson = JSON.parse(merkurDecompressed);


    if (oktagonJson.esMatches) {
      const filteredGames = oktagonJson.esMatches.filter(
        (game) => game.kickOffTime === date
      );
      if (filteredGames.length > 0) {
        const matchId = filteredGames[0].id;

        const match = `https://www.oktagonbet.com/restapi/offer/sr/match/${matchId}?annex=1&mobileVersion=2.38.5.1&locale=sr`;
        await fetch(match).then((res) => {
          res.json().then((json) => {
            const currentOdds = json.odds;
         
    
if (currentOdds && sport === "S") {
  odds["ki"]["awayAndAway3Plus"]["oktagon"] = currentOdds["50267"];
  odds["ki"]["homeAndHome3Plus"]["oktagon"] = currentOdds["50266"];
  odds["ki"]["1"]["oktagon"] = currentOdds["1"];
  odds["ki"]["homeAndGG"]["oktagon"] = currentOdds["365"];

  odds["ki"]["x"]["oktagon"] = currentOdds["2"];
  odds["ki"]["2"]["oktagon"] = currentOdds["3"];
  odds["ki"]["doubleChance_1X"]["oktagon"] = currentOdds["7"];
  odds["ki"]["doubleChance_12"]["oktagon"] = currentOdds["8"];
  odds["ki"]["doubleChance_X2"]["oktagon"] = currentOdds["9"];

  odds["goals"]["gg"]["oktagon"] = currentOdds["272"];
  odds["goals"]["ng"]["oktagon"] = currentOdds["273"];
  odds["goals"]["over1_5"]["oktagon"] = currentOdds["242"];
  odds["goals"]["over2_5"]["oktagon"] = currentOdds["24"];
  odds["goals"]["over_3_5"]["oktagon"] = currentOdds["25"];
  odds["goals"]["over_4_5"]["oktagon"] = currentOdds["27"];
  odds["goals"]["over_5_5"]["oktagon"] = currentOdds["223"];
  odds["goals"]["under2_5"]["oktagon"] = currentOdds["22"];
  odds["goals"]["under1_5"]["oktagon"] = currentOdds["21"];

  odds["goals"]["twoToFour"]["oktagon"] = currentOdds["243"];
  odds["goals"]["twoToSix"]["oktagon"] = currentOdds["220"];
  odds["goals"]["threeToSix"]["oktagon"] = currentOdds["382"];
  odds["goals"]["firstMore"]["oktagon"] = currentOdds["29"];
  odds["goals"]["secondMore"]["oktagon"] = currentOdds["31"];
  odds["goals"]["equalGoals"]["oktagon"] = currentOdds["30"];

  odds["ki"]["w1"]["oktagon"] = currentOdds["264"];
  odds["ki"]["w2"]["oktagon"] = currentOdds["265"];

  odds["secondHalf"]["gg"]["oktagon"] = currentOdds["299"];

  odds["goals"]["under3_5"]["oktagon"] = currentOdds["219"];
  odds["goals"]["oneToTwo"]["oktagon"] = currentOdds["278"];
  odds["goals"]["oneToThree"]["oktagon"] = currentOdds["279"];
  odds["goals"]["oneToFour"]["oktagon"] = currentOdds["280"];
  odds["goals"]["twoToThree"]["oktagon"] = currentOdds["23"];
  odds["goals"]["twoToFive"]["oktagon"] = currentOdds["333"];
  odds["goals"]["threeToFour"]["oktagon"] = currentOdds["244"];
  odds["goals"]["threeToFive"]["oktagon"] = currentOdds["281"];

  odds["goals"]["even"]["oktagon"] = currentOdds["231"];
  odds["goals"]["odd"]["oktagon"] = currentOdds["232"];

  odds["homeGoals"]["second_0_5"]["oktagon"] = currentOdds["312"];
  odds["homeGoals"]["second_1_5"]["oktagon"] = currentOdds["297"];
  odds["awayGoals"]["second_0_5"]["oktagon"] = currentOdds["313"];
  odds["awayGoals"]["second_1_5"]["oktagon"] = currentOdds["298"];

  odds["homeGoals"]["over_0_5"]["oktagon"] = currentOdds["238"];
  odds["homeGoals"]["over_1_5"]["oktagon"] = currentOdds["248"];
  odds["homeGoals"]["over_2_5"]["oktagon"] = currentOdds["276"];
  odds["homeGoals"]["over_3_5"]["oktagon"] = currentOdds["555"];
  odds["homeGoals"]["zeroToOne"]["oktagon"] = currentOdds["247"];
  odds["homeGoals"]["zeroToTwo"]["oktagon"] = currentOdds["551"];

  odds["awayGoals"]["over_0_5"]["oktagon"] = currentOdds["240"];
  odds["awayGoals"]["over_1_5"]["oktagon"] = currentOdds["250"];
  odds["awayGoals"]["over_2_5"]["oktagon"] = currentOdds["277"];
  odds["awayGoals"]["over_3_5"]["oktagon"] = currentOdds["556"];
  odds["awayGoals"]["zeroToOne"]["oktagon"] = currentOdds["249"];

  odds["homeGoals"]["first_0_5"]["oktagon"] = currentOdds["307"];
  odds["homeGoals"]["first_1_5"]["oktagon"] = currentOdds["274"];
  odds["awayGoals"]["first_0_5"]["oktagon"] = currentOdds["308"];
  odds["awayGoals"]["first_1_5"]["oktagon"] = currentOdds["275"];

  odds["firstHalf"]["ki1"]["oktagon"] = currentOdds["4"];
  odds["firstHalf"]["kix"]["oktagon"] = currentOdds["5"];
  odds["firstHalf"]["ki2"]["oktagon"] = currentOdds["6"];
  odds["firstHalf"]["gg"]["oktagon"] = currentOdds["291"];
  odds["firstHalf"]["over_0_5_both"]["oktagon"] = currentOdds["363"];
  odds["firstHalf"]["first05Second15"]["oktagon"] = currentOdds["316"];

  odds["secondHalf"]["ki1"]["oktagon"] = currentOdds["235"];
  odds["secondHalf"]["kix"]["oktagon"] = currentOdds["236"];
  odds["secondHalf"]["ki2"]["oktagon"] = currentOdds["237"];
  odds["secondHalf"]["over_0_5"]["oktagon"] = currentOdds["213"];
  odds["secondHalf"]["over_1_5"]["oktagon"] = currentOdds["214"];
  odds["secondHalf"]["over_2_5"]["oktagon"] = currentOdds["215"];

  odds["htft"]["hh"]["oktagon"] = currentOdds["10"];
  odds["htft"]["hx"]["oktagon"] = currentOdds["11"];
  odds["htft"]["ha"]["oktagon"] = currentOdds["12"];
  odds["htft"]["xh"]["oktagon"] = currentOdds["13"];
  odds["htft"]["xx"]["oktagon"] = currentOdds["14"];
  odds["htft"]["xa"]["oktagon"] = currentOdds["15"];
  odds["htft"]["ah"]["oktagon"] = currentOdds["16"];
  odds["htft"]["ax"]["oktagon"] = currentOdds["17"];
  odds["htft"]["aa"]["oktagon"] = currentOdds["18"];

  odds["ki"]["homeAnd3Plus"]["oktagon"] = currentOdds["287"];
  odds["ki"]["homeAnd4Plus"]["oktagon"] = currentOdds["314"];
  odds["ki"]["awayAnd3Plus"]["oktagon"] = currentOdds["288"];
  odds["ki"]["awayAnd4Plus"]["oktagon"] = currentOdds["315"];
  odds["ki"]["awayAndGG"]["oktagon"] = currentOdds["366"];

  odds["firstHalf"]["over_0_5"]["oktagon"] = currentOdds["207"];
  odds["firstHalf"]["over_1_5"]["oktagon"] = currentOdds["208"];
  odds["firstHalf"]["over_2_5"]["oktagon"] = currentOdds["209"];

  odds["goals"]["gg3"]["oktagon"] = currentOdds["303"];
}

          });
        });
      }
    }
    if (maxbetJson.esMatches) {
      // here, we will try to find the exact game from the search list.

     const filteredGames = maxbetJson.esMatches.filter(
  (game) =>
    game.kickOffTime === date &&
    game.sport === "S" &&                // real football matches
    game.away !== "." &&                 // removes winner / outright
    !game.leagueName.includes("Winner") &&// removes all cup winners
    game.ticketPrintType === 0 &&         // normal matches only
    game.oddsCount > 5 &&                 // avoids futures / specials
    !game.blocked &&
    game.status === 0
);

      if (filteredGames.length > 0 && sport === "S") {
        const currentOdds = filteredGames[0].odds;

   
       


        odds["ki"]["w1"]["maxBet"] = currentOdds["264"];
        odds["ki"]["w2"]["maxBet"] = currentOdds["265"];

        odds["goals"]["twoToThree"]["maxBet"] = currentOdds["23"];

        odds["homeGoals"]["second_0_5"]["maxBet"] = currentOdds["312"];
        odds["homeGoals"]["second_1_5"]["maxBet"] = currentOdds["297"];

        odds["awayGoals"]["second_0_5"]["maxBet"] = currentOdds["313"];
        odds["awayGoals"]["second_1_5"]["maxBet"] = currentOdds["298"];



        odds["secondHalf"]["gg"]["maxBet"] = currentOdds["299"];


        odds["ki"]["1"]["maxBet"] = currentOdds["1"];
        odds["ki"]["x"]["maxBet"] = currentOdds["2"];
        odds["ki"]["2"]["maxBet"] = currentOdds["3"];
        odds["goals"]["gg"]["maxBet"] = currentOdds["272"];
        odds["goals"]["ng"]["maxBet"] = currentOdds["273"];
        odds["ki"]["doubleChance_1X"]["maxBet"] = currentOdds["7"];
        odds["ki"]["doubleChance_12"]["maxBet"] = currentOdds["8"];
        odds["ki"]["doubleChance_X2"]["maxBet"] = currentOdds["9"];
        odds["goals"]["over2_5"]["maxBet"] = currentOdds["24"];
        odds["goals"]["under2_5"]["maxBet"] = currentOdds["22"];
        // x
        odds["ki"]["homeAnd3Plus"]["maxBet"] = currentOdds["287"];
        odds["ki"]["homeAnd4Plus"]["maxBet"] = currentOdds["314"];
        odds["ki"]["awayAnd3Plus"]["maxBet"] = currentOdds["288"];
        odds["ki"]["awayAnd4Plus"]["maxBet"] = currentOdds["315"];
        odds["ki"]["awayAndGG"]["maxBet"] = currentOdds["366"];
        odds["ki"]["homeAndGG"]["maxBet"] = currentOdds["365"];
        odds["ki"]["homeAndHome2Plus"]["maxBet"] = currentOdds["419"];
        odds["ki"]["homeAndHome3Plus"]["maxBet"] = currentOdds["50266"];
        odds["ki"]["awayAndAway2Plus"]["maxBet"] = currentOdds["420"];
        odds["ki"]["awayAndAway3Plus"]["maxBet"] = currentOdds["50267"];

        odds["goals"]["over1_5"]["maxBet"] = currentOdds["8"];
        odds["goals"]["over2_5"]["maxBet"] = currentOdds["24"];
        odds["goals"]["over_3_5"]["maxBet"] = currentOdds["25"];
        odds["goals"]["over_4_5"]["maxBet"] = currentOdds["27"];
        odds["goals"]["under1_5"]["maxBet"] = currentOdds["21"];
        odds["goals"]["under2_5"]["maxBet"] = currentOdds["22"];
        odds["goals"]["twoToFour"]["maxBet"] = currentOdds["243"];
        odds["goals"]["twoToSix"]["maxBet"] = currentOdds["220"];
        odds["goals"]["threeToSix"]["maxBet"] = currentOdds["382"];
        odds["goals"]["firstMore"]["maxBet"] = currentOdds["29"];
        odds["goals"]["secondMore"]["maxBet"] = currentOdds["31"];
        odds["goals"]["equalGoals"]["maxBet"] = currentOdds["30"];

        odds["homeGoals"]["over_0_5"]["maxBet"] = currentOdds["238"];
        odds["homeGoals"]["over_1_5"]["maxBet"] = currentOdds["248"];
        odds["homeGoals"]["over_2_5"]["maxBet"] = currentOdds["276"];
        odds["homeGoals"]["zeroToOne"]["maxBet"] = currentOdds["247"];
        odds["homeGoals"]["zeroToTwo"]["maxBet"] = currentOdds["551"];
        odds["homeGoals"]["over_3_5"]["maxBet"] = currentOdds["555"];
        odds["awayGoals"]["over_0_5"]["maxBet"] = currentOdds["240"];
        odds["awayGoals"]["over_1_5"]["maxBet"] = currentOdds["250"];
        odds["awayGoals"]["over_2_5"]["maxBet"] = currentOdds["277"];

        odds["awayGoals"]["zeroToOne"]["maxBet"] = currentOdds["249"];
        odds["awayGoals"]["over_3_5"]["maxBet"] = currentOdds["556"];

        odds["secondHalf"]["ki1"]["maxBet"] = currentOdds["235"];
        odds["secondHalf"]["ki2"]["maxBet"] = currentOdds["236"];
        odds["secondHalf"]["kix"]["maxBet"] = currentOdds["237"];

        odds["secondHalf"]["over_0_5"]["maxBet"] = currentOdds["213"];
        odds["secondHalf"]["over_1_5"]["maxBet"] = currentOdds["214"];
        odds["secondHalf"]["over_2_5"]["maxBet"] = currentOdds["215"];

        odds["firstHalf"]["over_0_5"]["maxBet"] = currentOdds["207"];
        odds["firstHalf"]["over_1_5"]["maxBet"] = currentOdds["208"];
        odds["firstHalf"]["over_2_5"]["maxBet"] = currentOdds["209"];

        odds["homeGoals"]["first_0_5"]["maxBet"] = currentOdds["307"];
        odds["homeGoals"]["first_1_5"]["maxBet"] = currentOdds["274"];
        odds["awayGoals"]["first_0_5"]["maxBet"] = currentOdds["308"];
        odds["awayGoals"]["first_1_5"]["maxBet"] = currentOdds["275"];
        odds["firstHalf"]["ki1"]["maxBet"] = currentOdds["4"];
        odds["firstHalf"]["ki2"]["maxBet"] = currentOdds["6"];
        odds["firstHalf"]["kix"]["maxBet"] = currentOdds["5"];
        odds["firstHalf"]["gg"]["maxBet"] = currentOdds["291"];
        odds["firstHalf"]["first05Second15"]["maxBet"] = currentOdds["316"];
        odds["firstHalf"]["over_0_5_both"]["maxBet"] = currentOdds["363"];

        odds["firstHalf"]["pg1"]["maxBet"] = currentOdds["204"];
        odds["firstHalf"]["pg2"]["maxBet"] = currentOdds["206"];

        odds["secondHalf"]["over_0_5"]["maxBet"] = currentOdds["213"];
        odds["secondHalf"]["over_1_5"]["maxBet"] = currentOdds["214"];

        odds["secondHalf"]["ki1"]["maxBet"] = currentOdds["235"];
        odds["secondHalf"]["kix"]["maxBet"] = currentOdds["236"];
        odds["secondHalf"]["ki2"]["maxBet"] = currentOdds["237"];

        odds["htft"]["hh"]["maxBet"] = currentOdds["10"];
        odds["htft"]["hx"]["maxBet"] = currentOdds["11"];
        odds["htft"]["ha"]["maxBet"] = currentOdds["12"];
        odds["htft"]["aa"]["maxBet"] = currentOdds["18"];
        odds["htft"]["ax"]["maxBet"] = currentOdds["17"];
        odds["htft"]["ah"]["maxBet"] = currentOdds["16"];
        odds["htft"]["xh"]["maxBet"] = currentOdds["13"];
        odds["htft"]["xx"]["maxBet"] = currentOdds["14"];
        odds["htft"]["xa"]["maxBet"] = currentOdds["15"];
        odds["goals"]["gg3"]["maxBet"] = currentOdds["303"];

        // '1' = home win 2 = x 3 = awayWin  272 = gg 273 = ng 24 = ug3+ 7 = 1x 12  = 8 x2 = 9 ----- 2.5+ =

        // Process maxbet odds and append to the odds object
      }
    }
    if (soccerJson?.betMap) {
      const soccerOdds = soccerJson?.betMap; // Get the whole betMap

   

      if (soccerOdds && sport === "S") {
        odds["ki"]["awayAndAway3Plus"]["soccerBet"] =
          soccerOdds["50267"]?.NULL?.ov;
        odds["ki"]["homeAndHome3Plus"]["soccerBet"] =
          soccerOdds["50266"]?.NULL?.ov;
        odds["ki"]["1"]["soccerBet"] = soccerOdds["1"]?.NULL?.ov;
        odds["ki"]["homeAndGG"]["soccerBet"] = soccerOdds["365"]?.NULL?.ov;

        odds["ki"]["x"]["soccerBet"] = soccerOdds["2"]?.NULL?.ov;
        odds["ki"]["2"]["soccerBet"] = soccerOdds["3"]?.NULL?.ov;
        odds["ki"]["doubleChance_1X"]["soccerBet"] = soccerOdds["7"]?.NULL?.ov;
        odds["ki"]["doubleChance_12"]["soccerBet"] = soccerOdds["8"]?.NULL?.ov;
        odds["ki"]["doubleChance_X2"]["soccerBet"] = soccerOdds["9"]?.NULL?.ov;
        odds["goals"]["gg"]["soccerBet"] = soccerOdds["272"]?.NULL?.ov;
        odds["goals"]["ng"]["soccerBet"] = soccerOdds["273"]?.NULL?.ov;
        odds["goals"]["over1_5"]["soccerBet"] = soccerOdds["242"]?.NULL?.ov;
        odds["goals"]["over2_5"]["soccerBet"] = soccerOdds["24"]?.NULL?.ov;
        odds["goals"]["over_3_5"]["soccerBet"] = soccerOdds["25"]?.NULL?.ov;
        odds["goals"]["over_4_5"]["soccerBet"] = soccerOdds["27"]?.NULL?.ov; 
          odds["goals"]["over_5_5"]["soccerBet"] = soccerOdds["223"]?.NULL?.ov; 
        odds["goals"]["under2_5"]["soccerBet"] = soccerOdds["22"]?.NULL?.ov;
        odds["goals"]["under1_5"]["soccerBet"] = soccerOdds["21"]?.NULL?.ov; 
        odds["goals"]["twoToFour"]["soccerBet"] = soccerOdds["243"]?.NULL?.ov;
        odds["goals"]["twoToSix"]["soccerBet"] = soccerOdds["220"]?.NULL?.ov;
        odds["goals"]["threeToSix"]["soccerBet"] = soccerOdds["382"]?.NULL?.ov;
        odds["goals"]["firstMore"]["soccerBet"] = soccerOdds["29"]?.NULL?.ov;
        odds["goals"]["secondMore"]["soccerBet"] = soccerOdds["31"]?.NULL?.ov;
        odds["goals"]["equalGoals"]["soccerBet"] = soccerOdds["30"]?.NULL?.ov;








        odds["ki"]["w1"]["soccerBet"] = soccerOdds["264"]?.NULL?.ov;
        odds["ki"]["w2"]["soccerBet"] = soccerOdds["265"]?.NULL?.ov;








        odds["secondHalf"]["gg"]["soccerBet"] = soccerOdds["299"]?.NULL?.ov; // gg2








                odds["goals"]["under3_5"]["soccerBet"] = soccerOdds["219"]?.NULL?.ov; // 0-3


                odds["goals"]["oneToTwo"]["soccerBet"] = soccerOdds["278"]?.NULL?.ov; // 1-2
                odds["goals"]["oneToThree"]["soccerBet"] = soccerOdds["279"]?.NULL?.ov; // 1-3
                odds["goals"]["oneToFour"]["soccerBet"] = soccerOdds["280"]?.NULL?.ov; // 1-4



                odds["goals"]["twoToThree"]["soccerBet"] = soccerOdds["23"]?.NULL?.ov; // 2-3
                odds["goals"]["twoToFive"]["soccerBet"] = soccerOdds["333"]?.NULL?.ov; // 2-5


        odds["goals"]["threeToFour"]["soccerBet"] = soccerOdds["244"]?.NULL?.ov; // 3-4
                odds["goals"]["threeToFive"]["soccerBet"] = soccerOdds["281"]?.NULL?.ov; // 3-5

                

                odds["goals"]["even"]["soccerBet"] = soccerOdds["231"]?.NULL?.ov; // 3-5
                odds["goals"]["odd"]["soccerBet"] = soccerOdds["232"]?.NULL?.ov; // 3-5




                odds["homeGoals"]["second_0_5"]["soccerBet"] = soccerOdds["312"]?.NULL?.ov; // 3-5
                odds["homeGoals"]["second_1_5"]["soccerBet"] = soccerOdds["297"]?.NULL?.ov; // 3-5





                              odds["awayGoals"]["second_0_5"]["soccerBet"] = soccerOdds["313"]?.NULL?.ov; // 3-5
                              odds["awayGoals"]["second_1_5"]["soccerBet"] = soccerOdds["298"]?.NULL?.ov; // 3-5





        odds["firstHalf"]["pg1"]["soccerBet"] = soccerOdds["792"]?.NULL?.ov;
        odds["firstHalf"]["pg2"]["soccerBet"] = soccerOdds["794"]?.NULL?.ov;

        odds["homeGoals"]["over_0_5"]["soccerBet"] =
          soccerOdds["238"]?.NULL?.ov;
        odds["homeGoals"]["over_1_5"]["soccerBet"] =
          soccerOdds["248"]?.NULL?.ov;
        odds["homeGoals"]["over_2_5"]["soccerBet"] =
          soccerOdds["276"]?.NULL?.ov;
        odds["homeGoals"]["over_3_5"]["soccerBet"] =
          soccerOdds["555"]?.NULL?.ov;
        odds["homeGoals"]["zeroToOne"]["soccerBet"] =
          soccerOdds["247"]?.NULL?.ov;
        odds["homeGoals"]["zeroToTwo"]["soccerBet"] =
          soccerOdds["551"]?.NULL?.ov;
        odds["awayGoals"]["over_3_5"]["soccerBet"] =
          soccerOdds["556"]?.NULL?.ov;
        odds["awayGoals"]["zeroToOne"]["soccerBet"] =
          soccerOdds["249"]?.NULL?.ov;

        odds["awayGoals"]["over_0_5"]["soccerBet"] =
          soccerOdds["240"]?.NULL?.ov;
        odds["awayGoals"]["over_1_5"]["soccerBet"] =
          soccerOdds["250"]?.NULL?.ov;
        odds["awayGoals"]["over_2_5"]["soccerBet"] =
          soccerOdds["277"]?.NULL?.ov;

        odds["homeGoals"]["first_0_5"]["soccerBet"] =
          soccerOdds["307"]?.NULL?.ov;
        odds["homeGoals"]["first_1_5"]["soccerBet"] =
          soccerOdds["274"]?.NULL?.ov;
        odds["awayGoals"]["first_0_5"]["soccerBet"] =
          soccerOdds["308"]?.NULL?.ov;
        odds["awayGoals"]["first_1_5"]["soccerBet"] =
          soccerOdds["275"]?.NULL?.ov;
        odds["firstHalf"]["ki1"]["soccerBet"] = soccerOdds["4"]?.NULL?.ov;
        odds["firstHalf"]["kix"]["soccerBet"] = soccerOdds["5"]?.NULL?.ov;
        odds["firstHalf"]["ki2"]["soccerBet"] = soccerOdds["6"]?.NULL?.ov;
        odds["firstHalf"]["gg"]["soccerBet"] = soccerOdds["291"]?.NULL?.ov;
        odds["firstHalf"]["over_0_5_both"]["soccerBet"] =
          soccerOdds["363"]?.NULL?.ov;
        odds["firstHalf"]["first05Second15"]["soccerBet"] =
          soccerOdds["316"]?.NULL?.ov;

        odds["secondHalf"]["ki1"]["soccerBet"] = soccerOdds["235"]?.NULL?.ov;
        odds["secondHalf"]["kix"]["soccerBet"] = soccerOdds["236"]?.NULL?.ov;
        odds["secondHalf"]["ki2"]["soccerBet"] = soccerOdds["237"]?.NULL?.ov;
        odds["secondHalf"]["over_0_5"]["soccerBet"] =
          soccerOdds["213"]?.NULL?.ov;
        odds["secondHalf"]["over_1_5"]["soccerBet"] =
          soccerOdds["214"]?.NULL?.ov;
        odds["secondHalf"]["over_2_5"]["soccerBet"] =
          soccerOdds["215"]?.NULL?.ov;

        odds["htft"]["hh"]["soccerBet"] = soccerOdds["10"]?.NULL?.ov;
        odds["htft"]["hx"]["soccerBet"] = soccerOdds["11"]?.NULL?.ov;
        odds["htft"]["ha"]["soccerBet"] = soccerOdds["12"]?.NULL?.ov;
        odds["htft"]["xh"]["soccerBet"] = soccerOdds["13"]?.NULL?.ov;
        odds["htft"]["xx"]["soccerBet"] = soccerOdds["14"]?.NULL?.ov;
        odds["htft"]["xa"]["soccerBet"] = soccerOdds["15"]?.NULL?.ov;
        odds["htft"]["ah"]["soccerBet"] = soccerOdds["16"]?.NULL?.ov;
        odds["htft"]["ax"]["soccerBet"] = soccerOdds["17"]?.NULL?.ov;
        odds["htft"]["aa"]["soccerBet"] = soccerOdds["18"]?.NULL?.ov;

        odds["ki"]["homeAnd3Plus"]["soccerBet"] = soccerOdds["287"]?.NULL?.ov;
        odds["ki"]["homeAnd4Plus"]["soccerBet"] = soccerOdds["314"]?.NULL?.ov;

        odds["ki"]["awayAnd3Plus"]["soccerBet"] = soccerOdds["288"]?.NULL?.ov;
        odds["ki"]["awayAnd4Plus"]["soccerBet"] = soccerOdds["315"]?.NULL?.ov;
        odds["ki"]["awayAndGG"]["soccerBet"] = soccerOdds["366"]?.NULL?.ov;

        odds["firstHalf"]["over_0_5"]["soccerBet"] =
          soccerOdds["207"]?.NULL?.ov;
        odds["firstHalf"]["over_1_5"]["soccerBet"] =
          soccerOdds["208"]?.NULL?.ov;
        odds["firstHalf"]["over_2_5"]["soccerBet"] =
          soccerOdds["209"]?.NULL?.ov;

        odds["goals"]["gg3"]["soccerBet"] = soccerOdds["303"]?.NULL?.ov;
      } 
    }
    if (mozzartJson?.items?.length > 0) {
      const items = mozzartJson.items;
    

     const filteredGames = items.filter(
  game =>
    game.startTime === date && 
    (game.visitor || game.totalOddsCount > 10) // dynamic filter for real match
);



      if (!filteredGames || filteredGames.length <= 0) {
        return res.status(404).json({ error: "Nije pronadjen mec." });
      }

     const result = await fetch(`https://www.mozzartbet.com/betting/match/${filteredGames[0].id}`, {
  method: "POST",
  headers: {
    "accept": "application/json, text/plain, */*",
    "content-type": "application/json",
    "medium": "PREMATCH_WEB",
    "origin": "https://www.mozzartbet.com",
    "referer": "https://www.mozzartbet.com/sr/kladjenje/sport/1/match/468279",
  },
  body: JSON.stringify({
    medium: "PREMATCH_WEB"
  }),
  credentials: "include" // ⬅️ VERY IMPORTANT (cookies)
});

const json = await result.json();


   
      if (json.status !== "ERROR") {
       
   
      // do ovde sam stigao, promenili su api, sada je jos lakse, json.match.oddsGroup je array objekata gde svaki objekat predstavlja
      // grupu betova //Konacan ishod je prvi objekat, npr, ima odds array u njemu.
      // odds array predstavlja array objekata gde svaki objekat je tip, npr prvi objekat je kec pobedjuje, pa drugi X pa treci dvojka.
const groups = json.match.oddsGroup;



/*
groups.forEach((group, groupIndex) => {
  console.log(`\n[GROUP ${groupIndex}] ${group.groupName}`);

  group.odds.forEach((odd, oddIndex) => {
    // Summary line
    console.log(`  └─ [GROUP ${groupIndex} | ODD ${oddIndex}] ${odd.subgame?.name ?? "no-name"} | value: ${odd.value}`);

    // Full JSON object
    console.log(JSON.stringify(odd, null, 2));
  });
});
*/





 odds["ki"]["1"]["mozzartBet"] = groups[0]?.odds?.[0]?.value ?? null;
odds["ki"]["x"]["mozzartBet"] = groups[0]?.odds?.[1]?.value ?? null;
odds["ki"]["2"]["mozzartBet"] = groups[0]?.odds?.[2]?.value ?? null;



odds["goals"]["even"]["mozzartBet"] = groups[4]?.odds?.[0]?.value ?? null;
odds["goals"]["odd"]["mozzartBet"] = groups[4]?.odds?.[1]?.value ?? null;


odds["homeGoals"]["second_0_5"]["mozzartBet"] = groups[20]?.odds?.[1]?.value ?? null; // 
odds["homeGoals"]["second_1_5"]["mozzartBet"] = groups[20]?.odds?.[3]?.value ?? null; // 



odds["awayGoals"]["second_0_5"]["mozzartBet"] = groups[21]?.odds?.[1]?.value ?? null; // 
odds["awayGoals"]["second_1_5"]["mozzartBet"] = groups[21]?.odds?.[3]?.value ?? null; // 


odds["secondHalf"]["gg"]["mozzartBet"] = groups[3]?.odds?.[8]?.value ?? null;


odds["ki"]["w1"]["mozzartBet"] = groups[6]?.odds?.[0]?.value ?? null;
odds["ki"]["w2"]["mozzartBet"] = groups[6]?.odds?.[1]?.value ?? null;

odds["goals"]["over_5_5"]["mozzartBet"] = groups[2]?.odds?.[8]?.value ?? null;

odds["goals"]["under3_5"]["mozzartBet"] = groups[2]?.odds?.[4]?.value ?? null;

odds["goals"]["oneToTwo"]["mozzartBet"] = groups[2]?.odds?.[10]?.value ?? null;
odds["goals"]["oneToThree"]["mozzartBet"] = groups[2]?.odds?.[11]?.value ?? null;
odds["goals"]["oneToFour"]["mozzartBet"] = groups[2]?.odds?.[12]?.value ?? null;
odds["goals"]["twoToThree"]["mozzartBet"] = groups[2]?.odds?.[14]?.value ?? null;
odds["goals"]["twoToFour"]["mozzartBet"] = groups[2]?.odds?.[15]?.value ?? null;
odds["goals"]["twoToFive"]["mozzartBet"] = groups[2]?.odds?.[16]?.value ?? null;
odds["goals"]["twoToSix"]["mozzartBet"] = groups[2]?.odds?.[17]?.value ?? null;
odds["goals"]["threeToFour"]["mozzartBet"] = groups[2]?.odds?.[18]?.value ?? null;
odds["goals"]["threeToFive"]["mozzartBet"] = groups[2]?.odds?.[19]?.value ?? null;
odds["goals"]["threeToSix"]["mozzartBet"] = groups[2]?.odds?.[20]?.value ?? null;

// x
odds["ki"]["homeAndHome3Plus"]["mozzartBet"] = groups[27]?.odds?.[32]?.value ?? null;
odds["ki"]["awayAndAway3Plus"]["mozzartBet"] = groups[27]?.odds?.[38]?.value ?? null;



odds["goals"]["firstMore"]["mozzartBet"] = groups[37]?.odds?.[0]?.value ?? null;
odds["goals"]["secondMore"]["mozzartBet"] = groups[37]?.odds?.[2]?.value ?? null;
odds["goals"]["equalGoals"]["mozzartBet"] = groups[37]?.odds?.[1]?.value ?? null;



odds["ki"]["doubleChance_1X"]["mozzartBet"] = groups[1]?.odds?.[0]?.value ?? null;
odds["ki"]["doubleChance_12"]["mozzartBet"] = groups[1]?.odds?.[1]?.value ?? null;
odds["ki"]["doubleChance_X2"]["mozzartBet"] = groups[1]?.odds?.[2]?.value ?? null;

odds["ki"]["homeAnd3Plus"]["mozzartBet"] = groups[27]?.odds?.[2]?.value ?? null;
odds["ki"]["homeAnd4Plus"]["mozzartBet"] = groups[27]?.odds?.[4]?.value ?? null;
odds["ki"]["awayAnd3Plus"]["mozzartBet"] = groups[27]?.odds?.[19]?.value ?? null;
odds["ki"]["awayAnd4Plus"]["mozzartBet"] = groups[27]?.odds?.[21]?.value ?? null;

odds["ki"]["homeAndGG"]["mozzartBet"] = groups[35]?.odds?.[0]?.value ?? null;
odds["ki"]["awayAndGG"]["mozzartBet"] = groups[35]?.odds?.[3]?.value ?? null;

odds["goals"]["over1_5"]["mozzartBet"] = groups[2]?.odds?.[1]?.value ?? null;
odds["goals"]["over2_5"]["mozzartBet"] = groups[2]?.odds?.[3]?.value ?? null;
odds["goals"]["over_3_5"]["mozzartBet"] = groups[2]?.odds?.[5]?.value ?? null;
odds["goals"]["over_4_5"]["mozzartBet"] = groups[2]?.odds?.[7]?.value ?? null;

odds["goals"]["under2_5"]["mozzartBet"] = groups[2]?.odds?.[2]?.value ?? null;
odds["goals"]["under1_5"]["mozzartBet"] = groups[2]?.odds?.[0]?.value ?? null;
odds["goals"]["twoToFour"]["mozzartBet"] = groups[2]?.odds?.[15]?.value ?? null;
odds["goals"]["twoToSix"]["mozzartBet"] = groups[2]?.odds?.[17]?.value ?? null;
odds["goals"]["threeToSix"]["mozzartBet"] = groups[2]?.odds?.[20]?.value ?? null;

odds["goals"]["gg"]["mozzartBet"] = groups[3]?.odds?.[0]?.value ?? null;
odds["goals"]["ng"]["mozzartBet"] = groups[3]?.odds?.[1]?.value ?? null;
odds["goals"]["gg3"]["mozzartBet"] = groups[3]?.odds?.[2]?.value ?? null;

odds["homeGoals"]["zeroToOne"]["mozzartBet"] = groups[10]?.odds?.[2]?.value ?? null;
odds["homeGoals"]["zeroToTwo"]["mozzartBet"] = groups[10]?.odds?.[4]?.value ?? null;


odds["awayGoals"]["zeroToOne"]["mozzartBet"] = groups[11]?.odds?.[2]?.value ?? null;


odds["homeGoals"]["over_0_5"]["mozzartBet"] = groups[10]?.odds?.[1]?.value ?? null;
odds["homeGoals"]["over_1_5"]["mozzartBet"] = groups[10]?.odds?.[3]?.value ?? null;
odds["homeGoals"]["over_2_5"]["mozzartBet"] = groups[10]?.odds?.[5]?.value ?? null;

odds["awayGoals"]["over_0_5"]["mozzartBet"] = groups[11]?.odds?.[1]?.value ?? null;
odds["awayGoals"]["over_1_5"]["mozzartBet"] = groups[11]?.odds?.[3]?.value ?? null;
odds["awayGoals"]["over_2_5"]["mozzartBet"] = groups[11]?.odds?.[5]?.value ?? null;
odds["awayGoals"]["over_3_5"]["mozzartBet"] = groups[11]?.odds?.[16]?.value ?? null;





odds["htft"]["hh"]["mozzartBet"] = groups[25]?.odds?.[0]?.value ?? null;
odds["htft"]["hx"]["mozzartBet"] = groups[25]?.odds?.[2]?.value ?? null;
odds["htft"]["ha"]["mozzartBet"] = groups[25]?.odds?.[3]?.value ?? null;
odds["htft"]["xa"]["mozzartBet"] = groups[25]?.odds?.[8]?.value ?? null;
odds["htft"]["xh"]["mozzartBet"] = groups[25]?.odds?.[4]?.value ?? null;

odds["htft"]["xx"]["mozzartBet"] = groups[25]?.odds?.[6]?.value ?? null;
odds["htft"]["ah"]["mozzartBet"] = groups[25]?.odds?.[10]?.value ?? null;
odds["htft"]["ax"]["mozzartBet"] = groups[25]?.odds?.[11]?.value ?? null;
odds["htft"]["aa"]["mozzartBet"] = groups[25]?.odds?.[12]?.value ?? null;

odds["firstHalf"]["gg"]["mozzartBet"] = groups[3]?.odds?.[6]?.value ?? null;

odds["homeGoals"]["first_0_5"]["mozzartBet"] = groups[16]?.odds?.[1]?.value ?? null;
odds["homeGoals"]["first_1_5"]["mozzartBet"] = groups[16]?.odds?.[3]?.value ?? null;

odds["awayGoals"]["first_0_5"]["mozzartBet"] = groups[17]?.odds?.[1]?.value ?? null;
odds["awayGoals"]["first_1_5"]["mozzartBet"] = groups[17]?.odds?.[3]?.value ?? null;


odds["firstHalf"]["over_0_5_both"]["mozzartBet"] = groups[22]?.odds?.[0]?.value ?? null;
odds["firstHalf"]["first05Second15"]["mozzartBet"] = groups[22]?.odds?.[1]?.value ?? null;

odds["secondHalf"]["over_0_5"]["mozzartBet"] = groups[19]?.odds?.[1]?.value ?? null;
odds["secondHalf"]["over_1_5"]["mozzartBet"] = groups[19]?.odds?.[3]?.value ?? null;
odds["secondHalf"]["over_2_5"]["mozzartBet"] = groups[19]?.odds?.[5]?.value ?? null;

odds["secondHalf"]["ki1"]["mozzartBet"] = groups[18]?.odds?.[0]?.value ?? null;
odds["secondHalf"]["ki2"]["mozzartBet"] = groups[18]?.odds?.[2]?.value ?? null;
odds["secondHalf"]["kix"]["mozzartBet"] = groups[18]?.odds?.[1]?.value ?? null;


odds["firstHalf"]["ki1"]["mozzartBet"] = groups[12]?.odds?.[0]?.value ?? null;
odds["firstHalf"]["ki2"]["mozzartBet"] = groups[12]?.odds?.[2]?.value ?? null;
odds["firstHalf"]["kix"]["mozzartBet"] = groups[12]?.odds?.[1]?.value ?? null;

odds["firstHalf"]["over_0_5"]["mozzartBet"] = groups[15]?.odds?.[1]?.value ?? null;
odds["firstHalf"]["over_1_5"]["mozzartBet"] = groups[15]?.odds?.[3]?.value ?? null;
odds["firstHalf"]["over_2_5"]["mozzartBet"] = groups[15]?.odds?.[5]?.value ?? null;

odds["secondHalf"]["ki1"]["mozzartBet"] = groups[18]?.odds?.[0]?.value ?? null;
odds["secondHalf"]["kix"]["mozzartBet"] = groups[18]?.odds?.[1]?.value ?? null;
odds["secondHalf"]["ki2"]["mozzartBet"] = groups[18]?.odds?.[2]?.value ?? null;

      }
    }
   if (merkurJson?.esMatches) {
    const filteredGames = merkurJson.esMatches.filter(
        (game) => game.kickOffTime === date
    );



    if (filteredGames.length > 0) {
        const matchId = filteredGames[0].id;
        const matchUrl = `https://www.merkurxtip.rs/restapi/offer/sr/match/${matchId}?annex=0&mobileVersion=1.16.2.18&locale=sr`;

        try {
            const response = await fetch(matchUrl);
            const detailJson = await response.json();
            const currentOdds = detailJson.odds;

            console.log("MERKUR DATA FETCHED FOR ID:", matchId);

            if (currentOdds) {
                odds["ki"]["awayAndAway3Plus"]["merkur"] = currentOdds["50267"];
                odds["ki"]["homeAndHome3Plus"]["merkur"] = currentOdds["50266"];
                odds["ki"]["1"]["merkur"] = currentOdds["1"];
                odds["ki"]["homeAndGG"]["merkur"] = currentOdds["365"];
                odds["ki"]["x"]["merkur"] = currentOdds["2"];
                odds["ki"]["2"]["merkur"] = currentOdds["3"];
                odds["ki"]["doubleChance_1X"]["merkur"] = currentOdds["7"];
                odds["ki"]["doubleChance_12"]["merkur"] = currentOdds["8"];
                odds["ki"]["doubleChance_X2"]["merkur"] = currentOdds["9"];
                odds["goals"]["gg"]["merkur"] = currentOdds["272"];
                odds["goals"]["ng"]["merkur"] = currentOdds["273"];
                odds["goals"]["over1_5"]["merkur"] = currentOdds["242"];
                odds["goals"]["over2_5"]["merkur"] = currentOdds["24"];
                odds["goals"]["over_3_5"]["merkur"] = currentOdds["25"];
                odds["goals"]["over_4_5"]["merkur"] = currentOdds["27"];
                odds["goals"]["over_5_5"]["merkur"] = currentOdds["223"];
                odds["goals"]["under2_5"]["merkur"] = currentOdds["22"];
                odds["goals"]["under1_5"]["merkur"] = currentOdds["21"];
                odds["goals"]["twoToFour"]["merkur"] = currentOdds["243"];
                odds["goals"]["twoToSix"]["merkur"] = currentOdds["220"];
                odds["goals"]["threeToSix"]["merkur"] = currentOdds["382"];
                odds["goals"]["firstMore"]["merkur"] = currentOdds["29"];
                odds["goals"]["secondMore"]["merkur"] = currentOdds["31"];
                odds["goals"]["equalGoals"]["merkur"] = currentOdds["30"];
                odds["ki"]["w1"]["merkur"] = currentOdds["264"];
                odds["ki"]["w2"]["merkur"] = currentOdds["265"];
                odds["secondHalf"]["gg"]["merkur"] = currentOdds["299"];
                odds["goals"]["under3_5"]["merkur"] = currentOdds["219"];
                odds["goals"]["oneToTwo"]["merkur"] = currentOdds["278"];
                odds["goals"]["oneToThree"]["merkur"] = currentOdds["279"];
                odds["goals"]["oneToFour"]["merkur"] = currentOdds["280"];
                odds["goals"]["twoToThree"]["merkur"] = currentOdds["23"];
                odds["goals"]["twoToFive"]["merkur"] = currentOdds["333"];
                odds["goals"]["threeToFour"]["merkur"] = currentOdds["244"];
                odds["goals"]["threeToFive"]["merkur"] = currentOdds["281"];
                odds["goals"]["even"]["merkur"] = currentOdds["231"];
                odds["goals"]["odd"]["merkur"] = currentOdds["232"];
                odds["homeGoals"]["second_0_5"]["merkur"] = currentOdds["312"];
                odds["homeGoals"]["second_1_5"]["merkur"] = currentOdds["297"];
                odds["awayGoals"]["second_0_5"]["merkur"] = currentOdds["313"];
                odds["awayGoals"]["second_1_5"]["merkur"] = currentOdds["298"];
                odds["homeGoals"]["over_0_5"]["merkur"] = currentOdds["238"];
                odds["homeGoals"]["over_1_5"]["merkur"] = currentOdds["248"];
                odds["homeGoals"]["over_2_5"]["merkur"] = currentOdds["276"];
                odds["homeGoals"]["over_3_5"]["merkur"] = currentOdds["555"];
                odds["homeGoals"]["zeroToOne"]["merkur"] = currentOdds["247"];
                odds["homeGoals"]["zeroToTwo"]["merkur"] = currentOdds["551"];
                odds["awayGoals"]["over_0_5"]["merkur"] = currentOdds["240"];
                odds["awayGoals"]["over_1_5"]["merkur"] = currentOdds["250"];
                odds["awayGoals"]["over_2_5"]["merkur"] = currentOdds["277"];
                odds["awayGoals"]["over_3_5"]["merkur"] = currentOdds["556"];
                odds["awayGoals"]["zeroToOne"]["merkur"] = currentOdds["249"];
                odds["homeGoals"]["first_0_5"]["merkur"] = currentOdds["307"];
                odds["homeGoals"]["first_1_5"]["merkur"] = currentOdds["274"];
                odds["awayGoals"]["first_0_5"]["merkur"] = currentOdds["308"];
                odds["awayGoals"]["first_1_5"]["merkur"] = currentOdds["275"];
                odds["firstHalf"]["ki1"]["merkur"] = currentOdds["4"];
                odds["firstHalf"]["kix"]["merkur"] = currentOdds["5"];
                odds["firstHalf"]["ki2"]["merkur"] = currentOdds["6"];
                odds["firstHalf"]["gg"]["merkur"] = currentOdds["291"];
                odds["firstHalf"]["over_0_5_both"]["merkur"] = currentOdds["363"];
                odds["firstHalf"]["first05Second15"]["merkur"] = currentOdds["316"];
                odds["secondHalf"]["ki1"]["merkur"] = currentOdds["235"];
                odds["secondHalf"]["kix"]["merkur"] = currentOdds["236"];
                odds["secondHalf"]["ki2"]["merkur"] = currentOdds["237"];
                odds["secondHalf"]["over_0_5"]["merkur"] = currentOdds["213"];
                odds["secondHalf"]["over_1_5"]["merkur"] = currentOdds["214"];
                odds["secondHalf"]["over_2_5"]["merkur"] = currentOdds["215"];
                odds["htft"]["hh"]["merkur"] = currentOdds["10"];
                odds["htft"]["hx"]["merkur"] = currentOdds["11"];
                odds["htft"]["ha"]["merkur"] = currentOdds["12"];
                odds["htft"]["xh"]["merkur"] = currentOdds["13"];
                odds["htft"]["xx"]["merkur"] = currentOdds["14"];
                odds["htft"]["xa"]["merkur"] = currentOdds["15"];
                odds["htft"]["ah"]["merkur"] = currentOdds["16"];
                odds["htft"]["ax"]["merkur"] = currentOdds["17"];
                odds["htft"]["aa"]["merkur"] = currentOdds["18"];
                odds["ki"]["homeAnd3Plus"]["merkur"] = currentOdds["287"];
                odds["ki"]["homeAnd4Plus"]["merkur"] = currentOdds["314"];
                odds["ki"]["awayAnd3Plus"]["merkur"] = currentOdds["288"];
                odds["ki"]["awayAnd4Plus"]["merkur"] = currentOdds["315"];
                odds["ki"]["awayAndGG"]["merkur"] = currentOdds["366"];
                odds["firstHalf"]["over_0_5"]["merkur"] = currentOdds["207"];
                odds["firstHalf"]["over_1_5"]["merkur"] = currentOdds["208"];
                odds["firstHalf"]["over_2_5"]["merkur"] = currentOdds["209"];
                odds["goals"]["gg3"]["merkur"] = currentOdds["303"];
            }
        } catch (error) {
            console.error("Merkur fetch failed:", error);
        }
    }
}
if (brazilJson?.esMatches) {
   const filteredGames = brazilJson.esMatches.filter(
        (game) => game.kickOffTime === date
    );

    if (filteredGames.length > 0) {
        const matchId = filteredGames[0].id;
        const matchUrl = `https://www.brazilbet.rs/restapi/offer/sr/match/${matchId}?annex=51&mobileVersion=2.44.9.7&locale=sr`;

        try {
            const response = await fetch(matchUrl);
            const detailJson = await response.json();
            const currentOdds = detailJson.odds;

        

           if (currentOdds) {
  odds["ki"]["awayAndAway3Plus"]["brazil"] = currentOdds["50267"];
  odds["ki"]["homeAndHome3Plus"]["brazil"] = currentOdds["50266"];
  odds["ki"]["1"]["brazil"] = currentOdds["1"];
  odds["ki"]["homeAndGG"]["brazil"] = currentOdds["365"];

  odds["ki"]["x"]["brazil"] = currentOdds["2"];
  odds["ki"]["2"]["brazil"] = currentOdds["3"];
  odds["ki"]["doubleChance_1X"]["brazil"] = currentOdds["7"];
  odds["ki"]["doubleChance_12"]["brazil"] = currentOdds["8"];
  odds["ki"]["doubleChance_X2"]["brazil"] = currentOdds["9"];

  odds["goals"]["gg"]["brazil"] = currentOdds["272"];
  odds["goals"]["ng"]["brazil"] = currentOdds["273"];
  odds["goals"]["over1_5"]["brazil"] = currentOdds["242"];
  odds["goals"]["over2_5"]["brazil"] = currentOdds["24"];
  odds["goals"]["over_3_5"]["brazil"] = currentOdds["25"];
  odds["goals"]["over_4_5"]["brazil"] = currentOdds["27"];
  odds["goals"]["over_5_5"]["brazil"] = currentOdds["223"];
  odds["goals"]["under2_5"]["brazil"] = currentOdds["22"];
  odds["goals"]["under1_5"]["brazil"] = currentOdds["21"];

  odds["goals"]["twoToFour"]["brazil"] = currentOdds["243"];
  odds["goals"]["twoToSix"]["brazil"] = currentOdds["220"];
  odds["goals"]["threeToSix"]["brazil"] = currentOdds["382"];
  odds["goals"]["firstMore"]["brazil"] = currentOdds["29"];
  odds["goals"]["secondMore"]["brazil"] = currentOdds["31"];
  odds["goals"]["equalGoals"]["brazil"] = currentOdds["30"];

  odds["ki"]["w1"]["brazil"] = currentOdds["264"];
  odds["ki"]["w2"]["brazil"] = currentOdds["265"];

  odds["secondHalf"]["gg"]["brazil"] = currentOdds["299"];

  odds["goals"]["under3_5"]["brazil"] = currentOdds["219"];
  odds["goals"]["oneToTwo"]["brazil"] = currentOdds["278"];
  odds["goals"]["oneToThree"]["brazil"] = currentOdds["279"];
  odds["goals"]["oneToFour"]["brazil"] = currentOdds["280"];
  odds["goals"]["twoToThree"]["brazil"] = currentOdds["23"];
  odds["goals"]["twoToFive"]["brazil"] = currentOdds["333"];
  odds["goals"]["threeToFour"]["brazil"] = currentOdds["244"];
  odds["goals"]["threeToFive"]["brazil"] = currentOdds["281"];

  odds["goals"]["even"]["brazil"] = currentOdds["231"];
  odds["goals"]["odd"]["brazil"] = currentOdds["232"];

  odds["homeGoals"]["second_0_5"]["brazil"] = currentOdds["312"];
  odds["homeGoals"]["second_1_5"]["brazil"] = currentOdds["297"];
  odds["awayGoals"]["second_0_5"]["brazil"] = currentOdds["313"];
  odds["awayGoals"]["second_1_5"]["brazil"] = currentOdds["298"];

  odds["homeGoals"]["over_0_5"]["brazil"] = currentOdds["238"];
  odds["homeGoals"]["over_1_5"]["brazil"] = currentOdds["248"];
  odds["homeGoals"]["over_2_5"]["brazil"] = currentOdds["276"];
  odds["homeGoals"]["over_3_5"]["brazil"] = currentOdds["555"];
  odds["homeGoals"]["zeroToOne"]["brazil"] = currentOdds["247"];
  odds["homeGoals"]["zeroToTwo"]["brazil"] = currentOdds["551"];

  odds["awayGoals"]["over_0_5"]["brazil"] = currentOdds["240"];
  odds["awayGoals"]["over_1_5"]["brazil"] = currentOdds["250"];
  odds["awayGoals"]["over_2_5"]["brazil"] = currentOdds["277"];
  odds["awayGoals"]["over_3_5"]["brazil"] = currentOdds["556"];
  odds["awayGoals"]["zeroToOne"]["brazil"] = currentOdds["249"];

  odds["homeGoals"]["first_0_5"]["brazil"] = currentOdds["307"];
  odds["homeGoals"]["first_1_5"]["brazil"] = currentOdds["274"];
  odds["awayGoals"]["first_0_5"]["brazil"] = currentOdds["308"];
  odds["awayGoals"]["first_1_5"]["brazil"] = currentOdds["275"];

  odds["firstHalf"]["ki1"]["brazil"] = currentOdds["4"];
  odds["firstHalf"]["kix"]["brazil"] = currentOdds["5"];
  odds["firstHalf"]["ki2"]["brazil"] = currentOdds["6"];
  odds["firstHalf"]["gg"]["brazil"] = currentOdds["291"];
  odds["firstHalf"]["over_0_5_both"]["brazil"] = currentOdds["363"];
  odds["firstHalf"]["first05Second15"]["brazil"] = currentOdds["316"];

  odds["secondHalf"]["ki1"]["brazil"] = currentOdds["235"];
  odds["secondHalf"]["kix"]["brazil"] = currentOdds["236"];
  odds["secondHalf"]["ki2"]["brazil"] = currentOdds["237"];
  odds["secondHalf"]["over_0_5"]["brazil"] = currentOdds["213"];
  odds["secondHalf"]["over_1_5"]["brazil"] = currentOdds["214"];
  odds["secondHalf"]["over_2_5"]["brazil"] = currentOdds["215"];

  odds["htft"]["hh"]["brazil"] = currentOdds["10"];
  odds["htft"]["hx"]["brazil"] = currentOdds["11"];
  odds["htft"]["ha"]["brazil"] = currentOdds["12"];
  odds["htft"]["xh"]["brazil"] = currentOdds["13"];
  odds["htft"]["xx"]["brazil"] = currentOdds["14"];
  odds["htft"]["xa"]["brazil"] = currentOdds["15"];
  odds["htft"]["ah"]["brazil"] = currentOdds["16"];
  odds["htft"]["ax"]["brazil"] = currentOdds["17"];
  odds["htft"]["aa"]["brazil"] = currentOdds["18"];

  odds["ki"]["homeAnd3Plus"]["brazil"] = currentOdds["287"];
  odds["ki"]["homeAnd4Plus"]["brazil"] = currentOdds["314"];
  odds["ki"]["awayAnd3Plus"]["brazil"] = currentOdds["288"];
  odds["ki"]["awayAnd4Plus"]["brazil"] = currentOdds["315"];
  odds["ki"]["awayAndGG"]["brazil"] = currentOdds["366"];

  odds["firstHalf"]["over_0_5"]["brazil"] = currentOdds["207"];
  odds["firstHalf"]["over_1_5"]["brazil"] = currentOdds["208"];
  odds["firstHalf"]["over_2_5"]["brazil"] = currentOdds["209"];

  odds["goals"]["gg3"]["brazil"] = currentOdds["303"];
}
        } catch (error) {
            console.error("BRAZIL fetch failed:", error);
        }
    }
}

    return res.status(200).json(sport === "S" ? odds : null);
  } catch (err) {
    console.error("Error fetching odds data:", err);
    return res.status(500).json({ error: "Failed to fetch odds data" });
  }
});
app.get("/tipStats", async (req, res) => {
  try {
    const allTips = await TipStat.find();
    if (allTips) {
      return res.status(200).json(allTips);
    }
  } catch (err) {
    console.log("error tipStats: " + err);
    return res.status(400);
  }
});
app.put("/removeBet", verifyToken, async (req, res) => {
  const { userId } = req.user;
  const { betId, datePath } = req.body;

  if (!userId || !betId || !datePath) {
    return res.status(400).json({ message: "Missing required parameters." });
  }

  try {
    // Construct the full path to the bet array
    const betPath = `statistics.monthlyStats.${datePath}`;

    // Pull the bet from the array using betId
    const result = await User.findByIdAndUpdate(
      userId,
      { $pull: { [betPath]: { betId: betId } } },
      { new: true }
    );

    if (!result) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.status(200).json({ message: "Bet successfully removed." });
  } catch (err) {
    console.error("Error removing bet:", err);
    return res
      .status(500)
      .json({ message: "Server error while removing bet." });
  }
});


app.post("/addPayment", paymentLimiter, uploadZ.single('file'), async (req, res) => {
  const { userEmail, userName, paymentType, mtcn } = req.body;
  const imageFile = req.file;

  if (!userEmail || !userName || !paymentType || !imageFile) {
    return res.status(400).json({ message: "Nedostaju podaci ili slika." });
  }

  try {
    // Convert buffer to base64 for Cloudinary
    const b64 = Buffer.from(imageFile.buffer).toString("base64");
    let dataURI = "data:" + imageFile.mimetype + ";base64," + b64;

    const result = await cloudinary.uploader.upload(dataURI, {
      folder: "payments", // Organizes your images in a folder
    });

    const payment = await mongoose.model("Payment").create({
      imageUrl: result.secure_url, // Permanent HTTPS link
      userEmail,
      userName,
      paymentType,
      mtcn,
      createdAt: new Date(),
    });

    res.status(200).json(payment);
  } catch (error) {
    console.error("Cloudinary Error:", error);
    res.status(500).json({ message: "Greška pri čuvanju slike na serveru." });
  }
});

server.listen(1337, () => console.log("Listening on port 1337."));
