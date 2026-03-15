const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Message = require('./models/Message');
const PrivateRoom = require('./models/PrivateRoom');

const FREE_MESSAGE_LIMIT = parseInt(process.env.FREE_MESSAGE_LIMIT) || 3;

// Track online users: userId -> { socketId, userId, username, avatar, bio }
const onlineUsers = new Map();

module.exports = (io) => {
  // Auth middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Authentication error: no token'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (!user) return next(new Error('Authentication error: user not found'));
      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Authentication error: invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    const user = socket.user;
    console.log(`✅ ${user.username} connected [${socket.id}]`);

    // Register online
    onlineUsers.set(user._id.toString(), {
      socketId: socket.id,
      userId: user._id.toString(),
      username: user.username,
      avatar: user.avatar,
      bio: user.bio
    });

    await User.findByIdAndUpdate(user._id, { isOnline: true, lastSeen: new Date() });
    broadcastOnlineUsers(io);
    socket.emit('onlineUsers', Array.from(onlineUsers.values()));
    socket.join('general');

    // ─── GENERAL MESSAGE ─────────────────────────────────────────────────────
    socket.on('generalMessage', async ({ content }) => {
      try {
        if (!content?.trim()) return;
        const message = await Message.create({
          sender: user._id,
          content: content.trim(),
          room: 'general'
        });
        await message.populate('sender', 'username avatar isOnline');
        io.to('general').emit('newGeneralMessage', {
          _id: message._id,
          content: message.content,
          sender: message.sender,
          room: 'general',
          createdAt: message.createdAt
        });
      } catch (error) {
        console.error('General message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // ─── TYPING ──────────────────────────────────────────────────────────────
    socket.on('typing', ({ room, isTyping }) => {
      socket.to(room).emit('userTyping', {
        userId: user._id,
        username: user.username,
        isTyping,
        room
      });
    });

    // ─── JOIN PRIVATE ROOM ────────────────────────────────────────────────────
    socket.on('joinPrivateRoom', async ({ roomId }) => {
      try {
        const room = await PrivateRoom.findOne({ roomId });
        if (!room) return socket.emit('error', { message: 'Room not found' });
        const participantIds = room.participants.map(p => p.toString());
        if (!participantIds.includes(user._id.toString()))
          return socket.emit('error', { message: 'Not authorized' });
        socket.join(roomId);
        socket.emit('joinedRoom', { roomId });
      } catch (error) {
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    // ─── PRIVATE MESSAGE ──────────────────────────────────────────────────────
    socket.on('privateMessage', async ({ roomId, content }) => {
      try {
        if (!content?.trim()) return;
        const room = await PrivateRoom.findOne({ roomId });
        if (!room) return socket.emit('error', { message: 'Room not found' });

        const participantIds = room.participants.map(p => p.toString());
        if (!participantIds.includes(user._id.toString()))
          return socket.emit('error', { message: 'Not authorized' });

        if (room.status !== 'accepted')
          return socket.emit('error', { message: 'Chat request not accepted yet' });

        if (!room.isPaid && room.messageCount >= FREE_MESSAGE_LIMIT) {
          return socket.emit('paymentRequired', {
            roomId,
            messageCount: room.messageCount,
            freeLimit: FREE_MESSAGE_LIMIT,
            price: parseInt(process.env.PRIVATE_CHAT_PRICE) || 99
          });
        }

        const message = await Message.create({
          sender: user._id,
          content: content.trim(),
          room: roomId
        });
        await message.populate('sender', 'username avatar');

        room.messageCount += 1;
        room.lastMessage = { content: content.trim(), sender: user._id, createdAt: new Date() };
        await room.save();

        io.to(roomId).emit('newPrivateMessage', {
          _id: message._id,
          content: message.content,
          sender: message.sender,
          room: roomId,
          createdAt: message.createdAt
        });

        if (!room.isPaid) {
          const remaining = FREE_MESSAGE_LIMIT - room.messageCount;
          if (remaining <= 0) {
            io.to(roomId).emit('messageLimitReached', { roomId, messageCount: room.messageCount, freeLimit: FREE_MESSAGE_LIMIT });
          } else if (remaining === 1) {
            socket.emit('messageLimitWarning', { roomId, remaining });
          }
        }

        io.to(roomId).emit('roomUpdated', {
          roomId,
          lastMessage: { content: content.trim(), sender: { _id: user._id, username: user.username }, createdAt: new Date() }
        });
      } catch (error) {
        console.error('Private message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // ─── CHAT REQUEST SENT ────────────────────────────────────────────────────
    socket.on('chatRequestSent', async ({ roomId, targetUserId }) => {
      const targetSocket = getSocketIdByUserId(targetUserId);
      if (targetSocket) {
        const room = await PrivateRoom.findOne({ roomId })
          .populate('participants', 'username avatar isOnline')
          .populate('requestedBy', 'username avatar');
        if (room) io.to(targetSocket).emit('chatRequest', { room });
      }
    });

    // ─── CHAT REQUEST RESPONSE ────────────────────────────────────────────────
    socket.on('chatRequestResponse', async ({ roomId, action }) => {
      const room = await PrivateRoom.findOne({ roomId })
        .populate('participants', 'username avatar isOnline')
        .populate('requestedBy', 'username avatar');

      if (room) {
        room.participants.forEach(participant => {
          const pSocket = getSocketIdByUserId(participant._id.toString());
          if (pSocket) io.to(pSocket).emit('chatRequestUpdated', { room, action });
        });
      }
    });

    // ─── PAYMENT CONFIRMED ────────────────────────────────────────────────────
    socket.on('paymentConfirmed', ({ roomId }) => {
      io.to(roomId).emit('chatUnlocked', { roomId });
    });

    // ─── DISCONNECT ───────────────────────────────────────────────────────────
    socket.on('disconnect', async () => {
      console.log(`❌ ${user.username} disconnected`);
      onlineUsers.delete(user._id.toString());
      await User.findByIdAndUpdate(user._id, { isOnline: false, lastSeen: new Date() });
      broadcastOnlineUsers(io);
    });

    function getSocketIdByUserId(userId) {
      return onlineUsers.get(userId)?.socketId || null;
    }
  });

  function broadcastOnlineUsers(io) {
    io.emit('onlineUsers', Array.from(onlineUsers.values()));
  }
};
