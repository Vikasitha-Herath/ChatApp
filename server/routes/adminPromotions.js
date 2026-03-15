const express   = require('express');
const router    = express.Router();
const Promotion = require('../models/Promotion');
const { adminProtect, requirePermission } = require('../middleware/adminAuth');

router.get('/', adminProtect, async (req, res) => {
  try {
    const promotions = await Promotion.find().populate('createdBy', 'username').sort('-createdAt');
    res.json({ success: true, promotions });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/', adminProtect, requirePermission('managePromotions'), async (req, res) => {
  try {
    const promotion = await Promotion.create({ ...req.body, createdBy: req.admin._id });
    res.status(201).json({ success: true, promotion, message: 'Promotion created!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id', adminProtect, requirePermission('managePromotions'), async (req, res) => {
  try {
    const promotion = await Promotion.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!promotion) return res.status(404).json({ success: false, message: 'Promotion not found' });
    res.json({ success: true, promotion, message: 'Promotion updated!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:id', adminProtect, requirePermission('managePromotions'), async (req, res) => {
  try {
    await Promotion.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Promotion deleted!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/:id/toggle', adminProtect, requirePermission('managePromotions'), async (req, res) => {
  try {
    const promotion = await Promotion.findById(req.params.id);
    if (!promotion) return res.status(404).json({ success: false, message: 'Not found' });
    promotion.status = promotion.status === 'active' ? 'inactive' : 'active';
    await promotion.save();
    res.json({ success: true, promotion });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;