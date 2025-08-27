const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Get monthly orders and sales data
router.get('/monthly-orders-sales', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const monthlyData = [];

    // Get data for each month
    for (let month = 0; month < 12; month++) {
      const startDate = new Date(currentYear, month, 1);
      const endDate = new Date(currentYear, month + 1, 0, 23, 59, 59, 999);

      // Get orders for this month
      const orders = await Order.find({
        createdAt: { $gte: startDate, $lte: endDate }
      });

      // Calculate total sales for this month
      const totalSales = orders.reduce((sum, order) => {
        if (order.totalAmount) {
          return sum + order.totalAmount;
        }
        return sum;
      }, 0);

      const monthNames = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
      ];

      monthlyData.push({
        month: monthNames[month],
        orders: orders.length,
        sales: Math.round(totalSales)
      });
    }

    res.json(monthlyData);
  } catch (error) {
    console.error('Error fetching monthly orders and sales:', error);
    res.status(500).json({ error: 'Failed to fetch monthly data' });
  }
});

// Get orders by status
router.get('/orders-by-status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const statusCounts = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          status: '$_id',
          count: 1,
          _id: 0
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Ensure all statuses are represented even if count is 0
    const allStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
    const statusMap = {};
    
    statusCounts.forEach(item => {
      statusMap[item.status] = item.count;
    });

    const result = allStatuses.map(status => ({
      status: status,
      count: statusMap[status] || 0
    }));

    res.json(result);
  } catch (error) {
    console.error('Error fetching orders by status:', error);
    res.status(500).json({ error: 'Failed to fetch status data' });
  }
});

// Get products by category
router.get('/products-by-category', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const categoryCounts = await Product.aggregate([
      {
        $unwind: '$categories'
      },
      {
        $group: {
          _id: '$categories',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          category: '$_id',
          count: 1,
          _id: 0
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    res.json(categoryCounts);
  } catch (error) {
    console.error('Error fetching products by category:', error);
    res.status(500).json({ error: 'Failed to fetch category data' });
  }
});

// Get dashboard summary (total counts)
router.get('/summary', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [totalProducts, totalOrders, totalUsers] = await Promise.all([
      Product.countDocuments({ isActive: true }),
      Order.countDocuments(),
      require('mongoose').model('User').countDocuments()
    ]);

    res.json({
      totalProducts,
      totalOrders,
      totalUsers
    });
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    res.status(500).json({ error: 'Failed to fetch summary data' });
  }
});

module.exports = router;
