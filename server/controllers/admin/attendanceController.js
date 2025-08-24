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