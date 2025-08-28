const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const adminRoutes = require('./routes/admin');
const authRoutes = require('./routes/auth');
const employeeRoutes = require('./routes/employee');
const clientRoutes = require('./routes/client');
const { MONGODB_URI } = require('./config/db'); // Your MongoDB URI

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: ['http://localhost:5173', 'https://cystas-ems.netlify.app'],
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Routes
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/client', clientRoutes);
app.use('/api/employee', employeeRoutes);

// Default Route
app.get('/', (req, res) => {
  res.send('✅ Server is running...');
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ status: 'fail', message: 'Route not found' });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.statusCode || 500).json({
    status: 'error',
    message: err.message || 'Internal Server Error',
  });
});

// ✅ Connect to MongoDB only once (not inside route handlers)
mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
  });

// ✅ Vercel: Export app instead of listening
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`✅ Server running locally on port ${PORT}`));
}

module.exports = app;
