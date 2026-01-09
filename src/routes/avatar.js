const express = require('express');
const multer = require('multer');
const AvatarController = require('../controllers/avatarController');
const authMiddleware = require('../middlewares/auth');
const RoleMiddleware = require('../middlewares/roles');
const SecurityMiddleware = require('../middlewares/security');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'), false);
    }
  }
});

// Apply authentication to all avatar routes
router.use(authMiddleware);

// Avatar generation and selection
router.post('/generate-ai', AvatarController.generateAIAvatar);
router.get('/random', AvatarController.getRandomAvatar);

// Custom image upload - supports both multipart/form-data and base64 JSON
router.post('/upload', (req, res, next) => {
  // Check if request is base64 JSON (from frontend)
  if (req.headers['content-type']?.includes('application/json') && req.body.image) {
    // Handle base64 upload directly
    AvatarController.uploadCustomImageBase64(req, res).catch(err => {
      console.error('Base64 upload error:', err);
      res.status(500).json({ success: false, message: err.message });
    });
    return; // Don't call next()
  }
  // Otherwise use multer for multipart/form-data
  next();
}, upload.single('image'), AvatarController.uploadCustomImage);

// Avatar management
router.get('/current', AvatarController.getUserAvatar);
router.get('/current/:userId', AvatarController.getUserAvatar);
router.delete('/current', AvatarController.deleteCurrentAvatar);
router.put('/preferences', AvatarController.updateAvatarPreferences);

// Avatar information
router.get('/templates', AvatarController.getAvatarTemplates);
router.get('/history', AvatarController.getUserAvatarHistory);

// Admin-only statistics
router.get('/statistics', RoleMiddleware.requireAdmin(), AvatarController.getAvatarStatistics);

module.exports = router;
