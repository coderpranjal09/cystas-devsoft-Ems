// controllers/admin/projectController.js
const Project = require('../../models/Project');
const User = require('../../models/User');

// Get all projects
exports.getAllProjects = async (req, res) => {
  try {
    const projects = await Project.find()
      .populate('manager', 'name')
      .populate('team', 'name');
    
    res.status(200).json({
      success: true,
      data: projects
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching projects',
      error: error.message
    });
  }
};

// Get single project
exports.getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('manager', 'name')
      .populate('team', 'name');
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: project
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching project',
      error: error.message
    });
  }
};

// Create new project
exports.createProject = async (req, res) => {
  try {
    // Validate manager exists
    const manager = await User.findById(req.body.manager);
    if (!manager) {
      return res.status(400).json({
        success: false,
        message: 'Manager not found'
      });
    }
    
    // Validate team members exist
    if (req.body.team && req.body.team.length > 0) {
      const teamMembers = await User.find({ _id: { $in: req.body.team } });
      if (teamMembers.length !== req.body.team.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more team members not found'
        });
      }
    }
    
    const project = await Project.create(req.body);
    
    res.status(201).json({
      success: true,
      data: project
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating project',
      error: error.message
    });
  }
};

// Update project
exports.updateProject = async (req, res) => {
  try {
    // Validate manager exists if being updated
    if (req.body.manager) {
      const manager = await User.findById(req.body.manager);
      if (!manager) {
        return res.status(400).json({
          success: false,
          message: 'Manager not found'
        });
      }
    }
    
    // Validate team members exist if being updated
    if (req.body.team && req.body.team.length > 0) {
      const teamMembers = await User.find({ _id: { $in: req.body.team } });
      if (teamMembers.length !== req.body.team.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more team members not found'
        });
      }
    }
    
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('manager', 'name')
      .populate('team', 'name');
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: project
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating project',
      error: error.message
    });
  }
};

// Delete project
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting project',
      error: error.message
    });
  }
};