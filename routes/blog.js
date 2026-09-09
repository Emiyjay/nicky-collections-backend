const express = require('express');
const router = express.Router();
const {
  getPosts,
  getPost,
  adminGetPosts,
  adminCreatePost,
  adminUpdatePost,
  adminDeletePost
} = require('../controllers/blogController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/', getPosts);

router.get('/admin/all', protect, adminOnly, adminGetPosts);
router.post('/admin', protect, adminOnly, adminCreatePost);
router.put('/admin/:id', protect, adminOnly, adminUpdatePost);
router.delete('/admin/:id', protect, adminOnly, adminDeletePost);

router.get('/:slug', getPost);

module.exports = router;
