# AasaMedChem — Inventory & Order Management System

A full-stack web application for managing chemical/medical product inventory with role-based access, flexible unit handling, and a complete quotation/order flow.

---

## 🚀 Live Demo

> Deploy URL will be added after Vercel + Render deployment.

**Test Credentials (after seeding):**

| Role   | Email               | Password    |
|--------|---------------------|-------------|
| Admin  | admin@aasa.com      | Admin@123   |
| Seller | seller@aasa.com     | Seller@123  |

---

## 🛠 Tech Stack

| Layer      | Technology              |
|------------|-------------------------|
| Frontend   | React 18 + Vite         |
| Styling    | Vanilla CSS (custom design system) |
| State      | React Context API + sessionStorage |
| Backend    | Node.js + Express.js    |
| Database   | MongoDB Atlas (Mongoose ODM) |
| Auth       | JWT (jsonwebtoken) + bcrypt |
| HTTP       | Axios                   |
| Deployment | Frontend: Vercel · Backend: Render |

---

## 🏗 High-Level System Design

```
Browser (React + Vite)
  │  Axios HTTP requests (with JWT)
  ▼
Express REST API (Node.js)
  │  JWT middleware → role check → controller
  ▼
MongoDB Atlas (Mongoose)
  ├── users
  ├── products
  └── orders
```

- The Vite dev server proxies `/api/*` → `http://localhost:5000/api` (no CORS issues in dev).
- In production, the frontend is deployed to Vercel and calls the Render backend URL directly.

---

## 📐 Database Schema

### `users` collection

| Field      | Type    | Notes                       |
|------------|---------|-----------------------------|
| _id        | ObjectId |                            |
| name       | String  | Required                    |
| email      | String  | Unique, lowercase           |
| password   | String  | bcrypt hash (select: false) |
| role       | String  | `"admin"` or `"seller"`     |
| isActive   | Boolean | Soft deactivation           |
| company    | String  | Optional                    |
| phone      | String  | Optional                    |
| timestamps | Date    | createdAt, updatedAt        |

### `products` collection

| Field              | Type         | Notes                                     |
|--------------------|--------------|-------------------------------------------|
| _id                | ObjectId     |                                           |
| name               | String       | Required                                  |
| sku                | String       | Unique, uppercase                         |
| description        | String       |                                           |
| category           | String       |                                           |
| baseUnit           | String       | `g`, `kg`, `mL`, `L`, `unit`             |
| basePricePerUnit   | Decimal128   | Price in **INR paise** per base unit      |
| stockQty           | Decimal128   | Quantity in base unit                     |
| lowStockThreshold  | Decimal128   | Alert threshold in base unit              |
| isActive           | Boolean      | Soft delete                               |
| createdBy          | ObjectId→User|                                           |
| timestamps         | Date         |                                           |

### `orders` collection

| Field        | Type         | Notes                               |
|--------------|--------------|-------------------------------------|
| _id          | ObjectId     |                                     |
| orderNumber  | String       | Auto-generated: `AMC-00001`         |
| seller       | ObjectId→User|                                     |
| sellerName   | String       | Snapshot                            |
| sellerEmail  | String       | Snapshot                            |
| status       | String       | quotation/confirmed/processing/fulfilled/cancelled |
| items        | Array        | See order item schema below         |
| totalAmount  | Decimal128   | Sum of line totals in INR paise     |
| notes        | String       | Seller notes                        |
| adminNotes   | String       | Admin response                      |
| timestamps   | Date         |                                     |

**Order Item (embedded)**

| Field               | Type       | Notes                                    |
|---------------------|------------|------------------------------------------|
| product             | ObjectId   | Reference                                |
| productName         | String     | Snapshot at order time                   |
| productSku          | String     | Snapshot at order time                   |
| orderedUnit         | String     | Unit chosen by seller (e.g. `kg`)        |
| orderedQty          | Decimal128 | Qty in orderedUnit                       |
| baseQty             | Decimal128 | Qty converted to baseUnit (for inventory)|
| baseUnit            | String     | Snapshot of product's baseUnit           |
| pricePerOrderedUnit | Decimal128 | INR paise per orderedUnit (snapshot)     |
| lineTotal           | Decimal128 | orderedQty × pricePerOrderedUnit (paise) |

---

## 📏 Unit Storage & Conversion Strategy

### Why Decimal128?

`Decimal128` (MongoDB's 128-bit decimal) is used for all monetary and quantity fields because:
- It avoids floating-point precision errors (critical for financial calculations).
- Supports very large values (e.g. 50,000,000 g) and very small fractional values (e.g. 0.000001 g).
- Mongoose getters convert it to JavaScript `Number` for API responses.

### Internal Base Units

| Dimension | Base Unit | Stored as  |
|-----------|-----------|------------|
| Weight    | grams (g) | `baseUnit: "g"` |
| Volume    | milliliters (mL) | `baseUnit: "mL"` |
| Count     | unit      | `baseUnit: "unit"` |

Products with `baseUnit: "kg"` or `baseUnit: "L"` are NOT allowed — these are always stored in the smaller base unit to keep arithmetic simple and lossless.

### Conversion Factors

| Display Unit | Conversion Factor (to base) |
|---|---|
| g → g   | × 1 |
| kg → g  | × 1000 |
| mL → mL | × 1 |
| L → mL  | × 1000 |
| unit → unit | × 1 |

### Price Storage

Prices are stored as **INR paise** (multiply INR by 100):
- `₹1.50/g` is stored as `Decimal128("150")` paise/g
- This avoids fractional paise and keeps all arithmetic in integers

**Derivation:**
```
pricePerOrderedUnit(paise) = basePricePerUnit(paise/g) × conversionFactor(orderedUnit)
lineTotal(paise)            = pricePerOrderedUnit × orderedQty(in orderedUnit)
displayPrice(INR)           = lineTotal / 100
```

**Example:**
- Product: Sodium Chloride, baseUnit=g, basePricePerUnit=25 paise/g (₹0.25/g)
- Seller orders: 2 kg
- conversionFactor(kg) = 1000
- pricePerKg = 25 × 1000 = 25,000 paise = ₹250/kg
- lineTotal = 25,000 × 2 = 50,000 paise = ₹500

### Where Conversions Are Applied

| Location | File | What happens |
|---|---|---|
| Client display | `client/src/utils/units.js` | Shows price for all compatible units on product card |
| Client cart     | `client/src/utils/units.js` → `calcLineTotal()` | Real-time line total as user changes unit/qty |
| Server on save  | `server/utils/unitConversion.js` → `convertToBase()` | Converts orderedQty → baseQty before saving |
| Server pricing  | `server/utils/unitConversion.js` → `pricePerUnit()` | Calculates pricePerOrderedUnit and lineTotal |

---

## 🖥 Features

### Admin Panel
- 📊 **Dashboard** — stats cards (products, orders, revenue), low stock alerts, recent orders
- 📦 **Products** — full CRUD with search + pagination, base unit/price config, live cross-unit price preview
- 📋 **Orders** — view all orders with item-level detail, unit conversion audit, status management
- 👥 **Users** — view sellers, activate/deactivate accounts

### Seller Panel
- 🔍 **Catalog** — browse/search/filter products, see prices for all compatible units
- 🛒 **Cart** — select unit per item, real-time INR price calculation, place quotation
- 📄 **My Orders** — track order status, view details, cancel quotations

---

## ⚙️ Local Setup

### Prerequisites
- Node.js ≥ 18
- MongoDB Atlas account (free tier is fine)

### 1. Clone & Install

```bash
git clone <repo-url>
cd assmedhchem

# Install server deps
cd server && npm install && cd ..

# Install client deps
cd client && npm install && cd ..
```

### 2. Configure Environment

**Server** — create `server/.env`:
```env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/assamedhchem?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=7d
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

### 3. Seed Database

```bash
cd server
node scripts/seed.js
```

This creates:
- Admin: `admin@aasa.com` / `Admin@123`
- Seller: `seller@aasa.com` / `Seller@123`
- 12 sample chemical products

### 4. Run Development Servers

**Terminal 1 — Backend:**
```bash
cd server
npm run dev
# → http://localhost:5000
```

**Terminal 2 — Frontend:**
```bash
cd client
npm run dev
# → http://localhost:5173
```

---

## 🚀 Deployment

### Backend → Render

1. Push code to GitHub.
2. Create a new **Web Service** on [render.com](https://render.com).
3. Connect your GitHub repo, set root directory to `server/`.
4. Build command: `npm install`
5. Start command: `node index.js`
6. Add environment variables (same as `.env`).

### Frontend → Vercel

1. Create a new project on [vercel.com](https://vercel.com).
2. Connect GitHub repo, set root directory to `client/`.
3. Framework preset: **Vite**.
4. Add environment variable: `VITE_API_BASE_URL=https://your-render-url.onrender.com/api`
5. Update `client/src/api/axios.js` baseURL to use `import.meta.env.VITE_API_BASE_URL`.

---

## 🧪 How to Use

### Admin Flow
1. Login as admin → redirected to `/admin/dashboard`
2. Go to **Products** → click **Add Product** → fill form → **Create Product**
3. Go to **Orders** → view incoming quotations → change status inline or in detail modal

### Seller Flow
1. Login as seller → redirected to `/seller/catalog`
2. Browse products — see prices for all units (g/kg, mL/L)
3. Click **Add to Cart** → go to **My Cart**
4. In cart: change unit (e.g. `g` → `kg`) → price recalculates in real-time
5. Click **Place Quotation** → confirmation toast
6. Go to **My Orders** → see quotation status

---

## 📁 Project Structure

```
assmedhchem/
├── client/                    # React + Vite frontend
│   ├── src/
│   │   ├── api/               # Axios instance + helpers
│   │   ├── components/        # Sidebar, Modal, Badges, ProtectedRoute
│   │   ├── context/           # AuthContext
│   │   ├── pages/
│   │   │   ├── auth/          # Login, Register
│   │   │   ├── admin/         # Dashboard, Products, Orders, Users
│   │   │   └── seller/        # Catalog, Cart, MyOrders
│   │   ├── styles/            # global.css — full design system
│   │   └── utils/             # units.js, currency.js
│   └── vite.config.js
│
└── server/                    # Express + Node.js API
    ├── config/                # db.js — MongoDB connection
    ├── controllers/           # authController, productController, orderController, userController
    ├── middleware/             # auth.js (JWT), errorHandler.js
    ├── models/                # User, Product, Order (Mongoose)
    ├── routes/                # auth, products, orders, users
    ├── scripts/               # seed.js
    ├── utils/                 # unitConversion.js
    └── index.js               # Express app entry
```

---

## 💡 Design Decisions

1. **Paise storage**: Storing prices as integer paise (×100) avoids floating-point rounding entirely.
2. **Base unit only in DB**: Only `g` and `mL` (not `kg`/`L`) are valid base units. This means all inventory math is lossless integer multiplication.
3. **Price snapshots on orders**: Order items store `pricePerOrderedUnit` at order time — price changes don't retroactively affect existing orders.
4. **Soft deletes**: Products and users are never deleted from DB; they're marked `isActive: false`.
5. **Session cart**: Cart state is stored in `sessionStorage` so it persists across navigation but clears on tab close.
6. **Text index**: MongoDB text index on product `name`, `sku`, `category`, `description` enables full-text search.
