const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const path = require("path");
require("dotenv").config();

const app = express();

// Middleware & View Engine Configuration
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use("/.well-known", express.static(path.join(__dirname, ".well-known")));

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// Database Connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.log("Error connecting to MongoDB:", err));

const userSchema = new mongoose.Schema({
  userId: String,
});

const User = mongoose.model("User", userSchema);

// Token that is passed back to the app (same q value used in the sakshampro.co.in URL)
const MOBILE_TOKEN =
  "H7KLMILKVhfdjDt6AzjkRyYgMtD%2bOzVApjpSnw4m7NLHjIOgyvWybI0tOLjaZFIUqZdxQG1DKnVE4OFCMyPRBB7kTkXFYMzAn9x%2fhHAMkX4tfVpAod9i33CyCP67McVBSNo%2fXVmfxws0iY%2faMiAgjQ%3d%3d";

// Routes
app.get("/", (req, res) => {
  res.render("index");
});

app.post("/submit", async (req, res) => {
  const userId =
    "FObVkPNGj1xjeiXFhKBCKn1TUjbdfzmNsO%2b4tH7q6Ko6NmO5kwpfZp9Tj2dw2Td2C68js0K2d2eqy%2fDxzPB7FCZ3aPABBd%2f74wku03lKWpUIxN6uAcduqbZrkLmIrDXWKshkyIeif0HcnL20dDR%2fRA%3d%3d";
  res.redirect(`/authorize/${userId}`);
});

app.get("/authorize/:userId", async (req, res) => {
  const userId = req.params.userId;
  const { deviceType } = req.query;

  if (deviceType) {
    // if (deviceType === "mobile") {
    //   res.redirect(`saksham://success?q=${userId}`);
    // }
    // if (deviceType === "mobile") {
    //   res.redirect('saksham://success?q=H7KLMILKVhfdjDt6AzjkRyYgMtD%2bOzVApjpSnw4m7NLHjIOgyvWybI0tOLjaZFIUqZdxQG1DKnVE40FCMyPRBB7kTkXFYMzAn9x%2fhHAMkX4tfVpAod9i33CyCP67McVBSNo%2fXVmfxws0iY%2faMiAgjQ%3d%3d?deviceType=mobile');
    // }
    if (deviceType === "mobile") {
      // Redirect to our own page, which opens the app via saksham://success
      return res.redirect(`/open-app?q=${MOBILE_TOKEN}`);
    } else if (deviceType === "web") {
      // Fixed: now matches the /user/:userId route
      res.redirect(
        `/user/${encodeURIComponent(userId)}?q=${encodeURIComponent(userId)}`
      );
    } else {
      res.status(400).send("Invalid device type");
    }
  } else {
    res.status(400).send("Device type is required");
  }
});

// Page that sends the user back to the app using its custom scheme
app.get("/open-app", (req, res) => {
  res.send(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Opening app...</title>
</head>
<body>
  <p>Opening the app...</p>
  <a id="open" href="#">Tap here if the app doesn't open</a>
  <script>
    var q = new URLSearchParams(location.search).get("q") || "";
    var link = "saksham://success?q=" + encodeURIComponent(q);
    document.getElementById("open").href = link;
    window.location.href = link;
  </script>
</body>
</html>`);
});

app.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { q } = req.query;

    // Find the user, or create it if it doesn't exist (never returns "User not found")
    await User.findOneAndUpdate(
      { userId },
      { $setOnInsert: { userId } },
      { upsert: true, new: true }
    );

    res.render("user", { userId, q });
  } catch (error) {
    console.log("Error in /user route:", error);
    res.status(500).send("Server Error");
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
