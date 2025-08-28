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
  credentials: true
}));

// ✅ Root Route (exact /) - moved up to avoid being caught by other middleware
app.get('/', (req, res) => {
  res.send('✅ Server is running...');
});

// ✅ API Routes - ensure these are correctly structured in their files
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/client', clientRoutes);
app.use('/api/employee', employeeRoutes);

// ✅ 404 Handler (must be after all routes)
app.use('*', (req, res) => {
  res.status(404).json({ status: 'fail', message: 'Route not found' });
});

// ✅ Global Error Handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.statusCode || 500).json({
    status: 'error',
    message: err.message || 'Internal Server Error'
  });
});

// ✅ Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// ✅ Local server for development only
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`✅ Server running locally on port ${PORT}`));
}

// ✅ Export app for serverless deployment (Vercel, Netlify Functions, etc.)
module.exports = app;