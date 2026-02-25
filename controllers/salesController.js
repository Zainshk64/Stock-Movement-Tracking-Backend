const Sale = require('../models/Sale');
const Product = require('../models/Product');
const StockLog = require('../models/StockLog');
const { validationResult } = require('express-validator');

// @desc    Get all sales
// @route   GET /api/sales
// @access  Private/Admin
const getSales = async (req, res) => {
  try {
    const { product, customer, startDate, endDate, page = 1, limit = 20 } = req.query;

    let query = {};

    if (product) {
      query.product = product;
    }

    if (customer) {
      query.customer = { $regex: customer, $options: 'i' };
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const sales = await Sale.find(query)
      .populate('product', 'name price image')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Sale.countDocuments(query);

    res.json({
      success: true,
      count: sales.length,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      data: sales,
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

// @desc    Create sale
// @route   POST /api/sales
// @access  Private/Admin
const createSale = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { productId, quantity, customer, paymentMethod, notes } = req.body;

    // Find product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Check stock
    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock. Available: ${product.stock}`,
      });
    }

    // Calculate amount
    const amount = product.price * quantity;

    // Create sale
    const sale = await Sale.create({
      product: productId,
      productName: product.name,
      quantity,
      amount,
      customer: customer || 'Walk-in',
      paymentMethod,
      notes,
      createdBy: req.user._id,
    });

    // Update product stock
    product.stock -= quantity;
    await product.save();

    // Create stock log
    await StockLog.create({
      product: productId,
      productName: product.name,
      type: 'sold',
      quantity,
      reference: `SALE-${sale._id}`,
      amount,
      notes: `Sale to ${customer || 'Walk-in'}`,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: 'Sale recorded successfully',
      data: sale,
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

// @desc    Get sales reports
// @route   GET /api/sales/reports
// @access  Private/Admin
const getSalesReports = async (req, res) => {
  try {
    const { period = 'all' } = req.query;

    let dateFilter = {};
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (period === 'daily') {
      dateFilter = { createdAt: { $gte: today } };
    } else if (period === 'weekly') {
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      dateFilter = { createdAt: { $gte: weekAgo } };
    } else if (period === 'monthly') {
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      dateFilter = { createdAt: { $gte: monthAgo } };
    }

    // Total stats
    const totalStats = await Sale.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' },
          totalOrders: { $sum: 1 },
          totalUnits: { $sum: '$quantity' },
        },
      },
    ]);

    // Product-wise sales
    const productWiseSales = await Sale.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$product',
          productName: { $first: '$productName' },
          totalQuantity: { $sum: '$quantity' },
          totalRevenue: { $sum: '$amount' },
          totalOrders: { $sum: 1 },
        },
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 10 },
    ]);

    // Daily breakdown
    const dailyBreakdown = await Sale.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          revenue: { $sum: '$amount' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: -1 } },
      { $limit: 30 },
    ]);

    res.json({
      success: true,
      data: {
        summary: totalStats[0] || {
          totalRevenue: 0,
          totalOrders: 0,
          totalUnits: 0,
        },
        productWiseSales,
        dailyBreakdown,
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

// @desc    Get dashboard stats
// @route   GET /api/sales/dashboard
// @access  Private/Admin
const getDashboardStats = async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments({ isActive: true });
    const lowStockProducts = await Product.countDocuments({
      stock: { $lte: 5 },
      isActive: true,
    });

    const totalRevenue = await Sale.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const totalUnitsSold = await Sale.aggregate([
      { $group: { _id: null, total: { $sum: '$quantity' } } },
    ]);

    const unsettledAmount = await StockLog.aggregate([
      { $match: { type: 'transferred', settled: false } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const recentSales = await Sale.find()
      .populate('product', 'name')
      .sort({ createdAt: -1 })
      .limit(10);

    const unsettledTransfers = await StockLog.find({
      type: 'transferred',
      settled: false,
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        totalProducts,
        lowStockProducts,
        totalRevenue: totalRevenue[0]?.total || 0,
        totalUnitsSold: totalUnitsSold[0]?.total || 0,
        unsettledAmount: unsettledAmount[0]?.total || 0,
        recentSales,
        unsettledTransfers,
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

// @desc    Get single sale
// @route   GET /api/sales/:id
// @access  Private/Admin
const getSale = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate('product', 'name price image')
      .populate('createdBy', 'name');

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Sale not found',
      });
    }

    res.json({
      success: true,
      data: sale,
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

// @desc    Delete sale (and restore stock)
// @route   DELETE /api/sales/:id
// @access  Private/Admin
const deleteSale = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Sale not found',
      });
    }

    // Restore product stock
    const product = await Product.findById(sale.product);
    if (product) {
      product.stock += sale.quantity;
      await product.save();
    }

    // Delete related stock log
    await StockLog.findOneAndDelete({
      reference: `SALE-${sale._id}`,
    });

    // Delete sale
    await Sale.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Sale deleted and stock restored',
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
  getSales,
  getSale,
  deleteSale,
  createSale,
  getSalesReports,
  getDashboardStats,
};