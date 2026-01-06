const express = require('express');
const AdminController = require('../controllers/adminController');
const adminMiddleware = require('../middlewares/admin');
const { validateRequest } = require('../middlewares/validation');
const Joi = require('joi');

const router = express.Router();

// All admin routes require admin authentication
router.use(adminMiddleware);

// Validation schemas
const dietContentSchema = Joi.object({
  diet_type: Joi.string().valid('veg', 'nonveg', 'vegan').required(),
  budget_level: Joi.string().valid('low', 'medium', 'high').required(),
  region: Joi.string().min(2).max(100).required(),
  food_name: Joi.string().min(1).max(200).required(),
  reason: Joi.string().min(1).required(),
  frequency: Joi.string().min(1).max(50).required()
});

const protectionPlanContentSchema = Joi.object({
  risk_band: Joi.string().valid('low', 'moderate', 'higher_attention').required(),
  plan_type: Joi.string().valid('basic', 'complete', 'premium').required(),
  section: Joi.string().valid('diet', 'lifestyle', 'screening').required(),
  content_text: Joi.string().min(1).required()
});

// Diet Content Management
router.post('/diet-content', validateRequest(dietContentSchema), AdminController.createDietContent);
router.get('/diet-content', AdminController.getDietContent);
router.put('/diet-content/:id', validateRequest(dietContentSchema), AdminController.updateDietContent);
router.delete('/diet-content/:id', AdminController.deleteDietContent);

// Protection Plan Content Management
router.post('/protection-plan', validateRequest(protectionPlanContentSchema), AdminController.createProtectionPlanContent);
router.get('/protection-plan', AdminController.getProtectionPlanContent);
router.put('/protection-plan/:id', validateRequest(protectionPlanContentSchema), AdminController.updateProtectionPlanContent);
router.delete('/protection-plan/:id', AdminController.deleteProtectionPlanContent);

// Audit Logs
router.get('/audit-logs', AdminController.getAuditLogs);

// System Statistics
router.get('/stats', AdminController.getSystemStats);

module.exports = router;
