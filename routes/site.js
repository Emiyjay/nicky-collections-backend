const express = require('express');
const rateLimit = require('express-rate-limit');
const { createProductInquiry } = require('../controllers/productInquiryController');

const router = express.Router();

const inquiryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many inquiries. Please try again later.' }
});

router.post('/product-inquiry', inquiryLimiter, createProductInquiry);

module.exports = router;
