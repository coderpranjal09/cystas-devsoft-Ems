const mongoose = require('mongoose');
const User = require('./User');

const clientSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  company: {
    type: String,
    required: [true, 'Please provide company name']
  },
  contactNumber: {
    type: String,
    required: [true, 'Please provide contact number']
  },
  projects: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Project'
  }]
});

clientSchema.pre(/^find/, function(next) {
  this.populate('user').populate('projects');
  next();
});

module.exports = User.discriminator('Client', clientSchema);