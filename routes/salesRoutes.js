const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  getSales,
  createSale,
  getSalesReports,
  getDashboardStats,
} = require('../controllers/salesController');
const { protect } = require('../middleware/auth');
const { admin } = require('../middleware/admin');

// Validation
const saleValidation = [
  body('productId').notEmpty().withMessage('Product ID is required'),
  body('quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
];

// All routes are admin only
router.use(protect, admin);

router.get('/', getSales);
router.get('/reports', getSalesReports);
router.get('/dashboard', getDashboardStats);
router.post('/', saleValidation, createSale);

module.exports = router;