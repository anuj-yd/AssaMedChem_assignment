const express = require('express');
const router = express.Router();
const { getUsers, toggleUser, updateRole } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin'));

router.get('/', getUsers);
router.patch('/:id/toggle', toggleUser);
router.patch('/:id/role', updateRole);

module.exports = router;
