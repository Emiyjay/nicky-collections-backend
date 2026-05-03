const express = require('express');
const router = express.Router();
const { getProducts, getProduct, getFeatured, addReview } = require('../controllers/productController');
const { protect } = require('../middleware/auth');

router.get('/', getProducts);
router.get('/featured', getFeatured);
router.get('/:id', getProduct);
router.post('/:id/reviews', protect, addReview);

module.exports = router;
