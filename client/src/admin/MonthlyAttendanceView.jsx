// src/admin/MonthlyAttendanceView.jsx
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import api from '@/services/api';

const MonthlyAttendanceView = () => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedEmployee, setSelectedEmployee] = useState('all');
  const [employees, setEmployees] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [employeeAttendance, setEmployeeAttendance] = useState(null);
  const [error, setError] = useState('');

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (selectedEmployee === 'all') {
      fetchAllEmployeesAttendance();
    } else if (selectedEmployee && selectedEmployee !== 'all') {
      fetchEmployeeAttendance();
    }
  }, [selectedYear, selectedMonth, selectedEmployee]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/users');
      
      let employeesList = [];
      if (response.data?.data?.employees) {
        employeesList = response.data.data.employees;
      } else if (response.data?.data) {
        employeesList = response.data.data;
      } else if (Array.isArray(response.data)) {
        employeesList = response.data;
      } else if (response.data?.employees) {
        employeesList = response.data.employees;
      }
      
      // Filter only clients
      const clientsOnly = employeesList.filter(emp => emp.role === 'client');
      setEmployees(Array.isArray(clientsOnly) ? clientsOnly : []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      setError('Failed to load employees list');
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllEmployeesAttendance = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get(`/admin/attendance/monthly/${selectedYear}/${selectedMonth}`);
      console.log('All Employees Attendance:', response.data);
      
      let attendanceList = [];
      if (response.data?.data) {
        attendanceList = response.data.data;
      } else if (Array.isArray(response.data)) {
        attendanceList = response.data;
      }
      
      setAttendanceData(Array.isArray(attendanceList) ? attendanceList : []);
      setEmployeeAttendance(null);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      setError('Failed to load attendance data');
      setAttendanceData([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployeeAttendance = async () => {
    if (!selectedEmployee || selectedEmployee === 'all') return;
    
    setLoading(true);
    setError('');
    try {
      const response = await api.get(`/admin/attendance/user/${selectedEmployee}/${selectedYear}/${selectedMonth}`);
      console.log('Single Employee Attendance:', response.data);
      
      if (response.data?.success && response.data?.data) {
        setEmployeeAttendance(response.data.data);
      } else if (response.data?.data) {
        setEmployeeAttendance(response.data.data);
      } else {
        setEmployeeAttendance(response.data);
      }
      setAttendanceData([]);
    } catch (error) {
      console.error('Error fetching employee attendance:', error);
      setError('Failed to load employee attendance data');
      setEmployeeAttendance(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      present: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      absent: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      half_day: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      'half-day': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      leave: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      not_marked: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500',
      'not-marked': 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500'
    };
    return colors[status] || colors['not_marked'];
  };

  const formatStatus = (status) => {
    if (status === 'half_day' || status === 'half-day') return 'Half Day';
    if (status === 'not_marked' || status === 'not-marked') return 'Not Marked';
    if (status === 'leave') return 'Leave';
    return status?.charAt(0).toUpperCase() + status?.slice(1) || 'N/A';
  };

  if (error) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <div className="text-red-600 mb-4">⚠️ {error}</div>
          <button 
            onClick={() => {
              if (selectedEmployee === 'all') {
                fetchAllEmployeesAttendance();
              } else {
                fetchEmployeeAttendance();
              }
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">Attendance Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {[2023, 2024, 2025, 2026].map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Month</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {months.map((month, index) => (
                  <option key={index} value={index + 1}>{month}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Client</label>
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Clients</option>
                {Array.isArray(employees) && employees.map(emp => (
                  <option key={emp._id} value={emp._id}>
                    {emp.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
        </div>
      )}

      {/* Individual Employee Attendance View */}
      {employeeAttendance && !loading && (
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">
              Attendance Summary - {employeeAttendance.clientName} - {months[selectedMonth - 1]} {selectedYear}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {employeeAttendance.summary?.present || 0}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Present</div>
              </div>
              <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {employeeAttendance.summary?.absent || 0}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Absent</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {employeeAttendance.summary?.halfDay || 0}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Half Day</div>
              </div>
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {employeeAttendance.summary?.leave || 0}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Leave</div>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                  {employeeAttendance.summary?.notMarked || 0}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Not Marked</div>
              </div>
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {employeeAttendance.summary?.attendancePercentage || 0}%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Attendance %</div>
              </div>
            </div>

            <div className="mb-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-center">
              <div className="text-lg font-semibold text-indigo-600 dark:text-indigo-400">
                Total Working Hours: {employeeAttendance.summary?.totalWorkingHours || 0} hrs
              </div>
            </div>

            <div className="overflow-x-auto">
              <div className="grid grid-cols-7 gap-2 min-w-[600px]">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center font-semibold py-2 bg-gray-100 dark:bg-gray-700 rounded text-gray-700 dark:text-gray-300">
                    {day}
                  </div>
                ))}
                {(employeeAttendance.dailyAttendance || []).map((day, index) => (
                  <div
                    key={index}
                    className={`text-center p-2 rounded-lg border ${getStatusColor(day.status)}`}
                  >
                    <div className="font-bold">{new Date(day.date).getDate()}</div>
                    <div className="text-xs capitalize">{formatStatus(day.status)}</div>
                    {day.workingHours > 0 && <div className="text-xs">{day.workingHours}h</div>}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Employees Summary View */}
      {Array.isArray(attendanceData) && attendanceData.length > 0 && !loading && (
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">
              All Clients Attendance - {months[selectedMonth - 1]} {selectedYear}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-left text-gray-700 dark:text-gray-300">Client Name</th>
                    <th className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-center text-gray-700 dark:text-gray-300">Present</th>
                    <th className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-center text-gray-700 dark:text-gray-300">Absent</th>
                    <th className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-center text-gray-700 dark:text-gray-300">Half Day</th>
                    <th className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-center text-gray-700 dark:text-gray-300">Leave</th>
                    <th className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-center text-gray-700 dark:text-gray-300">Not Marked</th>
                    <th className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-center text-gray-700 dark:text-gray-300">Attendance %</th>
                    <th className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-center text-gray-700 dark:text-gray-300">Working Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceData.map((data, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white">
                        {data.clientName}
                      </td>
                      <td className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-center text-green-600 dark:text-green-400 font-semibold">
                        {data.present || 0}
                      </td>
                      <td className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-center text-red-600 dark:text-red-400">
                        {data.absent || 0}
                      </td>
                      <td className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-center text-yellow-600 dark:text-yellow-400">
                        {data.halfDay || 0}
                      </td>
                      <td className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-center text-purple-600 dark:text-purple-400">
                        {data.leave || 0}
                      </td>
                      <td className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-center text-gray-500 dark:text-gray-400">
                        {data.notMarked || 0}
                      </td>
                      <td className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-center font-semibold">
                        <span className={`px-2 py-1 rounded ${(data.attendancePercentage || 0) >= 75 ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
                          {data.attendancePercentage || 0}%
                        </span>
                      </td>
                      <td className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-center text-gray-900 dark:text-white">
                        {data.totalWorkingHours || 0} hrs
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No data message */}
      {!loading && !employeeAttendance && (!attendanceData || attendanceData.length === 0) && (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">No attendance data available for the selected period.</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">Try selecting a different month or year.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MonthlyAttendanceView;