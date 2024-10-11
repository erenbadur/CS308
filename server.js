// server.js

const express = require('express');
const app = express();
const PORT = process.env.PORT || 3001;

// Example API route
app.get('/api/some-endpoint', (req, res) => {
  res.json({ message: 'Hello from the backend!' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
