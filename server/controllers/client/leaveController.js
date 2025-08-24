const Leave = require('../../models/Leave');
const AppError = require('../../utils/errorHandler');

exports.applyForLeave = async (req, res, next) => {
  try {
    const { type, startDate, endDate, reason } = req.body;

    // Calculate number of days
    const days = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1;

    const leave = await Leave.create({
      employee: req.user.id,
      type,
      startDate,
      endDate,
      days,
      reason
    });

    res.status(201).json({
      status: 'success',
      data: {
        leave
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.getMyLeaves = async (req, res, next) => {
  try {
    const leaves = await Leave.find({ employee: req.user.id }).sort('-createdAt');

    res.status(200).json({
      status: 'success',
      results: leaves.length,
      data: {
        leaves
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.cancelLeave = async (req, res, next) => {
  try {
    const leave = await Leave.findOneAndDelete({
      _id: req.params.id,
      employee: req.user.id,
      status: 'pending'
    });

    if (!leave) {
      return next(new AppError('No pending leave found with that ID or you cannot cancel this leave', 404));
    }

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (err) {
    next(err);
  }
};