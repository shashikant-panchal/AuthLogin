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
  const userId =
    "FObVkPNGj1xjeiXFhKBCKn1TUjbdfzmNsO%2b4tH7q6Ko6NmO5kwpfZp9Tj2dw2Td2C68js0K2d2eqy%2fDxzPB7FCZ3aPABBd%2f74wku03lKWpUIxN6uAcduqbZrkLmIrDXWKshkyIeif0HcnL20dDR%2fRA%3d%3d";

  res.redirect(`/authorize/${userId}`);
});

app.use("/.well-known", express.static(path.join(__dirname, ".well-known")));

app.get("/authorize/:userId", async (req, res) => {
  const userId = req.params.userId;
  const { deviceType } = req.query;
  console.log("Received deviceType:", deviceType);
  console.log("Received userId:", userId);

  if (deviceType) {
    if (deviceType === "mobile") {
      res.redirect(`saksham://success?q=${userId}`);
    } else if (deviceType === "web") {
      res.redirect(`/user?q=${userId}`);
    } else {
      res.status(400).send("Invalid device type");
    }
  } else {
    res.status(400).send("Device type is required");
  }
});

app.get("/authorize/redirect/:userId", (req, res) => {
  const userId =
    "FObVkPNGj1xjeiXFhKBCKn1TUjbdfzmNsO%2b4tH7q6Ko6NmO5kwpfZp9Tj2dw2Td2C68js0K2d2eqy%2fDxzPB7FCZ3aPABBd%2f74wku03lKWpUIxN6uAcduqbZrkLmIrDXWKshkyIeif0HcnL20dDR%2fRA%3d%3d";
  const redirectUriMobile = "saksham://success";
  const redirectUriWeb = "/user";
  const userAgent = req.headers["user-agent"];
  const isMobile = /android|iphone|ipad|ipod/i.test(userAgent);

  if (isMobile) {
    res.redirect(`${redirectUriMobile}?q=${userId}`);
  } else {
    res.redirect(`${redirectUriWeb}?q=${userId}`);
  }
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
