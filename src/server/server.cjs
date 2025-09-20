const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { request } = require("undici");
const http = require("http");
const socketIo = require("socket.io");
const rateLimit = require("express-rate-limit");
const nodemailer = require("nodemailer");
const { v4: uuidv4 } = require("uuid");

app.use(express.json());
app.use(cors());
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:5173", // Must be an object
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
const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    username: { type: String },
    tier: { type: String },
    isVerified: { type: Boolean, required: true },
    verificationCode: { type: String },
    codeExpiresAt: { type: Date },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    defaultCurrency: String,
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
            bets: { type: Array, default: [] },
          },
        ],
        default: months.map((month) => ({
          month,
          totalBets: 0,
          totalWins: 0,
          totalLosses: 0,
          monthlyProfit: 0,
          bets: [],
        })),
      },

      avgBetAmount: { type: Number, default: 0 },
      averageReturnOnInvestment: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

const TipSchema = new mongoose.Schema({
  tipTitle: String,
  analysis: String,
  tip: String,
  type: String,
  active: Boolean,
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

const verifyToken = (req, res, next) => {
  // middleware to verify jwt token
  const token = req.header("Authorization").replace("Bearer ", "");
  if (!token) {
    return res
      .status(401)
      .json({ message: "Doslo je do greske. Probajte se ponovo ulogovati." });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res
      .status(401)
      .json({ message: "Doslo je do greske. Probajte se ponovo ulogovati." });
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
  const { email, password } = req.body;
  const user = await User.findOne({ email: email, password: password }).lean();

  if (!user) {
    return res.status(404).json({ message: "Pogresan email ili sifra." });
  }
  const payload = { userId: user._id, email: user.email, tier: user.tier };
  const token = jwt.sign(payload, JWT_SECRET);
  res.send({ token });
});
app.post("/register", async (req, res) => {
  const { email, password, username, defaultCurrency } = req.body;
  if (email && password && username && defaultCurrency) {
    try {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "Taj email se vec koristi." });
      }
      const verificationCode = Math.floor(
        100000 + Math.random() * 900000
      ).toString();
      const codeExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

      const newUser = new User({
        email,
        password: password,
        username,
        defaultCurrency: defaultCurrency,
        tier: "free",
        isVerified: false,
        verificationCode: verificationCode,
        codeExpiresAt: codeExpiresAt,
        statistics: {
          totalBets: 0,
          totalWins: 0,
          totalLosses: 0,
          winRate: 0,
          totalProfit: 0,
          initialInvestment: null,
          monthlyStats: [
            {
              month: "January",
              totalBets: 0,
              totalWins: 0,
              totalLosses: 0,
              monthlyProfit: 0,
            },
            {
              month: "February",
              totalBets: 0,
              totalWins: 0,
              totalLosses: 0,
              monthlyProfit: 0,
            },
            {
              month: "March",
              totalBets: 0,
              totalWins: 0,
              totalLosses: 0,
              monthlyProfit: 0,
            },
            {
              month: "April",
              totalBets: 0,
              totalWins: 0,
              totalLosses: 0,
              monthlyProfit: 0,
            },
            {
              month: "May",
              totalBets: 0,
              totalWins: 0,
              totalLosses: 0,
              monthlyProfit: 0,
            },
            {
              month: "June",
              totalBets: 0,
              totalWins: 0,
              totalLosses: 0,
              monthlyProfit: 0,
            },
            {
              month: "July",
              totalBets: 0,
              totalWins: 0,
              totalLosses: 0,
              monthlyProfit: 0,
            },
            {
              month: "August",
              totalBets: 0,
              totalWins: 0,
              totalLosses: 0,
              monthlyProfit: 0,
            },
            {
              month: "September",
              totalBets: 0,
              totalWins: 0,
              totalLosses: 0,
              monthlyProfit: 0,
            },
            {
              month: "October",
              totalBets: 0,
              totalWins: 0,
              totalLosses: 0,
              monthlyProfit: 0,
            },
            {
              month: "November",
              totalBets: 0,
              totalWins: 0,
              totalLosses: 0,
              monthlyProfit: 0,
            },
            {
              month: "December",
              totalBets: 0,
              totalWins: 0,
              totalLosses: 0,
              monthlyProfit: 0,
            },
          ],
        },
      });
      await newUser.save();
      const transport = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: "bogdandjakovic123@gmail.com",
          pass: "xxrs arbb nioh nmzm",
        },
      });
      await transport.sendMail({
        from: "Insajder verifikacija (:",
        to: email,
        subject: "InsajderTips | Verifikacija",
        text: "Vaš verifikacioni kod je: " + verificationCode,
      });
      res.status(201).json({ message: "Registracija uspesna!" });
    } catch (err) {
      res.status(500).json({ message: "Doslo je do greske sa registracijom." });
    }
  } else {
    return res
      .status(401)
      .json({ message: "Doslo je do greske. Unesite svako polje." });
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
app.get("/tips/free/", (req, res) => {
  Tip.find({ type: "free", active: true })

    .then((tips) => {
      if (!tips) {
        return res
          .status(404)
          .json({ message: "Nije pronadjen ni jedan besplatan tip." });
      }

      res.json(tips);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ message: "Greska do servera." });
    });
});

app.get("/tips/premium/", verifyToken, (req, res) => {
  const decodedJWT = req.user;

  if (decodedJWT.tier !== "premium") {
    return res.status(403).json({ message: "Nemate pristup ovim tipovima." });
  }

  Tip.find({ type: "premium", active: true })

    .then((tips) => {
      if (!tips.length) {
        return res
          .status(404)
          .json({ message: "Trenutno nema aktivnih premium tipova." });
      }
      res.json(tips);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ message: "Greska do servera." });
    });
});

app.get("/statistics/:user", verifyToken, async (req, res) => {
  const { user } = req.params; // user who they tried to request statistics on
  if (!user) {
    return res
      .status(400)
      .json({ message: "Doslo je do greske. Molimo prijavite nasoj podrsci." });
  }

  const actualUserId = req.user.userId; // JWT user id
  try {
    const actualUser = await User.findById(actualUserId);
    if (!actualUser) {
      return res.status(404).json({ message: "Korisnik nije pronadjen." });
    }
    if (user !== actualUser.username) {
      return res
        .status(403)
        .json({ message: "Nemate pristup ovom korisniku." });
    }
    const statistics = await User.findOne({ _id: actualUserId });

    return res.status(200).json(statistics);
  } catch (err) {}
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
  const { betId } = req.body;

  if (!userId || !betId) {
    return res.status(400).json({ message: "Missing required parameters." });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    let betRemoved = false;
    let removedBet = null;
    let removedMonthKey = null;

    // Find & remove the bet (single or parlay)
    if (user.statistics && user.statistics.monthlyStats) {
      for (const monthKey in user.statistics.monthlyStats) {
        const month = user.statistics.monthlyStats[monthKey];
        if (!month || !month.bets) continue;

        for (const dayKey in month.bets) {
          const dayBets = month.bets[dayKey];

          if (!Array.isArray(dayBets)) continue;

          const newDayBets = [];

          for (const existingBet of dayBets) {
            // Single bet object
            if (existingBet && existingBet.betId === betId) {
              betRemoved = true;
              removedBet = existingBet;
              removedMonthKey = monthKey;
              // skip pushing -> removed
              continue;
            }

            // Parlay stored as array of bet objects
            if (Array.isArray(existingBet)) {
              const parlayContains = existingBet.some((g) => g.betId === betId);
              if (parlayContains) {
                betRemoved = true;
                removedBet = existingBet; // the whole parlay array
                removedMonthKey = monthKey;
                continue; // remove whole parlay
              }
            }

            // keep this bet
            newDayBets.push(existingBet);
          }

          month.bets[dayKey] = newDayBets;
        }
      }
    }

    if (!betRemoved || !removedBet) {
      return res.status(404).json({ message: "Bet not found." });
    }

    // Normalize processing: if parlay (array) -> process each element,
    // otherwise single element array
    const isParlay = Array.isArray(removedBet);
    const betsToProcess = isParlay ? removedBet : [removedBet];

    // Ensure statistics numbers exist
    user.statistics.totalBets = Number(user.statistics.totalBets || 0);
    user.statistics.totalWins = Number(user.statistics.totalWins || 0);
    user.statistics.totalLosses = Number(user.statistics.totalLosses || 0);
    user.statistics.totalProfit = Number(user.statistics.totalProfit || 0);
    user.statistics.initialInvestment = Number(
      user.statistics.initialInvestment || 0
    );

    // Get month object (for monthly updates)
    const month =
      removedMonthKey != null
        ? user.statistics.monthlyStats[removedMonthKey]
        : null;
    if (month) {
      month.totalBets = Number(month.totalBets || 0);
      month.totalWins = Number(month.totalWins || 0);
      month.totalLosses = Number(month.totalLosses || 0);
      month.monthlyProfit = Number(month.monthlyProfit || 0);
    }

    // For each "bet entry" removed, reverse its statistical and balance effects
    for (const bet of betsToProcess) {
      // Parse numeric values safely
      const stake = parseFloat(bet.stake) || 0;
      const odds = parseFloat(bet.odds) || 1;
      const status = (bet.status || "").toLowerCase();

      // Decrement global and monthly totalBets per entry removed
      user.statistics.totalBets = Math.max(0, user.statistics.totalBets - 1);
      if (month) month.totalBets = Math.max(0, month.totalBets - 1);

      if (status === "win") {
        // Undo a win:
        // - decrease totalWins
        // - subtract recorded profit from totalProfit/monthlyProfit
        // - remove that profit from initialInvestment (payout that was previously added)
        const profit = stake * odds - stake; // stake * (odds - 1)
        user.statistics.totalWins = Math.max(0, user.statistics.totalWins - 1);
        user.statistics.totalProfit =
          (user.statistics.totalProfit || 0) - profit;
        if (month) {
          month.totalWins = Math.max(0, month.totalWins - 1);
          month.monthlyProfit = (month.monthlyProfit || 0) - profit;
        }
        // Subtract profit from the balance to revert the payout the win added earlier.
        user.statistics.initialInvestment = Math.max(
          0,
          (user.statistics.initialInvestment || 0) - profit
        );
      } else if (status === "loss") {
        // Undo a loss:
        // - decrease totalLosses
        // - add stake back to totalProfit/monthlyProfit (undo loss)
        // - refund stake back to initialInvestment
        user.statistics.totalLosses = Math.max(
          0,
          user.statistics.totalLosses - 1
        );
        user.statistics.totalProfit =
          (user.statistics.totalProfit || 0) + stake;
        if (month) {
          month.totalLosses = Math.max(0, month.totalLosses - 1);
          month.monthlyProfit = (month.monthlyProfit || 0) + stake;
        }
        user.statistics.initialInvestment =
          (user.statistics.initialInvestment || 0) + stake;
      } else {
        // active / unsettled bet: placing the bet previously subtracted stake from balance,
        // so removing an active bet should refund the stake.
        user.statistics.initialInvestment =
          (user.statistics.initialInvestment || 0) + stake;
        // active bets shouldn't affect totalWins/totalLosses/totalProfit
      }
    }

    // Recalculate winRate safely
    user.statistics.winRate =
      user.statistics.totalBets > 0
        ? (user.statistics.totalWins / user.statistics.totalBets) * 100
        : 0;

    await user.save();

    return res.status(200).json({ message: "Bet successfully removed." });
  } catch (err) {
    console.error("Error removing bet:", err);
    return res
      .status(500)
      .json({ message: "Server error while removing bet." });
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
    const userId = req.user.userId; // Extracted from token via verifyToken middleware

    if (!oldName || !newName) {
      return res
        .status(400)
        .json({ error: "Both oldName and newName are required" });
    }

    if (oldName === newName) {
      return res
        .status(400)
        .json({ error: "New name must be different from the old name" });
    }

    // Find user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if the old name matches the current name
    if (user.username !== oldName) {
      return res
        .status(400)
        .json({ error: "Old name does not match current name" });
    }

    // Update the name
    user.username = newName;
    await user.save();

    return res
      .status(200)
      .json({ message: "Name updated successfully", newName: user.name });
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
  const resetLink = `http://localhost:5173/#/reset-password?token=${token}`;

  // 4. Send email with link
  const transport = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "bogdandjakovic123@gmail.com",
      pass: "xxrs arbb nioh nmzm",
    },
  });

  await transport.sendMail({
    from: "Insajder verifikacija (:",
    to: email,
    subject: "InsajderTips | Resetujte Sifru",
    text: `Da biste resetovali sifru, kliknite na sledeći link: ${resetLink}\n\nAko niste vi zahtevali, ignorisite ovaj email.`,
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
      data?.esMatches.forEach((match, index) => {
        console.log(`Match #${index + 1}:`, match.sport, "-", match.leagueName);
      });

      // Filter out any matches where leagueName or leagueToken contains "Igrači"
      // Also keep only sport S or B, apply extra filters to basketball leagues
      const filtered = data?.esMatches.filter((match) => {
        const leagueNameLower = (match.leagueName || "").toLowerCase();
        const leagueTokenLower = (match.leagueToken || "").toLowerCase();

        // Exclude all matches related to "igrači" (players) for any sport
        if (
          leagueNameLower.includes("igrači") ||
          leagueTokenLower.includes("igrači")
        ) {
          return false;
        }

        // Only soccer (S) or basketball (B)
        if (match.sport === "S") {
          return true;
        }

        if (match.sport === "B") {
          // Additional basketball exclusions
          if (match.leagueName === "Evroliga Igrači") return false;
          if (match.leagueName.includes("NBA 2024/25")) return false;
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

app.post("/oddsChecker/getOdds/", async (req, res) => {
  // attempts to get the odds for a specific match on all the bet stores.

  console.log("Entered getOdds.");

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
        under1_5: { reference: "0-1" },
        under2_5: { reference: "0-2" },
        twoToFour: { reference: "2-4" },
        twoToSix: { reference: "2-6" },
        threeToSix: { reference: "3-6" },
        gg: { reference: "gg" },
        gg3: { reference: "gg3+" },
        ng: { reference: "ng" },
        firstMore: { reference: "1>" },
        secondMore: { reference: "2>" },
        equalGoals: { reference: "1=2" },
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
      },

      firstHalf: {
        name: "Prvo poluvreme",
        gg: { reference: "GG1" },
        over_0_5: { reference: "PP1+" },
        over_1_5: { reference: "PP2+" },
        over_2_5: { reference: "PP3+" },
        over_0_5_both: { reference: "1P1+&2P1+" },
        first05Second15: { reference: "1P1+&2P2+" },
        ki1: { reference: "Ishod PP. 1" },
        ki2: { reference: "Ishod PP 2." },
        kix: { reference: "Ishod PP X." },
        pg1: { reference: "Prvi Gol PP. 1" },
        pg2: { reference: "Prvi Gol PP. 2" },
      },
      secondHalf: {
        name: "Drugo poluvreme",
        over_0_5: { reference: "2P1+" },
        over_1_5: { reference: "2P2++" },
        over_2_5: { reference: "2P3++" },
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

    let basketballOdds = {
      ki: {
        name: "Konačan ishod",
        1: { reference: "1 (bez prod.)" },
        x: { reference: "x (bez prod.)" },
        2: { reference: "2 (bez prod.)" },
        prod1: { reference: "1 (sa prod.)" },
        prod2: { reference: "2 (sa prod.)" },
      },
      firstHalf: {
        name: "Prvo poluvreme",
        ki1: { reference: "1" },
        ki2: { reference: "2" },
        kix: { reference: "x" },
      },
      firstMinute: {
        name: "Prvi minut",
        ki1: { reference: "1" },
        ki2: { reference: "2" },
        kix: { reference: "x" },
      },
      htft: {
        name: "Prelazi",
        hh: { reference: "1-1" },
        ha: { reference: "1-2" },
        aa: { reference: "2-2" },
        ah: { reference: "2-1" },
        xa: { reference: "X-2" },
        xh: { reference: "X-1" },
      },
    };

    // odds structure that we will return upon finding the odds 1: {soccerBet: 1.50} example

    // Define both API URLs
    const soccerApi = `https://www.soccerbet.rs/restapi/offer/sr/match/${soccerId}?annex=0&desktopVersion=2.36.3.14&locale=sr`;
    const maxbetSearch = `https://www.maxbet.rs/restapi/offer/sr/search/${searchQuery}/mob?mobileVersion=1.2.1.14&locale=sr`;
    const mozzartSearch = `https://www.mozzartbet.com/betting/search?term=${searchQuery}`;
    const oktagonSearch = `https://www.oktagonbet.com/restapi/offer/sr/search/${searchQuery}/mob?annex=1&mobileVersion=2.38.5.1&locale=sr`;
    // Fetch both API responses in parallel
    const [
      soccerResponse,
      maxbetSearchResponse,
      mozzartResponse,
      oktagonSearchResponse,
    ] = await Promise.all([
      request(soccerApi),
      request(maxbetSearch),
      request(mozzartSearch, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Medium: "WEB",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36",
          Referer: "https://www.mozzartbet.com/sr/kladjenje/sport/1?date=today",
          "X-Requested-With": "XMLHttpRequest",
        },
      }),
      request(oktagonSearch),
    ]);

    const soccerJson = await soccerResponse.body.json();
    const maxbetJson = await maxbetSearchResponse.body.json();
    const mozzartJson = await mozzartResponse.body.json();

    const oktagonJson = await oktagonSearchResponse.body.json();
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
            odds["homeGoals"]["zeroToOne"]["oktagon"] = currentOdds["355"];
            odds["ki"]["1"]["oktagon"] = currentOdds["1"];
            odds["ki"]["x"]["oktagon"] = currentOdds["2"];
            odds["ki"]["2"]["oktagon"] = currentOdds["3"];
            odds["goals"]["gg"]["oktagon"] = currentOdds["272"];
            odds["goals"]["ng"]["oktagon"] = currentOdds["273"];
            odds["ki"]["doubleChance_1X"]["oktagon"] = currentOdds["7"];
            odds["ki"]["doubleChance_12"]["oktagon"] = currentOdds["8"];
            odds["ki"]["doubleChance_X2"]["oktagon"] = currentOdds["9"];
            odds["goals"]["over2_5"]["oktagon"] = currentOdds["24"];
            odds["goals"]["under2_5"]["oktagon"] = currentOdds["22"];
            // x
            odds["ki"]["homeAnd3Plus"]["oktagon"] = currentOdds["287"];
            odds["ki"]["homeAnd4Plus"]["oktagon"] = currentOdds["314"];
            odds["ki"]["awayAnd3Plus"]["oktagon"] = currentOdds["288"]; // fix
            odds["ki"]["awayAnd4Plus"]["oktagon"] = currentOdds["315"]; // fix
            odds["ki"]["awayAndGG"]["oktagon"] = currentOdds["366"];
            odds["ki"]["homeAndHome2Plus"]["oktagon"] = currentOdds["419"];
            odds["ki"]["homeAndHome3Plus"]["oktagon"] = currentOdds["484"];
            odds["ki"]["awayAndAway2Plus"]["oktagon"] = currentOdds["420"];
            odds["ki"]["awayAndAway3Plus"]["oktagon"] = currentOdds["413"];

            odds["goals"]["over1_5"]["oktagon"] = currentOdds["8"];
            odds["goals"]["over2_5"]["oktagon"] = currentOdds["24"];
            odds["goals"]["over_3_5"]["oktagon"] = currentOdds["25"];
            odds["goals"]["over_4_5"]["oktagon"] = currentOdds["27"];
            odds["goals"]["under1_5"]["oktagon"] = currentOdds["21"];
            odds["goals"]["under2_5"]["oktagon"] = currentOdds["22"];
            odds["goals"]["twoToFour"]["oktagon"] = currentOdds["243"];
            odds["goals"]["twoToSix"]["oktagon"] = currentOdds["220"];
            odds["goals"]["threeToSix"]["oktagon"] = currentOdds["382"];
            odds["goals"]["firstMore"]["oktagon"] = currentOdds["29"];
            odds["goals"]["secondMore"]["oktagon"] = currentOdds["31"];
            odds["goals"]["equalGoals"]["oktagon"] = currentOdds["30"];

            odds["homeGoals"]["over_0_5"]["oktagon"] = currentOdds["238"];
            odds["homeGoals"]["over_1_5"]["oktagon"] = currentOdds["248"];
            odds["homeGoals"]["over_2_5"]["oktagon"] = currentOdds["276"];
            odds["homeGoals"]["over_3_5"]["oktagon"] = currentOdds["555"];
            odds["awayGoals"]["over_0_5"]["oktagon"] = currentOdds["240"];
            odds["awayGoals"]["over_1_5"]["oktagon"] = currentOdds["250"];
            odds["awayGoals"]["over_2_5"]["oktagon"] = currentOdds["277"];
            odds["awayGoals"]["zeroToOne"]["oktagon"] = currentOdds["249"];
            odds["homeGoals"]["zeroToTwo"]["oktagon"] = currentOdds["551"];
            odds["awayGoals"]["over_3_5"]["oktagon"] = currentOdds["556"];

            odds["firstHalf"]["over_0_5"]["oktagon"] = currentOdds["207"];
            odds["firstHalf"]["over_1_5"]["oktagon"] = currentOdds["208"];
            odds["firstHalf"]["over_2_5"]["oktagon"] = currentOdds["209"];
            odds["homeGoals"]["first_0_5"]["oktagon"] = currentOdds["307"];
            odds["homeGoals"]["first_1_5"]["oktagon"] = currentOdds["274"];
            odds["awayGoals"]["first_0_5"]["oktagon"] = currentOdds["308"];
            odds["awayGoals"]["first_1_5"]["oktagon"] = currentOdds["275"];
            odds["firstHalf"]["ki1"]["oktagon"] = currentOdds["4"];
            odds["firstHalf"]["ki2"]["oktagon"] = currentOdds["6"];
            odds["firstHalf"]["kix"]["oktagon"] = currentOdds["5"];
            odds["firstHalf"]["gg"]["oktagon"] = currentOdds["291"];
            odds["firstHalf"]["first05Second15"]["oktagon"] =
              currentOdds["316"];
            odds["firstHalf"]["over_0_5_both"]["oktagon"] = currentOdds["363"];

            odds["secondHalf"]["over_0_5"]["oktagon"] = currentOdds["213"];
            odds["secondHalf"]["over_1_5"]["oktagon"] = currentOdds["214"];
            odds["secondHalf"]["over_0_5"]["oktagon"] = currentOdds["215"];
            odds["secondHalf"]["ki1"]["oktagon"] = currentOdds["235"];
            odds["secondHalf"]["kix"]["oktagon"] = currentOdds["236"];
            odds["secondHalf"]["ki2"]["oktagon"] = currentOdds["237"];

            odds["htft"]["hh"]["oktagon"] = currentOdds["10"];
            odds["htft"]["hx"]["oktagon"] = currentOdds["11"];
            odds["htft"]["ha"]["oktagon"] = currentOdds["12"];
            odds["htft"]["aa"]["oktagon"] = currentOdds["18"];
            odds["htft"]["ax"]["oktagon"] = currentOdds["17"];
            odds["htft"]["ah"]["oktagon"] = currentOdds["16"];
            odds["htft"]["xh"]["oktagon"] = currentOdds["13"];
            odds["htft"]["xx"]["oktagon"] = currentOdds["14"];
            odds["htft"]["xa"]["oktagon"] = currentOdds["15"];

            odds["goals"]["gg3"]["oktagon"] = currentOdds["303"];
          });
        });
      }
    }
    if (maxbetJson.esMatches) {
      // here, we will try to find the exact game from the search list.

      const filteredGames = maxbetJson.esMatches.filter(
        (game) =>
          game.kickOffTime === date &&
          game.leagueName != "Max Bonus Tip Fudbal "
      );

      // if we found the game we are lookingg for, append its odds in the container.
      if (filteredGames.length > 0 && sport === "S") {
        const currentOdds = filteredGames[0].odds;

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

        odds["ki"]["homeAndHome2Plus"]["maxBet"] = currentOdds["419"];
        odds["ki"]["homeAndHome3Plus"]["maxBet"] = currentOdds["484"];
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

        odds["firstHalf"]["pg1"]["maxBet"] = currentOdds["363"];
        odds["firstHalf"]["pg2"]["maxBet"] = currentOdds["363"];

        odds["secondHalf"]["over_0_5"]["maxBet"] = currentOdds["213"];
        odds["secondHalf"]["over_1_5"]["maxBet"] = currentOdds["214"];
        odds["secondHalf"]["over_0_5"]["maxBet"] = currentOdds["215"];
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
      } else if (filteredGames.length > 0 && sport === "B") {
        let currentOdds = filteredGames[0].odds;
        basketballOdds["ki"]["prod1"]["maxBet"] = currentOdds["50291"];
        basketballOdds["ki"]["prod2"]["maxBet"] = currentOdds["50293"];
      }
    }
    if (soccerJson?.betMap) {
      const soccerOdds = soccerJson?.betMap; // Get the whole betMap

      if (soccerOdds && sport === "S") {
        odds["ki"]["awayAndAway3Plus"]["soccerBet"] =
          soccerOdds["50267"]?.NULL?.ov;
        odds["ki"]["homeAndHome3Plus"]["soccerBet"] =
          soccerOdds["221"]?.NULL?.ov;
        odds["ki"]["1"]["soccerBet"] = soccerOdds["1"]?.NULL?.ov;
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
        odds["goals"]["over_4_5"]["soccerBet"] = soccerOdds["27"]?.NULL?.ov; // fix
        odds["goals"]["under2_5"]["soccerBet"] = soccerOdds["22"]?.NULL?.ov;
        odds["goals"]["under1_5"]["soccerBet"] = soccerOdds["21"]?.NULL?.ov; // fix
        odds["goals"]["twoToFour"]["soccerBet"] = soccerOdds["243"]?.NULL?.ov;
        odds["goals"]["twoToSix"]["soccerBet"] = soccerOdds["220"]?.NULL?.ov;
        odds["goals"]["threeToSix"]["soccerBet"] = soccerOdds["382"]?.NULL?.ov;
        odds["goals"]["firstMore"]["soccerBet"] = soccerOdds["29"]?.NULL?.ov;
        odds["goals"]["secondMore"]["soccerBet"] = soccerOdds["31"]?.NULL?.ov;
        odds["goals"]["equalGoals"]["soccerBet"] = soccerOdds["30"]?.NULL?.ov;

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
      } else if (soccerOdds && sport === "B") {
        basketballOdds["ki"]["1"]["soccerBet"] = soccerOdds["1"]?.NULL?.ov;
        basketballOdds["ki"]["x"]["soccerBet"] = soccerOdds["2"]?.NULL?.ov;
        basketballOdds["ki"]["2"]["soccerBet"] = soccerOdds["3"]?.NULL?.ov;
        basketballOdds["ki"]["prod1"]["soccerBet"] =
          soccerOdds["50291"]?.NULL?.ov;
        basketballOdds["ki"]["prod2"]["soccerBet"] =
          soccerOdds["50293"]?.NULL?.ov;

        basketballOdds["firstHalf"]["ki1"]["soccerBet"] =
          soccerOdds["4"]?.NULL?.ov;
        basketballOdds["firstHalf"]["kix"]["soccerBet"] =
          soccerOdds["5"]?.NULL?.ov;
        basketballOdds["firstHalf"]["ki2"]["soccerBet"] =
          soccerOdds["6"]?.NULL?.ov;
        basketballOdds["firstMinute"]["ki1"]["soccerBet"] =
          soccerOdds["55358"]?.NULL?.ov;
        basketballOdds["firstMinute"]["kix"]["soccerBet"] =
          soccerOdds["55359"]?.NULL?.ov;
        basketballOdds["firstMinute"]["ki2"]["soccerBet"] =
          soccerOdds["55360"]?.NULL?.ov;

        basketballOdds["htft"]["aa"]["soccerBet"] = // 2-2
          soccerOdds["50304"]?.NULL?.ov;
        basketballOdds["htft"]["ah"]["soccerBet"] = // 2-1
          soccerOdds["50302"]?.NULL?.ov;
        basketballOdds["htft"]["ha"]["soccerBet"] = // 1-2
          soccerOdds["50298"]?.NULL?.ov;
        basketballOdds["htft"]["hh"]["soccerBet"] = // 1-1
          soccerOdds["50296"]?.NULL?.ov;
        basketballOdds["htft"]["xa"]["soccerBet"] = // X-2
          soccerOdds["50301"]?.NULL?.ov;
        basketballOdds["htft"]["xh"]["soccerBet"] = // X-1
          soccerOdds["50299"]?.NULL?.ov;
      }
    }
    if (mozzartJson?.items?.length > 0) {
      const items = mozzartJson.items;
      const filteredGames = items.filter((game) => game.startTime === date);
      if (!filteredGames) {
        return res.status(404).json({ error: "Nije pronadjen mec." });
      }
      const mozzartOdds = await request(
        `https://www.mozzartbet.com/match/${filteredGames[0]?.id}`,
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Medium: "WEB",
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36",
            Referer:
              "https://www.mozzartbet.com/sr/kladjenje/sport/1?date=today",
            "X-Requested-With": "XMLHttpRequest",
          },
          method: "POST",
        }
      );

      const json = await mozzartOdds.body.json();
      if (json.status !== "ERROR") {
        const mOdds = json.match.odds;
        console.log(JSON.stringify(mOdds, null, 2)); // Pretty print

        if (mOdds && mOdds.length > 0 && sport === "S") {
          odds["ki"]["1"]["mozzartBet"] = mOdds[0].value;
          odds["ki"]["x"]["mozzartBet"] = mOdds[1].value;
          odds["ki"]["2"]["mozzartBet"] = mOdds[2].value;

          odds["ki"]["homeAnd3Plus"]["mozzartBet"] = mOdds[301].value;
          odds["ki"]["homeAnd4Plus"]["mozzartBet"] = mOdds[312].value;
          odds["ki"]["homeAndHome2Plus"]["mozzartBet"] = mOdds[310].value;

          odds["ki"]["doubleChance_1X"]["mozzartBet"] = mOdds[3].value;
          odds["ki"]["doubleChance_12"]["mozzartBet"] = mOdds[4].value;
          odds["ki"]["doubleChance_X2"]["mozzartBet"] = mOdds[5].value;
          odds["ki"]["awayAnd3Plus"]["mozzartBet"] = mOdds[302].value;
          odds["ki"]["awayAnd4Plus"]["mozzartBet"] = mOdds[313].value;
          odds["ki"]["awayAndGG"]["mozzartBet"] = mOdds[319].value;
          odds["ki"]["awayAndAway2Plus"]["mozzartBet"] = mOdds[311].value;

          odds["goals"]["gg"]["mozzartBet"] = mOdds[223].value;
          odds["goals"]["ng"]["mozzartBet"] = mOdds[224].value;
          odds["goals"]["over2_5"]["mozzartBet"] = mOdds[9].value;
          odds["goals"]["under2_5"]["mozzartBet"] = mOdds[7].value;
          odds["goals"]["gg3"]["mozzartBet"] = mOdds[225].value;
          odds["goals"]["over1_5"]["mozzartBet"] = mOdds[17].value;
          odds["goals"]["over_3_5"]["mozzartBet"] = mOdds[10].value;
          odds["goals"]["over_4_5"]["mozzartBet"] = mOdds[12].value;
          odds["goals"]["under1_5"]["mozzartBet"] = mOdds[6].value;

          odds["htft"]["aa"]["mozzartBet"] = mOdds[55].value;
          odds["htft"]["ah"]["mozzartBet"] = mOdds[53].value;
          odds["htft"]["ax"]["mozzartBet"] = mOdds[54].value;
          odds["htft"]["ha"]["mozzartBet"] = mOdds[49].value;
          odds["htft"]["hh"]["mozzartBet"] = mOdds[47].value;
          odds["htft"]["hx"]["mozzartBet"] = mOdds[48].value;
          odds["htft"]["xa"]["mozzartBet"] = mOdds[52].value;
          odds["htft"]["xh"]["mozzartBet"] = mOdds[50].value;
          odds["htft"]["xx"]["mozzartBet"] = mOdds[51].value;

          odds["goals"]["twoToFour"]["mozzartBet"] = mOdds[23].value;
          odds["goals"]["twoToSix"]["mozzartBet"] = mOdds[19].value;
          odds["goals"]["threeToSix"]["mozzartBet"] = mOdds[33].value;

          odds["goals"]["firstMore"]["mozzartBet"] = mOdds[101].value;
          odds["goals"]["secondMore"]["mozzartBet"] = mOdds[102].value;
          odds["goals"]["equalGoals"]["mozzartBet"] = mOdds[103].value;

          odds["homeGoals"]["over_0_5"]["mozzartBet"] = mOdds[243].value;
          odds["homeGoals"]["over_1_5"]["mozzartBet"] = mOdds[244].value;
          odds["homeGoals"]["over_2_5"]["mozzartBet"] = mOdds[250].value;
          odds["homeGoals"]["over_3_5"]["mozzartBet"] = mOdds[260].value;
          odds["homeGoals"]["zeroToOne"]["mozzartBet"] = mOdds[251].value;
          odds["homeGoals"]["zeroToTwo"]["mozzartBet"] = mOdds[252].value;

          odds["awayGoals"]["over_0_5"]["mozzartBet"] = mOdds[268].value;
          odds["awayGoals"]["over_1_5"]["mozzartBet"] = mOdds[269].value;
          odds["awayGoals"]["over_2_5"]["mozzartBet"] = mOdds[275].value;
          odds["awayGoals"]["over_3_5"]["mozzartBet"] = mOdds[285].value;
          odds["awayGoals"]["zeroToOne"]["mozzartBet"] = mOdds[276].value;

          odds["secondHalf"]["ki1"]["mozzartBet"] = mOdds[104].value;
          odds["secondHalf"]["kix"]["mozzartBet"] = mOdds[105].value;
          odds["secondHalf"]["ki2"]["mozzartBet"] = mOdds[106].value;

          odds["secondHalf"]["over_0_5"]["mozzartBet"] = mOdds[87].value;
          odds["secondHalf"]["over_1_5"]["mozzartBet"] = mOdds[88].value;
          odds["secondHalf"]["over_2_5"]["mozzartBet"] = mOdds[89].value;

          odds["firstHalf"]["over_0_5_both"]["mozzartBet"] = mOdds[317].value;
          odds["firstHalf"]["first05Second15"]["mozzartBet"] = mOdds[315].value;
          odds["firstHalf"]["gg"]["mozzartBet"] = mOdds[226].value;

          odds["homeGoals"]["first_0_5"]["mozzartBet"] = mOdds[209].value;
          odds["homeGoals"]["first_1_5"]["mozzartBet"] = mOdds[210].value;

          odds["awayGoals"]["first_0_5"]["mozzartBet"] = mOdds[216].value;
          odds["awayGoals"]["first_1_5"]["mozzartBet"] = mOdds[217].value;

          odds["firstHalf"]["ki1"]["mozzartBet"] = mOdds[44].value;
          odds["firstHalf"]["ki2"]["mozzartBet"] = mOdds[46].value;
          odds["firstHalf"]["kix"]["mozzartBet"] = mOdds[45].value;

          odds["firstHalf"]["over_0_5"]["mozzartBet"] = mOdds[73].value;
          odds["firstHalf"]["over_1_5"]["mozzartBet"] = mOdds[74].value;
          odds["firstHalf"]["over_2_5"]["mozzartBet"] = mOdds[75].value;
        } else if (mOdds && mOdds.length > 0 && sport === "B") {
        }
      }
    }

    return res.status(200).json(sport === "S" ? odds : basketballOdds);
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
const wuLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 2,
  keyGenerator: (req) => req.body.userEmail || req.ip,
  message: {
    message:
      "Već ste poslali uplatu u poslednja 24h. Ukoliko imate problema, kontaktirajte nas => podrska@insajder.tips",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.post("/addPayment", wuLimiter, async (req, res) => {
  const { imageUrl, userEmail, userName, paymentType, mtcn } = req.body;

  if (!userEmail || !userName || !paymentType) {
    return res.status(400).json({
      message: "Doslo je do greske. Ili je problem do slike ili vaseg naloga.",
    });
  }
  if (paymentType === "uplatnica" && !imageUrl) {
    return res.status(400).json({
      message: "Doslo je do greske. Ili je problem do slike ili vaseg naloga.",
    });
  }
  const payment = await mongoose.model("Payment").create({
    imageUrl,
    userEmail,
    userName,
    paymentType,
    mtcn,
    createdAt: new Date(),
  });
  res.status(200).json(payment);
});
server.listen(1337, () => console.log("Listening on port 1337."));
