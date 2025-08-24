const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  date: {
    type: Date,
    required: [true, 'Date is required']
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'half_day', 'leave'],
    required: [true, 'Status is required']
  },
  checkIn: Date,
  checkOut: Date,
  notes: String,
  recordedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }
}, {
  // Add timestamps for better tracking
  timestamps: true
});

// Ensure one record per user per day with the correct field name
attendanceSchema.index({ user: 1, date: 1 }, { unique: true });

// Remove any old indexes that might cause conflicts
attendanceSchema.pre('save', async function(next) {
  try {
    const collection = mongoose.connection.db.collection('attendances');
    const indexes = await collection.indexes();
    
    // Check if old employee index exists and remove it
    const oldIndex = indexes.find(index => index.name === 'employee_1_date_1');
    if (oldIndex) {
      await collection.dropIndex('employee_1_date_1');
      console.log('Removed old employee_1_date_1 index');
    }
    
    next();
  } catch (error) {
    console.log('Error checking/removing old indexes:', error);
    next();
  }
});

module.exports = mongoose.model('Attendance', attendanceSchema);
