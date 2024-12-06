// productRoutes.test.js

const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const Product = require('../models/product');
const PurchaseHistory = require('../models/PurchaseHistory');
const User = require('../models/user');
const productRoutes = require('../routers/productRoutes');

// Set up Express app for testing
const app = express();
app.use(express.json());
app.use('/api/products', productRoutes);

// In-Memory MongoDB setup
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
  jest.clearAllMocks();
  await mongoose.connection.db.dropDatabase();
});

// Tests

describe('GET /api/products/', () => {
  test('should return paginated list of products', async () => {
    const products = [
      {
        productId: '1',
        name: 'Product 1',
        category: 'mobile phone',
        model: 'Model1',
        serialNumber: 'SN1',
        price: 299.99,
        distributor: 'Distributor A',
        quantityInStock: 50,
      },
      {
        productId: '2',
        name: 'Product 2',
        category: 'computer',
        model: 'Model2',
        serialNumber: 'SN2',
        price: 799.99,
        distributor: 'Distributor B',
        quantityInStock: 30,
      },
    ];
    await Product.insertMany(products);

    const response = await request(app)
      .get('/api/products')
      .query({ page: 1, limit: 2 });

    expect(response.status).toBe(200);
    expect(response.body.products).toHaveLength(2);
    expect(response.body.pagination.currentPage).toBe(1);
    expect(response.body.pagination.totalPages).toBe(1);
  });


});

describe('GET /api/products/:productId', () => {
  test('should return product details', async () => {
    const product = {
      productId: '123',
      name: 'Test Product',
      category: 'accessories',
      model: 'Model123',
      serialNumber: 'SN123',
      price: 49.99,
      distributor: 'Distributor X',
      quantityInStock: 100,
    };
    await Product.create(product);

    const response = await request(app).get('/api/products/123');

    expect(response.status).toBe(200);
    expect(response.body.product.name).toBe('Test Product');
    expect(response.body.product.quantityInStock).toBe(100);
  });

  test('should return 404 if product not found', async () => {
    const response = await request(app).get('/api/products/nonexistent');

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Product not found.');
  });
});

describe('POST /api/products/:productId/comment', () => {
  test('should add a comment and rating to a product', async () => {
    const product = {
      productId: '123',
      name: 'Test Product',
      category: 'accessories',
      model: 'Model123',
      serialNumber: 'SN123',
      price: 49.99,
      distributor: 'Distributor X',
      quantityInStock: 100,
    };
    await Product.create(product);

    const response = await request(app)
      .post('/api/products/123/comment')
      .send({ userId: 'user1', rating: 4, content: 'Great product!' });

    expect(response.status).toBe(201);
    expect(response.body.message).toBe('Rating and/or comment submitted successfully.');

    const updatedProduct = await Product.findOne({ productId: '123' });
    expect(updatedProduct.ratings).toHaveLength(1);
    expect(updatedProduct.comments).toHaveLength(1);
    expect(updatedProduct.comments[0].content).toBe('Great product!');
  });

  test('should return 400 for invalid rating', async () => {
    const product = {
      productId: '123',
      name: 'Test Product',
      category: 'accessories',
      model: 'Model123',
      serialNumber: 'SN123',
      price: 49.99,
      distributor: 'Distributor X',
      quantityInStock: 100,
    };
    await Product.create(product);

    const response = await request(app)
      .post('/api/products/123/comment')
      .send({ userId: 'user1', rating: 6 });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('A valid rating (1-5) is required.');
  });

  test('should return 404 if product not found', async () => {
    const response = await request(app)
      .post('/api/products/unknown/comment')
      .send({ userId: 'user1', rating: 4 });

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Product not found.');
  });
});

describe('GET /api/products/:productId/comments', () => {


  test('should return 404 if product not found', async () => {
    const response = await request(app).get('/api/products/nonexistent/comments');

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Product not found.');
  });
});

describe('GET /api/products/sort', () => {
  test('should sort products by price ascending', async () => {
    const products = [
      {
        productId: '1',
        name: 'Product 1',
        category: 'accessories',
        model: 'Model1',
        serialNumber: 'SN1',
        price: 200,
        distributor: 'Distributor A',
        quantityInStock: 50,
      },
      {
        productId: '2',
        name: 'Product 2',
        category: 'accessories',
        model: 'Model2',
        serialNumber: 'SN2',
        price: 100,
        distributor: 'Distributor B',
        quantityInStock: 30,
      },
    ];
    await Product.insertMany(products);

    const response = await request(app)
      .get('/api/products/sort')
      .query({ sortBy: 'price', order: 'asc' });

    expect(response.status).toBe(200);
    expect(response.body.products[0].price).toBe(100);
    expect(response.body.products[1].price).toBe(200);
  });


});

describe('POST /api/products/:productId/rate', () => {


  test('should forbid rating if user has not purchased the product', async () => {
    // Create user and product but no purchase history
    const user = {
      userId: 'user1',
      username: 'alice123',
      email: 'alice@example.com',
      password: 'securePassword123',
      name: 'Alice',
    };
    const product = {
      productId: '123',
      name: 'Test Product',
      category: 'accessories',
      model: 'Model123',
      serialNumber: 'SN123',
      price: 49.99,
      distributor: 'Distributor X',
      quantityInStock: 100,
    };
    await User.create(user);
    await Product.create(product);

    const response = await request(app)
      .post('/api/products/123/rate')
      .send({ userId: 'user1', rating: 5 });

    expect(response.status).toBe(403);
    expect(response.body.error).toBe('You can only comment or rate products you have purchased.');
  });
});