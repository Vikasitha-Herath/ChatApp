const express     = require('express');
const router      = express.Router();
const User        = require('../models/User');
const Message     = require('../models/Message');
const PrivateRoom = require('../models/PrivateRoom');
const { adminProtect } = require('../middleware/adminAuth');

router.get('/', adminProtect, async (req, res) => {
  try {
    const now   = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const week  = new Date(today); week.setDate(week.getDate() - 7);
    const month = new Date(today); month.setMonth(month.getMonth() - 1);

    const [
      totalUsers, newUsersToday, newUsersWeek, newUsersMonth, onlineUsers,
      totalMessages, messagesToday, messagesWeek,
      totalRooms, paidRooms, pendingRooms, totalRevenue
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: today } }),
      User.countDocuments({ createdAt: { $gte: week } }),
      User.countDocuments({ createdAt: { $gte: month } }),
      User.countDocuments({ isOnline: true }),
      Message.countDocuments(),
      Message.countDocuments({ createdAt: { $gte: today } }),
      Message.countDocuments({ createdAt: { $gte: week } }),
      PrivateRoom.countDocuments({ status: 'accepted' }),
      PrivateRoom.countDocuments({ isPaid: true }),
      PrivateRoom.countDocuments({ status: 'pending' }),
      PrivateRoom.aggregate([
        { $match: { isPaid: true } },
        { $group: { _id: null, total: { $sum: '$paymentInfo.amount' } } }
      ])
    ]);

    const [signupChart, messageChart, revenueChart] = await Promise.all([
      User.aggregate([
        { $match: { createdAt: { $gte: week } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]),
      Message.aggregate([
        { $match: { createdAt: { $gte: week } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]),
      PrivateRoom.aggregate([
        { $match: { isPaid: true, 'paymentInfo.paidAt': { $gte: week } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$paymentInfo.paidAt' } }, revenue: { $sum: '$paymentInfo.amount' }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ])
    ]);

    res.json({
      success: true,
      stats: {
        users:    { total: totalUsers, today: newUsersToday, week: newUsersWeek, month: newUsersMonth, online: onlineUsers },
        messages: { total: totalMessages, today: messagesToday, week: messagesWeek },
        rooms:    { total: totalRooms, paid: paidRooms, pending: pendingRooms },
        revenue:  { total: (totalRevenue[0]?.total || 0) / 100, paidRooms }
      },
      charts: { signups: signupChart, messages: messageChart, revenue: revenueChart }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;