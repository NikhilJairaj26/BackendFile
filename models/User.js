const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      minlength: [3, "Name must be at least 3 characters"],
      trim: true, // Removes unnecessary spaces
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      sparse: true, // Allows unique constraint while ignoring empty values
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"], // Ensures valid emails only
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // Prevents password from being returned in queries
    },
  },
  { timestamps: true }
);

// 🔒 Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(12); // Increased salt rounds for better security
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// 🔐 Compare passwords securely
userSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// 🔑 Generate JWT Token
userSchema.methods.generateAuthToken = function () {
  return jwt.sign(
    { userId: this._id, email: this.email },
    process.env.JWT_SECRET || "fallback_secret", // Uses a secret key from .env
    { expiresIn: "7d" } // Token expires in 7 days
  );
};

// 🚀 Prevent duplicate email registration
userSchema.pre("save", async function (next) {
  if (!this.isModified("email")) return next();

  const existingUser = await mongoose.models.User.findOne({ email: this.email });
  if (existingUser) {
    const error = new Error("⚠️ Email already registered.");
    return next(error);
  }

  next();
});

const User = mongoose.model("User", userSchema);
module.exports = User;
