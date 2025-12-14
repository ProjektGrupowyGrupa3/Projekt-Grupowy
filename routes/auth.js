const jwt = require('jsonwebtoken');
const User = require('../models/User.js');
const express = require('express');
const router = express.Router();
const bcrypt = require("bcryptjs");
const crypto = require('crypto');
const ResetToken = require('../models/ResetToken');
const nodemailer = require('nodemailer');



// @route   POST /api/auth/register
// @desc    Register a new user
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;

    // Check all fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Please fill all fields" });
    }
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message: "Password must be at least 8 characters long and include at least one letter and one number."
      });
    }
    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Create user
    const user = await User.create({ name, email, password });

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Respond with token + user data
    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      },
      token
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   POST /api/auth/login
// @desc    Login a user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      message: 'Login successful',
      user: { id: user._id, name: user.name, email: user.email },
      token,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      host:"pgpaigrupa@gmail.com",
      port:587,
      secure:false,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
      }
    });
    const { email } = req.body;

    if (!email) 
      return res.status(400).json({ message: "Email required" });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ message: "User with this email not found" });

    // Create secure reset token
    const token = crypto.randomBytes(32).toString("hex");

    // Remove old tokens for this user
    await ResetToken.deleteMany({ userId: user._id });

    // Save new token
    const newToken = await ResetToken.create({
      userId: user._id,
      email,
      token,
    });

    // Build reset URL
    const resetUrl = `${process.env.APP_URL || "http://localhost:3000"}/set-password/${newToken._id}`;

    // Send email
    await transporter.sendMail({
      from: `"Support" <${process.env.MAIL_USER}>`,
      to: email,
      subject: "Password Reset Request",
      html: `
        <h3>Reset Your Password</h3>
        <p>You requested to reset your password. Click the link below:</p>
        <a href="${resetUrl}" target="_blank">${resetUrl}</a>
        <p>This link is valid for <b>1 hour</b>.</p>
      `
    });

    return res.json({
      message: "Password reset email sent. Check your inbox."
    });

  } catch (err) {
    console.error("Reset Password Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// POST /api/auth/reset-password-confirm

router.post("/reset-password-confirm", async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        message: "Password must be at least 8 characters long and include at least one letter and one number."
      });
    }
    if (!token || !newPassword) {
      return res.status(400).json({ message: "Missing token or new password" });
    }

    const resetEntry = await ResetToken.findById(token);

    if (!resetEntry) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    const user = await User.findById(resetEntry.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.password = newPassword;
    await user.save();

    await ResetToken.findByIdAndDelete(token);

    return res.json({ message: "Password successfully updated" });

  } catch (err) {
    console.error("Reset password confirm error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


module.exports = router;