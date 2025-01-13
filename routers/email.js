const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail', // or 'hotmail', 'yahoo', etc., or use a custom SMTP server
    auth: {
        user: process.env.EMAIL_USER, // Your email
        pass: process.env.EMAIL_PASS, // Your email password or app-specific password
    },
    pool: true, // Enable connection pooling
    maxConnections: 5, // Maximum number of connections
    rateLimit: 100, // Maximum num

});

const sendEmail = async (to, subject, text, html) => {
    try {
        const info = await transporter.sendMail({
            from: `"N308" <${process.env.EMAIL_USER}>`, // Sender
            to, // Recipient email
            subject, // Subject
            text, // Plain text
            html, // HTML content
        });

        console.log('Email sent:', info.messageId);
    } catch (error) {
        console.error('Error sending email:', error);
    }
};

module.exports = sendEmail;
