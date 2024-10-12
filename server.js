const express = require('express');
const { MongoClient } = require('mongodb');
const app = express();
const PORT = process.env.PORT || 3001;

// Replace with your MongoDB connection URI
const uri = "mongodb+srv://eren:erenb200225@cluster0.fwxvq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Create a new MongoClient instance
const client = new MongoClient(uri);

app.get('/api/products', async (req, res) => {
  try {
    await client.connect(); // Connect to the MongoDB server
    const database = client.db('db1'); // Use your database name
    const collection = database.collection('cl1'); // Use your collection name

    const products = await collection.find({}).toArray();
    res.json(products); // Send the products as a response
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).send('Error fetching products from database');
  } finally {
    await client.close(); // Close the connection after the request is completed
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});