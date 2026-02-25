const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  getSale,
  createSale,
  deleteSale,
  getSalesReports,
  getDashboardStats,
  getSales,
} = require('../controllers/salesController');
const { protect } = require('../middleware/auth');
const { admin } = require('../middleware/admin');

// Validation
const saleValidation = [
  body('productId').notEmpty().withMessage('Product ID is required'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
];

// All routes are admin only
router.use(protect, admin);

// Reports & Dashboard (specific routes first)
router.get('/reports', getSalesReports);
router.get('/dashboard', getDashboardStats);

// CRUD routes
router.get('/', getSales);
router.get('/:id', getSale);
router.post('/', saleValidation, createSale);
router.delete('/:id', deleteSale);

module.exports = router;