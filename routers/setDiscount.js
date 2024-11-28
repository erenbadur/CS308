router.post('/set-discount', async (req, res) => {
    const { productId, discountRate } = req.body;

    try {
        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ error: 'Product not found.' });

        const originalPrice = product.price;
        product.discountedPrice = originalPrice - (originalPrice * discountRate) / 100;
        await product.save();

        // Notify users
        const wishlists = await Wishlist.find({ items: { $in: [productId] } });
        const userEmails = wishlists.map(wishlist => wishlist.user.email);
        const transporter = nodemailer.createTransport({ /* SMTP config */ });
        await transporter.sendMail({
            from: 'noreply@store.com',
            to: userEmails,
            subject: 'Discount Alert!',
            text: `Good news! ${product.name} is now available at a discounted price: ${product.discountedPrice}.`,
        });

        res.status(200).json({ message: 'Discount applied and users notified.' });
    } catch (error) {
        console.error('Error setting discount:', error);
        res.status(500).json({ error: 'Failed to apply discount.' });
    }
});
