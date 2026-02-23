const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  getStockLogs,
  addStock,
  recordSold,
  transferStock,
  settleTransfer,
  getUnsettledTransfers,
  getStockStats,
} = require('../controllers/stockController');
const { protect } = require('../middleware/auth');
const { admin } = require('../middleware/admin');

// Validation
const stockValidation = [
  body('productId').notEmpty().withMessage('Product ID is required'),
  body('quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
];

const transferValidation = [
  ...stockValidation,
  body('person').trim().notEmpty().withMessage('Person/Shop name is required'),
];

// All routes are admin only
router.use(protect, admin);

router.get('/', getStockLogs);
router.get('/stats', getStockStats);
router.get('/unsettled', getUnsettledTransfers);
router.post('/add', stockValidation, addStock);
router.post('/sold', stockValidation, recordSold);
router.post('/transfer', transferValidation, transferStock);
router.put('/:id/settle', settleTransfer);

module.exports = router;