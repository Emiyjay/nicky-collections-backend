const Product = require('../models/Product');
const User = require('../models/User');
const { cloudinary } = require('../config/cloudinary');

// @POST /api/admin/products
exports.createProduct = async (req, res) => {
  try {
    const {
      name, description, price, comparePrice, category, brand,
      colors, sizes, tags, inStock, stockCount, isFeatured,
      isNewArrival, tiktokLink
    } = req.body;

    // Handle uploaded images (from Cloudinary via multer)
    const images = req.files ? req.files.map(file => ({
      url: file.path,
      public_id: file.filename,
      alt: name
    })) : [];

    const product = await Product.create({
      name, description,
      price: Number(price),
      comparePrice: comparePrice ? Number(comparePrice) : null,
      category, brand,
      colors: colors ? JSON.parse(colors) : [],
      sizes: sizes ? JSON.parse(sizes) : [],
      tags: tags ? JSON.parse(tags) : [],
      inStock: inStock !== 'false',
      stockCount: Number(stockCount) || 0,
      isFeatured: isFeatured === 'true',
      isNewArrival: isNewArrival !== 'false',
      tiktokLink: tiktokLink || '',
      images,
      createdBy: req.user._id
    });

    res.status(201).json({ message: 'Product created', product });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @PUT /api/admin/products/:id
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const updates = { ...req.body };
    if (updates.colors && typeof updates.colors === 'string') updates.colors = JSON.parse(updates.colors);
    if (updates.sizes && typeof updates.sizes === 'string') updates.sizes = JSON.parse(updates.sizes);
    if (updates.tags && typeof updates.tags === 'string') updates.tags = JSON.parse(updates.tags);

    // Add new images if uploaded
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => ({
        url: file.path,
        public_id: file.filename,
        alt: updates.name || product.name
      }));
      updates.images = [...product.images, ...newImages];
    }

    const updated = await Product.findByIdAndUpdate(req.params.id, updates, {
      new: true, runValidators: true
    });
    res.json({ message: 'Product updated', product: updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @DELETE /api/admin/products/:id
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    // Delete images from Cloudinary
    for (const img of product.images) {
      if (img.public_id) {
        await cloudinary.uploader.destroy(img.public_id);
      }
    }

    await product.deleteOne();
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @DELETE /api/admin/products/:id/images/:imageId
exports.deleteProductImage = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const image = product.images.id(req.params.imageId);
    if (image && image.public_id) {
      await cloudinary.uploader.destroy(image.public_id);
    }
    product.images = product.images.filter(img => img._id.toString() !== req.params.imageId);
    await product.save();
    res.json({ message: 'Image deleted', images: product.images });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @POST /api/admin/products/:id/video
exports.addProductVideo = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    if (req.file) {
      product.videos.push({
        url: req.file.path,
        public_id: req.file.filename,
        thumbnail: ''
      });
      await product.save();
    }
    res.json({ message: 'Video added', videos: product.videos });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @GET /api/admin/stats
exports.getDashboardStats = async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const featuredProducts = await Product.countDocuments({ isFeatured: true });
    const outOfStock = await Product.countDocuments({ inStock: false });
    const totalUsers = await User.countDocuments({ role: 'user' });
    const recentProducts = await Product.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name price category images createdAt');

    const categoryBreakdown = await Product.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    res.json({
      totalProducts,
      featuredProducts,
      outOfStock,
      totalUsers,
      recentProducts,
      categoryBreakdown
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @GET /api/admin/users
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({ role: 'user' })
      .select('-password')
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
