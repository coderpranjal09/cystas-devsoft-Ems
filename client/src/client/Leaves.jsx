import { useState, useEffect } from 'react';
import { useAuth } from '@/services/auth-context.jsx';
import api from '@/services/api';

const LeavesPage = () => {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    from: new Date(),
    to: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
  });
  const [leaveType, setLeaveType] = useState('sick');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const fetchLeaves = async () => {
      try {
        const res = await api.get('/client/leaves');
        const data = res.data?.data;

        if (Array.isArray(data)) {
          setLeaves(data);
        } else if (Array.isArray(data?.leaves)) {
          setLeaves(data.leaves);
        } else {
          setLeaves([]);
        }
      } catch (err) {
        console.error('Error fetching leaves:', err);
        setLeaves([]);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaves();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    
    // Validation
    if (!dateRange.from || !dateRange.to) {
      setError('Please select a date range');
      return;
    }
    
    if (dateRange.from > dateRange.to) {
      setError('End date must be after start date');
      return;
    }
    
    if (!reason.trim()) {
      setError('Please provide a reason for your leave');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const days = Math.floor((dateRange.to - dateRange.from) / (1000 * 60 * 60 * 24)) + 1;
      const newLeave = {
        type: leaveType,
        startDate: dateRange.from,
        endDate: dateRange.to,
        days,
        reason,
      };

      const res = await api.post('/client/leaves', newLeave);
      const createdLeave = res.data?.data;
      if (createdLeave) {
        setLeaves((prev) => [createdLeave, ...prev]);
        setSuccessMessage('Leave application submitted successfully!');
      }
      setDateRange({ from: new Date(), to: new Date(Date.now() + 24 * 60 * 60 * 1000) });
      setLeaveType('sick');
      setReason('');
      setShowModal(false);
    } catch (err) {
      console.error('Error applying for leave:', err);
      setError(err.response?.data?.message || 'Failed to submit leave application');
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusIcons = {
    approved: (
      <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    ),
    pending: (
      <svg className="h-5 w-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
      </svg>
    ),
    rejected: (
      <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
    ),
  };

  const leaveTypeNames = {
    sick: 'Sick Leave',
    vacation: 'Vacation',
    personal: 'Personal Leave',
    maternity: 'Maternity Leave',
    paternity: 'Paternity Leave',
    other: 'Other',
  };

  // Custom Calendar Component
  const Calendar = ({ selected, onSelect, disabled }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    
    const nextMonth = () => {
      setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };
    
    const prevMonth = () => {
      setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };
    
    const getDaysInMonth = (year, month) => {
      return new Date(year, month + 1, 0).getDate();
    };
    
    const getFirstDayOfMonth = (year, month) => {
      return new Date(year, month, 1).getDay();
    };
    
    const isDateDisabled = (date) => {
      if (!disabled) return false;
      if (disabled.before && date < disabled.before) return true;
      return false;
    };
    
    const isDateInRange = (date) => {
      if (!selected.from || !selected.to) return false;
      return date >= selected.from && date <= selected.to;
    };
    
    const isDateSelected = (date) => {
      if (selected.from && selected.from.getDate() === date.getDate() && 
          selected.from.getMonth() === date.getMonth() && 
          selected.from.getFullYear() === date.getFullYear()) return true;
      if (selected.to && selected.to.getDate() === date.getDate() && 
          selected.to.getMonth() === date.getMonth() && 
          selected.to.getFullYear() === date.getFullYear()) return true;
      return false;
    };
    
    const handleDateClick = (date) => {
      if (isDateDisabled(date)) return;
      
      if (!selected.from || (selected.from && selected.to)) {
        onSelect({ from: date, to: null });
      } else if (date > selected.from) {
        onSelect({ from: selected.from, to: date });
      } else {
        onSelect({ from: date, to: null });
      }
    };
    
    const month = currentMonth.getMonth();
    const year = currentMonth.getFullYear();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    const days = [];
    
    // Previous month days
    for (let i = 0; i < firstDay; i++) {
      const prevMonthLastDate = getDaysInMonth(year, month - 1);
      days.push(
        <div key={`prev-${i}`} className="p-2 text-center text-gray-400 dark:text-gray-500">
          {prevMonthLastDate - firstDay + i + 1}
        </div>
      );
    }
    
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      const isDisabled = isDateDisabled(date);
      const inRange = isDateInRange(date);
      const isSelected = isDateSelected(date);
      
      days.push(
        <div
          key={`curr-${i}`}
          className={`p-2 text-center rounded-lg transition-all ${
            isDisabled 
              ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed' 
              : 'cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900'
          } ${
            inRange ? 'bg-blue-100 dark:bg-blue-900' : ''
          } ${
            isSelected ? 'bg-blue-500 text-white dark:bg-blue-600' : ''
          }`}
          onClick={() => !isDisabled && handleDateClick(date)}
        >
          {i}
        </div>
      );
    }
    
    // Next month days
    const totalCells = 42; // 6 weeks * 7 days
    const nextMonthDays = totalCells - (firstDay + daysInMonth);
    for (let i = 1; i <= nextMonthDays; i++) {
      days.push(
        <div key={`next-${i}`} className="p-2 text-center text-gray-400 dark:text-gray-500">
          {i}
        </div>
      );
    }
    
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 w-full max-w-md mx-auto">
        <div className="flex justify-between items-center mb-4">
          <button 
            onClick={prevMonth} 
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Previous month"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            {currentMonth.toLocaleString('default', { month: 'long' })} {year}
          </h3>
          <button 
            onClick={nextMonth} 
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Next month"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-sm font-medium text-gray-600 dark:text-gray-400 p-2">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <svg className="animate-spin h-10 w-10 mx-auto text-blue-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-4 text-lg">Loading leave records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 text-gray-900 dark:text-gray-100 max-w-6xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">My Leaves</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Manage and track your leave applications</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto justify-center shadow-md hover:shadow-lg"
        >
          <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Apply for Leave
        </button>
      </div>

      {successMessage && (
        <div className="mb-6 p-4 bg-green-100 text-green-700 rounded-lg dark:bg-green-900 dark:text-green-200 flex items-center">
          <svg className="h-5 w-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          {successMessage}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl my-8 max-h-[90vh] overflow-y-auto">
            <div className="p-6 sticky top-0 bg-white dark:bg-gray-800 z-10 border-b dark:border-gray-700">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Apply for New Leave</h2>
                <button 
                  onClick={() => setShowModal(false)} 
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  aria-label="Close modal"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {error && (
                <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg dark:bg-red-900 dark:text-red-200 flex items-center">
                  <svg className="h-5 w-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Leave Type */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2 text-gray-800 dark:text-gray-200">
                      Leave Type
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {Object.entries(leaveTypeNames).map(([value, name]) => (
                        <div
                          key={value}
                          className={`p-4 border rounded-lg cursor-pointer transition-all ${
                            leaveType === value
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-600'
                              : 'border-gray-300 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500'
                          }`}
                          onClick={() => setLeaveType(value)}
                        >
                          <div className="flex items-center">
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center mr-3 ${
                              leaveType === value
                                ? 'border-blue-500 bg-blue-500'
                                : 'border-gray-400 dark:border-gray-500'
                            }`}>
                              {leaveType === value && (
                                <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                            <span className="text-sm font-medium">{name}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Calendar */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2 text-gray-800 dark:text-gray-200">
                      Date Range
                    </label>
                    <div className="flex justify-center">
                      <Calendar
                        selected={dateRange}
                        onSelect={setDateRange}
                        disabled={{ before: new Date() }}
                      />
                    </div>
                    {dateRange.from && dateRange.to && (
                      <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center">
                        <svg className="h-5 w-5 text-blue-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                        </svg>
                        <span className="text-blue-700 dark:text-blue-300">
                          {Math.floor((dateRange.to - dateRange.from) / (1000 * 60 * 60 * 24)) + 1} day(s) - from{' '}
                          {dateRange.from.toLocaleDateString()} to {dateRange.to.toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Reason */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2 text-gray-800 dark:text-gray-200">
                      Reason
                    </label>
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Please provide a detailed reason for your leave request..."
                      required
                      className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:focus:ring-blue-600 dark:focus:border-blue-600 transition-colors resize-none"
                      rows="4"
                    />
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6 mt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-6 py-3 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-3 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-70 disabled:cursor-not-allowed dark:bg-blue-700 dark:hover:bg-blue-800 dark:focus:ring-blue-800 transition-colors flex items-center justify-center shadow-md hover:shadow-lg"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Submitting...
                      </>
                    ) : (
                      'Submit Application'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
        <div className="p-6 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Leave History</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {leaves.length} leave application{leaves.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <div className="p-6">
          {leaves.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
                <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium mb-2">No leave records found</h3>
              <p className="mb-4">You haven't applied for any leaves yet</p>
              <button
                onClick={() => setShowModal(true)}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center"
              >
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Apply for your first leave
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {leaves.map((leave) => (
                <div
                  key={leave._id}
                  className="border rounded-xl p-5 hover:shadow-md transition-all dark:border-gray-700 dark:hover:bg-gray-800/50"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
  <h3 className="font-semibold text-gray-800 dark:text-white">
    {leaveTypeNames[leave.type] || leave.type || 'Unknown Type'}
  </h3>
  {statusIcons[leave.status] ?? null}
</div>
<span
  className={`px-3 py-1 rounded-full text-xs font-medium ${
    leave.status === 'approved'
      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      : leave.status === 'pending'
      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
      : leave.status === 'rejected'
      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
  }`}
>
  {leave.status
    ? leave.status.charAt(0).toUpperCase() + leave.status.slice(1)
    : 'Unknown'}
</span>

                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-3">
                    <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-4">
                    <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {leave.days} day{leave.days !== 1 ? 's' : ''}
                  </div>
                  
                  {leave.reason && (
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 line-clamp-2">{leave.reason}</p>
                  )}
                  
                  {leave.rejectionReason && leave.status === 'rejected' && (
                    <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <p className="text-xs font-medium text-red-700 dark:text-red-300 mb-1">Reason for rejection:</p>
                      <p className="text-sm text-red-600 dark:text-red-400">{leave.rejectionReason}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeavesPage;