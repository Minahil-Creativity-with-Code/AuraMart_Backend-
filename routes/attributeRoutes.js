const express = require('express');
const router = express.Router();
const Attribute = require('../models/Attribute');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// ✅ Create new attribute (Admin only)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, type, values } = req.body;
    const newAttribute = new Attribute({
      name,
      type,
      values: Array.isArray(values) ? values : [values]
    });
    const savedAttribute = await newAttribute.save();
    res.status(201).json(savedAttribute);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ✅ Get All Attributes
router.get('/', async (req, res) => {
  try {
    const attributes = await Attribute.find({ isActive: true });
    res.status(200).json(attributes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Get Attributes by Type
router.get('/type/:type', async (req, res) => {
  try {
    const attributes = await Attribute.find({ 
      type: req.params.type, 
      isActive: true 
    });
    res.status(200).json(attributes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Get Attribute by ID
router.get('/:id', async (req, res) => {
  try {
    const attribute = await Attribute.findById(req.params.id);
    if (!attribute) {
      return res.status(404).json({ error: 'Attribute not found' });
    }
    res.status(200).json(attribute);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Update Attribute (Admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, type, values, isActive } = req.body;
    const updateData = {
      ...(name && { name }),
      ...(type && { type }),
      ...(values && { values: Array.isArray(values) ? values : [values] }),
      ...(typeof isActive !== 'undefined' && { isActive })
    };

    const updatedAttribute = await Attribute.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedAttribute) {
      return res.status(404).json({ error: 'Attribute not found' });
    }

    res.json(updatedAttribute);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ✅ Delete Attribute (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const deletedAttribute = await Attribute.findByIdAndDelete(req.params.id);
    if (!deletedAttribute) {
      return res.status(404).json({ error: 'Attribute not found' });
    }
    res.json({ message: 'Attribute deleted successfully', attribute: deletedAttribute });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router; 