const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const express = require('express');

const createProductRoute = require('../routers/createProduct');
const Product = require('../models/product');
const Category = require('../models/category');

const app = express();
app.use(express.json());
app.use('/api', createProductRoute);

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
    await mongoose.connection.dropDatabase();
});

describe('POST /api/product', () => {
    let testCategory;

    beforeEach(async () => {
        testCategory = await Category.create({ name: 'Electronics' });
    });

    it('should create a product successfully', async () => {
        const productData = {
            name: 'Test Product',
            model: 'TP123',
            serialNumber: 'SN12345',
            description: 'A test product.',
            category: testCategory._id,
            quantityInStock: 10,
            price: 99.99,
            distributor: 'Test Distributor',
            warrantyStatus: true,
            imageUrl: 'http://example.com/product.jpg',
        };

        const response = await request(app).post('/api/product').send(productData);

        expect(response.status).toBe(201);
        expect(response.body.message).toBe('Product created successfully.');
        expect(response.body.product.name).toBe('Test Product');
    });

    it('should return 400 if required fields are missing', async () => {
        const productData = { model: 'TP123', serialNumber: 'SN12345', price: 99.99 };

        const response = await request(app).post('/api/product').send(productData);

        expect(response.status).toBe(400);
        expect(response.body.error).toContain('Fields name, model, serialNumber');
    });

    it('should return 400 if the category does not exist', async () => {
        const productData = {
            name: 'Test Product',
            model: 'TP123',
            serialNumber: 'SN12345',
            description: 'A test product.',
            category: new mongoose.Types.ObjectId(),
            quantityInStock: 10,
            price: 99.99,
            distributor: 'Test Distributor',
            warrantyStatus: true,
            imageUrl: 'http://example.com/product.jpg',
        };

        const response = await request(app).post('/api/product').send(productData);

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Selected category does not exist.');
    });

    it('should return 400 if quantityInStock is negative', async () => {
        const productData = {
            name: 'Test Product',
            model: 'TP123',
            serialNumber: 'SN12345',
            description: 'A test product.',
            category: testCategory._id,
            quantityInStock: -5,
            price: 99.99,
            distributor: 'Test Distributor',
            warrantyStatus: true,
            imageUrl: 'http://example.com/product.jpg',
        };

        const response = await request(app).post('/api/product').send(productData);

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Quantity in stock must be zero or greater.');
    });

    it('should return 400 if price is negative', async () => {
        const productData = {
            name: 'Test Product',
            model: 'TP123',
            serialNumber: 'SN12345',
            description: 'A test product.',
            category: testCategory._id,
            quantityInStock: 10,
            price: -10,
            distributor: 'Test Distributor',
            warrantyStatus: true,
            imageUrl: 'http://example.com/product.jpg',
        };

        const response = await request(app).post('/api/product').send(productData);

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Price must be zero or greater.');
    });

    it('should return 400 if a product with the same model or serial number already exists', async () => {
        const existingProduct = {
            name: 'Existing Product',
            model: 'TP123',
            serialNumber: 'SN12345',
            description: 'An existing product.',
            category: testCategory._id,
            quantityInStock: 10,
            price: 99.99,
            distributor: 'Existing Distributor',
            warrantyStatus: true,
            imageUrl: 'http://example.com/existing-product.jpg',
        };

        await Product.create(existingProduct);

        const newProduct = {
            name: 'Test Product',
            model: 'TP123',
            serialNumber: 'SN12345',
            description: 'A test product.',
            category: testCategory._id,
            quantityInStock: 10,
            price: 99.99,
            distributor: 'Test Distributor',
            warrantyStatus: true,
            imageUrl: 'http://example.com/product.jpg',
        };

        const response = await request(app).post('/api/product').send(newProduct);

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('A product with the same model or serial number already exists.');
    });

    
});
