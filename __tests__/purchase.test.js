const request = require('supertest');
const express = require('express');
const purchaseRoute = require('../routers/purchaseRoute');
const mongoose = require('mongoose');
const Product = require('../models/product');
const PurchaseHistory = require('../models/PurchaseHistory');
const User = require('../models/user');

const app = express();
app.use(express.json());
app.use('/api/purchases', purchaseRoute);

// Connect to a test database
beforeAll(async () => {
  const mongoURI = 'mongodb://localhost:27017/testdb';
  await mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
});

// Clean up after each test
afterEach(async () => {
  await Product.deleteMany({});
  await PurchaseHistory.deleteMany({});
  await User.deleteMany({});
});

// Close database connection after tests
afterAll(async () => {
  await mongoose.connection.close();
});

describe('Purchase Routes', () => {
  let testProduct, testUser;

  beforeEach(async () => {
    testProduct = await Product.create({
      productId: 'prod-123',
      name: 'Test Product',
      model: 'Model-123',
      serialNumber: 'SN-123',
      description: 'A test product.',
      category: 'mobile phone',
      quantityInStock: 10,
      price: 100,
      distributor: 'Test Distributor',
    });

    testUser = await User.create({
      userId: 'user-123',
      username: 'Test User',
      email: 'testuser@example.com',
      password: 'securepassword',
    });
  });

  describe('POST /api/purchases/add', () => {
    it('should return an error if the product is out of stock', async () => {
      const response = await request(app).post('/api/purchases/add').send({
        userId: testUser.userId,
        productId: testProduct.productId,
        quantity: 15, // Exceeds stock
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Not enough stock');
    });

    it('should return an error if the product does not exist', async () => {
      const response = await request(app).post('/api/purchases/add').send({
        userId: testUser.userId,
        productId: 'nonexistent', // Non-existent productId
        quantity: 1,
      });

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('Product not found.');
      
    });
  });

  describe('POST /api/purchases/confirm-payment', () => {
    it('should confirm payment, deduct stock, and create a valid delivery record', async () => {
      await request(app).post('/api/purchases/add').send({
        userId: testUser.userId,
        productId: testProduct.productId,
        quantity: 2,
      });

      const response = await request(app).post('/api/purchases/confirm-payment').send({
        userId: testUser.userId,
        products: [{ productId: testProduct.productId, quantity: 2 }],
        shippingAddress: {
          fullName: 'John Doe',
          phoneNum: '1234567890',
          address: '123 Test Street',
          country: 'Testland',
          postalCode: '12345',
        },
      });

      expect(response.status).toBe(200);
      expect(response.body.delivery).toMatchObject({
        user: testUser.userId,
        deliveryAddress: {
          fullName: 'John Doe',
          phoneNum: '1234567890',
          address: '123 Test Street',
          country: 'Testland',
          postalCode: '12345',
        },
        status: 'processing',
      });

      const updatedProduct = await Product.findOne({ productId: testProduct.productId });
      expect(updatedProduct.quantityInStock).toBe(8);
    });

    it('should return an error if the user does not exist', async () => {
      const response = await request(app).post('/api/purchases/confirm-payment').send({
        userId: 'nonexistent',
        products: [{ productId: testProduct.productId, quantity: 2 }],
        shippingAddress: {
          fullName: 'John Doe',
          phoneNum: '1234567890',
          address: '123 Test Street',
          country: 'Testland',
          postalCode: '12345',
        },
      });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('User not found.');
    });

    it('should return an error if the product stock is insufficient', async () => {
      const response = await request(app).post('/api/purchases/confirm-payment').send({
        userId: testUser.userId,
        products: [{ productId: testProduct.productId, quantity: 12 }], // Exceeds stock
        shippingAddress: {
          fullName: 'John Doe',
          phoneNum: '1234567890',
          address: '123 Test Street',
          country: 'Testland',
          postalCode: '12345',
        },
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Product with ID prod-123 not found or insufficient stock.');
    });

    it('should return an error if the shipping address is incomplete', async () => {
      const response = await request(app).post('/api/purchases/confirm-payment').send({
        userId: testUser.userId,
        products: [{ productId: testProduct.productId, quantity: 2 }],
        shippingAddress: {
          fullName: 'John Doe',
          phoneNum: '1234567890',
        }, // Missing address, country, postalCode
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain(
        "Invalid shipping address. 'fullName', 'phoneNum', 'address', 'country', and 'postalCode' are required."
      );
    });
  });
});
