const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');

// Routers (all in the `routers` folder)
const signinRoutes = require('./signin.js');
const purchaseRoute = require('./purchaseRoute');
const productRoutes = require('./productRoutes');
const createUser = require('./createUser');
const orderProcessingRoute = require('./orderProcessing');
const searchBar = require('./searchBar');
const createProduct = require('./createProduct');
const cart = require('./cart');
const track = require('./track');
const productManagerRoutes = require('./productManager');
const notificationsRoutes = require('./notifications');
const wishlistRoutes = require('./wishlistRoute');

// Models (all in the `models` folder, one level up)
const Cart = require('../models/cartModel');
const User = require('../models/user');
const Product = require('../models/product');
const Order = require('../models/order');
const Delivery = require('../models/delivery');
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(bodyParser.json()); // Parse JSON request body

// MongoDB Connection
mongoose.connect('mongodb+srv://eren:erenb200225@cluster0.fwxvq.mongodb.net/db1', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to MongoDB with Mongoose'))
  .catch(err => console.error('Error connecting to MongoDB:', err));

// Routes
app.use('/api/auth', signinRoutes);
app.use('/api/purchases', purchaseRoute);
app.use('/api/products', productRoutes);
app.use('/api/createProduct', createProduct);
app.use('/api/createUser', createUser);
app.use('/api/searchBar', searchBar);
app.use('/api/cart', cart);
app.use('/api/processing', orderProcessingRoute);
app.use('/api/track', track);
app.use('/api/manager', productManagerRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/wishlist', wishlistRoutes);

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});