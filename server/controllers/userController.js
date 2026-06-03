const User = require('../models/User');

// @route  GET /api/users
// @access Admin
exports.getUsers = async (req, res) => {
  const { role, page = 1, limit = 20 } = req.query;
  const query = {};
  if (role) query.role = role;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [users, total] = await Promise.all([
    User.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
    User.countDocuments(query),
  ]);

  res.json({ success: true, total, users });
};

// @route  PATCH /api/users/:id/toggle
// @access Admin
exports.toggleUser = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  if (user._id.toString() === req.user._id.toString()) {
    return res.status(400).json({ success: false, message: 'Cannot deactivate yourself' });
  }
  user.isActive = !user.isActive;
  await user.save();
  res.json({ success: true, user });
};

// @route  PATCH /api/users/:id/role
// @access Admin
exports.updateRole = async (req, res) => {
  const { role } = req.body;
  if (!['admin', 'seller'].includes(role)) {
    return res.status(400).json({ success: false, message: 'Role must be admin or seller' });
  }
  const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true, runValidators: true });
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  res.json({ success: true, user });
};
