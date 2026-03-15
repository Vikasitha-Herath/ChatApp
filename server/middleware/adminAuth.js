const jwt   = require('jsonwebtoken');
const Admin = require('../models/Admin');

const adminProtect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) return res.status(401).json({ success: false, message: 'Not authorized' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type !== 'admin') return res.status(401).json({ success: false, message: 'Not authorized as admin' });

    const admin = await Admin.findById(decoded.id);
    if (!admin || !admin.isActive) return res.status(401).json({ success: false, message: 'Admin not found or inactive' });

    req.admin = admin;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Not authorized, invalid token' });
  }
};

const requirePermission = (permission) => (req, res, next) => {
  if (req.admin.role === 'superadmin') return next();
  if (!req.admin.permissions[permission]) {
    return res.status(403).json({ success: false, message: `Permission denied: ${permission}` });
  }
  next();
};

module.exports = { adminProtect, requirePermission };