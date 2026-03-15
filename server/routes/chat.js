const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const PrivateRoom = require('../models/PrivateRoom');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// GET /api/chat/general/messages
router.get('/general/messages', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const messages = await Message.find({ room: 'general' })
      .populate('sender', 'username avatar isOnline')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({ success: true, messages: messages.reverse(), page, hasMore: messages.length === limit });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/chat/private/rooms
router.get('/private/rooms', protect, async (req, res) => {
  try {
    const rooms = await PrivateRoom.find({
      participants: req.user._id,
      status: { $in: ['accepted', 'pending'] }
    })
      .populate('participants', 'username avatar isOnline lastSeen')
      .populate('requestedBy', 'username avatar')
      .sort({ updatedAt: -1 });

    res.json({ success: true, rooms });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/chat/private/request
router.post('/private/request', protect, async (req, res) => {
  try {
    const { targetUserId } = req.body;
    if (targetUserId === req.user._id.toString())
      return res.status(400).json({ success: false, message: 'Cannot start chat with yourself' });

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) return res.status(404).json({ success: false, message: 'User not found' });

    const roomId = PrivateRoom.generateRoomId(req.user._id, targetUserId);
    let room = await PrivateRoom.findOne({ roomId });

    if (room) {
      if (room.status === 'accepted')
        return res.status(400).json({ success: false, message: 'Chat room already exists' });
      if (room.status === 'pending')
        return res.status(400).json({ success: false, message: 'Chat request already sent' });
      if (room.status === 'rejected') {
        room.status = 'pending';
        room.requestedBy = req.user._id;
        await room.save();
      }
    } else {
      room = await PrivateRoom.create({
        participants: [req.user._id, targetUserId],
        roomId,
        requestedBy: req.user._id,
        status: 'pending'
      });
    }

    await room.populate('participants', 'username avatar isOnline');
    await room.populate('requestedBy', 'username avatar');

    res.json({ success: true, room, message: 'Chat request sent' });
  } catch (error) {
    console.error('Chat request error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/chat/private/respond
router.put('/private/respond', protect, async (req, res) => {
  try {
    const { roomId, action } = req.body;
    const room = await PrivateRoom.findOne({ roomId });
    if (!room) return res.status(404).json({ success: false, message: 'Chat room not found' });

    const participantIds = room.participants.map(p => p.toString());
    if (!participantIds.includes(req.user._id.toString()))
      return res.status(403).json({ success: false, message: 'Not authorized' });

    if (room.requestedBy.toString() === req.user._id.toString())
      return res.status(400).json({ success: false, message: 'Cannot respond to your own request' });

    room.status = action === 'accept' ? 'accepted' : 'rejected';
    await room.save();
    await room.populate('participants', 'username avatar isOnline');

    res.json({ success: true, room, message: `Chat request ${action}ed` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/chat/private/:roomId/messages
router.get('/private/:roomId/messages', protect, async (req, res) => {
  try {
    const { roomId } = req.params;
    const room = await PrivateRoom.findOne({ roomId });
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });

    const participantIds = room.participants.map(p => p.toString());
    if (!participantIds.includes(req.user._id.toString()))
      return res.status(403).json({ success: false, message: 'Not authorized' });

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const messages = await Message.find({ room: roomId })
      .populate('sender', 'username avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({ success: true, messages: messages.reverse(), room, hasMore: messages.length === limit });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/chat/private/:roomId/status
router.get('/private/:roomId/status', protect, async (req, res) => {
  try {
    const room = await PrivateRoom.findOne({ roomId: req.params.roomId });
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });

    const FREE_LIMIT = parseInt(process.env.FREE_MESSAGE_LIMIT) || 3;
    res.json({
      success: true,
      messageCount: room.messageCount,
      isPaid: room.isPaid,
      freeLimit: FREE_LIMIT,
      canSendFree: room.messageCount < FREE_LIMIT,
      remainingFree: Math.max(0, FREE_LIMIT - room.messageCount)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/chat/users/online
router.get('/users/online', protect, async (req, res) => {
  try {
    const users = await User.find({ isOnline: true, _id: { $ne: req.user._id } })
      .select('username avatar isOnline lastSeen bio');
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
