const mongoose = require('mongoose');
const { ALL_UNITS } = require('../utils/unitConversion');

// Each line item in an order snapshot
const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    productName: { type: String, required: true },   // snapshot at order time
    productSku:  { type: String, required: true },   // snapshot at order time

    // Unit the customer chose when ordering (e.g. "kg")
    orderedUnit: {
      type: String,
      required: true,
      enum: ALL_UNITS,
    },
    // Quantity in the unit the customer chose (Decimal128 for precision)
    orderedQty: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
      get: (v) => (v ? parseFloat(v.toString()) : 0),
    },
    // Quantity converted to product's baseUnit (stored for inventory tracking)
    baseQty: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
      get: (v) => (v ? parseFloat(v.toString()) : 0),
    },
    // Product's base unit at time of order
    baseUnit: { type: String, required: true },

    // Price per ONE orderedUnit in INR paise (snapshot at order time)
    pricePerOrderedUnit: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
      get: (v) => (v ? parseFloat(v.toString()) : 0),
    },
    // orderedQty × pricePerOrderedUnit in INR paise
    lineTotal: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
      get: (v) => (v ? parseFloat(v.toString()) : 0),
    },
  },
  { _id: false, toJSON: { getters: true }, toObject: { getters: true } }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sellerName:  { type: String },
    sellerEmail: { type: String },

    status: {
      type: String,
      enum: ['quotation', 'confirmed', 'processing', 'fulfilled', 'cancelled'],
      default: 'quotation',
    },

    items: {
      type: [orderItemSchema],
      validate: {
        validator: (v) => v.length > 0,
        message: 'Order must have at least one item',
      },
    },

    // Sum of all lineTotals in INR paise
    totalAmount: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
      get: (v) => (v ? parseFloat(v.toString()) : 0),
    },

    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
    },

    adminNotes: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
  },
  {
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true },
  }
);

// Auto-generate order number before saving
orderSchema.pre('save', async function (next) {
  if (this.isNew) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `AMC-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

orderSchema.index({ seller: 1, status: 1 });
orderSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
