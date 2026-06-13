// controllers/admin/performanceReportController.js
const PerformanceReport = require('../../models/PerformanceReport');
const User = require('../../models/User');
const Attendance = require('../../models/Attendance');
const Task = require('../../models/Task');

const calculateEmployeePerformance = async (employeeId, startDate, endDate) => {
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

  const totalDays = attendanceRecords.length;
  const attendancePercentage = totalDays > 0 
    ? ((presentDays + (halfDays * 0.5)) / totalDays) * 100 
    : 0;

  // Get tasks data
  const tasks = await Task.find({
    assignedTo: employeeId,
    createdAt: { $gte: startDate, $lte: endDate }
  }).populate('assignedTo', 'name');

  const totalAssigned = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed' || t.status === 'evaluated').length;
  const pendingTasks = tasks.filter(t => t.status === 'pending').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in-progress').length;

  // Calculate ratings
  const tasksWithRatings = tasks
    .filter(t => t.rating)
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

  // Calculate overall score (attendance 30%, task completion 40%, average rating 30%)
  const taskCompletionRate = totalAssigned > 0 ? (completedTasks / totalAssigned) * 100 : 0;
  const overallScore = (
    (attendancePercentage * 0.3) +
    (taskCompletionRate * 0.4) +
    (averageRating * 10 * 0.3)
  );

  // Determine grade
  let performanceGrade = 'F';
  if (overallScore >= 90) performanceGrade = 'A+';
  else if (overallScore >= 80) performanceGrade = 'A';
  else if (overallScore >= 70) performanceGrade = 'B+';
  else if (overallScore >= 60) performanceGrade = 'B';
  else if (overallScore >= 50) performanceGrade = 'C';
  else if (overallScore >= 40) performanceGrade = 'D';

  return {
    attendance: {
      totalDays,
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
};

exports.generatePerformanceReport = async (req, res) => {
  try {
    const { startDate, endDate, title } = req.body;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start date and end date are required' });
    }

    // Get all employees (both employee and client roles)
    const employees = await User.find({
      role: { $in: ['employee', 'client'] },
      isActive: true
    });

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

    // Create report in draft mode
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
    console.error(error);
    res.status(500).json({ message: 'Error generating report', error: error.message });
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
      return res.status(404).json({ message: 'Report not found' });
    }
    
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(500).json({ message: 'Error publishing report', error: error.message });
  }
};

exports.unpublishReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    
    const report = await PerformanceReport.findByIdAndUpdate(
      reportId,
      {
        status: 'archived'
      },
      { new: true }
    );
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(500).json({ message: 'Error unpublishing report', error: error.message });
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
    res.status(500).json({ message: 'Error fetching reports', error: error.message });
  }
};

exports.getReportById = async (req, res) => {
  try {
    const { reportId } = req.params;
    
    const report = await PerformanceReport.findById(reportId)
      .populate('createdBy', 'name');
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching report', error: error.message });
  }
};

exports.getMyPerformanceReports = async (req, res) => {
  try {
    const reports = await PerformanceReport.find({
      status: 'published',
      'reportData.employee': req.user.id
    }).sort({ publishedAt: -1 });
    
    // Extract only the current user's data from each report
    const myPerformanceData = reports.map(report => {
      const myData = report.reportData.find(
        data => data.employee.toString() === req.user.id
      );
      return {
        reportId: report._id,
        title: report.title,
        period: report.period,
        publishedAt: report.publishedAt,
        performance: myData
      };
    });
    
    res.json({
      success: true,
      data: myPerformanceData
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching performance reports', error: error.message });
  }
};