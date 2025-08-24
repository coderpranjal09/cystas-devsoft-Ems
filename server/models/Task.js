const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Task description is required']
  },
  assignedTo: [{
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  }],
  assignedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required']
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'evaluated'],
    default: 'pending'
  },
  submission: {
    submittedAt: Date,
    description: String,
    projectUrl: String,
    submittedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    }
  },
  evaluation: {
    rating: {
      type: Number,
      min: 0,
      max: 5
    },
    feedback: String,
    evaluatedAt: Date,
    evaluatedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for better query performance
taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ dueDate: 1 });

module.exports = mongoose.model('Task', taskSchema);