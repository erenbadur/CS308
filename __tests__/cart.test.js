


const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const express = require('express');

const cartRouter = require('../routers/cart');
const Cart = require('../models/cartModel');
const Product = require('../models/product');
const User = require('../models/user');
const Category = require('../models/category');


const app = express();
app.use(express.json());
app.use('/api/cart', cartRouter);

let mongoServer;

beforeAll(async () => {
    jest.spyOn(console, 'log').mockImplementation(() => {}); // Suppress console.log
    jest.spyOn(console, 'warn').mockImplementation(() => {}); // Suppress console.warn
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
});

afterAll(async () => {
    console.log.mockRestore(); // Restore original console.log behavior
    console.warn.mockRestore(); // Restore original console.warn behavior
    await mongoose.disconnect();
    await mongoServer.stop();
});

afterEach(async () => {
    await Cart.deleteMany({});
    await Product.deleteMany({});
    await User.deleteMany({});
    await Category.deleteMany({});
});

describe('Cart Routes', () => {
    let testProduct;
    let testUser;

    beforeEach(async () => {

        const testCategory = await Category.create({
            name: 'Electronics',
        });
        
        
        testUser = await User.create({
            userId: 'testUser',
            username: 'testuser',
            email: 'test@example.com',
            password: 'password123',
        });

        testProduct = await Product.create({
            productId: 'prod-001',
            name: 'Test Product',
            model: 'TP123',
            serialNumber: 'SN12345',
            description: 'A test product.',
            category: testCategory._id, // Use the ObjectId from the category
            price: 100,
            quantityInStock: 10,
            distributor: 'Test Distributor',
            imageUrl: 'http://example.com/product.jpg',
        });
    });

    describe('POST /api/cart/add', () => {
        it('should add an item to the cart', async () => {
            const response = await request(app)
                .post('/api/cart/add')
                .send({
                    userId: testUser.userId,
                    productId: testProduct.productId,
                    quantity: 2,
                });

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Item added to cart.');
            expect(response.body.cart.items).toHaveLength(1);
            expect(response.body.cart.items[0]).toMatchObject({
                productId: testProduct.productId,
                name: testProduct.name,
                price: testProduct.price,
                quantity: 2,
            });
        });

        it('should return 404 if the product does not exist', async () => {
            const response = await request(app)
                .post('/api/cart/add')
                .send({
                    userId: testUser.userId,
                    productId: 'nonexistent-prod',
                    quantity: 1,
                });

            expect(response.status).toBe(404);
            expect(response.body.error).toBe('Product with ID nonexistent-prod not found.');
        });

        it('should return 400 if the product is out of stock', async () => {
            await Product.updateOne(
                { productId: testProduct.productId },
                { quantityInStock: 0 }
            );

            const response = await request(app)
                .post('/api/cart/add')
                .send({
                    userId: testUser.userId,
                    productId: testProduct.productId,
                    quantity: 1,
                });

            expect(response.status).toBe(400);
            expect(response.body.error).toBe(`Product ${testProduct.name} is out of stock.`);
        });
    });

    describe('GET /api/cart/get', () => {
        it('should fetch the users cart', async () => {
            const cart = await Cart.create({
                userId: testUser.userId,
                items: [{ productId: testProduct.productId, quantity: 2 }],
            });

            const response = await request(app)
                .get('/api/cart/get')
                .query({ userId: testUser.userId });

            expect(response.status).toBe(200);
            expect(response.body.items).toHaveLength(1);
            expect(response.body.items[0]).toMatchObject({
                productId: testProduct.productId,
                name: testProduct.name,
                price: testProduct.price,
                quantity: 2,
            });
        });

    });

    describe('PUT /api/cart/update', () => {
        it('should update the quantity of an item in the cart', async () => {
            const cart = await Cart.create({
                userId: testUser.userId,
                items: [{ productId: testProduct.productId, quantity: 2 }],
            });

            const response = await request(app)
                .put('/api/cart/update')
                .send({
                    userId: testUser.userId,
                    productId: testProduct.productId,
                    quantity: 5,
                });

            expect(response.status).toBe(200);
            expect(response.body.cart.items[0].quantity).toBe(5);
        });

        it('should return 404 if the item is not in the cart', async () => {
            const cart = await Cart.create({
                userId: testUser.userId,
                items: [],
            });

            const response = await request(app)
                .put('/api/cart/update')
                .send({
                    userId: testUser.userId,
                    productId: 'nonexistent-prod',
                    quantity: 3,
                });

            expect(response.status).toBe(404);
            expect(response.body.error).toBe('Item not found in cart.');
        });
    });

    describe('DELETE /api/cart/delete', () => {
        it('should clear the cart for a user', async () => {
            await Cart.create({
                userId: testUser.userId,
                items: [{ productId: testProduct.productId, quantity: 2 }],
            });

            const response = await request(app)
                .delete('/api/cart/delete')
                .query({ userId: testUser.userId });

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Cart cleared successfully.');

            const cart = await Cart.findOne({ userId: testUser.userId });
            expect(cart).toBeNull();
        });

        it('should return 400 if userId is missing', async () => {
            const response = await request(app)
                .delete('/api/cart/delete')
                .query({});

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Both sessionId and userId are missing.');
        });
    });
});

