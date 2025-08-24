const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const adminRoutes = require('./routes/admin');
const authRoutes = require('./routes/auth');
const employeeRoutes =require('./routes/employee');
const clientRoutes = require('./routes/client');
const { MONGODB_URI } = require('./config/db'); // your config file exporting the URI


const app = express();

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected');

    // Middleware
    app.use(express.json());

    app.use(cors({
      origin: ['http://localhost:5173', 'https://yourproductiondomain.com'],
      credentials: true,
    }));

    // Routes
    app.use('/',(req,res)=>{
      res.send('server is running');
    })
    app.use('/api/admin', adminRoutes);
    app.use('/api/auth', authRoutes);
    app.use('/api/client', clientRoutes);
    app.use('/api/employee', employeeRoutes); 
    // 404 handler
    app.use((req, res, next) => {
      res.status(404).json({ status: 'fail', message: 'Route not found' });
    });

    // Global error handler
    app.use((err, req, res, next) => {
      console.error(err);
      res.status(err.statusCode || 500).json({
        status: 'error',
        message: err.message || 'Internal Server Error',
      });
    });

    // Start server
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
