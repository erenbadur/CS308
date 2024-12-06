// __tests__/searchBar.test.js

// Mock the Product model before importing it
jest.mock('../models/product', () => ({
    // Provide a default mock implementation
    find: jest.fn().mockResolvedValue([]),
  }));
  
  const request = require('supertest');
  const express = require('express');
  const Product = require('../models/product'); // This is now the mocked version
  const searchBarRouter = require('../routers/searchBar');
  
  // Set up Express app for testing
  const app = express();
  app.use(express.json());
  app.use('/api/searchBar', searchBarRouter);
  
  describe('SearchBar API', () => {
    afterEach(() => {
      jest.resetAllMocks(); // Reset mocks after each test
    });
  
    test('returns 400 when no search term or category is provided', async () => {
      const response = await request(app).get('/api/searchBar/search');
  
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Either search term or category is required.');
  
      // Ensure Product.find was not called
      expect(Product.find).not.toHaveBeenCalled();
    });    
  });  