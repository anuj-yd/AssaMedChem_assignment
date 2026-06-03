const Order = require('../models/Order');
const Product = require('../models/Product');
const {
  convertToBase,
  pricePerUnit,
  getBaseUnit,
  validateCompatibleUnits,
} = require('../utils/unitConversion');

// @route  GET /api/orders
// @access Private (Admin sees all, Seller sees own)
exports.getOrders = async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const query = {};

  if (req.user.role === 'seller') query.seller = req.user._id;
  if (status) query.status = status;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [orders, total] = await Promise.all([
    Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('seller', 'name email company'),
    Order.countDocuments(query),
  ]);

  res.json({
    success: true,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit)),
    orders,
  });
};

// @route  GET /api/orders/:id
// @access Private
exports.getOrder = async (req, res) => {
  const order = await Order.findById(req.params.id).populate('seller', 'name email company phone');
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

  // Sellers can only view their own orders
  if (req.user.role === 'seller' && order.seller._id.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  res.json({ success: true, order });
};

// @route  POST /api/orders
// @access Seller
exports.createOrder = async (req, res) => {
  const { items, notes } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Order must have at least one item' });
  }

  const processedItems = [];
  let totalAmountPaise = 0;

  for (const item of items) {
    const { productId, orderedUnit, orderedQty } = item;

    if (!productId || !orderedUnit || !orderedQty) {
      return res.status(400).json({ success: false, message: 'Each item needs productId, orderedUnit, orderedQty' });
    }

    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({ success: false, message: `Product ${productId} not found or inactive` });
    }

    // Validate unit compatibility (e.g. can't order kg for a mL product)
    try {
      validateCompatibleUnits(orderedUnit, product.baseUnit);
    } catch (e) {
      return res.status(400).json({ success: false, message: e.message });
    }

    const qty = parseFloat(orderedQty);
    if (qty <= 0) {
      return res.status(400).json({ success: false, message: 'Quantity must be greater than 0' });
    }

    // Convert ordered qty to base unit for inventory tracking
    const baseQty = convertToBase(qty, orderedUnit);

    // basePricePerUnit is stored in paise per base unit
    const basePricePaise = parseFloat(product.basePricePerUnit.toString());

    // Price per ordered unit = basePricePaise × conversionFactor(orderedUnit)
    const pricePerOrderedUnitPaise = pricePerUnit(basePricePaise, orderedUnit);

    // Line total in paise
    const lineTotalPaise = pricePerOrderedUnitPaise * qty;
    totalAmountPaise += lineTotalPaise;

    processedItems.push({
      product: product._id,
      productName: product.name,
      productSku: product.sku,
      orderedUnit,
      orderedQty: qty.toString(),
      baseQty: baseQty.toString(),
      baseUnit: product.baseUnit,
      pricePerOrderedUnit: pricePerOrderedUnitPaise.toString(),
      lineTotal: lineTotalPaise.toString(),
    });
  }

  const order = await Order.create({
    seller: req.user._id,
    sellerName: req.user.name,
    sellerEmail: req.user.email,
    items: processedItems,
    totalAmount: Math.round(totalAmountPaise).toString(),
    notes,
    status: 'quotation',
  });

  res.status(201).json({ success: true, order });
};

// @route  PATCH /api/orders/:id/status
// @access Admin
exports.updateOrderStatus = async (req, res) => {
  const { status, adminNotes } = req.body;
  const validStatuses = ['quotation', 'confirmed', 'processing', 'fulfilled', 'cancelled'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: `Invalid status. Must be: ${validStatuses.join(', ')}` });
  }

  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

  order.status = status;
  if (adminNotes !== undefined) order.adminNotes = adminNotes;
  await order.save();

  res.json({ success: true, order });
};

// @route  DELETE /api/orders/:id (cancel)
// @access Seller (own quotations only)
exports.cancelOrder = async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

  if (order.seller.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  if (order.status !== 'quotation') {
    return res.status(400).json({ success: false, message: 'Only quotations can be cancelled by the seller' });
  }

  order.status = 'cancelled';
  await order.save();
  res.json({ success: true, message: 'Order cancelled', order });
};

// @route  GET /api/orders/stats
// @access Admin
exports.getStats = async (req, res) => {
  const [productCount, activeUsers, orderStats] = await Promise.all([
    Product.countDocuments({ isActive: true }),
    require('../models/User').countDocuments({ role: 'seller', isActive: true }),
    Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          total: { $sum: { $toDouble: '$totalAmount' } },
        },
      },
    ]),
  ]);

  const stats = { productCount, activeUsers, ordersByStatus: {} };
  let totalRevenuePaise = 0;
  let totalOrders = 0;

  orderStats.forEach(({ _id, count, total }) => {
    stats.ordersByStatus[_id] = { count, totalPaise: total };
    totalRevenuePaise += total;
    totalOrders += count;
  });

  stats.totalOrders = totalOrders;
  // Return revenue in INR (divide paise by 100)
  stats.totalRevenueInr = totalRevenuePaise / 100;

  res.json({ success: true, stats });
};
