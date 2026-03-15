const mongoose = require('mongoose');

const appSettingsSchema = new mongoose.Schema({
  key:         { type: String, required: true, unique: true },
  value:       { type: mongoose.Schema.Types.Mixed, required: true },
  description: String,
  category:    { type: String, enum: ['general','payment','chat','email','security'], default: 'general' },
  updatedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }
}, { timestamps: true });

module.exports = mongoose.model('AppSettings', appSettingsSchema);