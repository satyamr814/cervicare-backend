const express = require('express');
const ProfileController = require('../controllers/profileController');
const authMiddleware = require('../middlewares/auth');
const { validateRequest, profileSchema } = require('../middlewares/validation');

const router = express.Router();

// All profile routes require authentication
router.use(authMiddleware);

// GET /profile - Get user profile
router.get('/', ProfileController.getProfile);

// POST /profile - Create or update user profile
router.post('/', validateRequest(profileSchema), ProfileController.createOrUpdateProfile);

module.exports = router;
