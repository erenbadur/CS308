const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const express = require('express');
const User = require('../models/user');
const notificationsRoutes = require('../routers/notifications');

const app = express();
app.use(express.json());
app.use('/api/notifications', notificationsRoutes);

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Notifications API', () => {
  beforeEach(async () => {
    const mockUser = new User({
      _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'), // Match the middleware ObjectId
      userId: 'mockUserId',
      username: 'testuser',
      email: 'testuser@example.com',
      password: 'securePassword123',
      notifications: [
        { id: '1', message: 'Test Notification 1', timestamp: new Date(), isRead: false },
      ],
    });
    await mockUser.save();
  });

  afterEach(async () => {
    await mongoose.connection.db.dropDatabase();
  });

  test('GET /api/notifications - Fetch last 5 notifications', async () => {
    const response = await request(app).get('/api/notifications');
    expect(response.statusCode).toBe(200);
    expect(response.body.notifications).toHaveLength(1);
    expect(response.body.notifications[0].message).toBe('Test Notification 1');
  });

  test('POST /api/notifications/mark-read - Mark notifications as read', async () => {
    const response = await request(app).post('/api/notifications/mark-read');
    expect(response.statusCode).toBe(200);

    const user = await User.findById('507f1f77bcf86cd799439011');
    expect(user.notifications.every((n) => n.isRead)).toBe(true);
  });

  test('POST /api/notifications/new - Add new notification', async () => {
    const response = await request(app)
      .post('/api/notifications/new')
      .send({ userId: '507f1f77bcf86cd799439011', message: 'New Test Notification' });
    expect(response.statusCode).toBe(201);
    expect(response.body.notification.message).toBe('New Test Notification');

    const user = await User.findById('507f1f77bcf86cd799439011');
    expect(user.notifications[0].message).toBe('New Test Notification');
  });
});