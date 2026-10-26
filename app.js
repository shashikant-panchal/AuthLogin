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
      // Redirect through https://sakshampro.co.in to reset the session and fire the deep link
      const redirectUrl =
        "https://sakshampro.co.in/?q=H7KLMILKVhfdjDt6AzjkRyYgMtD%2bOzVApjpSnw4m7NLHjIOgyvWybI0tOLjaZFIUqZdxQG1DKnVE4OFCMyPRBB7kTkXFYMzAn9x%2fhHAMkX4tfVpAod9i33CyCP67McVBSNo%2fXVmfxws0iY%2faMiAgjQ%3d%3d";

      // Inline page: set sessionStorage, reload once, then redirect
      return res.send(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Redirecting...</title>
</head>
<body>
<script>
  var KEY = "sessionId"; // change to the key your app reads
  var VALUE = "5082915";
  var redirectUrl = ${JSON.stringify(redirectUrl)};

  if (sessionStorage.getItem(KEY) !== VALUE) {
    sessionStorage.setItem(KEY, VALUE);
    location.reload();
  } else {
    location.replace(redirectUrl);
  }
</script>
</body>
</html>`);
    } else if (deviceType === "web") {
      res.redirect(`/user?q=${userId}`);
    } else {
      res.status(400).send("Invalid device type");
    }
  } else {
    res.status(400).send("Device type is required");
  }
});

app.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { q } = req.query;
    const user = await User.findOne({ userId });

    if (!user) {
      return res.status(404).send("User not found");
    }

    res.render("user", { userId, q });
  } catch (error) {
    res.status(500).send("Server Error");
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
