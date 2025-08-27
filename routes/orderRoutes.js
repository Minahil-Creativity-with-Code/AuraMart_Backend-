const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// ✅ Helper function to calculate total
const calculateTotalAmount = (items) => {
  return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
};

// ✅ Create new order (Public - for users to place orders)
router.post('/create', async (req, res) => {
  try {
    const { customerName, email, phone, userId, items, shippingAddress } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order items are required' });
    }

    const totalAmount = calculateTotalAmount(items);

    const newOrder = new Order({
      customerName,
      email,
      phone,
      userId,
      items,
      shippingAddress,
      totalAmount, // ✅ auto calculated
    });

    const savedOrder = await newOrder.save();
    res.status(201).json(savedOrder);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ✅ Create new order (Admin only)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { customerName, email, phone, userId, items, shippingAddress, status, paymentStatus } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order items are required' });
    }

    const totalAmount = calculateTotalAmount(items);

    const newOrder = new Order({
      customerName,
      email,
      phone,
      userId,
      items,
      shippingAddress,
      totalAmount,
      status,
      paymentStatus
    });

    const savedOrder = await newOrder.save();
    res.status(201).json(savedOrder);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ✅ Get All Orders (Admin only)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('userId', 'name email')
      .populate('items.productId', 'name price category');

    res.status(200).json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Get Order by ID (Admin only)
router.get('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.productId', 'name image prices');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.status(200).json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Update Order (Admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status, items, shippingAddress, paymentStatus, customerName, email, phone } = req.body;

    let updatedData = {
      ...(status && { status }),
      ...(shippingAddress && { shippingAddress }),
      ...(paymentStatus && { paymentStatus }),
      ...(customerName && { customerName }),
      ...(email && { email }),
      ...(phone && { phone }),
    };

    // If items are updated, recalc totalAmount
    if (items && Array.isArray(items) && items.length > 0) {
      updatedData.items = items;
      updatedData.totalAmount = calculateTotalAmount(items);
    }

    const updatedOrder = await Order.findByIdAndUpdate(req.params.id, updatedData, {
      new: true,
      runValidators: true,
    });

    if (!updatedOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(updatedOrder);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ✅ Delete Order (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const deletedOrder = await Order.findByIdAndDelete(req.params.id);

    if (!deletedOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ message: 'Order deleted successfully', order: deletedOrder });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
