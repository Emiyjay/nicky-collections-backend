const mongoose = require('mongoose');

const siteSettingsSchema = new mongoose.Schema({
  key: { type: String, default: 'global', unique: true, immutable: true },
  businessName: { type: String, default: 'Nicky Collections', trim: true },
  tagline: { type: String, default: '', trim: true },
  description: { type: String, default: '', trim: true },
  whatsappNumber: { type: String, default: '+1 (350) 220-8962', trim: true },
  phoneNumber: { type: String, default: '+1 (350) 220-8962', trim: true },
  smsNumber: { type: String, default: '+1 (350) 220-8962', trim: true },
  email: { type: String, default: 'nickycollection01@gmail.com', trim: true, lowercase: true },
  tiktokUrl: { type: String, default: 'https://www.tiktok.com/@shopwithnickycollections', trim: true },
  instagramUrl: { type: String, default: 'https://www.instagram.com/nickycollections', trim: true },
  facebookUrl: { type: String, default: '', trim: true },
  websiteUrl: { type: String, default: '', trim: true },
  logoUrl: { type: String, default: '', trim: true },
  metaTitle: { type: String, default: 'Nicky Collections — Fashion & New Drops', trim: true },
  metaDescription: { type: String, default: 'Shop fashion-forward shoes, jackets, accessories and exclusive drops from Nicky Collections.', trim: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

module.exports = mongoose.model('SiteSettings', siteSettingsSchema);
