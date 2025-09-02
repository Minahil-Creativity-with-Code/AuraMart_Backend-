const express = require('express');
const router = express.Router(); 
const Product = require('../models/Product'); // Mongoose model
const multer = require('multer');  // For file uploads
const path = require('path');  // For path manipulation
const { authenticateToken, requireAdmin } = require('../middleware/auth');
 
// Bulk Add Products (Admin only)
router.post('/bulk', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const products = req.body;

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: 'Invalid or empty product list' });
    }

    const savedProducts = await Product.insertMany(products);
    res.status(201).json(savedProducts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//Add Product (Admin only)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      name,
      prices,
      stockQuantity,
      categories,
      description,
      image,
      isCustomizable,
      CustomizationDescription,
      attributes,
      additionalAttributes
    } = req.body;

    const newProduct = new Product({
      name,
      prices,
      stockQuantity,
      categories: Array.isArray(categories) ? categories : [categories],
      description,
      image,
      isCustomizable,
      CustomizationDescription,
      attributes,
      additionalAttributes
    });

    const savedProduct = await newProduct.save();
    res.status(201).json(savedProduct);
  } catch (err) {
    console.error('Error creating product:', err);
    res.status(500).json({ error: err.message });
  }
});

//Get All Products
router.get('/', async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Product By ID
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.status(200).json(product);
  } catch (err) {
    res.status(500).json({ error: 'Invalid ID format or server error' });
  }
});

// 🔍 Search by category: /search/category/:category
router.get('/search/category/:category', async (req, res) => {
  const { category } = req.params;

  try {
    const products = await Product.find({ categories: { $in: [category] } }).sort({ createdAt: -1 });
    res.status(200).json(products);
  } catch (err) {
    console.error('Category search error:', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// Get Products by Category (alternative endpoint)
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const products = await Product.find({ categories: { $in: [category] } }).sort({ createdAt: -1 });
    res.status(200).json(products);
  } catch (err) {
    console.error('Category search error:', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// Get product by name and color (for color variants)
router.get('/variant/:name/:color', async (req, res) => {
  try {
    const { name, color } = req.params;
    
    // Find product with exact name and color
    const product = await Product.findOne({
      name: name,
      'attributes.colors': color
    });

    if (!product) {
      return res.status(404).json({ error: 'Product variant not found' });
    }

    res.status(200).json(product);
  } catch (err) {
    console.error('Product variant search error:', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// Get all variants of a product by name
router.get('/variants/:name', async (req, res) => {
  try {
    const { name } = req.params;
    
    // Find all products with the same base name
    const variants = await Product.find({
      name: { $regex: new RegExp(`^${name.replace(/[0-9]+$/, '')}`, 'i') }
    }).sort({ createdAt: -1 });

    if (!variants || variants.length === 0) {
      return res.status(404).json({ error: 'No product variants found' });
    }

    // Create a map of color to product variant
    const colorToProductMap = {};
    const allAvailableColors = new Set();
    
    variants.forEach(variant => {
      if (variant.attributes && variant.attributes.colors) {
        variant.attributes.colors.forEach(color => {
          allAvailableColors.add(color);
          if (!colorToProductMap[color]) {
            colorToProductMap[color] = [];
          }
          colorToProductMap[color].push({
            _id: variant._id,
            name: variant.name,
            image: variant.image,
            prices: variant.prices,
            stockQuantity: variant.stockQuantity,
            isActive: variant.isActive
          });
        });
      }
    });

    res.status(200).json({
      baseName: name.replace(/[0-9]+$/, ''),
      colorToProductMap: colorToProductMap,
      allAvailableColors: Array.from(allAvailableColors),
      allVariants: variants
    });
  } catch (err) {
    console.error('Product variants search error:', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// Set storage engine for multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../public/images')); // stores in public/images
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `img-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({ storage });

// Upload route (Admin only)
router.post('/upload', authenticateToken, requireAdmin, upload.single('productImage'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  res.status(200).json({ filename: req.file.filename });
});

// Update Product By ID (Admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      name,
      prices,
      stockQuantity,
      categories,
      description,
      image,
      isCustomizable,
      CustomizationDescription,
      attributes,
      additionalAttributes
    } = req.body;

    const updateData = {
      ...(name && { name }),
      ...(prices && { prices }),
      ...(stockQuantity && { stockQuantity }),
      ...(categories && { categories: Array.isArray(categories) ? categories : [categories] }),
      ...(description && { description }),
      ...(image && { image }),
      ...(typeof isCustomizable !== 'undefined' && { isCustomizable }),
      ...(CustomizationDescription && { CustomizationDescription }),
      ...(attributes && { attributes }),
      ...(additionalAttributes && { additionalAttributes })
    };

    const updatedProduct = await Product.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(updatedProduct);
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(400).json({ error: err.message });
  }
});

// Delete Product By ID (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);

    if (!deletedProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ message: 'Product deleted successfully', product: deletedProduct });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// 🔍 Search by product name
router.get('/search/name/:name', async (req, res) => {
  const { name } = req.params;
  try {
    const regex = new RegExp(name, 'i'); // case-insensitive search
    const products = await Product.find({ name: regex }).sort({ createdAt: -1 });
    
    if (!products || products.length === 0) {
      return res.status(404).json({ error: 'No products found' });
    }

    res.status(200).json(products);
  } catch (err) {
    console.error('Name search error:', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
});


module.exports = router; 