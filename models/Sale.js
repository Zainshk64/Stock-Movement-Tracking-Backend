const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    productName: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: [true, 'Please add quantity'],
      min: [1, 'Quantity must be at least 1'],
    },
    amount: {
      type: Number,
      required: [true, 'Please add amount'],
      min: [0, 'Amount cannot be negative'],
    },
    customer: {
      type: String,
      default: 'Walk-in',
      trim: true,
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'online', 'credit'],
      default: 'cash',
    },
    notes: {
      type: String,
      maxlength: [500, 'Notes cannot be more than 500 characters'],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Sale', saleSchema);