const express = require('express');
const AuthController = require('../controllers/authController');
const { validateRequest, signupSchema, loginSchema } = require('../middlewares/validation');

const router = express.Router();

// POST /auth/signup - Create new user account
router.post('/signup', validateRequest(signupSchema), AuthController.signup);

// POST /auth/login - Authenticate user
router.post('/login', validateRequest(loginSchema), AuthController.login);

module.exports = router;
