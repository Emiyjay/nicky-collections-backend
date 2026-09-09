const express = require('express');
const router = express.Router();
const { getPublicSettings, getAdminSettings, updateSettings } = require('../controllers/settingsController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/', getPublicSettings);
router.get('/admin', protect, adminOnly, getAdminSettings);
router.put('/admin', protect, adminOnly, updateSettings);

module.exports = router;
