const express = require('express');
const router  = express.Router();
const jwt     = require('jsonwebtoken');
const Admin   = require('../models/Admin');
const { adminProtect } = require('../middleware/adminAuth');

const generateAdminToken = (id) =>
  jwt.sign({ id, type: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1d' });

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    const admin = await Admin.findOne({ email }).select('+password');
    if (!admin || !(await admin.comparePassword(password)))
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    if (!admin.isActive)
      return res.status(401).json({ success: false, message: 'Account is deactivated' });
    admin.lastLogin = new Date();
    await admin.save();
    const token = generateAdminToken(admin._id);
    res.json({ success: true, token, admin });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/me', adminProtect, async (req, res) => {
  res.json({ success: true, admin: req.admin });
});

router.post('/setup', async (req, res) => {
  try {
    const count = await Admin.countDocuments();
    if (count > 0)
      return res.status(400).json({ success: false, message: 'Admin already exists. Use login.' });
    const { username, email, password } = req.body;
    if (!username || !email || !password)
      return res.status(400).json({ success: false, message: 'Please provide all fields' });
    const admin = await Admin.create({
      username, email, password, role: 'superadmin',
      permissions: {
        manageUsers: true, manageMessages: true, managePromotions: true,
        manageBundles: true, viewAnalytics: true, manageSettings: true, manageAdmins: true
      }
    });
    const token = generateAdminToken(admin._id);
    res.status(201).json({ success: true, message: 'Superadmin created!', token, admin });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;