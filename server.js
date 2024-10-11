const express = require('express');
const app = express();
const PORT = process.env.PORT || 3001;

// Product list (this could come from a database, but for simplicity, we'll use a hardcoded array)
const products = [
  { id: 1, name: 'Laptop', price: 999.99, description: 'A high-end laptop' },
  { id: 2, name: 'Smartphone', price: 599.99, description: 'A flagship smartphone' },
  { id: 3, name: 'Headphones', price: 199.99, description: 'Noise-cancelling headphones' },
  { id: 4, name: 'Smartwatch', price: 299.99, description: 'A stylish smartwatch' },
];

// API endpoint to get the product list
app.get('/api/products', (req, res) => {
  res.json(products);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});