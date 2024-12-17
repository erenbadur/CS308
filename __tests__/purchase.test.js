const request = require('supertest');
const express = require('express');
const purchaseRoute = require('../routers/purchaseRoute');
const mongoose = require('mongoose');
const Product = require('../models/product');
const Invoice = require('../models/invoice'); // Updated Invoice model
const User = require('../models/user');
const Delivery = require('../models/delivery');
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
  await Invoice.deleteMany({});
  await User.deleteMany({});
  await Delivery.deleteMany({});
});

afterAll(async () => {
  await mongoose.connection.close();
  jest.clearAllTimers();
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
      email: 'testuser1@example.com',
      password: 'securepassword',
    });
  });

  describe('POST /api/purchases/confirm-payment', () => {
    it('should confirm payment, deduct stock, create a delivery record, and save the invoice', async () => {
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
      expect(response.body.message).toBe('Payment confirmed and invoice generated.');
  
      // Check if stock is deducted
      const updatedProduct = await Product.findOne({ productId: testProduct.productId });
      expect(updatedProduct.quantityInStock).toBe(8);
  
      // Verify invoice creation
      const invoice = await Invoice.findOne({ email: testUser.email });
      expect(invoice).not.toBeNull();
      expect(invoice.totalAmount).toBe(200);
      expect(invoice.products[0].name).toBe('Test Product');
  
      // Verify delivery record
      const delivery = await Delivery.findOne({ user: testUser.userId });
      expect(delivery).not.toBeNull();
      expect(delivery.status).toBe('processing');
      expect(delivery.deliveryAddress.address).toBe('123 Test Street');
    });
  });
    

    it('should return an error if the product stock is insufficient', async () => {
      const response = await request(app).post('/api/purchases/confirm-payment').send({
        userId: testUser.userId,
        products: [{ productId: testProduct.productId, quantity: 15 }], // Exceeds stock
        shippingAddress: {
          fullName: 'John Doe',
          phoneNum: '1234567890',
          address: '123 Test Street',
          country: 'Testland',
          postalCode: '12345',
        },
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('not found or insufficient stock');
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

    it('should return an error if the shipping address is incomplete', async () => {
      const response = await request(app).post('/api/purchases/confirm-payment').send({
        userId: testUser.userId,
        products: [{ productId: testProduct.productId, quantity: 2 }],
        shippingAddress: {
          fullName: 'John Doe',
          phoneNum: '1234567890',

          country: 'Testland',
          postalCode: '12345',
        }, // Missing required fields
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain(
        "Invalid shipping address. 'fullName', 'phoneNum', 'address', 'country', and 'postalCode' are required."
      );
    });
  });
