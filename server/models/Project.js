// models/Project.js
const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide project name']
  },
  description: {
    type: String,
    required: [true, 'Please provide project description']
  },
  client: {
    type: String, // Changed from reference to String
    required: [true, 'Please provide client name']
  },
  manager: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  team: [{
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }],
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  lastDate: Date,
  status: {
    type: String,
    enum: ['planning', 'active', 'onHold', 'completed', 'cancelled'],
    default: 'planning'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  budget: Number,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Project', projectSchema);