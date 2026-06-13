// server/controllers/employee/performanceController.js
const PerformanceReport = require('../../models/PerformanceReport');

exports.getMyPerformanceReports = async (req, res) => {
  try {
    console.log('Fetching performance reports for user:', req.user.id);
    
    // Find all published reports that contain this employee's data
    const reports = await PerformanceReport.find({
      status: 'published',
      'reportData.employee': req.user.id
    }).sort({ publishedAt: -1 });
    
    console.log(`Found ${reports.length} reports for user`);
    
    // Extract only the current user's data from each report
    const myPerformanceData = reports.map(report => {
      const myData = report.reportData.find(
        data => data.employee.toString() === req.user.id
      );
      
      if (!myData) return null;
      
      return {
        reportId: report._id,
        title: report.title,
        period: report.period,
        publishedAt: report.publishedAt,
        performance: {
          attendance: myData.attendance,
          tasks: myData.tasks,
          overallScore: myData.overallScore,
          performanceGrade: myData.performanceGrade
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