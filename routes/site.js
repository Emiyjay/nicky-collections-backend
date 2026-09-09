const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/siteController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/settings', getSettings);
router.put('/settings', protect, adminOnly, updateSettings);

module.exports = router;
