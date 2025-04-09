const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { request } = require("undici");
const http = require("http");
const socketIo = require("socket.io");

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
const User = mongoose.model("User", UserSchema);
const Tip = mongoose.model("Tip", TipSchema);
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
      const newUser = new User({
        email,
        password: password,
        username,
        defaultCurrency: defaultCurrency,
        tier: "free",
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
app.get("/user", verifyToken, async (req, res) => {
  // fetches the current user provided by the verifyToken middleware
  try {
    const userData = await User.findById(req.user.userId).select("-password");
    res.status(200).json({ user: userData });
  } catch (err) {}
});
app.get("/tips/free/:amount", (req, res) => {
  // gets free betting tips with the specified amount
  const amount = req.params.amount;
  Tip.find({ type: "free", active: true })
    .limit(Number(amount))
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

app.get("/tips/premium/:amount", verifyToken, (req, res) => {
  const decodedJWT = req.user;
  const amount = req.params.amount;

  if (decodedJWT.tier !== "premium") {
    return res.status(403).json({ message: "Nemate pristup ovim tipovima." });
  }

  Tip.find({ type: "premium", active: true })
    .limit(Number(amount))
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

// OddsChecker
app.get("/oddsChecker/getSearch/:query", async (req, res) => {
  const query = req.params.query;
  const api = `https://www.soccerbet.rs/restapi/offer/sr/search/${query}/mob?annex=0&mobileVersion=2.36.3.14&locale=sr`;
  try {
    const response = await request(api);
    const ctp = response.headers["content-type"];
    if (ctp && ctp.includes("application/json")) {
      const data = await response.body.json();
      

      return res
        .status(200)
        .json(
          data?.esMatches.filter(
            (match) =>
              match.sport === "S" ||
              (match.sport === "B" && match.leagueName !== "Evroliga Igrači")
          )
        );
    }
  } catch (err) {}
});

app.post("/oddsChecker/getOdds/", async (req, res) => {
  // attempts to get the odds for a specific match on all the bet stores.

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
        homeAnd3Plus: { reference: "1&3+" },
        homeAnd4Plus: { reference: "1&4+" },
        awayAnd3Plus: { reference: "2&3+" },
        awayAnd4Plus: { reference: "2&4+" },
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
        twoToFour: { reference: "2-4" }, // new
        twoToSix: { reference: "2-6" }, // new
        threeToSix: { reference: "3-6" }, // new
        gg: { reference: "gg" },
        gg3: { reference: "gg3+" },
        ng: { reference: "ng" },
        firstMore: { reference: "1>" }, // new
        secondMore: { reference: "2>" }, // new
        equalGoals: { reference: "1=2" }, // new
      },

      homeGoals: {
        name: "Domacin golova",
        over_0_5: { reference: "D1+" },
        over_1_5: { reference: "D2+" },
        over_2_5: { reference: "D3+" },
      },

      awayGoals: {
        name: "Gost golova",
        over_0_5: { reference: "G1+" },
        over_1_5: { reference: "G2+" },
        over_2_5: { reference: "G3+" },
      },

      firstHalf: {
        name: "Prvo poluvreme",
        over_0_5: { reference: "pp1+" },
        over_1_5: { reference: "pp2+" },
        over_2_5: { reference: "pp3+" },
        over_0_5_both: { reference: "1p1+&2p1+" },
        first05Second15: { reference: "1p1+&2p2+" },
        homeOver_0_5: { reference: "d1+" },
        homeOver_1_5: { reference: "d2+" },
        awayOver_0_5: { reference: "g1+" },
        awayOver_1_5: { reference: "g2+" },
        ki1: { reference: "pp1" },
        ki2: { reference: "pp2" },
        kix: { reference: "ppx" },
        gg: { reference: "gg1" },
      },

      htft: {
        name: "Prelazi",
        hh: { reference: "1-1" },
        hx: { reference: "1-x" },
        ha: { reference: "1-2" },
        aa: { reference: "2-2" },
        ax: { reference: "2-x" },
        ah: { reference: "2-1" },
        xh: { reference: "x-1" },
        xx: { reference: "x-x" },
        xa: { reference: "x-2" },
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

    // Fetch both API responses in parallel
    const [soccerResponse, maxbetSearchResponse, mozzartResponse] =
      await Promise.all([
        request(soccerApi),
        request(maxbetSearch),
        request(mozzartSearch, {
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
        }),
      ]);

    const soccerJson = await soccerResponse.body.json();
    const maxbetJson = await maxbetSearchResponse.body.json();
    const mozzartJson = await mozzartResponse.body.json();

    if (maxbetJson.esMatches) {
      // here, we will try to find the exact game from the search list.
      const filteredGames = maxbetJson.esMatches.filter(
        (game) => game.kickOffTime === date
      );

      // if we found the game we are lookingg for, append its odds in the container.
      if (filteredGames.length > 0 && sport === "S") {
        const currentOdds = filteredGames[0].odds;
        console.log(currentOdds);

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
        odds["ki"]["awayAnd3Plus"]["maxBet"] = currentOdds["288"]; // fix
        odds["ki"]["awayAnd4Plus"]["maxBet"] = currentOdds["315"]; // fix
        odds["ki"]["awayAndGG"]["maxBet"] = currentOdds["366"];

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
        odds["awayGoals"]["over_0_5"]["maxBet"] = currentOdds["240"];
        odds["awayGoals"]["over_1_5"]["maxBet"] = currentOdds["250"];
        odds["awayGoals"]["over_2_5"]["maxBet"] = currentOdds["277"];

        odds["firstHalf"]["over_0_5"]["maxBet"] = currentOdds["207"];
        odds["firstHalf"]["over_1_5"]["maxBet"] = currentOdds["208"];
        odds["firstHalf"]["over_2_5"]["maxBet"] = currentOdds["209"];
        odds["firstHalf"]["homeOver_0_5"]["maxBet"] = currentOdds["307"];
        odds["firstHalf"]["homeOver_1_5"]["maxBet"] = currentOdds["274"];
        odds["firstHalf"]["awayOver_0_5"]["maxBet"] = currentOdds["308"];
        odds["firstHalf"]["awayOver_1_5"]["maxBet"] = currentOdds["275"];
        odds["firstHalf"]["ki1"]["maxBet"] = currentOdds["4"];
        odds["firstHalf"]["ki2"]["maxBet"] = currentOdds["6"];
        odds["firstHalf"]["kix"]["maxBet"] = currentOdds["5"];
        odds["firstHalf"]["gg"]["maxBet"] = currentOdds["291"];
        odds["firstHalf"]["first05Second15"]["maxBet"] = currentOdds["316"];
        odds["firstHalf"]["over_0_5_both"]["maxBet"] = currentOdds["363"];

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

        odds["awayGoals"]["over_0_5"]["soccerBet"] =
          soccerOdds["240"]?.NULL?.ov;
        odds["awayGoals"]["over_1_5"]["soccerBet"] =
          soccerOdds["250"]?.NULL?.ov;
        odds["awayGoals"]["over_2_5"]["soccerBet"] =
          soccerOdds["277"]?.NULL?.ov;

        odds["firstHalf"]["homeOver_0_5"]["soccerBet"] =
          soccerOdds["307"]?.NULL?.ov;
        odds["firstHalf"]["homeOver_1_5"]["soccerBet"] =
          soccerOdds["274"]?.NULL?.ov;
        odds["firstHalf"]["awayOver_0_5"]["soccerBet"] =
          soccerOdds["308"]?.NULL?.ov;
        odds["firstHalf"]["awayOver_1_5"]["soccerBet"] =
          soccerOdds["275"]?.NULL?.ov;
        odds["firstHalf"]["ki1"]["soccerBet"] = soccerOdds["4"]?.NULL?.ov;
        odds["firstHalf"]["kix"]["soccerBet"] = soccerOdds["5"]?.NULL?.ov;
        odds["firstHalf"]["ki2"]["soccerBet"] = soccerOdds["6"]?.NULL?.ov;
        odds["firstHalf"]["gg"]["soccerBet"] = soccerOdds["291"]?.NULL?.ov;
        odds["firstHalf"]["over_0_5_both"]["soccerBet"] =
          soccerOdds["363"]?.NULL?.ov;
        odds["firstHalf"]["first05Second15"]["soccerBet"] =
          soccerOdds["316"]?.NULL?.ov;

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
     

        if (mOdds && mOdds.length > 0 && sport === "S") {
          odds["ki"]["1"]["mozzartBet"] = mOdds[0].value;
          odds["ki"]["x"]["mozzartBet"] = mOdds[1].value;
          odds["ki"]["2"]["mozzartBet"] = mOdds[2].value;

          odds["ki"]["homeAnd3Plus"]["mozzartBet"] = mOdds[301].value;
          odds["ki"]["homeAnd4Plus"]["mozzartBet"] = mOdds[312].value;

          odds["ki"]["doubleChance_1X"]["mozzartBet"] = mOdds[3].value;
          odds["ki"]["doubleChance_12"]["mozzartBet"] = mOdds[4].value;
          odds["ki"]["doubleChance_X2"]["mozzartBet"] = mOdds[5].value;
          odds["ki"]["awayAnd3Plus"]["mozzartBet"] = mOdds[302].value;
          odds["ki"]["awayAnd4Plus"]["mozzartBet"] = mOdds[313].value;
          odds["ki"]["awayAndGG"]["mozzartBet"] = mOdds[319].value;

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
          odds["awayGoals"]["over_0_5"]["mozzartBet"] = mOdds[268].value;
          odds["awayGoals"]["over_1_5"]["mozzartBet"] = mOdds[269].value;
          odds["awayGoals"]["over_2_5"]["mozzartBet"] = mOdds[275].value;

          odds["firstHalf"]["over_0_5_both"]["mozzartBet"] = mOdds[317].value;
          odds["firstHalf"]["first05Second15"]["mozzartBet"] = mOdds[315].value;
          odds["firstHalf"]["awayOver_0_5"]["mozzartBet"] = mOdds[216].value;
          odds["firstHalf"]["awayOver_1_5"]["mozzartBet"] = mOdds[217].value;
          odds["firstHalf"]["gg"]["mozzartBet"] = mOdds[226].value;
          odds["firstHalf"]["homeOver_0_5"]["mozzartBet"] = mOdds[209].value;
          odds["firstHalf"]["homeOver_1_5"]["mozzartBet"] = mOdds[210].value;
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
server.listen(1337, () => console.log("Listening on port 1337."));
