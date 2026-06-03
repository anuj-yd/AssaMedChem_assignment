/**
 * Seed script — creates demo admin + seller accounts + sample chemical products
 * Run: node scripts/seed.js
 */

require('dotenv').config({ path: '../.env' });
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

// Prices are INR per base unit.
// Internally stored as paise (×100). Seed script converts below.
const PRODUCTS = [
  {
    name: 'Sodium Chloride (NaCl)',
    sku: 'NaCl-AR-001',
    description: 'Analytical reagent grade sodium chloride, ≥99.5% purity',
    category: 'Inorganic Salts',
    baseUnit: 'g',
    basePricePerUnitINR: 0.25, // ₹0.25 per gram → ₹250 per kg
    stockQty: 50000,           // 50 kg in grams
    lowStockThreshold: 1000,
  },
  {
    name: 'Ethanol Absolute (C₂H₅OH)',
    sku: 'EtOH-ABS-002',
    description: 'Absolute ethanol, ≥99.9% anhydrous, HPLC grade',
    category: 'Solvents',
    baseUnit: 'mL',
    basePricePerUnitINR: 0.085, // ₹0.085 per mL → ₹85 per L
    stockQty: 100000,           // 100 L in mL
    lowStockThreshold: 5000,
  },
  {
    name: 'Hydrochloric Acid (HCl) 37%',
    sku: 'HCl-37-003',
    description: 'Concentrated hydrochloric acid, 37% w/w, AR grade',
    category: 'Acids',
    baseUnit: 'mL',
    basePricePerUnitINR: 0.12,
    stockQty: 25000,
    lowStockThreshold: 2000,
  },
  {
    name: 'Glucose Anhydrous (D-Glucose)',
    sku: 'GLU-AH-004',
    description: 'D-(+)-Glucose anhydrous, ≥99.5%, suitable for cell culture',
    category: 'Sugars & Carbohydrates',
    baseUnit: 'g',
    basePricePerUnitINR: 1.80,
    stockQty: 10000,
    lowStockThreshold: 500,
  },
  {
    name: 'Sulfuric Acid (H₂SO₄) 98%',
    sku: 'H2SO4-98-005',
    description: 'Concentrated sulfuric acid, 98% w/w, analytical reagent',
    category: 'Acids',
    baseUnit: 'mL',
    basePricePerUnitINR: 0.09,
    stockQty: 20000,
    lowStockThreshold: 1000,
  },
  {
    name: 'Acetone (CH₃COCH₃)',
    sku: 'ACE-HPLC-006',
    description: 'Acetone HPLC grade, ≥99.9% purity, low water content',
    category: 'Solvents',
    baseUnit: 'mL',
    basePricePerUnitINR: 0.07,
    stockQty: 50000,
    lowStockThreshold: 3000,
  },
  {
    name: 'Potassium Permanganate (KMnO₄)',
    sku: 'KMnO4-AR-007',
    description: 'Potassium permanganate, AR grade, ≥99.0% purity',
    category: 'Oxidizing Agents',
    baseUnit: 'g',
    basePricePerUnitINR: 0.95,
    stockQty: 5000,
    lowStockThreshold: 250,
  },
  {
    name: 'Methanol (CH₃OH)',
    sku: 'MeOH-HPLC-008',
    description: 'Methanol HPLC grade, ≥99.9% purity, UV cutoff 205 nm',
    category: 'Solvents',
    baseUnit: 'mL',
    basePricePerUnitINR: 0.065,
    stockQty: 75000,
    lowStockThreshold: 5000,
  },
  {
    name: 'Ammonium Chloride (NH₄Cl)',
    sku: 'NH4Cl-AR-009',
    description: 'Ammonium chloride, analytical reagent grade, ≥99.5%',
    category: 'Inorganic Salts',
    baseUnit: 'g',
    basePricePerUnitINR: 0.35,
    stockQty: 20000,
    lowStockThreshold: 500,
  },
  {
    name: 'Borosilicate Glass Beakers 250mL',
    sku: 'BGK-250-010',
    description: 'Borosilicate 3.3 glass beaker, 250mL capacity, with spout',
    category: 'Glassware',
    baseUnit: 'unit',
    basePricePerUnitINR: 185,
    stockQty: 200,
    lowStockThreshold: 10,
  },
  {
    name: 'Sodium Hydroxide (NaOH) Pellets',
    sku: 'NaOH-PL-011',
    description: 'Sodium hydroxide pellets, AR grade, ≥98% purity',
    category: 'Bases',
    baseUnit: 'g',
    basePricePerUnitINR: 0.42,
    stockQty: 30000,
    lowStockThreshold: 1000,
  },
  {
    name: 'Isopropyl Alcohol (IPA) 99.9%',
    sku: 'IPA-999-012',
    description: 'Isopropyl alcohol / 2-Propanol, electronics grade, ≥99.9%',
    category: 'Solvents',
    baseUnit: 'mL',
    basePricePerUnitINR: 0.078,
    stockQty: 60000,
    lowStockThreshold: 4000,
  },
];

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
