// src/components/employee/EmployeePerformanceCard.jsx
import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, CheckCircle, Calendar, Award, TrendingUp, AlertCircle, Printer, Download, Eye } from 'lucide-react';
import api from '@/services/api';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';

const EmployeePerformanceCard = () => {
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const printRef = useRef();

  useEffect(() => {
    fetchMyReports();
  }, []);

  const fetchMyReports = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/employee/performance/reports');
      console.log('Performance reports response:', response.data);
      
      let reportsData = [];
      if (response.data?.data) {
        reportsData = response.data.data;
      } else if (Array.isArray(response.data)) {
        reportsData = response.data;
      }
      
      const reportsArray = Array.isArray(reportsData) ? reportsData : [];
      setReports(reportsArray);
      
      if (reportsArray.length > 0) {
        setSelectedReport(reportsArray[0]);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      setError('Failed to load performance reports. Please try again later.');
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    const printContent = document.getElementById('performance-report-content').innerHTML;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${selectedReport?.title || 'Performance Report'} - Cystas Devsoft</title>
          <meta charset="UTF-8">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: 'Segoe UI', Arial, sans-serif;
              background: white;
              padding: 40px;
              color: #000000;
            }
            
            .report-container {
              max-width: 1200px;
              margin: 0 auto;
              background: white;
              color: #000000;
            }
            
            /* Letterhead */
            .letterhead {
              text-align: center;
              padding: 25px;
              background: #1a2a6c;
              background: linear-gradient(135deg, #0f2027, #203a43, #2c5364);
              color: white;
              margin-bottom: 25px;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            
            .letterhead h1 {
              font-size: 28px;
              margin-bottom: 8px;
              letter-spacing: 1px;
            }
            
            .letterhead .cin {
              font-size: 11px;
              margin-top: 5px;
              opacity: 0.85;
            }
            
            .letterhead .address {
              font-size: 11px;
              margin-top: 8px;
              line-height: 1.4;
              opacity: 0.9;
            }
            
            .letterhead .contact {
              font-size: 11px;
              margin-top: 5px;
              opacity: 0.85;
            }
            
            .letterhead .subtitle {
              margin-top: 12px;
              font-size: 12px;
              border-top: 1px solid rgba(255,255,255,0.3);
              padding-top: 12px;
              font-weight: bold;
            }
            
            /* Report Header */
            .report-header {
              text-align: center;
              margin-bottom: 25px;
              padding-bottom: 15px;
              border-bottom: 2px solid #ddd;
            }
            
            .report-header h2 {
              font-size: 22px;
              color: #1a2a6c;
              margin-bottom: 8px;
            }
            
            .report-header .period {
              color: #444;
              font-size: 13px;
            }
            
            /* Score Card */
            .score-card {
              background: #1e3c72;
              background: linear-gradient(135deg, #1e3c72, #2a5298);
              color: white;
              padding: 25px;
              border-radius: 10px;
              margin-bottom: 25px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              flex-wrap: wrap;
              gap: 15px;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            
            .score-card h3 {
              font-size: 16px;
              margin-bottom: 8px;
              opacity: 0.9;
            }
            
            .score-card .score {
              font-size: 42px;
              font-weight: bold;
            }
            
            .score-card .grade {
              font-size: 34px;
              font-weight: bold;
            }
            
            /* Stats Grid */
            .stats-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 15px;
              margin-bottom: 25px;
            }
            
            .stat-card {
              background: #f5f5f5;
              padding: 15px;
              border-radius: 8px;
              text-align: center;
              border: 1px solid #ddd;
            }
            
            .stat-card .stat-value {
              font-size: 24px;
              font-weight: bold;
              color: #1e3c72;
              margin-bottom: 5px;
            }
            
            .stat-card .stat-label {
              font-size: 11px;
              color: #333;
            }
            
            /* Table Styles */
            .tasks-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 15px;
            }
            
            .tasks-table th {
              background: #1e3c72;
              color: white;
              padding: 10px;
              text-align: left;
              font-size: 12px;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            
            .tasks-table td {
              padding: 10px;
              border-bottom: 1px solid #ddd;
              font-size: 12px;
              color: #222;
            }
            
            .rating-badge {
              display: inline-block;
              padding: 3px 8px;
              border-radius: 15px;
              font-size: 11px;
              font-weight: bold;
            }
            
            .rating-high {
              background: #d4edda;
              color: #155724;
            }
            
            .rating-medium {
              background: #fff3cd;
              color: #856404;
            }
            
            .rating-low {
              background: #f8d7da;
              color: #721c24;
            }
            
            /* Footer */
            .footer {
              margin-top: 30px;
              padding-top: 15px;
              border-top: 1px solid #ddd;
              text-align: center;
              font-size: 10px;
              color: #555;
            }
            
            .signature {
              margin-top: 30px;
              display: flex;
              justify-content: flex-end;
            }
            
            .signature-line {
              width: 220px;
              text-align: center;
            }
            
            .signature-line .line {
              border-top: 1px solid #000;
              margin-top: 35px;
              margin-bottom: 8px;
            }
            
            @media print {
              body {
                padding: 0;
                margin: 0;
              }
              button {
                display: none;
              }
              .stat-card, .tasks-table td {
                break-inside: avoid;
              }
            }
            
            @media (max-width: 600px) {
              body {
                padding: 15px;
              }
              .score-card {
                flex-direction: column;
                text-align: center;
              }
              .stats-grid {
                grid-template-columns: 1fr 1fr;
              }
            }
          </style>
        </head>
        <body>
          <div class="report-container">
            ${printContent}
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.print();
    printWindow.close();
  };

  const getGradeColor = (grade) => {
    const colors = {
      'A+': 'from-green-500 to-green-600',
      'A': 'from-green-500 to-green-600',
      'B+': 'from-blue-500 to-blue-600',
      'B': 'from-blue-500 to-blue-600',
      'C': 'from-yellow-500 to-yellow-600',
      'D': 'from-orange-500 to-orange-600',
      'F': 'from-red-500 to-red-600'
    };
    return colors[grade] || 'from-gray-500 to-gray-600';
  };

  const getPerformanceLevel = (score) => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Very Good';
    if (score >= 70) return 'Good';
    if (score >= 60) return 'Satisfactory';
    if (score >= 50) return 'Needs Improvement';
    return 'Poor';
  };

  const getRatingColor = (rating) => {
    if (rating >= 4) return 'bg-green-100 text-green-800';
    if (rating >= 3) return 'bg-blue-100 text-blue-800';
    if (rating >= 2) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="text-center py-12">
          <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-400">Error Loading Reports</h3>
          <p className="text-gray-400 mt-2">{error}</p>
          <button 
            onClick={fetchMyReports}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </CardContent>
      </Card>
    );
  }

  if (!reports || reports.length === 0) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="text-center py-12">
          <Award className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-300">No Performance Reports Available</h3>
          <p className="text-gray-500 mt-2">Your performance reports will appear here once published by admin.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
     {/* Report Selector - Responsive Grid */}
<Card className="bg-gray-800 border-gray-700">
  <CardHeader>
    <CardTitle className="text-white">Select Report</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {reports.map((report, index) => (
        <button
          key={report.reportId || index}
          onClick={() => setSelectedReport(report)}
          className={`px-3 py-2 rounded-lg border transition-all text-center ${
            selectedReport?.reportId === report.reportId
              ? 'bg-green-600 text-white border-green-600'
              : 'bg-gray-700 text-gray-300 border-gray-600 hover:border-green-500 hover:bg-gray-600'
          }`}
        >
          <div className="text-sm font-medium truncate">
            {report.title || `Report ${index + 1}`}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {report.period ? format(new Date(report.period.startDate), 'MMM yyyy') : ''}
          </div>
        </button>
      ))}
    </div>
  </CardContent>
</Card>

      {selectedReport && (
        <>
          {/* Hidden Print Content */}
          <div id="performance-report-content" className="hidden">
            {/* Letterhead with correct company data */}
            <div className="letterhead">
              <h1>CYSTAS DEVSOFT PRIVATE LIMITED</h1>
              <div className="cin">CIN: U62090UT2025PTC019363</div>
              <div className="address">
                Regd. Off:- C/o Bhuvan Chandra Maithani, Makku, Makkumath, Makoomath,<br />
                Okhimath, Rudraprayag, Uttarakhand - 246419, India.
              </div>
              <div className="contact">Email: cystasdevsoft@gmail.com</div>
              <div className="subtitle">
                Employee Performance Evaluation Report
              </div>
              <div style={{ fontSize: '10px', marginTop: '8px' }}>
                Generated on: {format(new Date(), 'MMMM dd, yyyy')}
              </div>
            </div>

            {/* Report Header */}
            <div className="report-header">
              <h2>{selectedReport.title || 'Performance Evaluation Report'}</h2>
              <p className="period">
                Reporting Period: {format(new Date(selectedReport.period.startDate), 'MMMM dd, yyyy')} - {format(new Date(selectedReport.period.endDate), 'MMMM dd, yyyy')}
              </p>
            </div>

            {/* Score Card */}
            <div className="score-card">
              <div>
                <h3>Overall Performance Score</h3>
                <div className="score">{selectedReport.performance.overallScore || 0}</div>
                <div style={{ fontSize: '12px', marginTop: '5px' }}>out of 100</div>
              </div>
              <div className="text-center">
                <h3>Performance Grade</h3>
                <div className="grade">{selectedReport.performance.performanceGrade || 'N/A'}</div>
                <div style={{ fontSize: '12px', marginTop: '5px' }}>{getPerformanceLevel(selectedReport.performance.overallScore || 0)}</div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">{selectedReport.performance.attendance?.attendancePercentage || 0}%</div>
                <div className="stat-label">Attendance Rate</div>
                <div style={{ fontSize: '10px', marginTop: '4px' }}>Present: {selectedReport.performance.attendance?.presentDays || 0}/{selectedReport.performance.attendance?.totalDays || 0} days</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{selectedReport.performance.tasks?.completedTasks || 0}/{selectedReport.performance.tasks?.totalAssigned || 0}</div>
                <div className="stat-label">Tasks Completed</div>
                <div style={{ fontSize: '10px', marginTop: '4px' }}>Completion: {selectedReport.performance.tasks?.totalAssigned > 0 ? Math.round(((selectedReport.performance.tasks?.completedTasks || 0) / (selectedReport.performance.tasks?.totalAssigned || 1)) * 100) : 0}%</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{selectedReport.performance.tasks?.averageRating || 0}/5</div>
                <div className="stat-label">Average Rating</div>
                <div style={{ fontSize: '10px', marginTop: '4px' }}>Based on {selectedReport.performance.tasks?.tasksWithRatings?.length || 0} rated tasks</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{getPerformanceLevel(selectedReport.performance.overallScore || 0)}</div>
                <div className="stat-label">Performance Level</div>
                <div style={{ fontSize: '10px', marginTop: '4px' }}>Grade: {selectedReport.performance.performanceGrade || 'N/A'}</div>
              </div>
            </div>

            {/* Detailed Tasks Table */}
            {selectedReport.performance.tasks?.tasksWithRatings && selectedReport.performance.tasks.tasksWithRatings.length > 0 && (
              <>
                <h3 style={{ marginBottom: '12px', color: '#1e3c72', fontSize: '16px' }}>Task Evaluation Details</h3>
                <table className="tasks-table">
                  <thead>
                    <tr>
                      <th>S.No</th>
                      <th>Task Title</th>
                      <th>Rating</th>
                      <th>Feedback</th>
                      <th>Submission Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedReport.performance.tasks.tasksWithRatings.map((task, idx) => (
                      <tr key={idx}>
                        <td>{idx + 1}</td>
                        <td>{task.title}</td>
                        <td>
                          <span className={`rating-badge ${task.rating >= 4 ? 'rating-high' : task.rating >= 2 ? 'rating-medium' : 'rating-low'}`}>
                            {task.rating}/5 ★
                          </span>
                        </td>
                        <td>{task.feedback || 'No feedback provided'}</td>
                        <td>{format(new Date(task.submittedAt), 'MMM dd, yyyy')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}

            {/* Footer */}
            <div className="footer">
              <p>This is a system-generated performance report. For any discrepancies, please contact HR department.</p>
              <p>© {new Date().getFullYear()} Cystas Devsoft Private Limited. All rights reserved.</p>
            </div>
            
            <div className="signature">
              <div className="signature-line">
                <div className="line"></div>
                <p>Authorized Signatory</p>
                <p style={{ fontSize: '10px' }}>Cystas Devsoft Pvt Ltd</p>
              </div>
            </div>
          </div>

          {/* Visible Report Card */}
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg overflow-hidden shadow-2xl border border-gray-700">
            {/* Letterhead Style Header */}
            <div className="bg-gradient-to-r from-blue-900 to-blue-800 p-4 sm:p-6 text-center">
              <h1 className="text-xl sm:text-2xl font-bold text-white">CYSTAS DEVSOFT PRIVATE LIMITED</h1>
              <p className="text-blue-200 text-xs sm:text-sm mt-1">CIN: U62090UT2025PTC019363</p>
              <p className="text-blue-200 text-xs sm:text-sm mt-1">Email: cystasdevsoft@gmail.com</p>
              <p className="text-blue-300 text-xs mt-2">Employee Performance Evaluation Report</p>
              <p className="text-blue-300 text-xs mt-1">Generated: {format(new Date(), 'MMMM dd, yyyy')}</p>
            </div>

            {/* Report Header */}
            <div className="p-4 sm:p-6 border-b border-gray-700">
              <h2 className="text-lg sm:text-xl font-bold text-white text-center">{selectedReport.title || 'Performance Evaluation Report'}</h2>
              <p className="text-gray-400 text-center text-xs sm:text-sm mt-2">
                Period: {format(new Date(selectedReport.period.startDate), 'MMMM dd, yyyy')} - {format(new Date(selectedReport.period.endDate), 'MMMM dd, yyyy')}
              </p>
            </div>

            {/* Score Section */}
            <div className={`bg-gradient-to-r ${getGradeColor(selectedReport.performance.performanceGrade)} p-4 sm:p-6 text-white`}>
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-center sm:text-left">
                  <p className="text-sm opacity-90">Overall Performance Score</p>
                  <p className="text-4xl sm:text-5xl font-bold">{selectedReport.performance.overallScore || 0}</p>
                  <p className="text-sm opacity-80 mt-1">out of 100</p>
                </div>
                <div className="text-center">
                  <p className="text-sm opacity-90">Performance Grade</p>
                  <p className="text-5xl sm:text-6xl font-bold">{selectedReport.performance.performanceGrade || 'N/A'}</p>
                  <p className="text-sm opacity-80 mt-1">{getPerformanceLevel(selectedReport.performance.overallScore || 0)}</p>
                </div>
              </div>
            </div>

            {/* Stats Grid - Responsive */}
            <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gray-800 p-3 sm:p-4 rounded-lg text-center border border-gray-700">
                <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-blue-400 mx-auto mb-2" />
                <p className="text-xl sm:text-2xl font-bold text-white">{selectedReport.performance.attendance?.attendancePercentage || 0}%</p>
                <p className="text-xs text-gray-400">Attendance Rate</p>
                <p className="text-xs text-gray-500 mt-1">Present: {selectedReport.performance.attendance?.presentDays || 0}/{selectedReport.performance.attendance?.totalDays || 0} days</p>
              </div>
              
              <div className="bg-gray-800 p-3 sm:p-4 rounded-lg text-center border border-gray-700">
                <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-400 mx-auto mb-2" />
                <p className="text-xl sm:text-2xl font-bold text-white">{selectedReport.performance.tasks?.completedTasks || 0}/{selectedReport.performance.tasks?.totalAssigned || 0}</p>
                <p className="text-xs text-gray-400">Tasks Completed</p>
                <p className="text-xs text-gray-500 mt-1">Completion: {selectedReport.performance.tasks?.totalAssigned > 0 ? Math.round(((selectedReport.performance.tasks?.completedTasks || 0) / (selectedReport.performance.tasks?.totalAssigned || 1)) * 100) : 0}%</p>
              </div>
              
              <div className="bg-gray-800 p-3 sm:p-4 rounded-lg text-center border border-gray-700">
                <Star className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-400 mx-auto mb-2" />
                <p className="text-xl sm:text-2xl font-bold text-white">{selectedReport.performance.tasks?.averageRating || 0}/5</p>
                <p className="text-xs text-gray-400">Average Rating</p>
                <p className="text-xs text-gray-500 mt-1">From {selectedReport.performance.tasks?.tasksWithRatings?.length || 0} tasks</p>
              </div>
              
              <div className="bg-gray-800 p-3 sm:p-4 rounded-lg text-center border border-gray-700">
                <Award className="h-6 w-6 sm:h-8 sm:w-8 text-purple-400 mx-auto mb-2" />
                <p className="text-base sm:text-xl font-bold text-white">{getPerformanceLevel(selectedReport.performance.overallScore || 0)}</p>
                <p className="text-xs text-gray-400">Performance Level</p>
                <p className="text-xs text-gray-500 mt-1">Grade: {selectedReport.performance.performanceGrade || 'N/A'}</p>
              </div>
            </div>

            {/* Detailed Tasks - Responsive Table */}
            {selectedReport.performance.tasks?.tasksWithRatings && selectedReport.performance.tasks.tasksWithRatings.length > 0 && (
              <div className="px-4 sm:px-6 pb-6">
                <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Task Evaluation Details</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs sm:text-sm border-collapse">
                    <thead>
                      <tr className="bg-gray-800">
                        <th className="px-2 sm:px-4 py-2 text-left text-gray-300 border border-gray-700">#</th>
                        <th className="px-2 sm:px-4 py-2 text-left text-gray-300 border border-gray-700">Task Title</th>
                        <th className="px-2 sm:px-4 py-2 text-center text-gray-300 border border-gray-700">Rating</th>
                        <th className="px-2 sm:px-4 py-2 text-left text-gray-300 border border-gray-700 hidden sm:table-cell">Feedback</th>
                        <th className="px-2 sm:px-4 py-2 text-center text-gray-300 border border-gray-700">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedReport.performance.tasks.tasksWithRatings.map((task, idx) => (
                        <tr key={idx} className="bg-gray-900">
                          <td className="px-2 sm:px-4 py-2 text-gray-300 border border-gray-700">{idx + 1}</td>
                          <td className="px-2 sm:px-4 py-2 text-white border border-gray-700 break-words max-w-[150px] sm:max-w-none">{task.title}</td>
                          <td className="px-2 sm:px-4 py-2 text-center border border-gray-700">
                            <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-xs sm:text-sm font-semibold ${getRatingColor(task.rating)}`}>
                              {task.rating}/5 ★
                            </span>
                          </td>
                          <td className="px-2 sm:px-4 py-2 text-gray-300 border border-gray-700 hidden sm:table-cell break-words max-w-[200px]">{task.feedback || '—'}</td>
                          <td className="px-2 sm:px-4 py-2 text-gray-300 text-center border border-gray-700 whitespace-nowrap">
                            {format(new Date(task.submittedAt), 'MMM dd, yyyy')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-700 bg-gray-800">
              <div className="flex flex-col sm:flex-row justify-between items-center text-xs text-gray-500 gap-2">
                <p>This is a system-generated report. For discrepancies, contact HR.</p>
                <p>© {new Date().getFullYear()} Cystas Devsoft Pvt Ltd</p>
              </div>
            </div>
          </div>

          {/* Print Button */}
          <div className="flex justify-end">
            <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Printer className="h-4 w-4 mr-2" />
              Print Performance Report
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default EmployeePerformanceCard;