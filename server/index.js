require('dotenv').config();
require('express-async-errors');

const express  = require('express');
const cors     = require('cors');
const morgan   = require('morgan');

const connectDB    = require('./config/db');
const authRoutes   = require('./routes/auth');
const productRoutes= require('./routes/products');
const orderRoutes  = require('./routes/orders');
const userRoutes   = require('./routes/users');
const errorHandler = require('./middleware/errorHandler');

// Connect to MongoDB
connectDB();

const app = express();

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:3000',
    process.env.FRONTEND_URL,
    process.env.CLIENT_URL,
  ].filter(Boolean),
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// ─── Routes ───────────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

app.use('/api/auth',     authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders',   orderRoutes);
app.use('/api/users',    userRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Global error handler
app.use(errorHandler);

// ─── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown — lets nodemon restart cleanly without EADDRINUSE
const shutdown = () => {
  server.close(() => {
    console.log('🛑 Server closed gracefully');
    process.exit(0);
  });
};
process.on('SIGTERM', shutdown);
process.on('SIGINT',  shutdown);

module.exports = app;
