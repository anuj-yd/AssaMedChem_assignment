const mongoose = require('mongoose');
const { ALL_UNITS } = require('../utils/unitConversion');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [200, 'Product name cannot exceed 200 characters'],
    },
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    category: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    // The unit in which stock is tracked and prices are set.
    // Weight products → 'g' | Volume products → 'mL' | Count → 'unit'
    baseUnit: {
      type: String,
      required: [true, 'Base unit is required'],
      enum: {
        values: ALL_UNITS,
        message: `Base unit must be one of: ${ALL_UNITS.join(', ')}`,
      },
    },
    // Price per ONE base unit, stored in INR paise (1 INR = 100 paise)
    // Using Decimal128 for high precision on large and fractional values.
    // Example: ₹1.50 / g → stored as Decimal128("150") paise/g
    basePricePerUnit: {
      type: mongoose.Schema.Types.Decimal128,
      required: [true, 'Base price per unit is required'],
      get: (v) => (v ? parseFloat(v.toString()) : 0),
    },
    // Stock quantity in base units
    stockQty: {
      type: mongoose.Schema.Types.Decimal128,
      default: '0',
      get: (v) => (v ? parseFloat(v.toString()) : 0),
    },
    lowStockThreshold: {
      type: mongoose.Schema.Types.Decimal128,
      default: '0',
      get: (v) => (v ? parseFloat(v.toString()) : 0),
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true },
  }
);

// Text index for search
productSchema.index({ name: 'text', sku: 'text', category: 'text', description: 'text' });
productSchema.index({ category: 1, isActive: 1 });

module.exports = mongoose.model('Product', productSchema);
