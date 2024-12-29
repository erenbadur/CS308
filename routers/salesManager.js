const express = require('express');
const router = express.Router();
const Product = require('../models/product');
const User = require('../models/user');
const Wishlist = require('../models/wishlist');
const fs = require('fs');
const pdf = require('pdfkit');
const path = require('path');
const nodemailer = require('nodemailer');
const sendEmail = require('./email');
const Invoice = require('../models/invoice');
// Nodemailer setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// Set discounts and notify users
router.post('/set-discount', async (req, res) => {
    const { products, discount } = req.body;

    try {
        if (!products || !Array.isArray(products) || products.length === 0) {
            return res.status(400).json({ error: 'Products array is required.' });
        }
        if (discount < 0 || discount > 100) {
            return res.status(400).json({ error: 'Discount must be between 0 and 100.' });
        }

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

            product.discount = {
                percentage: discount,
                validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            };

            await product.save();
            updatedProducts.push(product);

            // Notify users who have this product in their wishlist
            const wishlists = await Wishlist.find({ productId });
            if (wishlists.length > 0) {
                for (const wishlistItem of wishlists) {
                    const user = await User.findOne({ userId: wishlistItem.userId });
                    if (user?.email) {
                        // Send email notification
                        const mailOptions = {
                            from: process.env.EMAIL_USER,
                            to: user.email,
                            subject: `Discount Alert: ${product.name}`,
                            text: `Great news! The product "${product.name}" is now available at a ${discount}% discount for only $${product.price}.\n\nHurry up, the discount is valid until ${new Date(product.discount.validUntil).toLocaleDateString()}!`,
                        };

                        try {
                            await transporter.sendMail(mailOptions);
                            console.log(`Email sent to ${user.email} for product ${product.name}`);
                        } catch (emailError) {
                            console.error(`Failed to send email to ${user.email}:`, emailError.message);
                        }
                    }
                }
            }
        }

        res.status(200).json({
            message: 'Discount applied successfully and users notified.',
            updatedProducts,
        });
    } catch (error) {
        console.error('Error applying discount:', error.message);
        res.status(500).json({ error: 'An error occurred while applying discounts.' });
    }
});

module.exports = router;




// Download invoices as PDF
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

        // Generate PDF content
        pdfDoc.fontSize(18).text('Invoice Report', { align: 'center' }).moveDown();
        invoices.forEach((invoice, index) => {
            pdfDoc.fontSize(14).text(`Invoice ${index + 1}`).moveDown();
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
// Download a specific invoice as a pre-existing PDF
router.get('/invoices/download/:invoiceId', async (req, res) => {
    const { invoiceId } = req.params;

    try {
        // Find the invoice by its unique `invoiceId`
        const invoice = await Invoice.findOne({ invoiceId });

        if (!invoice) {
            console.error(`Invoice with ID ${invoiceId} not found.`);
            return res.status(404).json({ error: 'Invoice not found.' });
        }

        // Ensure the invoice has a valid file path
        if (!invoice.invoiceFilePath) {
            console.error(`Invoice PDF path is missing for ID ${invoiceId}.`);
            return res.status(400).json({ error: 'Invoice PDF is not available.' });
        }

        // Resolve the file path
        const filePath = path.resolve(invoice.invoiceFilePath);
        console.log(`Resolved file path: ${filePath}`);

        // Check if the file exists
        if (!fs.existsSync(filePath)) {
            console.error(`File does not exist at path: ${filePath}`);
            return res.status(404).json({ error: 'File not found.' });
        }

        // Send the PDF file as a download
        res.download(filePath, `${invoiceId}.pdf`, (err) => {
            if (err) {
                console.error(`Error sending file: ${err.message}`);
                return res.status(500).json({ error: 'Failed to download invoice.' });
            }
        });
    } catch (error) {
        console.error(`Error retrieving invoice: ${error.message}`);
        res.status(500).json({ error: 'Failed to retrieve invoice.' });
    }
});





// Retrieve invoices by date
router.get('/invoices', async (req, res) => {
    const { startDate, endDate } = req.query;

    try {
        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'Start and end dates are required.' });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setUTCHours(23, 59, 59, 999);

        const invoices = await Invoice.find({
            date: { $gte: start, $lte: end },
        }).sort({ date: -1 });

        if (!invoices.length) {
            return res.status(404).json({ message: 'No invoices found for the specified date range.' });
        }

        res.status(200).json({ message: 'Invoices retrieved successfully.', invoices });
    } catch (error) {
        console.error('Error retrieving invoices:', error.message);
        res.status(500).json({ error: 'Failed to retrieve invoices.' });
    }
});



// Calculate revenue and profit/loss in a date range
router.get('/revenue-report', async (req, res) => {
    const { startDate, endDate } = req.query;

    try {
        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'Start and end dates are required.' });
        }

        // Fetch invoices in the date range
        const invoices = await Invoice.find({
            date: { $gte: new Date(startDate), $lte: new Date(endDate) },
        });

        if (!invoices.length) {
            return res.status(404).json({ error: 'No invoices found in the specified date range.' });
        }

        // Initialize variables
        let totalRevenue = 0;
        let totalProfit = 0;
        const dailyData = {};

        for (const invoice of invoices) {
            const dateKey = invoice.date.toISOString().split('T')[0];

            // Calculate revenue and profit for each invoice
            const revenue = invoice.totalAmount;
            const cost = invoice.products.reduce((sum, product) => sum + (product.price / 2) * product.quantity, 0);
            const profit = revenue - cost;

            // Accumulate totals
            totalRevenue += revenue;
            totalProfit += profit;

            // Aggregate daily data
            if (!dailyData[dateKey]) {
                dailyData[dateKey] = { revenue: 0, profit: 0 };
            }
            dailyData[dateKey].revenue += revenue;
            dailyData[dateKey].profit += profit;
        }

        // Prepare data for chart
        const chartData = Object.entries(dailyData).map(([date, data]) => ({
            date,
            revenue: data.revenue,
            profit: data.profit,
        }));

        res.status(200).json({
            message: 'Revenue and profit/loss report generated successfully.',
            totalRevenue,
            totalProfit,
            chartData,
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: 'Failed to generate revenue and profit/loss report.' });
    }
});


// Evaluate refund requests
router.post('/evaluate-refund', async (req, res) => {
    const { purchaseId, productId, quantity, status } = req.body;

    try {
        if (!purchaseId || !productId || !quantity || !status) {
            return res.status(400).json({ error: 'Purchase ID, Product ID, quantity, and status are required.' });
        }

        if (status !== 'approved') {
            return res.status(200).json({ message: `Refund for product ${productId} in purchase ${purchaseId} has been ${status}.` });
        }

        // Fetch the invoice
        const invoice = await Invoice.findOne({ _id: purchaseId, 'products.productId': productId });
        if (!invoice) {
            return res.status(404).json({ error: 'Purchase not found.' });
        }

        const productDetails = invoice.products.find((product) => product.productId === productId);
        if (!productDetails || productDetails.quantity < quantity) {
            return res.status(400).json({ error: 'Invalid product or quantity for refund.' });
        }

        // Update stock and restock the product
        const product = await Product.findOne({ productId });
        if (!product) {
            return res.status(404).json({ error: 'Product not found in inventory.' });
        }

        // Increase stock (for refund)
        const updatedProduct = await product.increaseStock(quantity, 'refund', invoice.email);  // Send email if reason is refund

        // Simulate refund to user
        const refundedAmount = (productDetails.price * quantity).toFixed(2);
        console.log(`Refunding $${refundedAmount} to user ${invoice.user}`);

        // Send refund notification email (to user)
        const emailSubject = `Refund Processed for ${productDetails.name}`;
        const emailText = `Dear ${invoice.user},\n\nYour refund of ${quantity} units of ${productDetails.name} has been successfully processed.\n\nRefunded amount: $${refundedAmount}`;
        const emailHtml = `
            <p>Dear ${invoice.user},</p>
            <p>Your refund of <strong>${quantity} units</strong> of <strong>${productDetails.name}</strong> has been successfully processed.</p>
            <p><strong>Refunded amount:</strong> $${refundedAmount}</p>
            <p>Thank you for shopping with us!</p>
        `;

        await sendEmail(invoice.email, emailSubject, emailText, emailHtml);  // Sending the refund email to the user

        res.status(200).json({
            message: `Refund for product ${productId} has been approved.`,
            refundedAmount,
            restockedQuantity: quantity,
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: 'Failed to evaluate refund.' });
    }
});

// Cancel discounts
router.post('/cancel-discount', async (req, res) => {
    const { products } = req.body;

    try {
        if (!products || !Array.isArray(products) || products.length === 0) {
            return res.status(400).json({ error: 'Products array is required.' });
        }

        const updatedProducts = [];
        for (const productId of products) {
            const product = await Product.findOne({ productId });
            if (!product) continue;

            product.discount = {
                percentage: 0,
                validUntil: null,
            };
            await product.save();
            updatedProducts.push(product);
        }

        res.status(200).json({
            message: 'Discounts canceled successfully.',
            updatedProducts,
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: 'An error occurred while canceling discounts.' });
    }
});

module.exports = router;