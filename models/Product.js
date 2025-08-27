const mongoose = require('mongoose'); //imports the library,used to define schemas and interact with MongoDB in an object-oriented way.

const productSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  image: String,
  prices: {
    small: { type: Number },
    medium: { type: Number },
    large: { type: Number },
    xlarge: { type: Number }
  },
  stockQuantity: { 
    type: Number, 
    required: true 
  },
  categories: [{
    type: String,
    required: true
  }],
  attributes: {
    colors: [{
      type: String
    }],
    sizes: [{
      type: String
    }],
    brand: {
      type: [String]  // Allow both single string and array of strings
    },
    material: {
      type: [String]  // Allow both single string and array of strings
    }
  },
  // Allow additional dynamic attributes beyond the predefined ones
  additionalAttributes: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  description: String,
  isCustomizable: {
    type: Boolean,
    default: false
  },
  CustomizationDescription: String,
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

// Pre-save middleware to handle dynamic attributes and ensure proper data types
productSchema.pre('save', function(next) {
  // Process main attributes
  if (this.attributes && typeof this.attributes === 'object') {
    const schemaKeys = ['colors', 'sizes', 'brand', 'material'];
    
    // Process each attribute to ensure proper data types
    Object.keys(this.attributes).forEach(key => {
      if (this.attributes[key]) {
        if (key === 'brand' || key === 'material') {
          // Ensure brand and material are always arrays
          this.attributes[key] = Array.isArray(this.attributes[key]) 
            ? this.attributes[key] 
            : [this.attributes[key]];
        } else if (!schemaKeys.includes(key)) {
          // Remove any non-schema attributes from main attributes
          delete this.attributes[key];
        }
      }
    });
  }
  
  // Process additionalAttributes if provided
  if (this.additionalAttributes && typeof this.additionalAttributes === 'object') {
    // Ensure all additional attributes are arrays
    Object.keys(this.additionalAttributes).forEach(key => {
      if (this.additionalAttributes[key]) {
        this.additionalAttributes[key] = Array.isArray(this.additionalAttributes[key]) 
          ? this.additionalAttributes[key] 
          : [this.additionalAttributes[key]];
      }
    });
  }
  
  next();
});

// Pre-find middleware to ensure backward compatibility for existing products
productSchema.pre('find', function() {
  // This will run before any find operation
});

productSchema.pre('findOne', function() {
  // This will run before any findOne operation
});

// Virtual field to combine main attributes with additional attributes
productSchema.virtual('allAttributes').get(function() {
  const mainAttributes = this.attributes || {};
  const additional = this.additionalAttributes || {};
  
  // Mixed type should already be an object
  const additionalObj = additional;
  
  const combined = {
    ...mainAttributes,
    ...additionalObj
  };
  
  return combined;
});

// Ensure virtual fields are included when converting to JSON
productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Product', productSchema);
