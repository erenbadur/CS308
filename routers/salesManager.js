const express = require('express');
const router = express.Router();
const Product = require('../models/product');
const Invoice = require('../models/invoice');
const User = require('../models/user');
const fs = require('fs');
const pdf = require('pdfkit');
const path = require('path');

// 1. Set Discounts and Notify Wishlisted Users
router.post('/set-discount', async (req, res) => {
    const { products, discount } = req.body;

    try {
        // Input validation
        if (!products || !Array.isArray(products) || products.length === 0) {
            return res.status(400).json({ error: 'Products array is required.' });
        }
        if (discount < 0 || discount > 100) {
            return res.status(400).json({ error: 'Discount must be between 0 and 100.' });
        }

        // Apply discount to each product
        const updatedProducts = [];
        for (const productId of products) {
            const product = await Product.findOne({ productId });
            if (!product) {
                console.warn(`Product with ID ${productId} not found.`);
                continue;
            }

            const originalPrice = product.price;
            const discountedPrice = originalPrice * (1 - discount / 100);
            product.price = parseFloat(discountedPrice.toFixed(2));

            // Add discount metadata
            product.discount = {
                percentage: discount,
                validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7-day validity
            };

            await product.save();
            updatedProducts.push(product);

            // Notify users with this product in their wishlist
            if (product.wishlistedBy?.length > 0) {
                product.wishlistedBy.forEach((userId) => {
                    console.log(`Notifying user ${userId} about discount on product: ${product.name}`);
                    // TODO: Implement actual notification logic (email/notification service)
                });
            }
        }

        res.status(200).json({
            message: 'Discount applied successfully to selected products.',
            updatedProducts,
        });
    } catch (error) {
        console.error('Error applying discount:', error.message);
        res.status(500).json({ error: 'An error occurred while applying discounts.' });
    }
});



// 3. Generate PDF of Invoices
router.get('/invoices/download', async (req, res) => {
    const { startDate, endDate } = req.query;

    try {
        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'Start and end dates are required.' });
        }

        const invoices = await Invoice.find({
            date: { $gte: new Date(startDate), $lte: new Date(endDate) },
        });

        if (!invoices.length) {
            return res.status(404).json({ error: 'No invoices found for the specified date range.' });
        }

        const pdfDoc = new pdf();
        const filePath = path.join(__dirname, `../invoices/Invoices-${Date.now()}.pdf`);
        const stream = fs.createWriteStream(filePath);

        pdfDoc.pipe(stream);

        // PDF Header
        pdfDoc.fontSize(18).text('Invoice Report', { align: 'center' }).moveDown();
        invoices.forEach((invoice, index) => {
            pdfDoc.fontSize(12).text(`Invoice ${index + 1}`);
            pdfDoc.text(`User: ${invoice.email}`);
            invoice.products.forEach((product) => {
                pdfDoc.text(` - ${product.name} x${product.quantity}, $${product.price}`);
            });
            pdfDoc.text(`Total Amount: $${invoice.totalAmount}`).moveDown();
        });

        pdfDoc.end();

        stream.on('finish', () => {
            res.download(filePath, () => fs.unlinkSync(filePath));
        });
    } catch (error) {
        console.error('Error generating PDF:', error.message);
        res.status(500).json({ error: 'Failed to generate invoice PDF.' });
    }
});

// Endpoint to retrieve invoices within a date range
router.get('/invoices', async (req, res) => {
    const { startDate, endDate } = req.query;

    try {
        // Validate input
        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'Start date and end date are required.' });
        }

        // Convert startDate and endDate to full-day range
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setUTCHours(23, 59, 59, 999); // Include entire day

        console.log('Fetching invoices between:', { start, end });

        // Query invoices within the date range
        const invoices = await Invoice.find({
            date: { $gte: start, $lte: end },
        }).sort({ date: -1 }); // Sort by date descending

        // Check if invoices were found
        if (!invoices.length) {
            return res.status(404).json({
                message: 'No invoices found in the specified date range.',
            });
        }

        // Return the list of invoices
        res.status(200).json({
            message: 'Invoices retrieved successfully.',
            count: invoices.length,
            invoices,
        });
    } catch (error) {
        console.error('Error retrieving invoices:', error.message);
        res.status(500).json({ error: 'An internal server error occurred while fetching invoices.' });
    }
});



// 4. Calculate Revenue, Loss/Profit, and Return Chart Data
router.get('/revenue-report', async (req, res) => {
    const { startDate, endDate } = req.query;

    try {
        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'Start and end dates are required.' });
        }

        const invoices = await Invoice.find({
            date: { $gte: new Date(startDate), $lte: new Date(endDate) },
        });

        if (!invoices.length) {
            return res.status(404).json({ error: 'No invoices found in the given date range.' });
        }

        const totalRevenue = invoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0);

        const chartData = invoices.map((invoice) => ({
            date: invoice.date.toISOString().split('T')[0],
            totalAmount: invoice.totalAmount,
        }));

        res.status(200).json({
            message: 'Revenue report generated successfully.',
            totalRevenue,
            chartData,
        });
    } catch (error) {
        console.error('Error generating revenue report:', error.message);
        res.status(500).json({ error: 'Failed to generate revenue report.' });
    }
});

// Test endpoint
router.get('/test', (req, res) => {
    res.status(200).json({ message: 'Test route works!' });
});

module.exports = router;
