const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const slugify = (value = '') => value
  .toString()
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 120);

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [200, 'Name too long']
  },
  slug: {
    type: String,
    trim: true,
    lowercase: true,
    sparse: true,
    index: true
  },
  description: {
    type: String,
    required: [true, 'Description is required']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  comparePrice: { type: Number, default: null },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['footwear', 'outerwear', 'accessories', 'clothing', 'collectibles', 'other']
  },
  brand: { type: String, default: '' },
  images: [{
    url: { type: String, required: true },
    public_id: { type: String, default: '' },
    alt: { type: String, default: '' }
  }],
  videos: [{
    url: { type: String },
    public_id: { type: String, default: '' },
    thumbnail: { type: String, default: '' }
  }],
  colors: [{ type: String }],
  sizes: [{ type: String }],
  tags: [{ type: String }],
  inStock: { type: Boolean, default: true },
  stockCount: { type: Number, default: 0 },
  isFeatured: { type: Boolean, default: false },
  isNewArrival: { type: Boolean, default: true },
  reviews: [reviewSchema],
  rating: { type: Number, default: 0 },
  numReviews: { type: Number, default: 0 },
  tiktokLink: { type: String, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

productSchema.pre('validate', function(next) {
  if (!this.slug && this.name) this.slug = slugify(this.name);
  next();
});

productSchema.methods.updateRating = function() {
  if (this.reviews.length === 0) {
    this.rating = 0;
    this.numReviews = 0;
  } else {
    this.rating = this.reviews.reduce((acc, r) => acc + r.rating, 0) / this.reviews.length;
    this.numReviews = this.reviews.length;
  }
};

productSchema.index({ name: 'text', description: 'text', brand: 'text', tags: 'text' });

module.exports = mongoose.model('Product', productSchema);
