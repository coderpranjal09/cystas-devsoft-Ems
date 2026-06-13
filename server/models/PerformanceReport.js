// models/PerformanceReport.js
const mongoose = require('mongoose');

const performanceReportSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  period: {
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true }
  },
  reportData: [{
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    employeeName: String,
    employeeRole: String,
    attendance: {
      totalDays: Number,
      presentDays: Number,
      absentDays: Number,
      halfDays: Number,
      attendancePercentage: Number
    },
    tasks: {
      totalAssigned: Number,
      completedTasks: Number,
      pendingTasks: Number,
      inProgressTasks: Number,
      averageRating: Number,
      tasksWithRatings: [{
        taskId: mongoose.Schema.Types.ObjectId,
        title: String,
        rating: Number,
        feedback: String,
        submittedAt: Date
      }]
    },
    overallScore: Number,
    performanceGrade: String
  }],
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  publishedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('PerformanceReport', performanceReportSchema);