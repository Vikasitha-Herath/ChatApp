const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const adminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, select: false },
  role:     { type: String, enum: ['superadmin','admin','moderator'], default: 'admin' },
  isActive: { type: Boolean, default: true },
  lastLogin: Date,
  permissions: {
    manageUsers:      { type: Boolean, default: true },
    manageMessages:   { type: Boolean, default: true },
    managePromotions: { type: Boolean, default: true },
    manageBundles:    { type: Boolean, default: true },
    viewAnalytics:    { type: Boolean, default: true },
    manageSettings:   { type: Boolean, default: false },
    manageAdmins:     { type: Boolean, default: false }
  }
}, { timestamps: true });

adminSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

adminSchema.methods.comparePassword = async function (candidate) {
  return await bcrypt.compare(candidate, this.password);
};

adminSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('Admin', adminSchema);