const mongoose = require('mongoose');

const blogPostSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 180 },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  excerpt: { type: String, default: '', trim: true, maxlength: 320 },
  content: { type: String, required: true },
  coverImage: { url: { type: String, default: '' }, alt: { type: String, default: '' } },
  category: { type: String, default: 'Style Guide', trim: true },
  tags: [{ type: String, trim: true }],
  authorName: { type: String, default: 'Nicky Collections', trim: true },
  seoTitle: { type: String, default: '', trim: true, maxlength: 180 },
  seoDescription: { type: String, default: '', trim: true, maxlength: 320 },
  published: { type: Boolean, default: false },
  publishedAt: { type: Date },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

blogPostSchema.index({ published: 1, publishedAt: -1 });
blogPostSchema.index({ title: 'text', excerpt: 'text', content: 'text', tags: 'text' });

module.exports = mongoose.model('BlogPost', blogPostSchema);
