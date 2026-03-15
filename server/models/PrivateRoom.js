const mongoose = require('mongoose');

const privateRoomSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  roomId: { type: String, unique: true, required: true },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'blocked'],
    default: 'pending'
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  messageCount: { type: Number, default: 0 },
  isPaid: { type: Boolean, default: false },
  paymentInfo: {
    stripePaymentIntentId: String,
    paidAt: Date,
    amount: Number,
    paidBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  lastMessage: {
    content: String,
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: Date
  }
}, { timestamps: true });

privateRoomSchema.statics.generateRoomId = function (userId1, userId2) {
  const ids = [userId1.toString(), userId2.toString()].sort();
  return `private_${ids[0]}_${ids[1]}`;
};

module.exports = mongoose.model('PrivateRoom', privateRoomSchema);
