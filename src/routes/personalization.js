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

// Legacy Compatibility: GET /protection/:userId
router.get('/protection/:userId', PersonalizationController.getLegacyProtectionPlan);

// Legacy Compatibility: POST /protection/plans/update
router.post('/protection/plans/update', PersonalizationController.getLegacyProtectionPlan); // Reusing for now or could add specific update logic

module.exports = router;
