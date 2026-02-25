const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const {
  uploadImage,
  uploadMultipleImages,
  deleteImage,
  uploadFromUrl,
} = require('../controllers/uploadController');
const { protect } = require('../middleware/auth');
const { admin } = require('../middleware/admin');

// All routes require admin authentication
router.use(protect, admin);

// Single image upload
router.post('/image', upload.single('image'), uploadImage);

// Multiple images upload (max 5)
router.post('/images', upload.array('images', 5), uploadMultipleImages);

// Delete image
router.delete('/image/:publicId', deleteImage);

// Upload from URL
router.post('/url', uploadFromUrl);

module.exports = router;