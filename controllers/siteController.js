const SiteSettings = require('../models/SiteSettings');

const PUBLIC_FIELDS = 'brandName tagline description seoTitle seoDescription whatsappNumber phoneNumber email tiktokUrl instagramUrl facebookUrl siteUrl logoUrl ogImageUrl announcement announcementEnabled updatedAt';

exports.getSettings = async (req, res) => {
  try {
    const settings = await SiteSettings.findOne({ singleton: 'primary' }).select(PUBLIC_FIELDS).lean();
    res.json(settings || {});
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const allowedFields = [
      'brandName', 'tagline', 'description', 'seoTitle', 'seoDescription',
      'whatsappNumber', 'phoneNumber', 'email', 'tiktokUrl', 'instagramUrl',
      'facebookUrl', 'siteUrl', 'logoUrl', 'ogImageUrl', 'announcement',
      'announcementEnabled'
    ];

    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    const settings = await SiteSettings.findOneAndUpdate(
      { singleton: 'primary' },
      { $set: { ...updates, updatedBy: req.user._id }, $setOnInsert: { singleton: 'primary' } },
      { new: true, upsert: true, runValidators: true }
    ).select(PUBLIC_FIELDS);

    res.json({ message: 'Site settings updated', settings });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
