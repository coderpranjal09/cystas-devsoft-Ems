const Admin = require('../../models/Admin');
const User = require('../../models/User');
const Project = require('../../models/Project');
const Leave = require('../../models/Leave');
const Attendance = require('../../models/Attendance');
const AppError = require('../../utils/errorHandler');
const Task = require('../../models/Task');

// Create new admin
exports.createAdmin = async (req, res, next) => {
  try {
    const { name, email, password, department, permissions } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new AppError('Email already in use', 400));
    }

    // Create new admin (discriminator handles both User and Admin creation)
    const admin = await Admin.create({
      name,
      email,
      password,
      role: 'admin',
      department,
      permissions: permissions || ['read']
    });

    res.status(201).json({
      status: 'success',
      data: {
        admin: {
          _id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
          department: admin.department,
          permissions: admin.permissions,
          createdAt: admin.createdAt
        }
      }
    });
  } catch (err) {
    next(err);
  }
};
// Get all admins
exports.getAllAdmins = async (req, res, next) => {
  try {
    const admins = await Admin.find();

    res.status(200).json({
      status: 'success',
      results: admins.length,
      data: {
        admins
      }
    });
  } catch (err) {
    next(err);
  }
};

// Get single admin by id
exports.getAdmin = async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.params.id);
    if (!admin) {
      return next(new AppError('No admin found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        admin
      }
    });
  } catch (err) {
    next(err);
  }
};

// Update admin
exports.updateAdmin = async (req, res, next) => {
  try {
    const { department, permissions } = req.body;

    const admin = await Admin.findByIdAndUpdate(
      req.params.id,
      { department, permissions },
      { new: true, runValidators: true }
    );

    if (!admin) {
      return next(new AppError('No admin found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        admin
      }
    });
  } catch (err) {
    next(err);
  }
};

// Delete admin and associated user
exports.deleteAdmin = async (req, res, next) => {
  try {
    const admin = await Admin.findByIdAndDelete(req.params.id);
    if (!admin) {
      return next(new AppError('No admin found with that ID', 404));
    }

    // Also delete the associated User document (same _id)
    await User.findByIdAndDelete(admin._id);

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (err) {
    next(err);
  }
};

// Admin dashboard stats
exports.getAdminStats = async (req, res, next) => {
  try {
    const employeeCount = await User.countDocuments();
    const projectCount = await Project.countDocuments();
    const pendingLeaves = await Leave.countDocuments({ status: 'pending' });
    const activeTasks = await Task.countDocuments({status:'pending'||'in_progress'})
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const presentCount = await Attendance.countDocuments({
      date: { $gte: today },
      status: 'present'
    });

    const todayAttendance = employeeCount > 0
      ? Math.round((presentCount / employeeCount) * 100)
      : 0;

    res.status(200).json({
      status: 'success',
      data: {
        employeeCount,
        projectCount,
        pendingLeaves,
        activeTasks
      }
    });
  } catch (err) {
    next(err);
  }
};
