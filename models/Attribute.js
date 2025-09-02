//Schema For Attribute in MongoDB
const mongoose = require('mongoose');

const attributeSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true    //automatically remove whitespaces 
  },
  type: { 
    type: String, 
    required: true,
    enum: ['color', 'size', 'brand', 'material'],
    default: 'color'
  },
  values: [{ 
    type: String, 
    required: true 
  }],
  isActive: { 
    type: Boolean, 
    default: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Attribute', attributeSchema); 