const express = require('express');
const router = express.Router();
const Product = require('../models/product'); // Adjust path for Product model

router.post('/product', async (req, res) => {
    const {
        name,
        model,
        serialNumber,
        description,
        category, // Add category field
        quantityInStock,
        price,
        distributor,
        warrantyStatus,
        discount,
    } = req.body;

    try {
        // Validate required fields
        if (!name || !model || !serialNumber || !category || quantityInStock === undefined || price === undefined || !distributor) {
            return res.status(400).json({
                error: 'Fields name, model, serialNumber, category, quantityInStock, price, and distributor are required.',
            });
        }

        // Validate category
        const allowedCategories = ['mobile phone', 'computer', 'tablet', 'accessories', 'headphone', 'smartwatch', 'television', 'camera'];
        if (!allowedCategories.includes(category)) {
            return res.status(400).json({
                error: `Invalid category. Allowed categories are: ${allowedCategories.join(', ')}.`,
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

        // Create a new product
        const newProduct = new Product({
            name,
            model,
            serialNumber,
            description,
            category, // Add category field
            quantityInStock,
            price,
            distributor,
            warrantyStatus: warrantyStatus || true, // Default to true if not provided
            discount: discount || { percentage: 0, validUntil: null },
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
