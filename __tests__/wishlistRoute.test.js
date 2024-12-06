const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const express = require('express');
const Wishlist = require('../models/wishlist');
const User = require('../models/user');
const Product = require('../models/product');
const wishlistRoutes = require('../routers/wishlistRoute');

// Set up Express app for testing
const app = express();
app.use(express.json());
app.use('/api/wishlist', wishlistRoutes);

let mongoServer;
let user; // Declare user
let product; // Declare product

beforeAll(async () => {
    // Start MongoMemoryServer
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();

    // Connect mongoose to in-memory database
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
});

afterAll(async () => {
    // Disconnect mongoose and stop MongoMemoryServer
    await mongoose.connection.close();
    await mongoServer.stop();
});

afterEach(async () => {
    // Clear database after each test
    await mongoose.connection.db.dropDatabase();
});

describe('Wishlist API', () => {
    beforeEach(async () => {
        // Create a test user
        user = new User({
            username: 'testuser',
            email: 'testuser@example.com',
            password: 'securePassword123',
        });

        // Create a test product with all required fields
        product = new Product({
            name: 'Test Product',
            model: 'Model-X',
            serialNumber: 'SN12345',
            category: 'computer',
            quantityInStock: 50,
            price: 999.99,
            distributor: 'Tech Distributor Inc',
        });

        await user.save();
        await product.save();
    });

    test('should add an item to the wishlist', async () => {
        const response = await request(app)
            .post('/api/wishlist')
            .send({ userId: user._id.toString(), productId: product._id.toString() });

        console.log('POST Response:', response.body); // Debug API response

        expect(response.statusCode).toBe(201);
        expect(response.body.message).toBe('Item added to wishlist');
        expect(response.body.wishlistItem.userId.toString()).toBe(user._id.toString());
        expect(response.body.wishlistItem.productId.toString()).toBe(product._id.toString());
    });

    test('should fetch a user\'s wishlist', async () => {
        // Add an item to the wishlist
        await new Wishlist({ userId: user._id, productId: product._id }).save();

        const response = await request(app).get(`/api/wishlist/${user._id}`);

        console.log('GET Response:', response.body); // Debug API response

        expect(response.statusCode).toBe(200);
        expect(response.body.wishlist).toHaveLength(1);
        expect(response.body.wishlist[0].productId._id.toString()).toBe(product._id.toString());
    });

    test('should remove an item from the wishlist', async () => {
        const wishlistItem = await new Wishlist({ userId: user._id, productId: product._id }).save();

        const response = await request(app).delete(`/api/wishlist/${wishlistItem._id}`);

        console.log('DELETE Response:', response.body); // Debug API response

        expect(response.statusCode).toBe(200);
        expect(response.body.message).toBe('Item removed from wishlist');
        expect(response.body.deletedItem._id.toString()).toBe(wishlistItem._id.toString());
    });

    test('should not add duplicate items to the wishlist', async () => {
        // Add an item to the wishlist
        await new Wishlist({ userId: user._id, productId: product._id }).save();

        // Try to add the same item again
        const response = await request(app)
            .post('/api/wishlist')
            .send({ userId: user._id.toString(), productId: product._id.toString() });

        console.log('Duplicate POST Response:', response.body); // Debug API response

        expect(response.statusCode).toBe(400);
        expect(response.body.message).toBe('Product already in wishlist');
    });

    test('should return an error for invalid userId or productId', async () => {
        const response = await request(app)
            .post('/api/wishlist')
            .send({ userId: '', productId: '' });

        console.log('Invalid POST Response:', response.body); // Debug API response

        expect(response.statusCode).toBe(400);
        expect(response.body.message).toBe('User ID and Product ID are required');
    });
});