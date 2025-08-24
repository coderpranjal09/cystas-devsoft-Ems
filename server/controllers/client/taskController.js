const Task = require('../../models/Task');
const { AppError } = require('../../utils/errorHandler');


exports.getClientTasks = async (req, res, next) => {
  try {
    // Get projects where client is the current user
    const projects = await Project.find({ client: req.user.id });
    const projectIds = projects.map(p => p._id);

    const tasks = await Task.find({ project: { $in: projectIds } })
      .populate('project assignedTo')
      .sort('-createdAt');

    res.status(200).json({
      status: 'success',
      results: tasks.length,
      data: {
        tasks
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.updateTaskStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, assignedTo: req.user.id },
      { status },
      { new: true, runValidators: true }
    ).populate('project assignedTo');

    if (!task) {
      return next(new AppError('No task found with that ID or you are not assigned to this task', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        task
      }
    });
  } catch (err) {
    next(err);
  }
};