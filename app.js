const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const path = require("path");
require("dotenv").config();

const app = express();

// Middlewares
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.log("Error connecting to MongoDB:", err));

// Define the User schema
const userSchema = new mongoose.Schema({
  userId: String,
});

const User = mongoose.model("User", userSchema);

// Routes
app.get("/", (req, res) => {
  // Just render the index page with no userId
  res.render("index");
});

app.post("/submit", async (req, res) => {
  const userId = req.body.userId;

  // Save to MongoDB
  const newUser = new User({ userId });
  await newUser.save();

  // Redirect to the authorize page with userId in query parameter
  res.redirect(`/authorize/${userId}`);
});

// Serve .well-known folder
app.use("/.well-known", express.static(path.join(__dirname, ".well-known")));

// Authorize Route (shows the Authorize button)
app.get("/authorize/:userId", async (req, res) => {
  const { userId } = req.params;

  // Render the authorize page with the userId
  res.render("authorize", { userId });
});

app.get("/user", (req, res) => {
  const userId = req.query.q; // Extracting `q` query parameter from the URL
  res.render("user", { q: userId }); // Passing `q` to the view as a variable
});

// Redirect back to user.ejs with userId as query parameter
// app.get("/authorize/redirect/:userId", (req, res) => {
//   const { userId } = req.params;
//   res.redirect(`/user/?q=${userId}`);
// });

// app.get("/authorize/redirect/:userId", (req, res) => {
//   const { userId } = req.params;

//   res.send(`
//     <html>
//       <head>
//         <script>
//           // Send success message back to In-App Browser and close it
//           setTimeout(() => {
//             if (window.ReactNativeWebView) {
//               window.ReactNativeWebView.postMessage("SUCCESS");
//             } else {
//               window.location.href = "/user/?q=${userId}";
//             }
//           }, 1500); // 1.5 sec delay for better UX
//         </script>
//       </head>
//       <body>
//         <h2>Authorization Successful</h2>
//         <p>You are being redirected...</p>
//       </body>
//     </html>
//   `);
// });

app.get("/authorize/redirect/:userId", (req, res) => {
  const { userId } = req.params;

  // Ensure redirectUri is correctly defined in frontend
  const redirectUri = "myapp://success"; // Use your deep link scheme

  // Redirect to deep link
  res.redirect(`${redirectUri}?q=${userId}`);
});

// Final User Page after Authorization (show userId and login confirmation)
app.get("/user/:userId", async (req, res) => {
  const { userId } = req.params;
  const { q } = req.query;

  // Query the user from the database
  const user = await User.findOne({ userId });

  if (!user) {
    return res.status(404).send("User not found");
  }

  // Render the user page with the userId and login confirmation
  res.render("user", { userId, q });
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
