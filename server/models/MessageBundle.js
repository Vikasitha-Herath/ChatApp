const mongoose = require('mongoose');

const messageBundleSchema = new mongoose.Schema({
  name:         { type: String, required: true, trim: true },
  description:  { type: String },
  messageCount: { type: Number, required: true },
  price:        { type: Number, required: true },
  currency:     { type: String, default: 'USD' },
  isPopular:    { type: Boolean, default: false },
  isActive:     { type: Boolean, default: true },
  color:        { type: String, default: '#7c3aed' },
  icon:         { type: String, default: '⚡' },
  validityDays:   { type: Number, default: 30 },
  totalPurchases: { type: Number, default: 0 },
  totalRevenue:   { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }
}, { timestamps: true });

module.exports = mongoose.model('MessageBundle', messageBundleSchema);