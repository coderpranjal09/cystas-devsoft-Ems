const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    default: null
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',  // Usually the user who logged the activity
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  // Optional: You can add status, activityType, or other metadata if needed
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed'],
    default: 'pending'
  }
});

module.exports = mongoose.model('Activity', activitySchema);
