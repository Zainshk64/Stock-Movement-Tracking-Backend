const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a product name'],
      trim: true,
      maxlength: [100, 'Name cannot be more than 100 characters'],
    },
    brand: {
      type: String,
      required: [true, 'Please add a brand'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Please add a category'],
      enum: ['Smartphones', 'Accessories', 'Tablets', 'Wearables'],
    },
    price: {
      type: Number,
      required: [true, 'Please add a price'],
      min: [0, 'Price cannot be negative'],
    },
    originalPrice: {
      type: Number,
      min: [0, 'Original price cannot be negative'],
    },
    stock: {
      type: Number,
      required: [true, 'Please add stock quantity'],
      min: [0, 'Stock cannot be negative'],
      default: 0,
    },
    description: {
      type: String,
      maxlength: [1000, 'Description cannot be more than 1000 characters'],
    },
    image: {
      type: String,
      default: 'https://via.placeholder.com/300x300?text=Product',
    },
    specifications: {
      type: Map,
      of: String,
    },
    rating: {
      type: Number,
      min: [0, 'Rating must be at least 0'],
      max: [5, 'Rating cannot be more than 5'],
      default: 0,
    },
    reviews: {
      type: Number,
      default: 0,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-deactivate when stock is 0
productSchema.pre('save', function (next) {
  if (this.stock === 0) {
    this.isActive = false;
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);