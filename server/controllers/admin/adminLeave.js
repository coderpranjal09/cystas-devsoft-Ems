const mongoose = require('mongoose');
const Leave = require('../../models/Leave'); // Leave schema
const User = require('../../models/User');   // Employees are stored here

class LeaveController {
  // Get all leave applications with filtering
  async getAllLeaves(req, res) {
    try {
      const {
        status,
        employeeId,
        type,
        startDate,
        endDate,
        department,
        sort = '-createdAt',
        limit = 10,
        page = 1
      } = req.query;

      const filter = {};
      if (status) filter.status = status;
      if (employeeId && mongoose.Types.ObjectId.isValid(employeeId)) {
        filter.employee = new mongoose.Types.ObjectId(employeeId);
      }
      if (type) filter.type = type;

      if (startDate || endDate) {
        filter.startDate = {};
        if (startDate) filter.startDate.$gte = new Date(startDate);
        if (endDate) filter.startDate.$lte = new Date(endDate);
      }

      if (department) {
        const employees = await User.find({ department }).select('_id');
        const employeeIds = employees.map(e => e._id);
        if (employeeIds.length > 0) {
          filter.employee = { $in: employeeIds };
        }
      }

      const skip = (page - 1) * parseInt(limit);
      const sortOrder = sort.startsWith('-') ? -1 : 1;
      const sortField = sort.startsWith('-') ? sort.substring(1) : sort;

      const leaves = await Leave.aggregate([
        { $match: filter },
        { $sort: { [sortField]: sortOrder } },
        { $skip: skip },
        { $limit: parseInt(limit) },
        {
          $lookup: {
            from: 'users',  // was 'employees'
            localField: 'employee',
            foreignField: '_id',
            as: 'employee'
          }
        },
        { $unwind: '$employee' },
        {
          $lookup: {
            from: 'users',
            localField: 'approvedBy',
            foreignField: '_id',
            as: 'approvedBy'
          }
        },
        { $unwind: { path: '$approvedBy', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            'employee.password': 0,
            'approvedBy.password': 0
          }
        }
      ]);

      const total = await Leave.countDocuments(filter);

      res.status(200).json({
        status: 'success',
        results: leaves.length,
        total,
        page: +page,
        limit: +limit,
        data: { leaves }
      });
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  }

  // Get single leave application
  async getLeave(req, res) {
    try {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ status: 'fail', message: 'Invalid leave ID' });
      }

      const leave = await Leave.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(req.params.id) } },
        {
          $lookup: {
            from: 'users', // was 'employees'
            localField: 'employee',
            foreignField: '_id',
            as: 'employee'
          }
        },
        { $unwind: '$employee' },
        {
          $lookup: {
            from: 'users',
            localField: 'approvedBy',
            foreignField: '_id',
            as: 'approvedBy'
          }
        },
        { $unwind: { path: '$approvedBy', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            'employee.password': 0,
            'approvedBy.password': 0
          }
        }
      ]);

      if (!leave || leave.length === 0) {
        return res.status(404).json({ status: 'fail', message: 'No leave found with that ID' });
      }

      res.status(200).json({ status: 'success', data: { leave: leave[0] } });
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  }

  // Approve or reject leave application
  async updateLeaveStatus(req, res) {
    try {
      const { status, rejectionReason } = req.body;
      const adminId = req.user.id;

      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ status: 'fail', message: 'Status must be either "approved" or "rejected"' });
      }

      if (status === 'rejected' && !rejectionReason) {
        return res.status(400).json({ status: 'fail', message: 'Rejection reason is required when rejecting leave' });
      }

      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ status: 'fail', message: 'Invalid leave ID' });
      }

      const updateData = {
        status,
        approvedBy: new mongoose.Types.ObjectId(adminId),
        approvedAt: new Date()
      };
      if (status === 'rejected') updateData.rejectionReason = rejectionReason;

      const leave = await Leave.findByIdAndUpdate(req.params.id, updateData, { new: true })
        .populate('employee', '-password')
        .populate('approvedBy', '-password');

      if (!leave) {
        return res.status(404).json({ status: 'fail', message: 'No leave found with that ID' });
      }

      res.status(200).json({ status: 'success', data: { leave } });
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  }

  // Get leave statistics
  async getLeaveStats(req, res) {
    try {
      const { department, startDate, endDate } = req.query;
      const match = {};

      if (department) {
        const employees = await User.find({ department }).select('_id');
        const employeeIds = employees.map(e => e._id);
        if (employeeIds.length > 0) match.employee = { $in: employeeIds };
      }

      if (startDate || endDate) {
        match.startDate = {};
        if (startDate) match.startDate.$gte = new Date(startDate);
        if (endDate) match.startDate.$lte = new Date(endDate);
      }

      const stats = await Leave.aggregate([
        { $match: match },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]);

      const result = { pending: 0, approved: 0, rejected: 0, total: 0 };
      stats.forEach(stat => { result[stat._id] = stat.count; result.total += stat.count; });

      res.status(200).json({ status: 'success', data: result });
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  }
}

module.exports = new LeaveController();
