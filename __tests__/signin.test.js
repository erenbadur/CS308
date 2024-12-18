const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const express = require('express');
const bcrypt = require('bcrypt');

const User = require('../models/user');
const Cart = require('../models/cartModel');
const authRoutes = require('../routers/signin'); 

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

let mongoServer;

beforeAll(async () => {
    // Start MongoDB memory server
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

afterEach(async () => {
    // Clean up after each test
    await User.deleteMany({});
    await Cart.deleteMany({});
});




describe('Auth Routes', () => {
    describe('POST /api/auth/signin', () => {
      it('should create a new user successfully', async () => {
        const response = await request(app)
            .post('/api/auth/signin')
            .send({ username: 'testuser', email: 'test@example.com', password: 'Test@1234' });
    
        expect(response.status).toBe(201);
        expect(response.body.message).toBe('User created successfully');
    
        // Fetch user with password included
        const user = await User.findOne({ email: 'test@example.com' }).select('+password');
        expect(user).not.toBeNull();
    
        // Verify the password is hashed
        const isPasswordValid = await bcrypt.compare('Test@1234', user.password);
        expect(isPasswordValid).toBe(true);
    });
    
    
    

    it('should return 400 if the user already exists', async () => {
      await User.create({
          username: 'testuser',
          email: 'test@example.com',
          password: await bcrypt.hash('Test@1234', 10),
      });
  
      const response = await request(app)
          .post('/api/auth/signin')
          .send({ username: 'testuser', email: 'test@example.com', password: 'Test@1234' });
  
      expect(response.status).toBe(400);
      expect(response.body.message).toBe('User already exists');
  });
  
    });

    describe('POST /api/auth/login', () => {
        let user;
        beforeEach(async () => {
            const hashedPassword = await bcrypt.hash('Test@1234', 10);
            user = await User.create({
                userId: 'user-123',
                username: 'testuser',
                email: 'test@example.com',
                password: hashedPassword,
            });
        });

        it('should login successfully with valid credentials', async () => {
          const response = await request(app)
              .post('/api/auth/login')
              .send({ username: 'testuser', password: 'Test@1234' });
      
          expect(response.status).toBe(200);
          expect(response.body.message).toBe('Login successful');
          expect(response.body.userId).toBe('user-123');
      });
      

        it('should return 400 for invalid username', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({ username: 'invaliduser', password: 'Test@1234' });

            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Invalid credentials');
        });

        it('should return 400 for invalid password', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({ username: 'testuser', password: 'WrongPassword' });

            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Invalid credentials');
        });

        it('should merge guest cart with user cart', async () => {
          // Create a guest cart
          await Cart.create({
              sessionId: 'guest-session',
              items: [{ productId: 'prod-123', quantity: 2 }],
          });
      
          // User login with guest session ID
          const response = await request(app)
              .post('/api/auth/login')
              .send({ username: 'testuser', password: 'Test@1234', sessionId: 'guest-session' });
      
          expect(response.status).toBe(200);
          expect(response.body.message).toBe('Login successful');
      
          // Verify the cart is merged
          const userCart = await Cart.findOne({ userId: user.userId });
          expect(userCart).not.toBeNull();
          expect(userCart.items).toHaveLength(1);
          expect(userCart.items[0].productId).toBe('prod-123');
          expect(userCart.items[0].quantity).toBe(2);
      
          // Ensure guest cart is removed
          const guestCart = await Cart.findOne({ sessionId: 'guest-session' });
          expect(guestCart).toBeNull();
      });
      
    });

    describe('GET /api/auth/users', () => {
        beforeEach(async () => {
            await User.create([
                { username: 'user1', email: 'user1@example.com', password: 'hashedpass' },
                { username: 'user2', email: 'user2@example.com', password: 'hashedpass' },
            ]);
        });

        it('should return a list of all users without passwords', async () => {
          const response = await request(app).get('/api/auth/users');
      
          expect(response.status).toBe(200);
          expect(response.body).toHaveLength(2);
      
          response.body.forEach((user) => {
              expect(user).toHaveProperty('username');
              expect(user).toHaveProperty('email');
              expect(user).not.toHaveProperty('password'); // Ensure no password
          });
      });
      
    });
});
