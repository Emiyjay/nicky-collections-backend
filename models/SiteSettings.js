const mongoose = require('mongoose');

const siteSettingsSchema = new mongoose.Schema({
  singleton: { type: String, default: 'primary', unique: true, immutable: true },
  brandName: { type: String, default: 'Nicky Collections', trim: true },
  tagline: { type: String, default: 'Style Without Limits', trim: true },
  description: { type: String, default: '', trim: true },
  seoTitle: { type: String, default: 'Nicky Collections | Fashion Drops, Footwear & Accessories', trim: true },
  seoDescription: { type: String, default: '', trim: true },
  whatsappNumber: { type: String, default: '13502208962', trim: true },
  phoneNumber: { type: String, default: '13502208962', trim: true },
  email: { type: String, default: 'nickycollection01@gmail.com', trim: true },
  tiktokUrl: { type: String, default: 'https://www.tiktok.com/@shopwithnickycollections', trim: true },
  instagramUrl: { type: String, default: 'https://www.instagram.com/nickycollections', trim: true },
  facebookUrl: { type: String, default: '', trim: true },
  siteUrl: { type: String, default: '', trim: true },
  logoUrl: { type: String, default: '', trim: true },
  ogImageUrl: { type: String, default: '', trim: true },
  announcement: { type: String, default: '', trim: true },
  announcementEnabled: { type: Boolean, default: false },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('SiteSettings', siteSettingsSchema);
