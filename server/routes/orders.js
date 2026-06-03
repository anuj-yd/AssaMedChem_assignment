const express = require('express');
const router = express.Router();
const {
  getOrders, getOrder, createOrder, updateOrderStatus, cancelOrder, getStats
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/stats', authorize('admin'), getStats);
router.get('/', getOrders);
router.get('/:id', getOrder);

router.post('/', authorize('seller', 'admin'), createOrder);
router.patch('/:id/status', authorize('admin'), updateOrderStatus);
router.patch('/:id/cancel', authorize('seller'), cancelOrder);

module.exports = router;
