const Product = require('../models/Product');

const slugify = (value = '') => value
  .toString()
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 120);

exports.getProductBySlug = async (req, res) => {
  try {
    const slug = String(req.params.slug || '').toLowerCase();
    let product = await Product.findOne({ slug }).populate('reviews.user', 'name avatar');

    if (!product) {
      const legacyProducts = await Product.find({ slug: { $exists: false } }).select('_id name');
      const match = legacyProducts.find(item => slugify(item.name) === slug);
      if (match) {
        match.slug = slug;
        try { await match.save(); } catch (_) {}
        product = await Product.findById(match._id).populate('reviews.user', 'name avatar');
      }
    }

    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
