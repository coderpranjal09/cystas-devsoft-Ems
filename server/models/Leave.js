const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.ObjectId,
    ref: 'User', // ✅ corrected
    required: true
  },
  type: {
    type: String,
    enum: ['sick', 'vacation', 'personal', 'maternity', 'paternity', 'other'],
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  days: {
    type: Number,
    required: true
  },
  reason: String,
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  approvedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  rejectionReason: String
}, { timestamps: true });

module.exports = mongoose.model('Leave', leaveSchema);
