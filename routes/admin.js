const express = require('express');
const router = express.Router();
const {
  createProduct, updateProduct, deleteProduct,
  deleteProductImage, addProductVideo,
  getDashboardStats, getUsers
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');
const { uploadImages, uploadVideo } = require('../config/cloudinary');

// All admin routes are protected
router.use(protect, adminOnly);

router.get('/stats', getDashboardStats);
router.get('/users', getUsers);

router.post('/products', uploadImages, createProduct);
router.put('/products/:id', uploadImages, updateProduct);
router.delete('/products/:id', deleteProduct);
router.delete('/products/:id/images/:imageId', deleteProductImage);
router.post('/products/:id/video', uploadVideo, addProductVideo);

module.exports = router;
