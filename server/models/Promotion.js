const mongoose = require('mongoose');

const promotionSchema = new mongoose.Schema({
  title:       { type: String, required: true, trim: true },
  description: { type: String, required: true },
  type:        { type: String, enum: ['banner','popup','notification','discount'], required: true },
  status:      { type: String, enum: ['active','inactive','scheduled','expired'], default: 'inactive' },
  startDate:   { type: Date, required: true },
  endDate:     { type: Date, required: true },
  targetAudience: { type: String, enum: ['all','new_users','free_users','paid_users'], default: 'all' },
  discountPercent: { type: Number, min: 0, max: 100 },
  promoCode:   { type: String, uppercase: true, trim: true },
  imageUrl:    String,
  ctaText:     String,
  ctaUrl:      String,
  viewCount:   { type: Number, default: 0 },
  clickCount:  { type: Number, default: 0 },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }
}, { timestamps: true });

module.exports = mongoose.model('Promotion', promotionSchema);