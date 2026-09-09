const SiteSettings = require('../models/SiteSettings');

const DEFAULTS = {
  businessName: 'Nicky Collections',
  whatsappNumber: '+1 (350) 220-8962',
  phoneNumber: '+1 (350) 220-8962',
  smsNumber: '+1 (350) 220-8962',
  email: 'nickycollection01@gmail.com',
  tiktokUrl: 'https://www.tiktok.com/@shopwithnickycollections',
  instagramUrl: 'https://www.instagram.com/nickycollections',
  metaTitle: 'Nicky Collections — Fashion & New Drops',
  metaDescription: 'Shop fashion-forward shoes, jackets, accessories and exclusive drops from Nicky Collections.',
};

exports.getPublicSettings = async (req, res, next) => {
  try {
    const settings = await SiteSettings.findOne({ key: 'global' }).lean();
    res.json({ ...DEFAULTS, ...(settings || {}) });
  } catch (error) {
    next(error);
  }
};

exports.getAdminSettings = async (req, res, next) => {
  try {
    const settings = await SiteSettings.findOne({ key: 'global' }).lean();
    res.json({ ...DEFAULTS, ...(settings || {}) });
  } catch (error) {
    next(error);
  }
};

exports.updateSettings = async (req, res, next) => {
  try {
    const allowedFields = [
      'businessName', 'tagline', 'description', 'whatsappNumber', 'phoneNumber',
      'smsNumber', 'email', 'tiktokUrl', 'instagramUrl', 'facebookUrl',
      'websiteUrl', 'logoUrl', 'metaTitle', 'metaDescription'
    ];

    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    const settings = await SiteSettings.findOneAndUpdate(
      { key: 'global' },
      { $set: { ...updates, updatedBy: req.user._id }, $setOnInsert: { key: 'global' } },
      { new: true, upsert: true, runValidators: true }
    );

    res.json(settings);
  } catch (error) {
    next(error);
  }
};
