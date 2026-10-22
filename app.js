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

// Simplified schema without failure or session window tracking
const userSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
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
  const { userId } = req.params;
  const { deviceType } = req.query;

  if (!deviceType) {
    return res.status(400).send("Device type is required");
  }

  if (deviceType === "web") {
    return res.redirect(`/user?q=${userId}`);
  }

  if (deviceType === "mobile") {
    try {
      // Upsert the user to ensure the record exists without failure state checks
      await User.findOneAndUpdate(
        { userId },
        { $setOnInsert: { userId } },
        { upsert: true, new: true }
      );

      // Direct success redirect
      return res.redirect(`saksham://success?q=${userId}`);
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

  try {
    const user = await User.findOne({ userId });

    if (!user) {
      return res.status(404).send("User not found");
    }

    res.render("user", { userId, q });
  } catch (err) {
    console.error("User lookup error:", err);
    res.status(500).send("Internal Server Error");
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
