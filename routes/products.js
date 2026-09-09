const express = require('express');
const router = express.Router();
const { getProducts, getProduct, getFeatured, getRelatedProducts, addReview } = require('../controllers/productController');
const { getProductBySlug } = require('../controllers/productSlugController');
const { protect } = require('../middleware/auth');

router.get('/', getProducts);
router.get('/featured', getFeatured);
router.get('/slug/:slug', getProductBySlug);
router.get('/:id/related', getRelatedProducts);
router.get('/:id', (req, res, next) => {
  if (/^[a-f\d]{24}$/i.test(req.params.id)) return getProduct(req, res, next);
  req.params.slug = req.params.id;
  return getProductBySlug(req, res, next);
});
router.post('/:id/reviews', protect, addReview);

module.exports = router;
