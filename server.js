const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const signinRoutes = require('./signin.js'); // Import your signin routes
const { MongoClient } = require('mongodb');
const User = require('./models/user'); // Import User model
const Product = require('./models/product').default; // Import Product model
const bcrypt = require('bcrypt');
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(bodyParser.json()); // Parse JSON request body

// MongoDB connection using Mongoose
mongoose.connect('mongodb+srv://eren:erenb200225@cluster0.fwxvq.mongodb.net/db1', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB with Mongoose');
}).catch(err => {
  console.error('Error connecting to MongoDB:', err);
});

// Sample endpoint to fetch products using MongoClient
const uri = "mongodb+srv://eren:erenb200225@cluster0.fwxvq.mongodb.net/db1?retryWrites=true&w=majority";
const client = new MongoClient(uri);

app.get('/api/products', async (req, res) => {
  try {
    await client.connect(); // Connect to MongoDB using MongoClient
    const database = client.db('db1'); // Use your database name
    const collection = database.collection('cl1'); // Use your collection name

    const products = await Product.find({}).lean(); // Fetch all products
    res.json(products); // Send the products as a response
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).send('Error fetching products from database');
  } finally {
    await client.close(); // Close the connection after the request
  }
});

// Use the signin routes
app.use('/api/auth', signinRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});