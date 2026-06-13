// server/models/PerformanceReport.js
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
      totalDays: { type: Number, default: 0 },
      presentDays: { type: Number, default: 0 },
      absentDays: { type: Number, default: 0 },
      halfDays: { type: Number, default: 0 },
      attendancePercentage: { type: Number, default: 0 }
    },
    tasks: {
      totalAssigned: { type: Number, default: 0 },
      completedTasks: { type: Number, default: 0 },
      pendingTasks: { type: Number, default: 0 },
      inProgressTasks: { type: Number, default: 0 },
      averageRating: { type: Number, default: 0 },
      tasksWithRatings: [{
        taskId: mongoose.Schema.Types.ObjectId,
        title: String,
        rating: Number,
        feedback: String,
        submittedAt: Date
      }]
    },
    overallScore: { type: Number, default: 0 },
    performanceGrade: { type: String, default: 'N/A' }
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
  publishedAt: Date
}, {
  timestamps: true
});

module.exports = mongoose.model('PerformanceReport', performanceReportSchema);