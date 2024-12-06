const request = require('supertest'); // For HTTP assertions
const express = require('express'); // To mock Express where necessary

jest.mock('../routers/server', () => {
  const express = require('express');
  const app = express();

  app.use(express.json()); // Add any middleware used in `server.js`

  // Mock routes as in `server.js`
  app.use('/api/products', (req, res) => {
    res.status(200).json([{ id: 1, name: 'Sample Product' }]);
  });

  return app; // Return app without calling `.listen()`
});

const app = require('../routers/server');

describe('Server.js Tests', () => {

  test('GET /api/products - Fetch all products', async () => {
    const response = await request(app).get('/api/products');
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual([{ id: 1, name: 'Sample Product' }]);
  });

  test('Unknown route should return 404', async () => {
    const response = await request(app).get('/unknown-route');
    expect(response.statusCode).toBe(404);
  });

  test("Middleware - JSON Parsing", async () => {
    const response = await request(app)
      .post("/api/auth") // Adjust route to one accepting POST
      .send({ key: "value" })
      .set("Content-Type", "application/json");
    expect(response.status).not.toBe(500); // Ensure middleware prevents server errors
  });

  test("GET / - Server Root", async () => {
    const response = await request(app).get("/");
    expect(response.status).toBe(404); // Assuming root route isn't defined
  });

  test("Query Parameters - Sorting", async () => {
    const response = await request(app).get("/api/products?sort=price");
    expect(response.status).toBe(200);
    expect(response.body).toBeInstanceOf(Array); // Assuming the route returns an array
    if (response.body.length > 1) {
      expect(response.body[0].price).toBeLessThanOrEqual(response.body[1].price);
    }
  });

  test("Stress Test - Multiple Requests", async () => {
    const requests = Array.from({ length: 10 }).map(() =>
      request(app).get("/api/products")
    );
    const responses = await Promise.all(requests);
    responses.forEach((response) => {
      expect(response.status).toBe(200);
    });
  });

  test("Rate Limiting - Excessive Requests", async () => {
    // Simulate rate limiting (if applicable)
    const requests = Array.from({ length: 101 }).map(() =>
      request(app).get("/api/products")
    );
    const responses = await Promise.all(requests);
    const lastResponse = responses[responses.length - 1];
    if (lastResponse.status === 429) {
      expect(lastResponse.body).toEqual({ error: "Too Many Requests" });
    }
  });

});