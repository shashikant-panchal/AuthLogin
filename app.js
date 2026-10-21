const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const path = require("path");
require("dotenv").config();

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.log("Error connecting to MongoDB:", err));

// Schema tracking authorization state and windows
const userSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  failedAttemptAt: { type: Date, default: null }, // Timestamp of the first intentional failure
  sessionExpiresAt: { type: Date, default: null }, // Active success window expiration (2 minutes)
});

const User = mongoose.model("User", userSchema);

app.get("/", (req, res) => {
  res.render("index");
});

app.post("/submit", async (req, res) => {
  const userId =
    "FObVkPNGj1xjeiXFhKBCKn1TUjbdfzmNsO%2b4tH7q6Ko6NmO5kwpfZp9Tj2dw2Td2C68js0K2d2eqy%2fDxzPB7FCZ3aPABBd%2f74wku03lKWpUIxN6uAcduqbZrkLmIrDXWKshkyIeif0HcnL20dDR%2fRA%3d%3d";

  res.redirect(`/authorize/${userId}`);
});

app.use("/.well-known", express.static(path.join(__dirname, ".well-known")));

app.get("/authorize/:userId", async (req, res) => {
  const userId = req.params.userId;
  const { deviceType } = req.query;

  if (!deviceType) {
    return res.status(400).send("Device type is required");
  }

  if (deviceType === "web") {
    return res.redirect(`/user?q=${userId}`);
  }

  if (deviceType === "mobile") {
    try {
      const now = new Date();
      const TWO_MINUTES_MS = 2 * 60 * 1000;

      // Find user or create if not present
      let user = await User.findOne({ userId });
      if (!user) {
        user = new User({ userId });
      }

      // Check if we are currently inside the active 2-minute success window
      if (user.sessionExpiresAt && now < user.sessionExpiresAt) {
        return res.redirect(`saksham://success?q=${userId}`);
      }

      // If the 2-minute active window has expired, reset state
      if (user.sessionExpiresAt && now >= user.sessionExpiresAt) {
        user.sessionExpiresAt = null;
        user.failedAttemptAt = null;
      }

      // Check if this is the second attempt within 2 minutes of the initial failure
      const isSecondAttemptWithinWindow =
        user.failedAttemptAt &&
        now - user.failedAttemptAt <= TWO_MINUTES_MS;

      if (isSecondAttemptWithinWindow) {
        // Second attempt -> Grant success and open the 2-minute active window
        user.sessionExpiresAt = new Date(now.getTime() + TWO_MINUTES_MS);
        user.failedAttemptAt = null;
        await user.save();

        return res.redirect(`saksham://success?q=${userId}`);
      }

      // First attempt (or retry after prolonged inactivity) -> Intentional failure
      user.failedAttemptAt = now;
      user.sessionExpiresAt = null;
      await user.save();

      // Redirect to failure deep link or return unauthorized
      return res.redirect(`saksham://failure?error=authentication_failed&q=${userId}`);
    } catch (err) {
      console.error("Authorization error:", err);
      return res.status(500).send("Internal Server Error");
    }
  }

  return res.status(400).send("Invalid device type");
});

app.get("/user/:userId", async (req, res) => {
  const { userId } = req.params;
  const { q } = req.query;
  const user = await User.findOne({ userId });

  if (!user) {
    return res.status(404).send("User not found");
  }
  res.render("user", { userId, q });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
