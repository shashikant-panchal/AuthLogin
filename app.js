const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const path = require("path");
require("dotenv").config();

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.log("Error connecting to MongoDB:", err));

const userSchema = new mongoose.Schema({
  userId: String,
});

const User = mongoose.model("User", userSchema);

app.get("/", (req, res) => {
  res.render("index");
});

app.post("/submit", async (req, res) => {
  const userId = req.body.userId;

  const newUser = new User({ userId });
  await newUser.save();

  res.redirect(`/authorize/${userId}`);
});

app.use("/.well-known", express.static(path.join(__dirname, ".well-known")));

app.get("/authorize/:userId", async (req, res) => {
  const { userId } = req.params;

  res.render("authorize", { userId });
});

app.get("/user", (req, res) => {
  const userId = req.query.q;
  res.render("user", { q: userId });
});

app.get("/authorize/redirect/:userId", (req, res) => {
  const { userId } = req.params;
  const redirectUri = "myapp://success";
  res.redirect(`${redirectUri}?q=${userId}`);
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
