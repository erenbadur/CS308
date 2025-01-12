const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const productManagerRouter = require('../routers/productManager');
const Product = require('../models/product');
const Category = require('../models/category');

const app = express();
app.use(express.json());
app.use('/api/manager', productManagerRouter);

let mongoServer;


beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
});

afterEach(async () => {
    await Product.deleteMany({});
    await Category.deleteMany({});
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

describe('Product Manager Routes', () => {
    let testProduct;
    let testCategory; 

    beforeEach(async () => {
        testCategory = await Category.create({
            name: 'Electronics',
        });

        testProduct = await Product.create({
            productId: 'prod-001',
            name: 'Test Product',
            model: 'TP-123',
            serialNumber: 'SN-123',
            description: 'A test product.',
            category: testCategory._id,
            imageUrl: 'http://example.com/product.jpg',
            quantityInStock: 10,
            price: 100,
            distributor: 'Test Distributor',
        });
    });

    describe('GET /api/manager/categories', () => {
        it('should fetch all categories', async () => {
            const response = await request(app).get('/api/manager/categories');

            expect(response.status).toBe(200);
            expect(response.body.categories).toHaveLength(1);
            expect(response.body.categories[0].name).toBe('Electronics');
        });
    });

    describe('POST /api/manager/categories', () => {
        it('should add a new category', async () => {
            const response = await request(app).post('/api/manager/categories').send({
                name: 'Home Appliances',
            });

            expect(response.status).toBe(201);
            expect(response.body.message).toBe('Category added successfully.');
        });

        it('should return an error if the category already exists', async () => {
            const response = await request(app).post('/api/manager/categories').send({
                name: 'Electronics',
            });

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Category already exists.');
        });

        it('should return an error for invalid input', async () => {
            const response = await request(app).post('/api/manager/categories').send({
                name: '',
            });

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Category name is required and must be a non-empty string.');
        });
    });

    describe('DELETE /api/manager/categories/:categoryName', () => {
        it('should delete a category and its products', async () => {
            const response = await request(app).delete(`/api/manager/categories/${testCategory.name}`);

            expect(response.status).toBe(200);
            expect(response.body.message).toContain('Category "Electronics" and its associated products have been deleted successfully.');
            expect(response.body.deletedProductsCount).toBe(1);
        });

        it('should return an error if the category does not exist', async () => {
            const response = await request(app).delete('/api/manager/categories/NonExistentCategory');

            expect(response.status).toBe(404);
            expect(response.body.error).toBe('Category not found.');
        });
    });

    describe('GET /api/manager/products', () => {
        it('should fetch all products', async () => {
            const response = await request(app).get('/api/manager/products');

            expect(response.status).toBe(200);
            expect(response.body.products).toHaveLength(1);
            expect(response.body.products[0].name).toBe('Test Product');
        });

        it('should fetch products filtered by category', async () => {
            // Ensure the category _id is a valid ObjectId
            expect(mongoose.Types.ObjectId.isValid(testCategory._id)).toBe(true);
            
            const response = await request(app)
            .get('/api/manager/products')
            .query({ category: testCategory._id.toString() });

            expect(response.status).toBe(200);
            expect(response.body.products).toHaveLength(1);
            expect(response.body.products[0].category.name).toBe('Electronics');
        });
    });

    describe('DELETE /api/manager/products/:productId', () => {
        it('should delete a product by productId', async () => {
            const response = await request(app).delete(`/api/manager/products/${testProduct.productId}`);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Product deleted successfully.');
        });

        it('should return an error if the product does not exist', async () => {
            const response = await request(app).delete('/api/manager/products/nonexistent-prod');

            expect(response.status).toBe(404);
            expect(response.body.error).toBe('Product not found.');
        });
    });

    describe('PUT /api/manager/products/:productId', () => {
        it('should update product details', async () => {
            const response = await request(app).put(`/api/manager/products/${testProduct.productId}`).send({
                name: 'Updated Product',
                price: 150,
            });

            expect(response.status).toBe(200);
            expect(response.body.product.name).toBe('Updated Product');
            expect(response.body.product.price).toBe(150);
        });

        it('should return an error if the product does not exist', async () => {
            const response = await request(app).put('/api/manager/products/nonexistent-prod').send({
                name: 'Nonexistent Product',
            });

            expect(response.status).toBe(404);
            expect(response.body.error).toBe('Product not found.');
        });
    });
});
