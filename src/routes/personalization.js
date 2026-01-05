const express = require('express');
const PersonalizationController = require('../controllers/personalizationController');
const authMiddleware = require('../middlewares/auth');

const router = express.Router();

// All personalization routes require authentication
router.use(authMiddleware);

// GET /diet-plan - Get personalized diet recommendations
router.get('/diet-plan', PersonalizationController.getDietPlan);

// GET /protection-plan - Get personalized protection plan
router.get('/protection-plan', PersonalizationController.getProtectionPlan);

module.exports = router;
