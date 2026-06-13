// server/controllers/admin/performanceReportController.js
const PerformanceReport = require('../../models/PerformanceReport');
const User = require('../../models/User');
const Attendance = require('../../models/Attendance');
const Task = require('../../models/Task');

const calculateEmployeePerformance = async (employeeId, startDate, endDate) => {
  try {
    // Get attendance data
    const attendanceRecords = await Attendance.find({
      userId: employeeId,
      date: { $gte: startDate, $lte: endDate }
    });

    let presentDays = 0;
    let absentDays = 0;
    let halfDays = 0;

    attendanceRecords.forEach(record => {
      if (record.status === 'present') presentDays++;
      else if (record.status === 'absent') absentDays++;
      else if (record.status === 'half-day') halfDays++;
    });

    const totalDays = attendanceRecords.length || 1;
    const attendancePercentage = totalDays > 0 
      ? ((presentDays + (halfDays * 0.5)) / totalDays) * 100 
      : 0;

    // Get tasks data
    const tasks = await Task.find({
      assignedTo: employeeId,
      createdAt: { $gte: startDate, $lte: endDate }
    });

    const totalAssigned = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed' || t.status === 'evaluated').length;
    const pendingTasks = tasks.filter(t => t.status === 'pending').length;
    const inProgressTasks = tasks.filter(t => t.status === 'in-progress').length;

    // Calculate ratings
    const tasksWithRatings = tasks
      .filter(t => t.rating && t.rating > 0)
      .map(t => ({
        taskId: t._id,
        title: t.title,
        rating: t.rating,
        feedback: t.feedback || '',
        submittedAt: t.updatedAt
      }));

    const averageRating = tasksWithRatings.length > 0
      ? tasksWithRatings.reduce((sum, t) => sum + t.rating, 0) / tasksWithRatings.length
      : 0;

    // Calculate overall score
    const taskCompletionRate = totalAssigned > 0 ? (completedTasks / totalAssigned) * 100 : 0;
    const overallScore = (
      (attendancePercentage * 0.3) +
      (taskCompletionRate * 0.4) +
      (averageRating * 10 * 0.3)
    );

    // Determine grade
    let performanceGrade = 'N/A';
    if (overallScore >= 90) performanceGrade = 'A+';
    else if (overallScore >= 80) performanceGrade = 'A';
    else if (overallScore >= 70) performanceGrade = 'B+';
    else if (overallScore >= 60) performanceGrade = 'B';
    else if (overallScore >= 50) performanceGrade = 'C';
    else if (overallScore >= 40) performanceGrade = 'D';
    else if (overallScore > 0) performanceGrade = 'F';

    return {
      attendance: {
        totalDays: attendanceRecords.length,
        presentDays,
        absentDays,
        halfDays,
        attendancePercentage: Math.round(attendancePercentage)
      },
      tasks: {
        totalAssigned,
        completedTasks,
        pendingTasks,
        inProgressTasks,
        averageRating: Math.round(averageRating * 10) / 10,
        tasksWithRatings
      },
      overallScore: Math.round(overallScore),
      performanceGrade
    };
  } catch (error) {
    console.error('Error in calculateEmployeePerformance:', error);
    return {
      attendance: {
        totalDays: 0,
        presentDays: 0,
        absentDays: 0,
        halfDays: 0,
        attendancePercentage: 0
      },
      tasks: {
        totalAssigned: 0,
        completedTasks: 0,
        pendingTasks: 0,
        inProgressTasks: 0,
        averageRating: 0,
        tasksWithRatings: []
      },
      overallScore: 0,
      performanceGrade: 'N/A'
    };
  }
};

exports.generatePerformanceReport = async (req, res) => {
  try {
    const { startDate, endDate, title } = req.body;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ 
        success: false,
        message: 'Start date and end date are required' 
      });
    }

    const employees = await User.find({
      role: { $in: ['employee', 'client'] },
      isActive: true
    });

    if (employees.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'No employees found in the system' 
      });
    }

    const reportData = [];
    
    for (const employee of employees) {
      const performance = await calculateEmployeePerformance(
        employee._id,
        new Date(startDate),
        new Date(endDate)
      );
      
      reportData.push({
        employee: employee._id,
        employeeName: employee.name,
        employeeRole: employee.role,
        ...performance
      });
    }

    const report = new PerformanceReport({
      title: title || `Performance Report ${new Date().toLocaleDateString()}`,
      period: { startDate, endDate },
      reportData,
      createdBy: req.user.id,
      status: 'draft'
    });

    await report.save();

    res.status(201).json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error generating report', 
      error: error.message 
    });
  }
};

exports.publishReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    
    const report = await PerformanceReport.findByIdAndUpdate(
      reportId,
      {
        status: 'published',
        publishedAt: new Date()
      },
      { new: true }
    );
    
    if (!report) {
      return res.status(404).json({ 
        success: false,
        message: 'Report not found' 
      });
    }
    
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error publishing report', 
      error: error.message 
    });
  }
};

exports.unpublishReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    
    const report = await PerformanceReport.findByIdAndUpdate(
      reportId,
      { status: 'archived' },
      { new: true }
    );
    
    if (!report) {
      return res.status(404).json({ 
        success: false,
        message: 'Report not found' 
      });
    }
    
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error unpublishing report', 
      error: error.message 
    });
  }
};

exports.getAllReports = async (req, res) => {
  try {
    const reports = await PerformanceReport.find()
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: reports
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error fetching reports', 
      error: error.message 
    });
  }
};

exports.getReportById = async (req, res) => {
  try {
    const { reportId } = req.params;
    
    const report = await PerformanceReport.findById(reportId)
      .populate('createdBy', 'name');
    
    if (!report) {
      return res.status(404).json({ 
        success: false,
        message: 'Report not found' 
      });
    }
    
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error fetching report', 
      error: error.message 
    });
  }
};