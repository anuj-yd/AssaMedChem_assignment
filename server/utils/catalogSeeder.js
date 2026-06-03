const User = require('../models/User');
const Product = require('../models/Product');
const PRODUCTS = require('./seedProducts');

const seedProductCatalogIfEmpty = async () => {
  try {
    const productCount = await Product.countDocuments();
    if (productCount > 0) {
      console.log('📊 Product catalog already has products. Skipping auto-seed.');
      return;
    }

    console.log('🌱 Product catalog is empty. Auto-seeding catalog...');

    // Find or create an admin user to be the owner of the products
    let admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      console.log('👤 No admin found for products ownership. Creating default admin...');
      admin = await User.create({
        name: 'Admin User',
        email: 'admin@aasa.com',
        password: 'Admin@123',
        role: 'admin',
        company: 'AasaMedChem Labs',
        phone: '+91-9000000001',
      });
      console.log('✅ Default admin created');
    }

    const productDocs = PRODUCTS.map((p) => ({
      ...p,
      basePricePerUnit: Math.round(p.basePricePerUnitINR * 100).toString(),
      stockQty:         p.stockQty.toString(),
      lowStockThreshold: p.lowStockThreshold.toString(),
      createdBy:        admin._id,
    }));

    await Product.insertMany(productDocs);
    console.log(`✅ Auto-seeded ${productDocs.length} products successfully!`);
  } catch (error) {
    console.error('❌ Auto-seeding catalog failed:', error.message);
  }
};

module.exports = seedProductCatalogIfEmpty;
