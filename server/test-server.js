// test-server.js
require('dotenv').config();
const express = require('express');
const app = express();

// Test route
app.get('/api/test', (req, res) => {
  res.json({ status: 'success', message: 'Basic route working' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Test server running on port ${PORT}`);
});