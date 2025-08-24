const mongoose = require('mongoose');
const User = require('./User');

const employeeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  employeeId: {
    type: String,
    required: true,
    unique: true
  },
  position: {
    type: String,
    required: [true, 'Please provide position']
  },
  department: {
    type: String,
    required: [true, 'Please provide department']
  },
  joiningDate: {
    type: Date,
    required: [true, 'Please provide joining date']
  },
  salary: {
    type: Number,
    required: [true, 'Please provide salary']
  },
  skills: [String],
  manager: {
    type: mongoose.Schema.ObjectId,
    ref: 'Employee'
  }
});

employeeSchema.pre(/^find/, function(next) {
  this.populate('user').populate('manager');
  next();
});

module.exports = User.discriminator('Employee', employeeSchema);