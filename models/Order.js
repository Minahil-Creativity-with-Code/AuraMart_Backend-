const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  customerName: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true,
  },
  email: { type: String, required: false },
  phone: { type: String, required: false },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [false],
  },
  items: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: [true, 'Product ID is required'],
      },
      quantity: {
        type: Number,
        required: [true, 'Quantity is required'],
        min: [1, 'Quantity must be at least 1'],
      },
      price: {
        type: Number,
        required: [true, 'Price is required'],
        min: [0, 'Price must be a non-negative number'],
      }
    }
  ],
  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: [0, 'Total amount must be a non-negative number'],
  },
  status: {
    type: String,
    enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
    default: 'Pending',
  },
  paymentStatus: {
    type: String,
    enum: ['Unpaid', 'Paid', 'Failed'],
    default: 'Unpaid',
  },
  shippingAddress: {
    addressLine: {
      type: String,
      required: [true, 'Address line is required'],
      trim: true,
    },
    city: {
      type: String,
      required: [false],
      trim: true,
    },
    postalCode: {
      type: String,
      required: [false],
      trim: true,
    },
    country: {
      type: String,
      required: [false],
      trim: true,
    }
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Order', orderSchema);
