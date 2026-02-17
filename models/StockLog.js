const mongoose = require('mongoose');

const stockLogSchema = new mongoose.Schema(
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
    type: {
      type: String,
      enum: ['added', 'sold', 'transferred'],
      required: true,
    },
    quantity: {
      type: Number,
      required: [true, 'Please add quantity'],
      min: [1, 'Quantity must be at least 1'],
    },
    reference: {
      type: String,
      trim: true,
    },
    person: {
      type: String,
      trim: true,
    },
    amount: {
      type: Number,
      default: 0,
    },
    settled: {
      type: Boolean,
      default: true,
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

// Generate reference if not provided
stockLogSchema.pre('save', function (next) {
  if (!this.reference) {
    const prefix = this.type === 'added' ? 'PO' : this.type === 'sold' ? 'INV' : 'TRF';
    this.reference = `${prefix}-${Date.now()}`;
  }
  next();
});

module.exports = mongoose.model('StockLog', stockLogSchema);