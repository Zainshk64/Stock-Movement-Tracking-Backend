const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  signup,
  login,
  getMe,
  updateProfile,
  createAdmin,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Validation rules
const signupValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('Passwords do not match');
    }
    return true;
  }),
];

const loginValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
];

// Routes
router.post('/signup', signupValidation, signup);
router.post('/login', loginValidation, login);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
// router.post('/create-admin', createAdmin);

module.exports = router;