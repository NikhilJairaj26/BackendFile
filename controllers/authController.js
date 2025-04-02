require("dotenv").config();
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { body, validationResult } = require("express-validator");

// ✅ Generate Tokens
const generateAccessToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET ,{ expiresIn: "1h" }); // Use JWT_SECRET from env

const generateRefreshToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: "7d" });

// ✅ Input Validation Middleware
exports.validateUserInput = (method) => {
  const rules = {
    register: [
      body("name").trim().notEmpty().withMessage("Name is required"),
      body("email").isEmail().withMessage("Invalid email format"),
      body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
      body("repassword").custom((value, { req }) => value === req.body.password)
        .withMessage("Passwords do not match"),
    ],
    login: [
      body("email").isEmail().withMessage("Invalid email format"),
      body("password").notEmpty().withMessage("Password is required"),
    ],
  };
  return rules[method] || [];
};

// 🔐 Login User
exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

  const { email, password } = req.body;
  const user = await User.findOne({ email }).select("+password");
  if (!user) return res.status(404).json({ error: "User not found" });

  const isPasswordValid = await bcrypt.compare(password, user.password);
console.log("Password Match:", isPasswordValid);
  console.log("Entered password:", password);
  console.log("Stored password:", user ? user.password : "Not found");
  if (!isPasswordValid) return res.status(401).json({ error: "Invalid credentials" }); // Re-enabled password check
  
  const accessToken = generateAccessToken(user._id);
  // const refreshToken = generateRefreshToken(user.email);

  // res.cookie("refreshToken", refreshToken, {
  //   httpOnly: true,
  //   secure: process.env.NODE_ENV === "production",
  //   sameSite: "Strict",
  // });

  res.json({ user: { id: user._id, name: user.name, email: user.email }, token: accessToken });
};

// 📝 Register User
exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

  const { name, email, password } = req.body;
  if (await User.findOne({ email })) return res.status(400).json({ error: "Email already in use" });

  // Let the User model's pre-save hook handle hashing
  const newUser = new User({ name, email, password }); // Pass the plain password
  await newUser.save();

  res.status(201).json({ message: "Registration successful! Please log in." });
};

// 🔄 Get Authenticated User
exports.getAuthenticatedUser = async (req, res) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "No token provided" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({ user });
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
};

// 🔄 Refresh Token
exports.refreshToken = (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) return res.status(403).json({ error: "No refresh token provided" });

  jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: "Invalid refresh token" });

    const newAccessToken = generateAccessToken(decoded.userId);
    res.json({ accessToken: newAccessToken });
  });
};

// 🚪 Logout User
exports.logout = (req, res) => {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
  });
  res.json({ message: "Logged out successfully" });
};
