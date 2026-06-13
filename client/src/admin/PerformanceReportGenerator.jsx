// components/admin/PerformanceReportGenerator.jsx
import { useState, useEffect } from 'react';
import { Calendar, Download, Printer, Eye, Send, Archive, AlertCircle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import api from '@/services/api';
import { format } from 'date-fns';

const PerformanceReportGenerator = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportTitle, setReportTitle] = useState('');
  const [generatedReport, setGeneratedReport] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [savedReports, setSavedReports] = useState([]);
  const [fetchingReports, setFetchingReports] = useState(false);
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });

  useEffect(() => {
    fetchSavedReports();
  }, []);

  const showNotification = (type, message) => {
    setNotification({ show: true, type, message });
    setTimeout(() => setNotification({ show: false, type: '', message: '' }), 5000);
  };

  const validateDates = () => {
    if (!startDate || !endDate) {
      showNotification('error', 'Please select both start and end dates');
      return false;
    }
    if (new Date(startDate) > new Date(endDate)) {
      showNotification('error', 'Start date cannot be later than end date');
      return false;
    }
    return true;
  };

  const generateReport = async () => {
    if (!validateDates()) return;

    setLoading(true);
    try {
      const response = await api.post('/admin/performance/generate', {
        startDate,
        endDate,
        title: reportTitle || `Performance Report ${format(new Date(), 'PPP')}`
      });
      
      if (response.data.success) {
        setGeneratedReport(response.data.data);
        setShowPreview(true);
        showNotification('success', 'Report generated successfully!');
      } else {
        showNotification('error', response.data.message || 'Failed to generate report');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      const errorMessage = error.response?.data?.message || 'Failed to generate report. Please try again.';
      showNotification('error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const publishReport = async () => {
    try {
      const response = await api.post(`/admin/performance/publish/${generatedReport._id}`);
      
      if (response.data.success) {
        showNotification('success', 'Report published successfully! Employees can now view it.');
        setShowPreview(false);
        await fetchSavedReports();
      } else {
        showNotification('error', response.data.message || 'Failed to publish report');
      }
    } catch (error) {
      console.error('Error publishing report:', error);
      const errorMessage = error.response?.data?.message || 'Failed to publish report';
      showNotification('error', errorMessage);
    }
  };

  const unpublishReport = async (reportId) => {
    if (window.confirm('Are you sure you want to unpublish this report? Employees will no longer be able to view it.')) {
      try {
        const response = await api.post(`/admin/performance/unpublish/${reportId}`);
        
        if (response.data.success) {
          showNotification('success', 'Report unpublished successfully');
          await fetchSavedReports();
        } else {
          showNotification('error', response.data.message || 'Failed to unpublish report');
        }
      } catch (error) {
        console.error('Error unpublishing report:', error);
        const errorMessage = error.response?.data?.message || 'Failed to unpublish report';
        showNotification('error', errorMessage);
      }
    }
  };

  const fetchSavedReports = async () => {
    setFetchingReports(true);
    try {
      const response = await api.get('/admin/performance/reports');
      if (response.data.success) {
        setSavedReports(Array.isArray(response.data.data) ? response.data.data : []);
      } else {
        setSavedReports([]);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      setSavedReports([]);
      showNotification('error', 'Failed to fetch saved reports');
    } finally {
      setFetchingReports(false);
    }
  };

  const handlePrint = () => {
    const printContent = document.getElementById('report-content');
    
    if (printContent) {
      const originalContent = printContent.cloneNode(true);
      
      // Create a complete HTML document for printing
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${generatedReport?.title || 'Performance Report'} - Cystas Devsoft</title>
            <meta charset="UTF-8">
            <style>
              /* Reset and Base Styles */
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
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              
              /* Letterhead */
              .print-letterhead {
                text-align: center;
                padding: 30px;
                background: linear-gradient(135deg, #0f2027, #203a43, #2c5364);
                color: white;
                margin-bottom: 30px;
                border-radius: 0;
              }
              .print-letterhead h1 {
                font-size: 28px;
                margin-bottom: 8px;
                letter-spacing: 1px;
              }
              .print-letterhead .cin {
                font-size: 11px;
                margin-top: 5px;
                opacity: 0.85;
              }
              .print-letterhead .address {
                font-size: 10px;
                margin-top: 8px;
                line-height: 1.4;
                opacity: 0.9;
              }
              .print-letterhead .email {
                font-size: 10px;
                margin-top: 5px;
                opacity: 0.85;
              }
              .print-letterhead .subtitle {
                margin-top: 15px;
                font-size: 12px;
                border-top: 1px solid rgba(255,255,255,0.3);
                padding-top: 12px;
                font-weight: bold;
              }
              .print-letterhead .generated-date {
                font-size: 10px;
                margin-top: 8px;
                opacity: 0.8;
              }
              
              /* Report Header */
              .print-header {
                text-align: center;
                margin-bottom: 25px;
                padding-bottom: 15px;
                border-bottom: 2px solid #ddd;
              }
              .print-header h2 {
                font-size: 22px;
                color: #1a2a6c;
                margin-bottom: 8px;
              }
              .print-header .period {
                color: #444;
                font-size: 13px;
              }
              .print-header .status {
                display: inline-block;
                padding: 2px 10px;
                border-radius: 20px;
                font-size: 11px;
                margin-top: 8px;
              }
              .print-status-published {
                background: #d4edda;
                color: #155724;
              }
              .print-status-draft {
                background: #fff3cd;
                color: #856404;
              }
              
              /* Stats Grid */
              .print-stats-grid {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 15px;
                margin-bottom: 30px;
              }
              .print-stat-card {
                padding: 15px;
                border-radius: 8px;
                text-align: center;
              }
              .print-stat-card .stat-value {
                font-size: 28px;
                font-weight: bold;
                margin-bottom: 5px;
              }
              .print-stat-card .stat-label {
                font-size: 12px;
                color: #555;
              }
              .print-stat-blue {
                background: #eff6ff;
                border: 1px solid #bfdbfe;
              }
              .print-stat-blue .stat-value { color: #2563eb; }
              .print-stat-green {
                background: #f0fdf4;
                border: 1px solid #bbf7d0;
              }
              .print-stat-green .stat-value { color: #16a34a; }
              .print-stat-purple {
                background: #faf5ff;
                border: 1px solid #e9d5ff;
              }
              .print-stat-purple .stat-value { color: #9333ea; }
              .print-stat-orange {
                background: #fff7ed;
                border: 1px solid #fed7aa;
              }
              .print-stat-orange .stat-value { color: #ea580c; }
              
              /* Table Styles */
              .print-table {
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
              }
              .print-table th {
                background: #1e3c72;
                color: white;
                padding: 12px;
                text-align: left;
                font-size: 13px;
                font-weight: 600;
              }
              .print-table td {
                padding: 10px 12px;
                border-bottom: 1px solid #e0e0e0;
                font-size: 12px;
                color: #333;
              }
              .print-table tr:hover {
                background: #f5f5f5;
              }
              
              /* Grade Badges */
              .print-grade {
                display: inline-block;
                padding: 3px 8px;
                border-radius: 15px;
                font-size: 11px;
                font-weight: bold;
              }
              .print-grade-A {
                background: #d4edda;
                color: #155724;
              }
              .print-grade-B {
                background: #d1ecf1;
                color: #0c5460;
              }
              .print-grade-C {
                background: #fff3cd;
                color: #856404;
              }
              .print-grade-D {
                background: #ffe5d0;
                color: #e46a00;
              }
              .print-grade-F {
                background: #f8d7da;
                color: #721c24;
              }
              
              /* Score Colors */
              .print-score-high { color: #16a34a; font-weight: bold; font-size: 16px; }
              .print-score-medium { color: #2563eb; font-weight: bold; font-size: 16px; }
              .print-score-low { color: #ea580c; font-weight: bold; font-size: 16px; }
              .print-score-poor { color: #dc2626; font-weight: bold; font-size: 16px; }
              
              /* Footer */
              .print-footer {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #ddd;
                text-align: center;
                font-size: 10px;
                color: #666;
              }
              .print-signature {
                margin-top: 40px;
                display: flex;
                justify-content: flex-end;
              }
              .print-signature-box {
                width: 250px;
                text-align: center;
              }
              .print-signature-line {
                border-top: 1px solid #000;
                margin-top: 40px;
                margin-bottom: 8px;
              }
              
              @media print {
                body {
                  padding: 0;
                  margin: 0;
                }
                .no-print {
                  display: none;
                }
              }
            </style>
          </head>
          <body>
            <div style="max-width: 1200px; margin: 0 auto;">
              <!-- Letterhead -->
              <div class="print-letterhead">
                <h1>CYSTAS DEVSOFT PRIVATE LIMITED</h1>
                <div class="cin">CIN: U62090UT2025PTC019363</div>
                <div class="address">
                  Regd. Off:- C/o Bhuvan Chandra Maithani, Makku, Makkumath, Makoomath,<br />
                  Okhimath, Rudraprayag, Uttarakhand - 246419, India.
                </div>
                <div class="email">Email: cystasdevsoft@gmail.com</div>
                <div class="subtitle">
                  Enterprise Performance Evaluation Report
                </div>
                <div class="generated-date">
                  Generated on: ${format(new Date(), 'MMMM dd, yyyy')}
                </div>
              </div>

              <!-- Report Header -->
              <div class="print-header">
                <h2>${generatedReport?.title || 'Performance Evaluation Report'}</h2>
                <p class="period">
                  Reporting Period: ${format(new Date(generatedReport?.period.startDate), 'MMMM dd, yyyy')} - ${format(new Date(generatedReport?.period.endDate), 'MMMM dd, yyyy')}
                </p>
                <span class="status ${generatedReport?.status === 'published' ? 'print-status-published' : 'print-status-draft'}">
                  Status: ${generatedReport?.status?.toUpperCase() || 'DRAFT'}
                </span>
              </div>

              <!-- Stats Grid -->
              <div class="print-stats-grid">
                <div class="print-stat-card print-stat-blue">
                  <div class="stat-value">${generatedReport?.reportData?.length || 0}</div>
                  <div class="stat-label">Total Employees</div>
                </div>
                <div class="print-stat-card print-stat-green">
                  <div class="stat-value">${generatedReport?.reportData?.length > 0 ? Math.round(generatedReport.reportData.reduce((sum, d) => sum + (d.attendance.attendancePercentage || 0), 0) / generatedReport.reportData.length) : 0}%</div>
                  <div class="stat-label">Average Attendance</div>
                </div>
                <div class="print-stat-card print-stat-purple">
                  <div class="stat-value">${generatedReport?.reportData?.length > 0 ? Math.round(generatedReport.reportData.reduce((sum, d) => sum + (d.overallScore || 0), 0) / generatedReport.reportData.length) : 0}</div>
                  <div class="stat-label">Average Overall Score</div>
                </div>
                <div class="print-stat-card print-stat-orange">
                  <div class="stat-value">${generatedReport?.reportData?.filter(d => d.performanceGrade === 'A+' || d.performanceGrade === 'A').length || 0}</div>
                  <div class="stat-label">Top Performers (A Grade)</div>
                </div>
              </div>

              <!-- Data Table -->
              <table class="print-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Employee Name</th>
                    <th>Role</th>
                    <th>Attendance</th>
                    <th>Tasks (C/T)</th>
                    <th>Avg Rating</th>
                    <th>Overall Score</th>
                    <th>Grade</th>
                    <th>Performance Level</th>
                  </tr>
                </thead>
                <tbody>
                  ${generatedReport?.reportData?.map((data, idx) => {
                    const getScoreClass = (score) => {
                      if (score >= 80) return 'print-score-high';
                      if (score >= 60) return 'print-score-medium';
                      if (score >= 40) return 'print-score-low';
                      return 'print-score-poor';
                    };
                    const getGradeClass = (grade) => {
                      const gradeMap = {
                        'A+': 'print-grade-A', 'A': 'print-grade-A',
                        'B+': 'print-grade-B', 'B': 'print-grade-B',
                        'C': 'print-grade-C', 'D': 'print-grade-D', 'F': 'print-grade-F'
                      };
                      return gradeMap[grade] || 'print-grade-C';
                    };
                    const getPerformanceLevel = (score) => {
                      if (score >= 90) return 'Excellent';
                      if (score >= 80) return 'Very Good';
                      if (score >= 70) return 'Good';
                      if (score >= 60) return 'Satisfactory';
                      if (score >= 50) return 'Needs Improvement';
                      return 'Poor';
                    };
                    return `
                      <tr>
                        <td>${idx + 1}</td>
                        <td><strong>${data.employeeName}</strong></td>
                        <td style="text-transform: capitalize;">${data.employeeRole}</td>
                        <td style="text-align: center;"><strong>${data.attendance.attendancePercentage}%</strong></td>
                        <td style="text-align: center;">
                          <strong style="color: #16a34a;">${data.tasks.completedTasks}</strong>/${data.tasks.totalAssigned}
                        </td>
                        <td style="text-align: center;">
                          <strong style="color: #2563eb;">${data.tasks.averageRating}</strong>/5
                        </td>
                        <td style="text-align: center;">
                          <span class="${getScoreClass(data.overallScore)}">${data.overallScore}</span>
                        </td>
                        <td style="text-align: center;">
                          <span class="print-grade ${getGradeClass(data.performanceGrade)}">${data.performanceGrade}</span>
                        </td>
                        <td>${getPerformanceLevel(data.overallScore)}</td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>

              <!-- Footer -->
              <div class="print-footer">
                <p>This is a system-generated performance report. For any discrepancies, please contact HR department within 7 days.</p>
                <p>© ${new Date().getFullYear()} Cystas Devsoft Private Limited. All rights reserved.</p>
              </div>
              
              <div class="print-signature">
                <div class="print-signature-box">
                  <div class="print-signature-line"></div>
                  <p><strong>Authorized Signatory</strong></p>
                  <p style="font-size: 10px;">HR Department, Cystas Devsoft Pvt Ltd</p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
      printWindow.close();
    }
  };

  const getGradeColor = (grade) => {
    const colors = {
      'A+': 'bg-green-100 text-green-800',
      'A': 'bg-green-100 text-green-800',
      'B+': 'bg-blue-100 text-blue-800',
      'B': 'bg-blue-100 text-blue-800',
      'C': 'bg-yellow-100 text-yellow-800',
      'D': 'bg-orange-100 text-orange-800',
      'F': 'bg-red-100 text-red-800'
    };
    return colors[grade] || 'bg-gray-100 text-gray-800';
  };

  const getScoreClass = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceLevel = (score) => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Very Good';
    if (score >= 70) return 'Good';
    if (score >= 60) return 'Satisfactory';
    if (score >= 50) return 'Needs Improvement';
    return 'Poor';
  };

  return (
    <div className="space-y-6">
      {/* Notification */}
      {notification.show && (
        <div className={`fixed top-4 right-4 z-50 flex items-center p-4 rounded-lg shadow-lg ${
          notification.type === 'success' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'
        } border`}>
          {notification.type === 'success' ? (
            <CheckCircle className="h-5 w-5 mr-2" />
          ) : (
            <XCircle className="h-5 w-5 mr-2" />
          )}
          {notification.message}
        </div>
      )}

      {/* Report Generator Form */}
      <Card className="bg-white dark:bg-gray-800 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-white dark:from-gray-700 dark:to-gray-800 border-b dark:border-gray-700">
          <CardTitle className="text-2xl text-gray-800 dark:text-white">Generate Performance Report</CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Create comprehensive performance reports for employees</p>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black dark:text-white dark:bg-gray-700"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black dark:text-white dark:bg-gray-700"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Report Title (Optional)</label>
              <input
                type="text"
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                placeholder="e.g., Q4 2024 Performance Review"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black dark:text-white dark:bg-gray-700"
              />
            </div>
          </div>
          <div className="mt-6">
            <Button 
              onClick={generateReport} 
              disabled={loading} 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating Report...
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Generate Report
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Saved Reports */}
      <Card className="bg-white dark:bg-gray-800 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-700 dark:to-gray-800 border-b dark:border-gray-700">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl text-gray-800 dark:text-white">Published Reports</CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Manage and view previously published reports</p>
            </div>
            <Button 
              onClick={fetchSavedReports} 
              variant="outline" 
              className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800"
              disabled={fetchingReports}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${fetchingReports ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {fetchingReports ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : savedReports.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p>No reports found. Generate your first report above.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {savedReports.map(report => (
                <div key={report._id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow gap-3">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-800 dark:text-white">{report.title}</h4>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        report.status === 'published' 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                          : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                      }`}>
                        {report.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Period: {format(new Date(report.period.startDate), 'MMM dd, yyyy')} - {format(new Date(report.period.endDate), 'MMM dd, yyyy')}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      Generated by: {report.createdBy?.name || 'Admin'} | {format(new Date(report.createdAt), 'PPP')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        setGeneratedReport(report);
                        setShowPreview(true);
                      }}
                      className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    {report.status === 'published' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => unpublishReport(report._id)}
                        className="bg-red-50 hover:bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800"
                      >
                        <Archive className="h-4 w-4 mr-1" />
                        Unpublish
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Report Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto bg-white p-0">
          {generatedReport && (
            <div id="report-content" className="bg-white">
              {/* Letterhead Header */}
              <div className="bg-gradient-to-r from-[#0f2027] via-[#203a43] to-[#2c5364] text-white p-8 text-center">
                <h1 className="text-3xl font-bold mb-2">CYSTAS DEVSOFT PRIVATE LIMITED</h1>
                <p className="text-sm text-blue-200">CIN: U62090UT2025PTC019363</p>
                <p className="text-xs text-blue-200 mt-2 max-w-2xl mx-auto">
                  Regd. Off:- C/o Bhuvan Chandra Maithani, Makku, Makkumath, Makoomath, Okhimath, Rudraprayag, Uttarakhand - 246419, India.
                </p>
                <p className="text-xs text-blue-200 mt-1">Email: cystasdevsoft@gmail.com</p>
                <div className="mt-4 pt-3 border-t border-blue-700">
                  <p className="text-sm font-semibold">Enterprise Performance Evaluation Report</p>
                  <p className="text-xs text-blue-200 mt-1">Generated on: {format(new Date(), 'MMMM dd, yyyy')}</p>
                </div>
              </div>

              {/* Report Header */}
              <div className="p-8 border-b border-gray-200">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">{generatedReport.title}</h2>
                  <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-600 mt-3">
                    <div>
                      <span className="font-semibold">Reporting Period:</span> {format(new Date(generatedReport.period.startDate), 'MMMM dd, yyyy')} - {format(new Date(generatedReport.period.endDate), 'MMMM dd, yyyy')}
                    </div>
                    <div>
                      <span className="font-semibold">Status:</span> 
                      <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
                        generatedReport.status === 'published' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {generatedReport.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary Stats */}
              <div className="p-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-600">{generatedReport.reportData.length}</div>
                    <div className="text-sm text-gray-600">Total Employees</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {generatedReport.reportData.length > 0 ? Math.round(generatedReport.reportData.reduce((sum, d) => sum + (d.attendance.attendancePercentage || 0), 0) / generatedReport.reportData.length) : 0}%
                    </div>
                    <div className="text-sm text-gray-600">Average Attendance</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {generatedReport.reportData.length > 0 ? Math.round(generatedReport.reportData.reduce((sum, d) => sum + (d.overallScore || 0), 0) / generatedReport.reportData.length) : 0}
                    </div>
                    <div className="text-sm text-gray-600">Average Overall Score</div>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {generatedReport.reportData.filter(d => d.performanceGrade === 'A+' || d.performanceGrade === 'A').length}
                    </div>
                    <div className="text-sm text-gray-600">Top Performers (A Grade)</div>
                  </div>
                </div>

                {/* Data Table */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 border border-gray-200 text-left text-sm font-semibold text-gray-700">#</th>
                        <th className="px-4 py-3 border border-gray-200 text-left text-sm font-semibold text-gray-700">Employee Name</th>
                        <th className="px-4 py-3 border border-gray-200 text-left text-sm font-semibold text-gray-700">Role</th>
                        <th className="px-4 py-3 border border-gray-200 text-center text-sm font-semibold text-gray-700">Attendance</th>
                        <th className="px-4 py-3 border border-gray-200 text-center text-sm font-semibold text-gray-700">Tasks (C/T)</th>
                        <th className="px-4 py-3 border border-gray-200 text-center text-sm font-semibold text-gray-700">Avg Rating</th>
                        <th className="px-4 py-3 border border-gray-200 text-center text-sm font-semibold text-gray-700">Overall Score</th>
                        <th className="px-4 py-3 border border-gray-200 text-center text-sm font-semibold text-gray-700">Grade</th>
                        <th className="px-4 py-3 border border-gray-200 text-left text-sm font-semibold text-gray-700">Performance Level</th>
                      </tr>
                    </thead>
                    <tbody>
                      {generatedReport.reportData.map((data, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-3 border border-gray-200 text-sm text-gray-600">{idx + 1}</td>
                          <td className="px-4 py-3 border border-gray-200 text-sm font-medium text-gray-800">{data.employeeName}</td>
                          <td className="px-4 py-3 border border-gray-200 text-sm capitalize text-gray-600">{data.employeeRole}</td>
                          <td className="px-4 py-3 border border-gray-200 text-center text-sm font-semibold text-gray-700">{data.attendance.attendancePercentage}%</td>
                          <td className="px-4 py-3 border border-gray-200 text-center text-sm">
                            <span className="font-semibold text-green-600">{data.tasks.completedTasks}</span>
                            <span className="text-gray-400">/{data.tasks.totalAssigned}</span>
                          </td>
                          <td className="px-4 py-3 border border-gray-200 text-center text-sm">
                            <span className="font-semibold text-blue-600">{data.tasks.averageRating}</span>
                            <span className="text-gray-400">/5</span>
                          </td>
                          <td className="px-4 py-3 border border-gray-200 text-center">
                            <span className={`font-bold text-lg ${getScoreClass(data.overallScore)}`}>{data.overallScore}</span>
                          </td>
                          <td className="px-4 py-3 border border-gray-200 text-center">
                            <span className={`px-2 py-1 rounded text-sm font-semibold ${getGradeColor(data.performanceGrade)}`}>
                              {data.performanceGrade}
                            </span>
                          </td>
                          <td className="px-4 py-3 border border-gray-200 text-sm text-gray-600">
                            {getPerformanceLevel(data.overallScore)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Footer with Signature */}
              <div className="bg-gray-50 px-8 py-6 border-t">
                <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-gray-600 gap-4">
                  <div className="text-center sm:text-left">
                    <p>This report is system-generated and requires authorized verification.</p>
                    <p className="text-xs mt-1">© {new Date().getFullYear()} Cystas Devsoft Private Limited. All rights reserved.</p>
                  </div>
                  <div className="text-center">
                    <p>Authorized Signature</p>
                    <div className="border-t-2 border-gray-400 w-32 mt-2"></div>
                    <p className="text-xs mt-1">HR Department, Cystas Devsoft</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="sticky bottom-0 bg-white border-t p-4 flex justify-end gap-3">
            <Button onClick={handlePrint} variant="outline" className="bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-300">
              <Printer className="h-4 w-4 mr-2" />
              Print Report
            </Button>
            {generatedReport?.status === 'draft' && (
              <Button onClick={publishReport} className="bg-green-600 hover:bg-green-700 text-white">
                <Send className="h-4 w-4 mr-2" />
                Publish Report
              </Button>
            )}
            <Button onClick={() => setShowPreview(false)} variant="ghost" className="hover:bg-gray-100">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PerformanceReportGenerator;