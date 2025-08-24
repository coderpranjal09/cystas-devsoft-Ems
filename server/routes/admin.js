const express = require('express');
const router = express.Router();

// Import controllers
const adminController = require('../controllers/admin/adminController');
const employeeController = require('../controllers/admin/employeeController');
const attendanceController = require('../controllers/admin/attendanceController');
const projectController = require('../controllers/admin/projectController');
const leaveController = require('../controllers/admin/adminLeave');
const taskController = require('../controllers/taskController');

// Import middleware
const { auth, restrict } = require('../middleware/auth');

// Protect all routes after this middleware (only admin)
router.use(auth);
router.use(restrict('admin'));

// ✅ Admin Management
router
  .route('/admins')
  .get(adminController.getAllAdmins)
  .post(adminController.createAdmin);

router
  .route('/admins/:id')
  .get(adminController.getAdmin)
  .patch(adminController.updateAdmin)
  .delete(adminController.deleteAdmin);

// ✅ User (Employee) Management
router
  .route('/users')
  .get(employeeController.getAllEmployees)
  .post(employeeController.createEmployee);

router
  .route('/users/:id')
  .get(employeeController.getEmployee)
  .patch(employeeController.updateEmployee)
  .delete(employeeController.deleteEmployee);

// ✅ Attendance Management
router
  .route('/attendance')
  .get(attendanceController.getAllAttendance)
  .post(attendanceController.markAttendance);

router
  .route('/attendance/multiple')
  .post(attendanceController.markMultipleAttendance);

router
  .route('/attendance/user/:userId')
  .get(attendanceController.getUserAttendance);

router
  .route('/attendance/:id')
  .get(attendanceController.getAttendanceRecord)
  .patch(attendanceController.updateAttendance)
  .delete(attendanceController.deleteAttendance);

// ✅ Task Management
router
  .route('/tasks')
  .get(taskController.getAllTasks)
  .post(taskController.createTask);

router
  .route('/tasks/:taskId')
  .get(taskController.getTask)
  .patch(taskController.updateTask)
  .delete(taskController.deleteTask);

router
  .route('/tasks/:taskId/evaluate')
  .post(taskController.evaluateTask);

// ✅ Project Management
router
  .route('/projects')
  .get(projectController.getAllProjects)
  .post(projectController.createProject);

router
  .route('/projects/:id')
  .get(projectController.getProject)
  .patch(projectController.updateProject)
  .delete(projectController.deleteProject);

// ✅ Leave Management
router
  .route('/leaves')
  .get(leaveController.getAllLeaves);

// Leave statistics route (must be before /leaves/:id)
router
  .route('/leaves/stats')
  .get(leaveController.getLeaveStats);

// Single leave and update status
router
  .route('/leaves/:id')
  .get(leaveController.getLeave)
  .patch(leaveController.updateLeaveStatus);

// ✅ Dashboard Stats
router.get('/dashboard/stats', adminController.getAdminStats);

module.exports = router;
