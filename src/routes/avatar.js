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

// Custom image upload
router.post('/upload', upload.single('image'), AvatarController.uploadCustomImage);

// Avatar management
router.get('/current', AvatarController.getUserAvatar);
router.delete('/current', AvatarController.deleteCurrentAvatar);
router.put('/preferences', AvatarController.updateAvatarPreferences);

// Avatar information
router.get('/templates', AvatarController.getAvatarTemplates);
router.get('/history', AvatarController.getUserAvatarHistory);

// Admin-only statistics
router.get('/statistics', RoleMiddleware.requireAdmin(), AvatarController.getAvatarStatistics);

module.exports = router;
