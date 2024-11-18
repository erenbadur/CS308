const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const signinRoutes = require('./signin.js'); // Import your signin routes
const purchaseRoute = require('./purchaseRoute'); // Correct relative path
const productRoutes = require('./productRoutes')
const createUser = require('./createUser')
const orderProcessingRoute = require('./orderProcessing')
const createProduct = require('./createProduct')
const User = require('./models/user'); // Import User model
const Product = require('./models/product'); // Correctly import Product model
const Order = require('./models/order');
const app = express();
const PORT = process.env.PORT || 3001;


// Middleware
app.use(bodyParser.json()); // Parse JSON request body

// MongoDB connection using Mongoose
mongoose.connect('mongodb+srv://eren:erenb200225@cluster0.fwxvq.mongodb.net/db1', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('Connected to MongoDB with Mongoose'))
  .catch(err => console.error('Error connecting to MongoDB:', err));

// Endpoint to fetch all products
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find({}); // Fetch all products using Mongoose
    res.status(200).json(products); // Send the products as a JSON response
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Error fetching products from database' });
  }
});

app.get('/api/categories', async (req, res) => {
  try {
    // Fetch unique categories from the Product collection
    const categories = await Product.distinct('category');
    res.status(200).json(categories); // Send the categories as a JSON response
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Error fetching categories from database' });
  }
});


// Use the signin routes
app.use('/api/auth', signinRoutes);
app.use('/api/purchases', purchaseRoute); // Purchase routes
app.use('/api/products', productRoutes); // Product routes
app.use('/api/processing', orderProcessingRoute); 
app.use('/api/createProduct', createProduct); 
app.use('/api/createUser', createUser); 
// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

