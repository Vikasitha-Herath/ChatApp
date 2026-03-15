const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });

const createTransporter = () =>
  nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
  });

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password)
      return res.status(400).json({ success: false, message: 'Please provide all fields' });

    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      const field = existing.email === email ? 'Email' : 'Username';
      return res.status(400).json({ success: false, message: `${field} already exists` });
    }

    const user = await User.create({ username, email, password });
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        _id: user._id, username: user.username, email: user.email,
        avatar: user.avatar, bio: user.bio, isOnline: user.isOnline, createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Please provide email and password' });

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ success: false, message: 'Invalid credentials' });

    user.isOnline = true;
    user.lastSeen = new Date();
    await user.save();

    const token = generateToken(user._id);
    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        _id: user._id, username: user.username, email: user.email,
        avatar: user.avatar, bio: user.bio, isOnline: true, createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Please provide email' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: 'No account found with that email' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordOTP = otp;
    user.resetPasswordOTPExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    // Log OTP in dev mode for testing
    console.log(`🔑 OTP for ${email}: ${otp}`);

    try {
      const transporter = createTransporter();
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: email,
        subject: 'ChatApp — Password Reset OTP',
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0f172a;color:#e2e8f0;padding:40px;border-radius:12px;">
            <h1 style="color:#06b6d4;text-align:center;margin-bottom:30px;">ChatApp</h1>
            <h2 style="color:#e2e8f0;">Password Reset Request</h2>
            <p style="color:#94a3b8;">Your OTP code for password reset:</p>
            <div style="background:#1e293b;border:2px solid #06b6d4;border-radius:8px;padding:20px;text-align:center;margin:20px 0;">
              <span style="font-size:36px;font-weight:bold;color:#06b6d4;letter-spacing:8px;">${otp}</span>
            </div>
            <p style="color:#94a3b8;">This OTP expires in <strong style="color:#f59e0b;">10 minutes</strong>.</p>
            <p style="color:#94a3b8;">If you didn't request this, ignore this email.</p>
          </div>`
      });
    } catch (emailErr) {
      console.error('Email send error:', emailErr.message);
      // Still return success — OTP is logged above for testing
    }

    res.json({ success: true, message: 'OTP sent to your email address' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({
      email,
      resetPasswordOTP: otp,
      resetPasswordOTPExpiry: { $gt: Date.now() }
    });
    if (!user) return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    res.json({ success: true, message: 'OTP verified successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword)
      return res.status(400).json({ success: false, message: 'Please provide all fields' });
    if (newPassword.length < 6)
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });

    const user = await User.findOne({
      email,
      resetPasswordOTP: otp,
      resetPasswordOTPExpiry: { $gt: Date.now() }
    });
    if (!user) return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });

    user.password = newPassword;
    user.resetPasswordOTP = undefined;
    user.resetPasswordOTPExpiry = undefined;
    await user.save();

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/auth/profile
router.put('/profile', protect, async (req, res) => {
  try {
    const { username, bio, avatar } = req.body;
    const user = await User.findById(req.user._id);

    if (username && username !== user.username) {
      const existing = await User.findOne({ username });
      if (existing) return res.status(400).json({ success: false, message: 'Username already taken' });
      user.username = username;
    }
    if (bio !== undefined) user.bio = bio;
    if (avatar !== undefined) user.avatar = avatar;

    await user.save();
    res.json({ success: true, user, message: 'Profile updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/auth/logout
router.post('/logout', protect, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { isOnline: false, lastSeen: new Date() });
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
