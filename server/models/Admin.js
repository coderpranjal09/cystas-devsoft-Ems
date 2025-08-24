const mongoose = require('mongoose');
const User = require('./User');

const adminSchema = new mongoose.Schema({
  department: {
    type: String,
    required: [true, 'Please provide department']
  },
  permissions: {
    type: [String],
    enum: ['create', 'read', 'update', 'delete', 'manage_users', 'manage_attendance'],
    default: ['read']
  }
});

// Inherit from User model using discriminators
module.exports = User.discriminator('Admin', adminSchema);