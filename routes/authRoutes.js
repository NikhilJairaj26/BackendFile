const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

// Register a new user
router.post('/register', async (req, res) => {
  const { email, password } = req.body;

  try {
    console.log('Register request received:', { email }); // Debug log

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('User already exists:', email); // Debug log
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create a new user
    const user = new User({ email, password });
    await user.save();
    console.log('User created:', user); // Debug log

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    res.status(201).json({ token, user: { email: user.email } });
  } catch (error) {
    console.error('Register error:', error); // Debug log
    res.status(500).json({ message: 'Something went wrong' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    console.log('Login request received:', { email }); // Debug log

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found:', email); // Debug log
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Compare passwords
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log('Invalid password for user:', email); // Debug log
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    res.status(200).json({ token, user: { email: user.email } });
  } catch (error) {
    console.error('Login error:', error); // Debug log
    res.status(500).json({ message: 'Something went wrong' });
  }
});

module.exports = router;