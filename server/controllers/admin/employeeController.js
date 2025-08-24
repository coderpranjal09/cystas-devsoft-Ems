const User = require('../../models/User');
const AppError = require('../../utils/errorHandler');

// Get all users (optional filter by role via query ?role=client/admin)
exports.getAllEmployees = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.role) {
      filter.role = req.query.role;
    }

    const employees = await User.find(filter).select(
      '-password -__v -passwordChangedAt -passwordResetToken -passwordResetExpires'
    );

    res.status(200).json({
      status: 'success',
      results: employees.length,
      data: { employees }
    });
  } catch (err) {
    next(err);
  }
};

// Get single user
exports.getEmployee = async (req, res, next) => {
  try {
    const employee = await User.findById(req.params.id).select(
      '-password -__v -passwordChangedAt -passwordResetToken -passwordResetExpires'
    );

    if (!employee) {
      return next(new AppError('No user found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: { employee }
    });
  } catch (err) {
    next(err);
  }
};

// Create new user (client or admin)
exports.createEmployee = async (req, res, next) => {
  try {
    const { name, email, mobno, password, role = 'client', department } = req.body;

    const newEmployee = await User.create({
      name,
      email,
      mobno,
      password,
      role,
      department
    });

    newEmployee.password = undefined;
    newEmployee.__v = undefined;

    res.status(201).json({
      status: 'success',
      data: { employee: newEmployee }
    });
  } catch (err) {
    next(err);
  }
};

// Update user
exports.updateEmployee = async (req, res, next) => {
  try {
    // Optional: protect against role changes unless admin
    if (req.body.role && req.user?.role !== 'admin') {
      return next(new AppError('Not authorized to change user role', 403));
    }

    const employee = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).select('-password -__v -passwordChangedAt -passwordResetToken -passwordResetExpires');

    if (!employee) {
      return next(new AppError('No user found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: { employee }
    });
  } catch (err) {
    next(err);
  }
};

// Delete user
exports.deleteEmployee = async (req, res, next) => {
  try {
    const employee = await User.findByIdAndDelete(req.params.id);

    if (!employee) {
      return next(new AppError('No user found with that ID', 404));
    }

    res.status(204).json({ status: 'success', data: null });
  } catch (err) {
    next(err);
  }
};
