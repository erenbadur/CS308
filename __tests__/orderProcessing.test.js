

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const express = require('express');

const orderProcessingRouter = require('../routers/orderProcessing');
const Product = require('../models/product');
const User = require('../models/user');
const Order = require('../models/order');
const Category = require('../models/category');

const app = express();
app.use(express.json());
app.use('/api/orders', orderProcessingRouter);

let mongoServer;

beforeAll(async () => {
    
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
});

afterAll(async () => {
    
    await mongoose.disconnect();
    await mongoServer.stop();
});

afterEach(async () => {
    await Product.deleteMany({});
    await User.deleteMany({});
    await Order.deleteMany({});
    await Category.deleteMany({});
    jest.restoreAllMocks(); // Restore all mocks after each test
});

describe('Order Processing Routes', () => {
    let testUser, testProduct;

    beforeEach(async () => {
        const testCategory = await Category.create({
            name: 'Electronics',
        });

        testUser = await User.create({
            userId: 'testUser',
            username: 'testuser',
            email: 'testuser@example.com',
            password: 'password123',
        });

        testProduct = await Product.create({
            productId: 'prod-001',
            name: 'Test Product',
            model: 'TP123',
            serialNumber: 'SN12345',
            description: 'A test product.',
            category: testCategory._id,
            price: 100,
            quantityInStock: 10,
            distributor: 'Test Distributor',
            imageUrl: 'http://example.com/product.jpg',
        });
    });

    describe('POST /api/orders/order', () => {
        it('should place an order successfully', async () => {
            const response = await request(app)
                .post('/api/orders/order')
                .send({
                    userId: testUser.userId,
                    productId: testProduct.productId,
                    quantity: 2,
                });

            expect(response.status).toBe(201);
            expect(response.body.message).toBe('Order placed successfully.');
            expect(response.body.order).toMatchObject({
                user: testUser.userId,
                quantity: 2,
                status: 'Processing',
            });

            const updatedProduct = await Product.findOne({ productId: testProduct.productId });
            expect(updatedProduct.quantityInStock).toBe(8); // Ensure stock is reduced
        });

        it('should return 400 for invalid quantity', async () => {
            const response = await request(app)
                .post('/api/orders/order')
                .send({
                    userId: testUser.userId,
                    productId: testProduct.productId,
                    quantity: 0,
                });

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Invalid productId or quantity.');
        });

        it('should return 401 if userId is missing', async () => {
            const response = await request(app)
                .post('/api/orders/order')
                .send({
                    productId: testProduct.productId,
                    quantity: 2,
                });

            expect(response.status).toBe(401);
            expect(response.body.error).toBe('User must be logged in to place an order.');
        });

        it('should return 404 if the user does not exist', async () => {
            const response = await request(app)
                .post('/api/orders/order')
                .send({
                    userId: 'nonexistent-user',
                    productId: testProduct.productId,
                    quantity: 2,
                });

            expect(response.status).toBe(404);
            expect(response.body.error).toBe('User not found.');
        });

        it('should return 404 if the product does not exist', async () => {
            const response = await request(app)
                .post('/api/orders/order')
                .send({
                    userId: testUser.userId,
                    productId: 'nonexistent-product',
                    quantity: 2,
                });

            expect(response.status).toBe(404);
            expect(response.body.error).toBe('Product not found.');
        });

        it('should return 400 if stock is insufficient', async () => {
            const response = await request(app)
                .post('/api/orders/order')
                .send({
                    userId: testUser.userId,
                    productId: testProduct.productId,
                    quantity: 15, // More than available stock
                });

            expect(response.status).toBe(400);
            expect(response.body.error).toBe(
                `Not enough stock. Available stock: ${testProduct.quantityInStock}`
            );
        });

        it('should handle server errors gracefully and roll back stock changes', async () => {
            // Mock Order.create to throw an error
            const mockOrderCreate = jest.spyOn(Order, 'create').mockImplementationOnce(() => {
                throw new Error('Order creation failed');
            });

            // Muted the intentionally crated error for test purposes as it is distracting in the test results.
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});


            const response = await request(app)
                .post('/api/orders/order')
                .send({
                    userId: testUser.userId,
                    productId: testProduct.productId,
                    quantity: 2,
                });

            // Check that the response indicates a server error
            expect(response.status).toBe(500);
            expect(response.body.error).toBe('An error occurred while placing the order.');

            // Ensure stock is rolled back after the error
            const updatedProduct = await Product.findOne({ productId: testProduct.productId });
            expect(updatedProduct.quantityInStock).toBe(10); // Stock should remain unchanged

            // Restore the mock to avoid side effects on other tests
            // Restore the console after the test
            consoleSpy.mockRestore();
            mockOrderCreate.mockRestore();
        });
    });
});
