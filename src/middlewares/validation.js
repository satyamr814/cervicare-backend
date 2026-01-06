const Joi = require('joi');

const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      allowUnknown: true,
      stripUnknown: true
    });
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: error.details.map(detail => detail.message)
      });
    }

    req.body = value;
    next();
  };
};

const signupSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  password: Joi.string().min(8).required().messages({
    'string.min': 'Password must be at least 8 characters long',
    'any.required': 'Password is required'
  })
});

const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  password: Joi.string().required().messages({
    'any.required': 'Password is required'
  })
});

const profileSchema = Joi.object({
  age: Joi.number().integer().min(18).max(120).required().messages({
    'number.base': 'Age must be a number',
    'number.integer': 'Age must be an integer',
    'number.min': 'Age must be at least 18',
    'number.max': 'Age must not exceed 120',
    'any.required': 'Age is required'
  }),
  gender: Joi.string().valid('male', 'female', 'other').required().messages({
    'any.only': 'Gender must be male, female, or other',
    'any.required': 'Gender is required'
  }),
  city: Joi.string().min(2).max(100).required().messages({
    'string.min': 'City name must be at least 2 characters',
    'string.max': 'City name must not exceed 100 characters',
    'any.required': 'City is required'
  }),
  diet_type: Joi.string().valid('veg', 'nonveg', 'vegan').required().messages({
    'any.only': 'Diet type must be veg, nonveg, or vegan',
    'any.required': 'Diet type is required'
  }),
  budget_level: Joi.string().valid('low', 'medium', 'high').required().messages({
    'any.only': 'Budget level must be low, medium, or high',
    'any.required': 'Budget level is required'
  }),
  lifestyle: Joi.string().valid('sedentary', 'moderately_active', 'active').required().messages({
    'any.only': 'Lifestyle must be sedentary, moderately_active, or active',
    'any.required': 'Lifestyle is required'
  }),
  whatsapp_consent: Joi.boolean().default(false).messages({
    'boolean.base': 'WhatsApp consent must be true or false'
  }),
  marketing_consent: Joi.boolean().default(false).messages({
    'boolean.base': 'Marketing consent must be true or false'
  }),
  phone: Joi.string().pattern(/^[+]?[\d\s\-\(\)]+$/).optional().messages({
    'string.pattern.base': 'Phone number must contain only digits, spaces, and standard phone symbols'
  }),
  profile_image_url: Joi.string().uri({ scheme: ['http', 'https', 'data'] }).optional().allow(null, '').messages({
    'string.uri': 'Profile image must be a valid URL or data URI'
  })
});

module.exports = {
  validateRequest,
  signupSchema,
  loginSchema,
  profileSchema
};
