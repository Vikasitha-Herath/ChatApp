const express     = require('express');
const router      = express.Router();
const User        = require('../models/User');
const Message     = require('../models/Message');
const PrivateRoom = require('../models/PrivateRoom');
const { adminProtect, requirePermission } = require('../middleware/adminAuth');

router.get('/', adminProtect, requirePermission('manageUsers'), async (req, res) => {
  try {
    const page   = parseInt(req.query.page)  || 1;
    const limit  = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';
    const filter = req.query.filter || 'all';
    const sort   = req.query.sort   || '-createdAt';
    let query = {};
    if (search) query.$or = [{ username: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];
    if (filter === 'online')  query.isOnline = true;
    if (filter === 'offline') query.isOnline = false;
    if (filter === 'banned')  query.isBanned = true;
    const total = await User.countDocuments(query);
    const users = await User.find(query).sort(sort).skip((page - 1) * limit).limit(limit);
    res.json({ success: true, users, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/:id', adminProtect, requirePermission('manageUsers'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const [messageCount, roomCount, paidRooms] = await Promise.all([
      Message.countDocuments({ sender: user._id }),
      PrivateRoom.countDocuments({ participants: user._id, status: 'accepted' }),
      PrivateRoom.countDocuments({ participants: user._id, isPaid: true })
    ]);
    const recentMessages = await Message.find({ sender: user._id }).sort('-createdAt').limit(10);
    res.json({ success: true, user, stats: { messageCount, roomCount, paidRooms }, recentMessages });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.put('/:id', adminProtect, requirePermission('manageUsers'), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user, message: 'User updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:id', adminProtect, requirePermission('manageUsers'), async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    await Message.deleteMany({ sender: req.params.id });
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/:id/ban', adminProtect, requirePermission('manageUsers'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.isBanned = !user.isBanned;
    await user.save();
    res.json({ success: true, message: `User ${user.isBanned ? 'banned' : 'unbanned'}`, user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;