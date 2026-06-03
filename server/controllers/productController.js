const Product = require('../models/Product');
const { ALL_UNITS, convertToBase } = require('../utils/unitConversion');

// @route  GET /api/products
// @access Private
exports.getProducts = async (req, res) => {
  const { search, category, isActive, page = 1, limit = 20 } = req.query;

  const query = {};

  // Text search
  if (search) {
    query.$text = { $search: search };
  }

  // Category filter
  if (category) query.category = { $regex: category, $options: 'i' };

  // Active filter (admin sees all, sellers only see active)
  if (req.user.role === 'seller') {
    query.isActive = true;
  } else if (isActive !== undefined) {
    query.isActive = isActive === 'true';
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [products, total] = await Promise.all([
    Product.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('createdBy', 'name'),
    Product.countDocuments(query),
  ]);

  res.json({
    success: true,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit)),
    products,
  });
};

// @route  GET /api/products/:id
// @access Private
exports.getProduct = async (req, res) => {
  const product = await Product.findById(req.params.id).populate('createdBy', 'name');
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
  res.json({ success: true, product });
};

// @route  POST /api/products
// @access Admin only
exports.createProduct = async (req, res) => {
  const {
    name, sku, description, category,
    baseUnit, basePricePerUnit,
    stockQty, lowStockThreshold, isActive,
  } = req.body;

  if (!name || !sku || !baseUnit || basePricePerUnit === undefined) {
    return res.status(400).json({ success: false, message: 'name, sku, baseUnit, and basePricePerUnit are required' });
  }

  if (!ALL_UNITS.includes(baseUnit)) {
    return res.status(400).json({ success: false, message: `Invalid baseUnit. Must be one of: ${ALL_UNITS.join(', ')}` });
  }

  // basePricePerUnit is received in INR (e.g. 1.50) and stored as paise (150)
  const priceInPaise = Math.round(parseFloat(basePricePerUnit) * 100);

  const product = await Product.create({
    name,
    sku: sku.toUpperCase(),
    description,
    category,
    baseUnit,
    basePricePerUnit: priceInPaise.toString(),
    stockQty: (parseFloat(stockQty) || 0).toString(),
    lowStockThreshold: (parseFloat(lowStockThreshold) || 0).toString(),
    isActive: isActive !== undefined ? isActive : true,
    createdBy: req.user._id,
  });

  res.status(201).json({ success: true, product });
};

// @route  PUT /api/products/:id
// @access Admin only
exports.updateProduct = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

  const {
    name, description, category,
    basePricePerUnit, stockQty, lowStockThreshold, isActive,
  } = req.body;

  if (name !== undefined) product.name = name;
  if (description !== undefined) product.description = description;
  if (category !== undefined) product.category = category;
  if (isActive !== undefined) product.isActive = isActive;
  if (lowStockThreshold !== undefined)
    product.lowStockThreshold = (parseFloat(lowStockThreshold)).toString();

  // Price is received in INR, stored as paise
  if (basePricePerUnit !== undefined) {
    product.basePricePerUnit = Math.round(parseFloat(basePricePerUnit) * 100).toString();
  }

  // Stock adjustment (admin can directly set stock in base units)
  if (stockQty !== undefined) {
    product.stockQty = (parseFloat(stockQty)).toString();
  }

  await product.save();
  res.json({ success: true, product });
};

// @route  DELETE /api/products/:id
// @access Admin only
exports.deleteProduct = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

  // Soft delete — just mark inactive
  product.isActive = false;
  await product.save();

  res.json({ success: true, message: 'Product deactivated successfully' });
};

// @route  GET /api/products/categories
// @access Private
exports.getCategories = async (req, res) => {
  const categories = await Product.distinct('category', { category: { $ne: null, $ne: '' } });
  res.json({ success: true, categories: categories.sort() });
};

// @route  POST /api/products/inquire
// @access Private
exports.inquireProduct = async (req, res) => {
  const { chemicalName } = req.body;
  if (!chemicalName) {
    return res.status(400).json({ success: false, message: 'Chemical name is required' });
  }

  const User = require('../models/User');
  const admin = await User.findOne({ role: 'admin' });
  const adminEmail = admin ? admin.email : 'admin@aasa.com';

  const nodemailer = require('nodemailer');

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER || 'noreply@aasaadmedchem.com',
      pass: process.env.GMAIL_CLIENT_SECRET || '',
    }
  });

  const mailOptions = {
    from: req.user.email,
    to: adminEmail,
    subject: `Chemical Inquiry: ${chemicalName}`,
    text: `Hello Admin,

Seller ${req.user.name} (${req.user.email}, Company: ${req.user.company || 'N/A'}, Phone: ${req.user.phone || 'N/A'}) searched for the chemical "${chemicalName}" and it was not found in the catalog.

They are inquiring about when this chemical will be available.

Please update the catalog or contact the seller.

Regards,
AasaMedChem Portal`,
  };

  let emailSent = false;
  let emailError = null;

  try {
    if (process.env.GMAIL_USER && process.env.GMAIL_CLIENT_SECRET) {
      await transporter.sendMail(mailOptions);
      emailSent = true;
    } else {
      console.log('Skipping actual email sending: GMAIL_USER or GMAIL_CLIENT_SECRET not configured in .env');
    }
  } catch (err) {
    console.error('Failed to send inquiry email via nodemailer:', err.message);
    emailError = err.message;
  }

  // Log inquiry locally so it is visible in the server console log
  console.log(`[INQUIRY LOGGED] From: ${req.user.email} -> To: ${adminEmail} | Subject: ${mailOptions.subject}`);
  console.log(`Body:\n${mailOptions.text}\n-------------------`);

  return res.json({
    success: true,
    message: emailSent
      ? 'Inquiry email sent to Admin successfully!'
      : 'Inquiry received. The Admin has been notified.',
    emailSent,
    emailError,
  });
};
