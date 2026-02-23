const StockLog = require('../models/StockLog');
const Product = require('../models/Product');
const { validationResult } = require('express-validator');

// @desc    Get all stock logs
// @route   GET /api/stock
// @access  Private/Admin
const getStockLogs = async (req, res) => {
  try {
    const { type, settled, product, page = 1, limit = 20 } = req.query;

    let query = {};

    if (type && type !== 'all') {
      query.type = type;
    }

    if (settled === 'true') {
      query.settled = true;
    } else if (settled === 'false') {
      query.settled = false;
    }

    if (product) {
      query.product = product;
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const logs = await StockLog.find(query)
      .populate('product', 'name price')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await StockLog.countDocuments(query);

    res.json({
      success: true,
      count: logs.length,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      data: logs,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Add stock
// @route   POST /api/stock/add
// @access  Private/Admin
const addStock = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { productId, quantity, reference, notes } = req.body;

    // Find product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Update product stock
    product.stock += quantity;
    product.isActive = true;
    await product.save();

    // Create stock log
    const stockLog = await StockLog.create({
      product: productId,
      productName: product.name,
      type: 'added',
      quantity,
      reference,
      amount: quantity * product.price,
      notes,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: 'Stock added successfully',
      data: stockLog,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Record sale (reduce stock)
// @route   POST /api/stock/sold
// @access  Private/Admin
const recordSold = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { productId, quantity, reference, notes } = req.body;

    // Find product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Check stock availability
    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock. Available: ${product.stock}`,
      });
    }

    // Update product stock
    product.stock -= quantity;
    await product.save();

    // Create stock log
    const stockLog = await StockLog.create({
      product: productId,
      productName: product.name,
      type: 'sold',
      quantity,
      reference,
      amount: quantity * product.price,
      notes,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: 'Sale recorded successfully',
      data: stockLog,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Transfer stock to person/shop
// @route   POST /api/stock/transfer
// @access  Private/Admin
const transferStock = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { productId, quantity, person, reference, notes } = req.body;

    // Find product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Check stock availability
    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock. Available: ${product.stock}`,
      });
    }

    // Update product stock
    product.stock -= quantity;
    await product.save();

    // Create stock log
    const stockLog = await StockLog.create({
      product: productId,
      productName: product.name,
      type: 'transferred',
      quantity,
      person,
      reference,
      amount: quantity * product.price,
      settled: false,
      notes,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: 'Stock transferred successfully',
      data: stockLog,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Mark transfer as settled
// @route   PUT /api/stock/:id/settle
// @access  Private/Admin
const settleTransfer = async (req, res) => {
  try {
    const stockLog = await StockLog.findById(req.params.id);

    if (!stockLog) {
      return res.status(404).json({
        success: false,
        message: 'Stock log not found',
      });
    }

    if (stockLog.type !== 'transferred') {
      return res.status(400).json({
        success: false,
        message: 'Only transfers can be settled',
      });
    }

    stockLog.settled = true;
    await stockLog.save();

    res.json({
      success: true,
      message: 'Transfer marked as settled',
      data: stockLog,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Get unsettled transfers
// @route   GET /api/stock/unsettled
// @access  Private/Admin
const getUnsettledTransfers = async (req, res) => {
  try {
    const logs = await StockLog.find({
      type: 'transferred',
      settled: false,
    })
      .populate('product', 'name price')
      .sort({ createdAt: -1 });

    const totalAmount = logs.reduce((sum, log) => sum + log.amount, 0);

    res.json({
      success: true,
      count: logs.length,
      totalAmount,
      data: logs,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Get stock stats
// @route   GET /api/stock/stats
// @access  Private/Admin
const getStockStats = async (req, res) => {
  try {
    const totalAdded = await StockLog.aggregate([
      { $match: { type: 'added' } },
      { $group: { _id: null, total: { $sum: '$quantity' } } },
    ]);

    const totalSold = await StockLog.aggregate([
      { $match: { type: 'sold' } },
      { $group: { _id: null, total: { $sum: '$quantity' } } },
    ]);

    const totalTransferred = await StockLog.aggregate([
      { $match: { type: 'transferred' } },
      { $group: { _id: null, total: { $sum: '$quantity' } } },
    ]);

    const unsettledAmount = await StockLog.aggregate([
      { $match: { type: 'transferred', settled: false } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    res.json({
      success: true,
      data: {
        totalAdded: totalAdded[0]?.total || 0,
        totalSold: totalSold[0]?.total || 0,
        totalTransferred: totalTransferred[0]?.total || 0,
        unsettledAmount: unsettledAmount[0]?.total || 0,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

module.exports = {
  getStockLogs,
  addStock,
  recordSold,
  transferStock,
  settleTransfer,
  getUnsettledTransfers,
  getStockStats,
};