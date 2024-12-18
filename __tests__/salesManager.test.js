const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const express = require('express');
const salesManagerRoute = require('../routers/salesManager');
const Product = require('../models/product');
const Invoice = require('../models/invoice');
const User = require('../models/user'); // Added User model
const app = express();

app.use(express.json());
app.use('/api/sales', salesManagerRoute);

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
});

afterAll(async () => {
    await mongoose.connection.close();
    await mongoServer.stop();
});

afterEach(async () => {
    await Product.deleteMany({});
    await Invoice.deleteMany({});
    await User.deleteMany({});
});

describe('Sales Manager Routes', () => {
    let testUser, testProduct1, testProduct2;

    beforeEach(async () => {
        // Create a user to avoid duplicate errors
        testUser = await User.create({
            userId: 'user-123',
            username: 'testuser',
            email: `testuser-${Date.now()}@example.com`, // Unique email
            password: 'securepassword',
        });

        // Add test products
        testProduct1 = await Product.create({
            productId: 'prod-001',
            name: 'Product One',
            model: 'Model-001',
            serialNumber: 'SN-001',
            description: 'A test product.',
            category: 'mobile phone',
            quantityInStock: 10,
            price: 100,
            distributor: 'Distributor-1',
        });

        testProduct2 = await Product.create({
            productId: 'prod-002',
            name: 'Product Two',
            model: 'Model-002',
            serialNumber: 'SN-002',
            description: 'Another test product.',
            category: 'computer',
            quantityInStock: 20,
            price: 200,
            distributor: 'Distributor-2',
        });
    });

    describe('POST /api/sales/set-discount', () => {
        it('should apply discounts to selected products', async () => {
            const response = await request(app)
                .post('/api/sales/set-discount')
                .send({ products: ['prod-001'], discount: 10 });

            expect(response.status).toBe(200);
            const updatedProduct = await Product.findOne({ productId: 'prod-001' });
            expect(updatedProduct.price).toBe(90);
        });
    });

    describe('GET /api/sales/invoices', () => {
        beforeEach(async () => {
            await Invoice.create({
                user: testUser._id,
                email: testUser.email,
                products: [{ name: 'Product One', quantity: 1, price: 100, total: 100 }],
                totalAmount: 100,
                invoiceFilePath: 'invoices/Invoice-001.pdf',
                date: new Date(),
            });
        });

        it('should retrieve invoices in a date range', async () => {
            const response = await request(app)
                .get('/api/sales/invoices')
                .query({ startDate: '2024-12-01', endDate: '2024-12-31' });

            expect(response.status).toBe(200);
            expect(response.body.invoices).toHaveLength(1);
        });
    });
});
