/**
 * dev-server.js — Development entry point with optional in-memory MongoDB.
 * 
 * If MONGO_URI contains "xxxxx" (placeholder) or is missing, this script:
 *  1. Downloads and starts a local MongoDB Memory Server instance
 *  2. Injects the URI into process.env
 *  3. Auto-seeds the database with demo data
 *  4. Then starts the Express app normally
 * 
 * This means zero configuration is needed for local development.
 */

require('dotenv').config();
require('express-async-errors');

async function startWithMemoryDB() {
  const { MongoMemoryServer } = require('mongodb-memory-server');
  console.log('⚡ Starting MongoDB Memory Server (no MONGO_URI configured)...');
  const mongod = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongod.getUri() + 'assamedhchem';
  console.log(`✅ In-memory MongoDB ready: ${process.env.MONGO_URI}`);

  // Auto-seed
  const mongoose = require('mongoose');
  await mongoose.connect(process.env.MONGO_URI);

  const bcrypt  = require('bcryptjs');
  const User    = require('./models/User');
  const Product = require('./models/Product');

  // Create admin + seller
  await User.deleteMany({});
  await User.create([
    { name:'Admin User',    email:'admin@aasa.com',  password:'Admin@123',  role:'admin',  company:'AasaMedChem Labs',      phone:'+91-9000000001' },
    { name:'Sample Seller', email:'seller@aasa.com', password:'Seller@123', role:'seller', company:'BestChem Distributors', phone:'+91-9000000002' },
  ]);

  // Create products
  await Product.deleteMany({});
  const admin = await User.findOne({ role:'admin' });
  const PRODUCTS = [
    { name:'Sodium Chloride (NaCl)',         sku:'NaCl-AR-001',   description:'Analytical reagent grade NaCl, ≥99.5% purity',           category:'Inorganic Salts',        baseUnit:'g',    basePricePerUnit:'25',    stockQty:'50000',  lowStockThreshold:'1000'  },
    { name:'Ethanol Absolute (C₂H₅OH)',      sku:'EtOH-ABS-002',  description:'Absolute ethanol, ≥99.9% anhydrous, HPLC grade',          category:'Solvents',               baseUnit:'mL',   basePricePerUnit:'9',     stockQty:'100000', lowStockThreshold:'5000'  },
    { name:'Hydrochloric Acid (HCl) 37%',   sku:'HCl-37-003',    description:'Concentrated HCl, 37% w/w, AR grade',                     category:'Acids',                  baseUnit:'mL',   basePricePerUnit:'12',    stockQty:'25000',  lowStockThreshold:'2000'  },
    { name:'Glucose Anhydrous (D-Glucose)',  sku:'GLU-AH-004',    description:'D-(+)-Glucose anhydrous, ≥99.5%, cell culture suitable',   category:'Sugars & Carbohydrates', baseUnit:'g',    basePricePerUnit:'180',   stockQty:'10000',  lowStockThreshold:'500'   },
    { name:'Sulfuric Acid (H₂SO₄) 98%',    sku:'H2SO4-98-005',  description:'Concentrated H₂SO₄, 98% w/w, analytical reagent',         category:'Acids',                  baseUnit:'mL',   basePricePerUnit:'9',     stockQty:'20000',  lowStockThreshold:'1000'  },
    { name:'Acetone (CH₃COCH₃)',            sku:'ACE-HPLC-006',  description:'Acetone HPLC grade, ≥99.9% purity, low water content',    category:'Solvents',               baseUnit:'mL',   basePricePerUnit:'7',     stockQty:'50000',  lowStockThreshold:'3000'  },
    { name:'Potassium Permanganate (KMnO₄)',sku:'KMnO4-AR-007',  description:'KMnO₄ AR grade, ≥99.0% purity, strong oxidizer',          category:'Oxidizing Agents',       baseUnit:'g',    basePricePerUnit:'95',    stockQty:'5000',   lowStockThreshold:'250'   },
    { name:'Methanol (CH₃OH)',              sku:'MeOH-HPLC-008', description:'Methanol HPLC grade, ≥99.9%, UV cutoff 205 nm',           category:'Solvents',               baseUnit:'mL',   basePricePerUnit:'7',     stockQty:'75000',  lowStockThreshold:'5000'  },
    { name:'Ammonium Chloride (NH₄Cl)',     sku:'NH4Cl-AR-009',  description:'Ammonium chloride AR grade, ≥99.5%',                      category:'Inorganic Salts',        baseUnit:'g',    basePricePerUnit:'35',    stockQty:'20000',  lowStockThreshold:'500'   },
    { name:'Borosilicate Beakers 250mL',    sku:'BGK-250-010',   description:'Borosilicate 3.3 glass beaker, 250mL, with spout',        category:'Glassware',              baseUnit:'unit', basePricePerUnit:'18500', stockQty:'200',    lowStockThreshold:'10'    },
    { name:'Sodium Hydroxide (NaOH) Pellets',sku:'NaOH-PL-011',  description:'NaOH pellets AR grade, ≥98% purity',                     category:'Bases',                  baseUnit:'g',    basePricePerUnit:'42',    stockQty:'30000',  lowStockThreshold:'1000'  },
    { name:'Isopropyl Alcohol (IPA) 99.9%', sku:'IPA-999-012',   description:'IPA / 2-Propanol, electronics grade, ≥99.9%',            category:'Solvents',               baseUnit:'mL',   basePricePerUnit:'8',     stockQty:'850',    lowStockThreshold:'4000'  },
  ];
  await Product.insertMany(PRODUCTS.map((p) => ({ ...p, createdBy: admin._id })));

  await mongoose.disconnect();
  console.log('🌱 Auto-seed complete!');
  console.log('  Admin:  admin@aasa.com  / Admin@123');
  console.log('  Seller: seller@aasa.com / Seller@123');
}

async function main() {
  const uri = process.env.MONGO_URI || '';
  const needsMemoryDB = !uri || uri.includes('xxxxx') || uri.includes('yourpassword');

  if (needsMemoryDB) {
    await startWithMemoryDB();
  }

  // Now start the actual server
  require('./index.js');
}

main().catch((err) => {
  console.error('❌ Startup failed:', err);
  process.exit(1);
});
