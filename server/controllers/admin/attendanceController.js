const Attendance = require('../../models/Attendance');

// Simple error handler without external dependency
const handleError = (res, statusCode, message) => {
  return res.status(statusCode).json({
    status: 'error',
    message
  });
};

exports.markAttendance = async (req, res) => {
  try {
    const { userId, date, status, checkIn, checkOut, notes } = req.body;

    if (!userId) {
      return handleError(res, 400, 'User ID is required');
    }

    if (!date) {
      return handleError(res, 400, 'Date is required');
    }

    // Normalize date to remove time
    const formattedDate = new Date(new Date(date).setHours(0, 0, 0, 0));

    // Convert checkIn/checkOut only if present and status is not absent/leave
    let checkInDate = null;
    let checkOutDate = null;

    if (status !== 'absent' && status !== 'leave') {
      if (checkIn) {
        if (checkIn.includes('T')) {
          checkInDate = new Date(checkIn);
        } else {
          const timeParts = checkIn.split(':');
          checkInDate = new Date(formattedDate);
          checkInDate.setHours(parseInt(timeParts[0]), parseInt(timeParts[1] || 0), 0, 0);
        }
      }
      
      if (checkOut) {
        if (checkOut.includes('T')) {
          checkOutDate = new Date(checkOut);
        } else {
          const timeParts = checkOut.split(':');
          checkOutDate = new Date(formattedDate);
          checkOutDate.setHours(parseInt(timeParts[0]), parseInt(timeParts[1] || 0), 0, 0);
        }
      }
    }

    // Check if attendance already exists for this user and date
    const existingAttendance = await Attendance.findOne({
      user: userId,
      date: formattedDate
    });

    if (existingAttendance) {
      return handleError(res, 400, 'Attendance already recorded for this user on the selected date');
    }

    // Create new attendance record
    const attendance = await Attendance.create({
      user: userId,
      date: formattedDate,
      status,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      notes: notes || '',
      recordedBy: req.user.id
    });

    res.status(201).json({
      status: 'success',
      data: { attendance }
    });
  } catch (err) {
    console.error('Error marking attendance:', err);
    
    if (err.code === 11000) {
      return handleError(res, 400, 'Attendance already recorded for this user on the selected date');
    }
    
    handleError(res, 500, 'Internal server error');
  }
};

// Mark multiple attendance records (NEW)
exports.markMultipleAttendance = async (req, res) => {
  try {
    const { attendanceRecords } = req.body;

    if (!attendanceRecords || !Array.isArray(attendanceRecords) || attendanceRecords.length === 0) {
      return handleError(res, 400, 'Attendance records array is required');
    }

    const results = [];
    const errors = [];

    for (const record of attendanceRecords) {
      try {
        const { userId, date, status, checkIn, checkOut, notes } = record;

        if (!userId || !date) {
          errors.push({ record, error: 'User ID and date are required' });
          continue;
        }

        // Normalize date to remove time
        const formattedDate = new Date(new Date(date).setHours(0, 0, 0, 0));

        // Convert checkIn/checkOnly if status requires it
        let checkInDate = null;
        let checkOutDate = null;

        if (status !== 'absent' && status !== 'leave') {
          if (checkIn) {
            checkInDate = new Date(checkIn);
          }
          
          if (checkOut) {
            checkOutDate = new Date(checkOut);
          }
        }

        // Check if attendance already exists
        const existingAttendance = await Attendance.findOne({
          user: userId,
          date: formattedDate
        });

        if (existingAttendance) {
          errors.push({ record, error: 'Attendance already exists for this user and date' });
          continue;
        }

        // Create new attendance record
        const attendance = await Attendance.create({
          user: userId,
          date: formattedDate,
          status,
          checkIn: checkInDate,
          checkOut: checkOutDate,
          notes: notes || '',
          recordedBy: req.user.id
        });

        results.push(attendance);
      } catch (error) {
        errors.push({ record, error: error.message });
      }
    }

    res.status(201).json({
      status: 'success',
      data: {
        successful: results,
        failed: errors
      }
    });
  } catch (err) {
    console.error('Error marking multiple attendance:', err);
    handleError(res, 500, 'Internal server error');
  }
};


// Get All Attendance
exports.getAllAttendance = async (req, res) => {
  try {
    const { limit } = req.query;
    let query = Attendance.find().populate('user', 'name email role department').sort('-date');
    
    if (limit) {
      query = query.limit(parseInt(limit));
    }
    
    const attendances = await query;

    res.status(200).json({
      status: 'success',
      results: attendances.length,
      data: { attendances }
    });
  } catch (err) {
    console.error('Error fetching attendance:', err);
    handleError(res, 500, 'Internal server error');
  }
};

// Get Attendance for One User
exports.getUserAttendance = async (req, res) => {
  try {
    const { userId } = req.params;
    const { month, year } = req.query;

    let query = { user: userId };
    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      query.date = { $gte: startDate, $lte: endDate };
    }

    const attendance = await Attendance.find(query).populate('user', 'name email role department').sort('date');

    res.status(200).json({
      status: 'success',
      results: attendance.length,
      data: { attendance }
    });
  } catch (err) {
    console.error('Error fetching user attendance:', err);
    handleError(res, 500, 'Internal server error');
  }
};

// Get Single Attendance Record
exports.getAttendanceRecord = async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id)
      .populate('user', 'name email role department');

    if (!attendance) {
      return handleError(res, 404, 'No attendance record found with that ID');
    }

    res.status(200).json({
      status: 'success',
      data: { attendance }
    });
  } catch (err) {
    console.error('Error fetching attendance record:', err);
    handleError(res, 500, 'Internal server error');
  }
};

// Update Attendance
exports.updateAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!attendance) {
      return handleError(res, 404, 'No attendance record found with that ID');
    }

    res.status(200).json({
      status: 'success',
      data: { attendance }
    });
  } catch (err) {
    console.error('Error updating attendance:', err);
    handleError(res, 500, 'Internal server error');
  }
};

// Delete Attendance
exports.deleteAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.findByIdAndDelete(req.params.id);

    if (!attendance) {
      return handleError(res, 404, 'No attendance record found with that ID');
    }

    res.status(204).json({ status: 'success', data: null });
  } catch (err) {
    console.error('Error deleting attendance:', err);
    handleError(res, 500, 'Internal server error');
  }
};

// Check for existing attendance
exports.checkExistingAttendance = async (req, res) => {
  try {
    const { userId, date } = req.query;
    
    if (!userId || !date) {
      return handleError(res, 400, 'User ID and date are required');
    }

    const formattedDate = new Date(new Date(date).setHours(0, 0, 0, 0));
    const existingRecord = await Attendance.findOne({ 
      user: userId, 
      date: formattedDate 
    });

    res.status(200).json({
      status: 'success',
      data: { exists: !!existingRecord }
    });
  } catch (err) {
    console.error('Error checking existing attendance:', err);
    handleError(res, 500, 'Internal server error');
  }
};
// server/controllers/admin/attendanceController.js

const User = require('../../models/User'); // ✅ THIS LINE WAS MISSING - FIXES "User is not defined"


// Get all employees monthly attendance
exports.getAllEmployeesMonthlyAttendance = async (req, res) => {
  try {
    const { year, month } = req.params;
    
    console.log(`=== Fetching Attendance for ${year}-${month} ===`);
    
    // Get all clients only (not admins)
    const users = await User.find({ 
      role: 'client'
    });
    
    if (!users || users.length === 0) {
      return res.json({
        success: true,
        data: []
      });
    }
    
    const attendanceData = [];
    
    for (const user of users) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      const daysInMonth = endDate.getDate();
      
      // Get all attendance records for this user in the month
      const attendance = await Attendance.find({
        user: user._id,
        date: { $gte: startDate, $lte: endDate }
      });
      
      // Calculate statistics
      let presentDays = 0;
      let absentDays = 0;
      let halfDays = 0;
      let totalWorkingHours = 0;
      
      attendance.forEach(record => {
        if (record.status === 'present') {
          presentDays++;
          // Calculate working hours if checkIn and checkOut exist
          if (record.checkIn && record.checkOut) {
            const checkInTime = new Date(record.checkIn);
            const checkOutTime = new Date(record.checkOut);
            const hoursWorked = (checkOutTime - checkInTime) / (1000 * 60 * 60);
            totalWorkingHours += hoursWorked;
          }
        } else if (record.status === 'absent') {
          absentDays++;
        } else if (record.status === 'half_day') {
          halfDays++;
          // Half day counts as 0.5 present for percentage
          if (record.checkIn && record.checkOut) {
            const checkInTime = new Date(record.checkIn);
            const checkOutTime = new Date(record.checkOut);
            const hoursWorked = (checkOutTime - checkInTime) / (1000 * 60 * 60);
            totalWorkingHours += hoursWorked;
          }
        }
      });
      
      // Calculate attendance percentage (half day counts as 0.5)
      const totalPresentEquivalent = presentDays + (halfDays * 0.5);
      const attendancePercentage = daysInMonth > 0 
        ? Math.round((totalPresentEquivalent / daysInMonth) * 100)
        : 0;
      
      attendanceData.push({
        clientName: user.name,
        attendancePercentage: `${attendancePercentage}%`,
        totalWorkingHours: totalWorkingHours.toFixed(1),
        presentDays: presentDays,
        absentDays: absentDays,
        halfDays: halfDays,
        totalDaysInMonth: daysInMonth
      });
    }
    
    res.json({
      success: true,
      data: attendanceData
    });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching attendance', 
      error: error.message 
    });
  }
};

// Get single employee monthly attendance with detailed view
exports.getEmployeeMonthlyAttendance = async (req, res) => {
  try {
    const { userId, year, month } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    const daysInMonth = endDate.getDate();
    
    const attendance = await Attendance.find({
      user: userId,
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1 });
    
    // Daily breakdown
    const dailyAttendance = [];
    let presentDays = 0;
    let absentDays = 0;
    let halfDays = 0;
    let totalWorkingHours = 0;
    
    for (let i = 1; i <= daysInMonth; i++) {
      const currentDate = new Date(year, month - 1, i);
      const attendanceRecord = attendance.find(
        a => a.date && new Date(a.date).getDate() === i
      );
      
      let status = 'not_marked';
      let workingHours = 0;
      
      if (attendanceRecord) {
        status = attendanceRecord.status;
        
        if (status === 'present') {
          presentDays++;
          if (attendanceRecord.checkIn && attendanceRecord.checkOut) {
            const checkInTime = new Date(attendanceRecord.checkIn);
            const checkOutTime = new Date(attendanceRecord.checkOut);
            workingHours = (checkOutTime - checkInTime) / (1000 * 60 * 60);
            totalWorkingHours += workingHours;
          }
        } else if (status === 'absent') {
          absentDays++;
        } else if (status === 'half_day') {
          halfDays++;
          if (attendanceRecord.checkIn && attendanceRecord.checkOut) {
            const checkInTime = new Date(attendanceRecord.checkIn);
            const checkOutTime = new Date(attendanceRecord.checkOut);
            workingHours = (checkOutTime - checkInTime) / (1000 * 60 * 60);
            totalWorkingHours += workingHours;
          }
        }
      }
      
      dailyAttendance.push({
        date: currentDate.toISOString().split('T')[0],
        day: currentDate.toLocaleDateString('en-US', { weekday: 'short' }),
        status: status,
        workingHours: workingHours.toFixed(1),
        checkIn: attendanceRecord?.checkIn ? new Date(attendanceRecord.checkIn).toLocaleTimeString() : null,
        checkOut: attendanceRecord?.checkOut ? new Date(attendanceRecord.checkOut).toLocaleTimeString() : null
      });
    }
    
    // Calculate attendance percentage
    const totalPresentEquivalent = presentDays + (halfDays * 0.5);
    const attendancePercentage = daysInMonth > 0 
      ? Math.round((totalPresentEquivalent / daysInMonth) * 100)
      : 0;
    
    res.json({
      success: true,
      data: {
        clientName: user.name,
        clientEmail: user.email,
        period: {
          month: parseInt(month),
          year: parseInt(year),
          totalDays: daysInMonth
        },
        summary: {
          attendancePercentage: `${attendancePercentage}%`,
          totalWorkingHours: totalWorkingHours.toFixed(1),
          presentDays: presentDays,
          absentDays: absentDays,
          halfDays: halfDays,
          notMarkedDays: daysInMonth - (presentDays + absentDays + halfDays)
        },
        dailyAttendance: dailyAttendance
      }
    });
  } catch (error) {
    console.error('Error fetching employee attendance:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching attendance', 
      error: error.message 
    });
  }
};