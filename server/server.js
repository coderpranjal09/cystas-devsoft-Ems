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
app.use(express.json());
// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected');


    app.use(cors({
      origin: ['http://localhost:5173', 'https://cystas-ems.netlify.app'],
      credentials: true,
    }));

    
// Vercel requires exporting app instead of listening
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
}
    
    app.use('/api/admin', adminRoutes);
    app.use('/api/auth', authRoutes);
    app.use('/api/client', clientRoutes);
    app.use('/api/employee', employeeRoutes); 
    // Routes
    app.use('/',(req,res)=>{
      res.send('server is running');
    })
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
