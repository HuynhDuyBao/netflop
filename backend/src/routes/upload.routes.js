const express = require('express');
const uploadController = require('../controllers/upload.controller');
const upload = require('../middlewares/upload.middleware');
const { authenticate, authorizeRoles } = require('../middlewares/auth.middleware');

const router = express.Router();
const adminOnly = [authenticate, authorizeRoles('admin')];

router.post('/media', authenticate, upload.single('file'), uploadController.uploadMedia);
router.post('/videos', adminOnly, upload.single('video'), uploadController.uploadVideo);

module.exports = router;
