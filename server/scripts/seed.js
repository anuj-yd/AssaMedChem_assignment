/**
 * Seed script — creates demo admin + seller accounts + sample chemical products
 * Run: node scripts/seed.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const User    = require('../models/User');
const Product = require('../models/Product');
const connectDB = require('../config/db');

const ADMIN = {
  name:     'Admin User',
  email:    'admin@aasa.com',
  password: 'Admin@123',
  role:     'admin',
  company:  'AasaMedChem Labs',
  phone:    '+91-9000000001',
};

const SELLER = {
  name:     'Sample Seller',
  email:    'seller@aasa.com',
  password: 'Seller@123',
  role:     'seller',
  company:  'BestChem Distributors',
  phone:    '+91-9000000002',
};

const PRODUCTS = require('../utils/seedProducts');


async function seed() {
  await connectDB();
  console.log('\n🌱 Starting seed...\n');

  // Clear existing data
  await Promise.all([
    User.deleteMany({}),
    Product.deleteMany({}),
  ]);
  console.log('🗑️  Cleared existing data');

  // Create users
  const admin  = await User.create(ADMIN);
  const seller = await User.create(SELLER);
  console.log(`✅ Admin  created: ${admin.email}`);
  console.log(`✅ Seller created: ${seller.email}`);

  // Create products
  const productDocs = PRODUCTS.map((p) => ({
    ...p,
    basePricePerUnit: Math.round(p.basePricePerUnitINR * 100).toString(),
    stockQty:         p.stockQty.toString(),
    lowStockThreshold: p.lowStockThreshold.toString(),
    createdBy:        admin._id,
  }));

  const products = await Product.insertMany(productDocs);
  console.log(`✅ Created ${products.length} products`);

  console.log('\n🎉 Seed complete!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Admin:  admin@aasa.com  / Admin@123');
  console.log('  Seller: seller@aasa.com / Seller@123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
