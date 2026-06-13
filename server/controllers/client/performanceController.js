// server/controllers/employee/performanceController.js
const PerformanceReport = require('../../models/PerformanceReport');

exports.getMyPerformanceReports = async (req, res) => {
  try {
    console.log('Fetching performance reports for user:', req.user.id);
    
    const reports = await PerformanceReport.find({
      status: 'published',
      'reportData.employee': req.user.id
    }).sort({ publishedAt: -1 });
    
    console.log(`Found ${reports.length} reports for user`);
    
    const myPerformanceData = reports.map(report => {
      const myData = report.reportData.find(
        data => data.employee && data.employee.toString() === req.user.id
      );
      
      if (!myData) return null;
      
      return {
        reportId: report._id,
        title: report.title,
        period: report.period,
        publishedAt: report.publishedAt,
        performance: {
          attendance: myData.attendance || {
            attendancePercentage: 0,
            presentDays: 0,
            totalDays: 0
          },
          tasks: myData.tasks || {
            completedTasks: 0,
            totalAssigned: 0,
            averageRating: 0,
            tasksWithRatings: []
          },
          overallScore: myData.overallScore || 0,
          performanceGrade: myData.performanceGrade || 'N/A'
        }
      };
    }).filter(data => data !== null);
    
    res.json({
      success: true,
      data: myPerformanceData
    });
  } catch (error) {
    console.error('Error fetching performance reports:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching performance reports', 
      error: error.message 
    });
  }
};