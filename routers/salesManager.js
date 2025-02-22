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
const refund = require('../models/refund');
const PurchaseHistory = require('../models/PurchaseHistory');
const Delivery = require('../models/delivery');
// Nodemailer setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },

});
router.post('/set-discount', async (req, res) => {
    const { products, discount } = req.body;

    try {
        // Input Validation
        if (!products || !Array.isArray(products) || products.length === 0) {
            return res.status(400).json({ error: 'Products array is required.' });
        }
        if (typeof discount !== 'number' || discount < 0 || discount > 100) {
            return res.status(400).json({ error: 'Discount must be a number between 0 and 100.' });
        }

        const updatedProducts = [];
        const emailPromises = [];

        for (const productId of products) {
            const product = await Product.findOne({ productId });
            if (!product) {
                console.warn(`Product with ID ${productId} not found.`);
                continue;
            }

            // Check if a discount is already active
            const isDiscountActive = product.discount &&
                                      product.discount.percentage > 0 &&
                                      new Date(product.discount.validUntil) >= new Date();

            if (isDiscountActive) {
                console.warn(`Discount already active for product ID ${productId}. Skipping.`);
                continue;
            }

            // Store original price if not already set
            if (!product.originalPrice || product.originalPrice === 0) {
                product.originalPrice = product.price;
            }

            // Calculate the discounted price
            const discountedPrice = (product.originalPrice * (1 - discount / 100)).toFixed(2);
            product.price = parseFloat(discountedPrice);

            // Set Discount Details
            product.discount = {
                percentage: discount,
                validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
                purchasesDuringDiscount: 0, // Reset purchases during discount
            };

            await product.save();
            updatedProducts.push(product);

            // Notify Users with the Product in their Wishlist
            const wishlists = await Wishlist.find({ productId });
            if (wishlists.length > 0) {
                for (const wishlistItem of wishlists) {
                    const user = await User.findOne({ userId: wishlistItem.userId });
                    if (user?.email) {
                        const mailOptions = {
                            from: process.env.EMAIL_USER,
                            to: user.email,
                            subject: `Discount Alert: ${product.name}`,
                            text: `Great news! The product "${product.name}" is now available at a ${discount}% discount for only $${discountedPrice}.\n\nHurry up, the discount is valid until ${new Date(product.discount.validUntil).toLocaleDateString()}!`,
                        };

                        // Push email sending promises to the array
                        emailPromises.push(
                            transporter.sendMail(mailOptions)
                                .then(() => {
                                    console.log(`Email sent to ${user.email} for product ${product.name}`);
                                })
                                .catch((emailError) => {
                                    console.error(`Failed to send email to ${user.email}:`, emailError.message);
                                })
                        );
                    }
                }
            }
        }

        // Send response immediately without waiting for all emails
        res.status(200).json({
            message: 'Discount applied successfully. Users are being notified.',
            updatedProducts,
        });

        // Handle email sending asynchronously
        Promise.all(emailPromises)
            .then(() => {
                console.log('All emails have been processed.');
            })
            .catch((err) => {
                console.error('Error in sending emails:', err);
            });

    } catch (error) {
        console.error('Error applying discount:', error.message);
        res.status(500).json({ error: 'An error occurred while applying discounts.' });
    }
});



router.get('/refund-requests', async (req, res) => {
    try {
        // Fetch all refund requests from the database
        const refundRequests = await refund.find();

        if (!refundRequests || refundRequests.length === 0) {
            return res.status(404).json({ error: 'No refund requests found.' });
        }

        // Return the refund requests
        res.status(200).json({
            refundRequests,
        });
    } catch (error) {
        console.error('Error fetching refund requests:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});




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
        let totalCost = 0;
        const dailyData = {};

        for (const invoice of invoices) {
            const dateKey = invoice.date.toISOString().split('T')[0];

            // Calculate revenue and profit for each invoice
            const revenue = invoice.totalAmount;

            // Updated cost calculation with Number parsing and validation
            const cost = invoice.products.reduce((sum, product) => {
                const price = Number(product.price);
                if (isNaN(price)) {
                    console.warn(`Invalid price for product ID ${product.productId}:`, product.price);
                    return sum; // Skip invalid prices
                }
                return sum + (price / 2) * product.quantity;
            }, 0);


            const profit = revenue - cost;

            // Accumulate totals
            totalRevenue += revenue;
            totalProfit += profit;
            totalCost += cost;

            // Aggregate daily data
            if (!dailyData[dateKey]) {
                dailyData[dateKey] = { revenue: 0, profit: 0 , cost: 0, };
            }

            dailyData[dateKey].revenue += revenue;
            dailyData[dateKey].profit += profit;
            dailyData[dateKey].cost += cost;

        }

        // Prepare data for chart
        const chartData = Object.entries(dailyData).map(([date, data]) => ({
            date,
            revenue: data.revenue,
            profit: data.profit,
            cost: data.cost,

        }));


        res.status(200).json({
            message: 'Revenue and profit/loss report generated successfully.',
            totalRevenue,
            totalProfit,
            totalCost,
            chartData,
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: 'Failed to generate revenue and profit/loss report.' });
    }
});

// Evaluate refund request
router.post('/evaluate-refund', async (req, res) => {
    const { deliveryId, productId, quantity, status } = req.body;

    try {
        console.log('--- /evaluate-refund Debug Start ---');
        console.log('Incoming request body:', req.body);

        // Validate required fields
        if (!deliveryId || !productId || !quantity || !status) {
            console.error('Missing required fields.');
            return res.status(400).json({
                error: 'Delivery ID, Product ID, quantity, and status are required.',
            });
        }

        // Find the refund request
        const refundRequest = await refund.findOne({
            deliveryId,
            productId,
            status: 'pending',
        });

        if (!refundRequest) {
            console.error('Refund request not found or already evaluated.');
            return res.status(404).json({ error: 'Refund request not found or already processed.' });
        }

        console.log(`Evaluating refund status: ${status}`);

        // Find the associated delivery to get the purchase ID
        const delivery = await Delivery.findById(deliveryId).populate('purchase');
        if (!delivery) {
            console.error(`Delivery not found for deliveryId: ${deliveryId}`);
            return res.status(404).json({ error: 'Delivery not found.' });
        }

        const purchaseId = delivery.purchase._id;

        // Find the associated invoice
        const invoice = await Invoice.findOne({ delivery: deliveryId, 'products.productId': productId });
        if (!invoice) {
            console.error(`Invoice not found for deliveryId: ${deliveryId}, productId: ${productId}`);
            return res.status(404).json({ error: 'Invoice not found.' });
        }

        // Find the associated purchase history using the purchase ID
        const purchase = await PurchaseHistory.findById(purchaseId);
        if (!purchase) {
            console.error(`Purchase history not found for purchaseId: ${purchaseId}`);
            return res.status(404).json({ error: 'Purchase history not found.' });
        }

        // Fallback to find user details if email is missing in the purchase
        let userEmail = purchase.email;
        if (!userEmail) {
            console.warn(`Email not found in purchase. Fetching from User model for userId: ${purchase.user}`);
            const user = await User.findOne({ userId: purchase.user });
            if (user) {
                userEmail = user.email;
                console.log(`User email retrieved from User model: ${userEmail}`);
            } else {
                console.error(`User not found for userId: ${purchase.user}`);
            }
        }

        // Update the refund request with required fields
        refundRequest.purchaseId = purchase._id;
        refundRequest.invoiceId = invoice._id;
        refundRequest.status = status;
        await refundRequest.save();

        if (status === 'approved') {
            console.log('Processing approved refund...');

            // Find product details from the invoice
            const productDetails = invoice.products.find((prod) => prod.productId === productId);
            if (!productDetails) {
                console.error('Product not found in invoice:', productId);
                return res.status(400).json({ error: 'Invalid product or quantity for refund.' });
            }

            // Find the product in inventory
            const product = await Product.findOne({ productId });
            if (!product) {
                console.error(`Product not found in inventory for productId: ${productId}`);
                return res.status(404).json({ error: 'Product not found in inventory.' });
            }

            // **Increase stock due to refund**
            console.log(`Increasing stock by ${quantity} for productId: ${productId} due to refund...`);
            product.quantityInStock += quantity;
            await product.save();

            // Calculate refund amount
            const refundedAmount = (productDetails.price * quantity).toFixed(2);
            console.log(`Refunded $${refundedAmount} to user: ${purchase.user}`);

            // Send refund confirmation email if email is available
            if (userEmail) {
                const emailSubject = `Refund Processed for ${productDetails.name}`;
                const emailText = `
                    Dear user,

                    Your refund for ${quantity} unit(s) of ${productDetails.name} has been successfully processed.

                    Refunded Amount: $${refundedAmount}.

                    Thank you for shopping with us.

                    Regards,
                    Your N308 Team
                `;
                const emailHtml = `
                    <p>Dear user,</p>
                    <p>Your refund for <strong>${quantity} unit(s)</strong> of <strong>${productDetails.name}</strong> has been successfully processed.</p>
                    <p><strong>Refunded Amount:</strong> $${refundedAmount}</p>
                    <p>Thank you for shopping with us.</p>
                    <p>Regards,<br>Your N308 Team</p>
                `;

                try {
                    await sendEmail(userEmail, emailSubject, emailText, emailHtml);
                    console.log(`Refund confirmation email sent to ${userEmail} successfully.`);
                } catch (emailError) {
                    console.error(`Error sending refund confirmation email to ${userEmail}:`, emailError.message);
                }
            } else {
                console.error('Refund confirmation email not sent. User email not found.');
            }
        } else {
            console.log(`Refund for product ${productId} has been rejected.`);
        }

        console.log('--- /evaluate-refund Debug End ---');
        res.status(200).json({
            message: `Refund for product ${productId} has been ${status}.`,
            refundRequest,
        });
    } catch (error) {
        console.error('Error evaluating refund request:', error.message);
        res.status(500).json({ error: 'Failed to evaluate refund.' });
    }
});



router.post('/cancel-discount', async (req, res) => {
    const { products } = req.body;

    if (!products || products.length === 0) {
        return res.status(400).json({ error: 'No products provided to cancel the discount.' });
    }

    try {
        // Fetch products that are in the provided list
        const productDocs = await Product.find({ productId: { $in: products } });

        if (productDocs.length === 0) {
            return res.status(404).json({ error: 'No matching products found to cancel the discount.' });
        }

        // Update each product by restoring the original price
        const updates = productDocs.map(async (product) => {
            if (product.discount && product.discount.percentage > 0) {
                // Calculate the original price based on the discounted price
                const originalPrice = product.price / (1 - product.discount.percentage / 100);

                product.price = originalPrice.toFixed(2); // Restore the original price
                product.discount.percentage = 0;
                product.discount.validUntil = null;
                product.discount.purchasesDuringDiscount = 0;
                return product.save();
            }
        });

        // Wait for all updates to complete
        await Promise.all(updates);

        return res.status(200).json({
            message: `Discount canceled for ${productDocs.length} products.`,
        });
    } catch (error) {
        console.error('Error canceling discount:', error);
        return res.status(500).json({ error: 'An error occurred while canceling the discount.' });
    }
});







//update the price

// PATCH /api/sales/update-price/:productId
router.patch('/update-price/:productId', async (req, res) => {
    const { productId } = req.params;
    const { price } = req.body;

    // Validate the price
    if (typeof price !== 'number' || price <= 0) {
        return res.status(400).json({ error: 'Price must be a positive number.' });
    }

    try {
        // Find the product by productId
        const product = await Product.findOne({ productId });
        if (!product) {
            return res.status(404).json({ error: 'Product not found.' });
        }

        // Set originalPrice if not already set
        if (!product.originalPrice || product.originalPrice === 0) {
            product.originalPrice = product.price;
        }

        // Update the price
        product.price = price;

        // Save the updated product
        await product.save();

        res.status(200).json({
            message: 'Product price updated successfully.',
            product: {
                productId: product.productId,
                name: product.name,
                price: product.price,
                originalPrice: product.originalPrice,
            },
        });
    } catch (error) {
        console.error('Error updating product price:', error);
        res.status(500).json({ error: 'An error occurred while updating the product price.' });
    }
});


module.exports = router;