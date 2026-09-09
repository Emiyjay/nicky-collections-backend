const Product = require('../models/Product');

// @GET /api/products
exports.getProducts = async (req, res) => {
  try {
    const {
      category,
      brand,
      search,
      sort,
      minPrice,
      maxPrice,
      isFeatured,
      isNewArrival,
      onSale,
      page = 1,
      limit = 12,
    } = req.query;
    const query = {};

    if (category && category !== 'all') query.category = category;
    if (brand) query.brand = brand;
    if (isFeatured === 'true' || isFeatured === 'false') query.isFeatured = isFeatured === 'true';
    if (isNewArrival === 'true' || isNewArrival === 'false') query.isNewArrival = isNewArrival === 'true';
    if (onSale === 'true') {
      query.$expr = { $gt: ['$comparePrice', '$price'] };
    }
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    if (search) query.$text = { $search: search };

    let sortOption = { createdAt: -1 };
    if (sort === 'price-asc') sortOption = { price: 1 };
    else if (sort === 'price-desc') sortOption = { price: -1 };
    else if (sort === 'rating') sortOption = { rating: -1 };
    else if (sort === 'newest') sortOption = { createdAt: -1 };

    const pageNumber = Math.max(Number(page) || 1, 1);
    const limitNumber = Math.min(Math.max(Number(limit) || 12, 1), 50);
    const skip = (pageNumber - 1) * limitNumber;
    const total = await Product.countDocuments(query);
    const products = await Product.find(query).sort(sortOption).skip(skip).limit(limitNumber).select('-reviews');

    res.json({ products, page: pageNumber, pages: Math.ceil(total / limitNumber), total });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @GET /api/products/featured
exports.getFeatured = async (req, res) => {
  try {
    const products = await Product.find({ isFeatured: true }).limit(8).select('-reviews');
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @GET /api/products/slug/:slug
exports.getProductBySlug = async (req, res) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug }).populate('reviews.user', 'name avatar');
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @GET /api/products/:id/related
exports.getRelatedProducts = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).select('category brand tags');
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const or = [{ category: product.category }];
    if (product.brand) or.push({ brand: product.brand });
    if (product.tags?.length) or.push({ tags: { $in: product.tags } });

    const related = await Product.find({ _id: { $ne: product._id }, inStock: true, $or: or })
      .select('-reviews')
      .sort({ isFeatured: -1, rating: -1, createdAt: -1 })
      .limit(8);

    res.json(related);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @GET /api/products/:id
exports.getProduct = async (req, res) => {
  try {
    const identifier = req.params.id;
    const query = Product.findById(identifier).populate('reviews.user', 'name avatar');
    const product = mongooseSafeObjectId(identifier)
      ? await query
      : await Product.findOne({ slug: identifier }).populate('reviews.user', 'name avatar');
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const mongooseSafeObjectId = (value) => /^[a-fA-F0-9]{24}$/.test(String(value));

// @POST /api/products/:id/reviews
exports.addReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const alreadyReviewed = product.reviews.find(r => r.user.toString() === req.user._id.toString());
    if (alreadyReviewed) return res.status(400).json({ message: 'Already reviewed this product' });

    product.reviews.push({ user: req.user._id, name: req.user.name, rating, comment });
    product.updateRating();
    await product.save();
    res.status(201).json({ message: 'Review added' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
