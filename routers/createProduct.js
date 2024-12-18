// routers/createProduct.js
const express = require('express');
const router = express.Router();
const Product = require('../models/product'); // Adjust path for Product model
const Category = require('../models/category'); // Import Category model

// POST /product (Add new product)
router.post('/product', async (req, res) => {
    const {
        name,
        model,
        serialNumber,
        description,
        category, // Should be category ObjectId
        quantityInStock,
        price,
        distributor,
        warrantyStatus,
        imageUrl, // New field for image URL
    } = req.body;

    try {
        // Validate required fields
        if (!name || !model || !serialNumber || !category || quantityInStock === undefined || price === undefined || !distributor || !imageUrl) {
            return res.status(400).json({
                error: 'Fields name, model, serialNumber, category, quantityInStock, price, distributor, and imageUrl are required.',
            });
        }

        // Validate category exists
        const categoryExists = await Category.findById(category);
        if (!categoryExists) {
            return res.status(400).json({
                error: 'Selected category does not exist.',
            });
        }

        // Ensure quantity and price are valid
        if (quantityInStock < 0) {
            return res.status(400).json({ error: 'Quantity in stock must be zero or greater.' });
        }
        if (price < 0) {
            return res.status(400).json({ error: 'Price must be zero or greater.' });
        }

        // Check for existing product with the same serial number or model
        const existingProduct = await Product.findOne({
            $or: [{ model }, { serialNumber }],
        });
        if (existingProduct) {
            return res.status(400).json({ error: 'A product with the same model or serial number already exists.' });
        }

        // Create a new product without discount fields
        const newProduct = new Product({
            name,
            model,
            serialNumber,
            description,
            category, // category ObjectId
            quantityInStock,
            price,
            distributor,
            warrantyStatus: warrantyStatus !== undefined ? warrantyStatus : true, // Default to true if not provided
            imageUrl, // Set image URL
        });

        // Save the product to the database
        await newProduct.save();

        res.status(201).json({
            message: 'Product created successfully.',
            product: newProduct,
        });
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ error: 'An error occurred while creating the product.' });
    }
});

module.exports = router;
