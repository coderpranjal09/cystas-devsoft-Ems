const Task = require('../models/Task');

// Simple error handler
const handleError = (res, statusCode, message) => {
  return res.status(statusCode).json({
    status: 'error',
    message
  });
};

// Create a new task
exports.createTask = async (req, res) => {
  try {
    const { title, description, assignedTo, dueDate } = req.body;

    if (!title || !description || !assignedTo || !dueDate) {
      return handleError(res, 400, 'All fields are required');
    }

    const task = await Task.create({
      title,
      description,
      assignedTo,
      dueDate: new Date(dueDate),
      assignedBy: req.user.id
    });

    // Populate assignedTo details
    await task.populate('assignedTo', 'name email');

    res.status(201).json({
      status: 'success',
      data: { task }
    });
  } catch (err) {
    console.error('Error creating task:', err);
    handleError(res, 500, 'Internal server error');
  }
};

// Get all tasks (for admin)
exports.getAllTasks = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    let query = {};
    if (status) {
      query.status = status;
    }

    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name')
      .populate('submission.submittedBy', 'name')
      .populate('evaluation.evaluatedBy', 'name')
      .sort('-createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Task.countDocuments(query);

    res.status(200).json({
      status: 'success',
      data: {
        tasks,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total
      }
    });
  } catch (err) {
    console.error('Error fetching tasks:', err);
    handleError(res, 500, 'Internal server error');
  }
};

// Get tasks assigned to current user
exports.getMyTasks = async (req, res) => {
  try {
    const { status } = req.query;
    
    let query = { assignedTo: req.user.id };
    if (status) {
      query.status = status;
    }

    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name')
      .sort('-createdAt');

    res.status(200).json({
      status: 'success',
      data: { tasks }
    });
  } catch (err) {
    console.error('Error fetching user tasks:', err);
    handleError(res, 500, 'Internal server error');
  }
};

// Submit task
exports.submitTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { description, projectUrl } = req.body;

    if (!description) {
      return handleError(res, 400, 'Submission description is required');
    }

    const task = await Task.findById(taskId);

    if (!task) {
      return handleError(res, 404, 'Task not found');
    }

    // Check if task is assigned to current user
    if (!task.assignedTo.some(userId => userId.toString() === req.user.id)) {
      return handleError(res, 403, 'You are not assigned to this task');
    }

    task.status = 'completed';
    task.submission = {
      submittedAt: new Date(),
      description,
      projectUrl: projectUrl || '',
      submittedBy: req.user.id
    };

    await task.save();
    await task.populate('submission.submittedBy', 'name');

    res.status(200).json({
      status: 'success',
      data: { task }
    });
  } catch (err) {
    console.error('Error submitting task:', err);
    handleError(res, 500, 'Internal server error');
  }
};

// Evaluate task
exports.evaluateTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { rating, feedback } = req.body;

    if (!rating || rating < 0 || rating > 5) {
      return handleError(res, 400, 'Valid rating (0-5) is required');
    }

    const task = await Task.findById(taskId);

    if (!task) {
      return handleError(res, 404, 'Task not found');
    }

    if (task.status !== 'completed') {
      return handleError(res, 400, 'Task must be completed before evaluation');
    }

    task.status = 'evaluated';
    task.evaluation = {
      rating,
      feedback: feedback || '',
      evaluatedAt: new Date(),
      evaluatedBy: req.user.id
    };

    await task.save();
    await task.populate('evaluation.evaluatedBy', 'name');

    res.status(200).json({
      status: 'success',
      data: { task }
    });
  } catch (err) {
    console.error('Error evaluating task:', err);
    handleError(res, 500, 'Internal server error');
  }
};

// Update task
exports.updateTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { title, description, assignedTo, dueDate, status } = req.body;

    const task = await Task.findByIdAndUpdate(
      taskId,
      { title, description, assignedTo, dueDate, status },
      { new: true, runValidators: true }
    ).populate('assignedTo', 'name email');

    if (!task) {
      return handleError(res, 404, 'Task not found');
    }

    res.status(200).json({
      status: 'success',
      data: { task }
    });
  } catch (err) {
    console.error('Error updating task:', err);
    handleError(res, 500, 'Internal server error');
  }
};

// Delete task
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.taskId);

    if (!task) {
      return handleError(res, 404, 'Task not found');
    }

    res.status(204).json({ status: 'success', data: null });
  } catch (err) {
    console.error('Error deleting task:', err);
    handleError(res, 500, 'Internal server error');
  }
};

// Get single task
exports.getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId)
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name')
      .populate('submission.submittedBy', 'name')
      .populate('evaluation.evaluatedBy', 'name');

    if (!task) {
      return handleError(res, 404, 'Task not found');
    }

    res.status(200).json({
      status: 'success',
      data: { task }
    });
  } catch (err) {
    console.error('Error fetching task:', err);
    handleError(res, 500, 'Internal server error');
  }
};