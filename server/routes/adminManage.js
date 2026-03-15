const express       = require('express');
const router        = express.Router();
const MessageBundle = require('../models/MessageBundle');
const AppSettings   = require('../models/AppSettings');
const PrivateRoom   = require('../models/PrivateRoom');
const Message       = require('../models/Message');
const Admin         = require('../models/Admin');
const { adminProtect, requirePermission } = require('../middleware/adminAuth');

// ─── BUNDLES ──────────────────────────────────────────────────────────────────
router.get('/bundles', adminProtect, async (req, res) => {
  try {
    const bundles = await MessageBundle.find().populate('createdBy', 'username').sort('-createdAt');
    res.json({ success: true, bundles });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
});

router.post('/bundles', adminProtect, requirePermission('manageBundles'), async (req, res) => {
  try {
    const bundle = await MessageBundle.create({ ...req.body, createdBy: req.admin._id });
    res.status(201).json({ success: true, bundle, message: 'Bundle created!' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.put('/bundles/:id', adminProtect, requirePermission('manageBundles'), async (req, res) => {
  try {
    const bundle = await MessageBundle.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!bundle) return res.status(404).json({ success: false, message: 'Bundle not found' });
    res.json({ success: true, bundle, message: 'Bundle updated!' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.delete('/bundles/:id', adminProtect, requirePermission('manageBundles'), async (req, res) => {
  try {
    await MessageBundle.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Bundle deleted!' });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
});

// ─── SETTINGS ─────────────────────────────────────────────────────────────────
router.get('/settings', adminProtect, async (req, res) => {
  try {
    const settings = await AppSettings.find().sort('category');
    res.json({ success: true, settings });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
});

router.put('/settings', adminProtect, requirePermission('manageSettings'), async (req, res) => {
  try {
    const { settings } = req.body;
    const updates = await Promise.all(
      settings.map(s => AppSettings.findOneAndUpdate(
        { key: s.key },
        { value: s.value, updatedBy: req.admin._id, description: s.description, category: s.category },
        { new: true, upsert: true }
      ))
    );
    res.json({ success: true, settings: updates, message: 'Settings saved!' });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
});

// ─── MESSAGES ─────────────────────────────────────────────────────────────────
router.get('/messages', adminProtect, requirePermission('manageMessages'), async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 30;
    const room  = req.query.room || '';
    let query = {};
    if (room) query.room = room;
    const total    = await Message.countDocuments(query);
    const messages = await Message.find(query)
      .populate('sender', 'username avatar email')
      .sort('-createdAt').skip((page - 1) * limit).limit(limit);
    res.json({ success: true, messages, total, page, pages: Math.ceil(total / limit) });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
});

router.delete('/messages/:id', adminProtect, requirePermission('manageMessages'), async (req, res) => {
  try {
    await Message.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Message deleted!' });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
});

// ─── ROOMS ────────────────────────────────────────────────────────────────────
router.get('/rooms', adminProtect, async (req, res) => {
  try {
    const page   = parseInt(req.query.page)  || 1;
    const limit  = parseInt(req.query.limit) || 20;
    const filter = req.query.filter || 'all';
    let query = {};
    if (filter === 'paid')    query.isPaid  = true;
    if (filter === 'pending') query.status  = 'pending';
    if (filter === 'active')  query.status  = 'accepted';
    const total = await PrivateRoom.countDocuments(query);
    const rooms = await PrivateRoom.find(query)
      .populate('participants', 'username avatar email')
      .populate('requestedBy', 'username')
      .sort('-updatedAt').skip((page - 1) * limit).limit(limit);
    res.json({ success: true, rooms, total, page, pages: Math.ceil(total / limit) });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
});

// ─── ADMINS ───────────────────────────────────────────────────────────────────
router.get('/admins', adminProtect, requirePermission('manageAdmins'), async (req, res) => {
  try {
    const admins = await Admin.find().sort('-createdAt');
    res.json({ success: true, admins });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
});

router.post('/admins', adminProtect, requirePermission('manageAdmins'), async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    const existing = await Admin.findOne({ $or: [{ email }, { username }] });
    if (existing) return res.status(400).json({ success: false, message: 'Username or email already exists' });
    const perms = {
      manageUsers: true, manageMessages: true, managePromotions: true,
      manageBundles: true, viewAnalytics: true,
      manageSettings: role === 'superadmin',
      manageAdmins:   role === 'superadmin'
    };
    const admin = await Admin.create({ username, email, password, role, permissions: perms });
    res.status(201).json({ success: true, admin, message: 'Admin created!' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.post('/admins/:id/toggle', adminProtect, requirePermission('manageAdmins'), async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id);
    if (!admin) return res.status(404).json({ success: false, message: 'Not found' });
    admin.isActive = !admin.isActive;
    await admin.save();
    res.json({ success: true, admin, message: `Admin ${admin.isActive ? 'activated' : 'deactivated'}` });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
});

module.exports = router;