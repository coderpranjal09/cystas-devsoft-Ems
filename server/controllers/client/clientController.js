const Client = require('../../models/Client');
const User = require('../../models/User');
const Project = require('../../models/Project');
const Task = require('../../models/Task');
const Activity = require('../../models/Activity');
const jwt = require('jsonwebtoken');
const Attendance = require('../../models/Attendance');

// ==========================
// Get Client Profile
// ==========================
exports.getClientProfile = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(200).json({ status: 'success', data: { client: null } });
    }

    const client = await Client.findOne({ user: req.user.id })
      .populate('user')
      .populate('projects');

    res.status(200).json({
      status: 'success',
      data: { client: client || null }
    });
  } catch (err) {
    next(err);
  }
};

// ==========================
// Update Client Profile
// ==========================
exports.updateClientProfile = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(200).json({ status: 'success', data: { client: null } });
    }

    const updates = {
      company: req.body.company,
      contactNumber: req.body.contactNumber
    };

    const client = await Client.findOneAndUpdate(
      { user: req.user.id },
      updates,
      { new: true, runValidators: true }
    ).populate('user');

    if (req.body.name || req.body.email) {
      const userUpdates = {};
      if (req.body.name) userUpdates.name = req.body.name;
      if (req.body.email) userUpdates.email = req.body.email;
      await User.findByIdAndUpdate(req.user.id, userUpdates, { runValidators: true });
    }

    res.status(200).json({
      status: 'success',
      data: { client: client || null }
    });
  } catch (err) {
    next(err);
  }
};

// ==========================
// Get Attendance
// ==========================
exports.getAttendance = async (req, res, next) => {
  try {
    const { year, month } = req.query;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
    }

    if (!year || !month) {
      return res.status(400).json({
        status: 'error',
        message: 'Year and month parameters are required'
      });
    }

    const yearNum = parseInt(year);
    const monthNum = parseInt(month);
    
    if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid year or month parameters'
      });
    }

    const startDate = new Date(yearNum, monthNum - 1, 1);
    const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59, 999);

    const attendanceRecords = await Attendance.find({
      user: userId,
      date: { 
        $gte: startDate, 
        $lte: endDate 
      }
    })
    .select('_id user date status checkIn checkOut notes recordedBy createdAt updatedAt')
    .sort({ date: 1 });

    const formattedRecords = attendanceRecords.map(record => ({
      id: record._id,
      user: record.user,
      date: record.date,
      status: record.status,
      checkIn: record.checkIn,
      checkOut: record.checkOut,
      notes: record.notes,
      recordedBy: record.recordedBy,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt
    }));

    res.status(200).json({
      status: 'success',
      results: formattedRecords.length,
      data: { 
        attendance: formattedRecords,
        month: monthNum,
        year: yearNum
      }
    });
  } catch (err) {
    next(err);
  }
};

// ==========================
// Get Client Projects (FIXED - SIMPLE STRING MATCH)
// ==========================
exports.getClientProjects = async (req, res, next) => {
  try {
    console.log('=== DEBUG: getClientProjects called ===');
    console.log('User ID:', req.user?.id);
    
    if (!req.user?.id) {
      console.log('No user ID found in request');
      return res.status(200).json({ 
        status: 'success', 
        results: 0, 
        data: { projects: [] } 
      });
    }

    // Get the authenticated user
    const user = await User.findById(req.user?.id);
    console.log('User found:', user ? user.name : 'No user found');
    
    if (!user) {
      console.log('No user document found');
      return res.status(200).json({ 
        status: 'success', 
        results: 0, 
        data: { projects: [] } 
      });
    }

    console.log('Looking for projects with client name:', user.name);
    
    // Find projects where the client field matches the user's name
    const projects = await Project.find({ 
      client: user.name 
    })
    .populate('manager', 'name email position')
    .populate('team', 'name email position');

    console.log('Projects found:', projects.length);
    if (projects.length > 0) {
      console.log('Project details:');
      projects.forEach(p => {
        console.log('- Name:', p.name, 'Client:', p.client, 'Manager:', p.manager?.name);
      });
    }

    res.status(200).json({
      status: 'success',
      results: projects.length,
      data: { projects }
    });
  } catch (err) {
    console.error('Error in getClientProjects:', err);
    next(err);
  }
};

// ==========================
// Get Single Client Project (FIXED)
// ==========================
exports.getClientProject = async (req, res, next) => {
  try {
    console.log('=== DEBUG: getClientProject called ===');
    console.log('Project ID:', req.params.id);
    
    if (!req.user?.id) {
      return res.status(200).json({ status: 'success', data: { project: null } });
    }

    // Get the authenticated user
    const user = await User.findById(req.user?.id);
    console.log('User found:', user ? user.name : 'No user found');
    
    if (!user) {
      return res.status(200).json({ status: 'success', data: { project: null } });
    }

    // Find project where client name matches user's name and ID matches
    const project = await Project.findOne({ 
      _id: req.params.id,
      client: user.name 
    })
    .populate('manager', 'name email position')
    .populate('team', 'name email position');

    console.log('Project found:', project ? project.name : 'No project found');

    res.status(200).json({
      status: 'success',
      data: { project: project || null }
    });
  } catch (err) {
    console.error('Error in getClientProject:', err);
    next(err);
  }
};

// ==========================
// Dashboard Stats (FIXED)
// ==========================
exports.getDashboardStats = async (req, res, next) => {
  try {
    if (!req.user?.id) {
      return res.status(200).json({
        status: 'success',
        data: {
          projectStats: { total: 0 },
          recentActivities: []
        }
      });
    }

    // Get the authenticated user
    const user = await User.findById(req.user?.id);
    
    if (!user) {
      return res.status(200).json({
        status: 'success',
        data: {
          projectStats: { total: 0 },
          recentActivities: []
        }
      });
    }

    // Find projects for this client (using user name)
    const projects = await Project.find({ client: user.name });
    
    const statusCounts = {};
    projects.forEach(project => {
      statusCounts[project.status] = (statusCounts[project.status] || 0) + 1;
    });

    const recentActivities = await Activity.find({
      $or: [
        { project: { $in: projects.map(p => p._id) } },
        { client: user.name }
      ]
    })
    .sort('-createdAt')
    .limit(5)
    .populate('project', 'name')
    .populate('employee', 'name');

    res.status(200).json({
      status: 'success',
      data: {
        projectStats: {
          total: projects.length,
          ...statusCounts
        },
        recentActivities
      }
    });
  } catch (err) {
    next(err);
  }
};

// ==========================
// Update Password
// ==========================
exports.updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user?.id).select('+password');
    if (!user || !(await user.correctPassword(currentPassword, user.password))) {
      return res.status(200).json({ status: 'success', data: { updated: false } });
    }

    user.password = newPassword;
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE
    });

    res.status(200).json({
      status: 'success',
      token,
      data: { updated: true, user }
    });
  } catch (err) {
    next(err);
  }
};

// ==========================
// Get Client Projects (FIXED - Find projects where user is in team)
// ==========================
exports.getClientProjects = async (req, res, next) => {
  try {
    console.log('=== DEBUG: getClientProjects called ===');
    console.log('User ID:', req.user?.id);
    
    if (!req.user?.id) {
      console.log('No user ID found in request');
      return res.status(200).json({ 
        status: 'success', 
        results: 0, 
        data: { projects: [] } 
      });
    }

    // Find projects where the user is part of the team
    const projects = await Project.find({ 
      team: req.user.id 
    })
    .populate('manager', 'name email position')
    .populate('team', 'name email position');

    console.log('Projects found where user is in team:', projects.length);
    if (projects.length > 0) {
      console.log('Project details:');
      projects.forEach(p => {
        console.log('- Name:', p.name, 'Client:', p.client, 'Manager:', p.manager?.name);
      });
    }

    res.status(200).json({
      status: 'success',
      results: projects.length,
      data: { projects }
    });
  } catch (err) {
    console.error('Error in getClientProjects:', err);
    next(err);
  }
};

// ==========================
// Get Single Client Project (FIXED - User in team)
// ==========================
exports.getClientProject = async (req, res, next) => {
  try {
    console.log('=== DEBUG: getClientProject called ===');
    console.log('Project ID:', req.params.id);
    
    if (!req.user?.id) {
      return res.status(200).json({ status: 'success', data: { project: null } });
    }

    // Find project where user is in team and ID matches
    const project = await Project.findOne({ 
      _id: req.params.id,
      team: req.user.id 
    })
    .populate('manager', 'name email position')
    .populate('team', 'name email position');

    console.log('Project found:', project ? project.name : 'No project found');

    res.status(200).json({
      status: 'success',
      data: { project: project || null }
    });
  } catch (err) {
    console.error('Error in getClientProject:', err);
    next(err);
  }
};

// ==========================
// Dashboard Stats (FIXED - User in team)
// ==========================
exports.getDashboardStats = async (req, res, next) => {
  try {
    if (!req.user?.id) {
      return res.status(200).json({
        status: 'success',
        data: {
          projectStats: { total: 0 },
          recentActivities: []
        }
      });
    }

    // Find projects where user is in team
    const projects = await Project.find({ team: req.user.id });
    
    const statusCounts = {};
    projects.forEach(project => {
      statusCounts[project.status] = (statusCounts[project.status] || 0) + 1;
    });

    const recentActivities = await Activity.find({
      $or: [
        { project: { $in: projects.map(p => p._id) } },
        { employee: req.user.id }
      ]
    })
    .sort('-createdAt')
    .limit(5)
    .populate('project', 'name')
    .populate('employee', 'name');

    res.status(200).json({
      status: 'success',
      data: {
        projectStats: {
          total: projects.length,
          ...statusCounts
        },
        recentActivities
      }
    });
  } catch (err) {
    next(err);
  }
};

// ==========================
// Get Client Tasks (FIXED - User in team)
// ==========================
exports.getClientTasks = async (req, res, next) => {
  try {
    if (!req.user?.id) {
      return res.status(200).json({ 
        status: 'success', 
        results: 0, 
        data: { tasks: [] } 
      });
    }

    // Find projects where user is in team
    const projects = await Project.find({ team: req.user.id });
    const projectIds = projects.map(p => p._id);

    const tasks = await Task.find({
      project: { $in: projectIds }
    })
    .populate('project', 'name')
    .populate('assignedTo', 'name email')
    .sort('-createdAt');

    res.status(200).json({
      status: 'success',
      results: tasks.length,
      data: { tasks }
    });
  } catch (err) {
    next(err);
  }
};

// ==========================
// Get Client Project Details (FIXED - User in team)
// ==========================
exports.getClientProjectDetails = async (req, res, next) => {
  try {
    if (!req.user?.id) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Find project where user is in team and ID matches
    const project = await Project.findOne({ 
      _id: req.params.id,
      team: req.user.id 
    })
    .populate('manager', 'name email')
    .populate('team', 'name email position')
    .populate({
      path: 'tasks',
      select: 'title description status priority assignedTo dueDate',
      populate: {
        path: 'assignedTo',
        select: 'name email'
      }
    });

    if (!project) {
      return res.status(404).json({
        status: 'error',
        message: 'Project not found or access denied'
      });
    }

    res.status(200).json({
      status: 'success',
      data: { project }
    });
  } catch (err) {
    next(err);
  }
};

// ==========================
// Get Project Tasks (FIXED - User in team)
// ==========================
exports.getProjectTasks = async (req, res, next) => {
  try {
    if (!req.user?.id) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Verify the project belongs to user (user is in team)
    const project = await Project.findOne({ 
      _id: req.params.id,
      team: req.user.id 
    });

    if (!project) {
      return res.status(404).json({
        status: 'error',
        message: 'Project not found or access denied'
      });
    }

    const tasks = await Task.find({ project: req.params.id })
      .populate('assignedTo', 'name email')
      .sort('-createdAt');

    res.status(200).json({
      status: 'success',
      results: tasks.length,
      data: { tasks }
    });
  } catch (err) {
    next(err);
  }
};

// ==========================
// Get Project Team (FIXED - User in team)
// ==========================
exports.getProjectTeam = async (req, res, next) => {
  try {
    if (!req.user?.id) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Verify the project belongs to user (user is in team)
    const project = await Project.findOne({ 
      _id: req.params.id,
      team: req.user.id 
    })
    .populate('manager', 'name email position')
    .populate('team', 'name email position');

    if (!project) {
      return res.status(404).json({
        status: 'error',
        message: 'Project not found or access denied'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        manager: project.manager,
        team: project.team
      }
    });
  } catch (err) {
    next(err);
  }
};