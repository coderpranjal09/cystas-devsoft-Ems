const express = require('express');
const router = express.Router();

const clientController = require('../controllers/client/clientController');
const leaveController = require('../controllers/client/leaveController');
const taskController = require('../controllers/client/taskController');

const { auth, restrict } = require('../middleware/auth');

// Protect all routes below and restrict to 'client' role
router.use(auth);
router.use(restrict('client'));

// Client profile routes
router
  .route('/profile')
  .get(clientController.getClientProfile)
  .patch(clientController.updateClientProfile);

// Client password update
router.post('/update-password', clientController.updatePassword);

// Client projects
router
  .route('/projects')
  .get(clientController.getClientProjects);

router
  .route('/projects/:id')
  .get(clientController.getClientProject);

// Client tasks
router
  .route('/tasks')
  .get(clientController.getClientTasks);

router
  .route('/tasks/:id')
  .patch(taskController.updateTaskStatus);

// Client leaves
router
  .route('/leaves')
  .get(leaveController.getMyLeaves)
  .post(leaveController.applyForLeave);

router
  .route('/leaves/:id')
  .delete(leaveController.cancelLeave);

// Client dashboard stats
router.get('/dashboard/stats', clientController.getDashboardStats);

// ** NEW: Client attendance **
router.get('/attendance', clientController.getAttendance);

// Client project details
router
  .route('/projects/:id/details')
  .get(clientController.getClientProjectDetails);

// Client project tasks
router
  .route('/projects/:id/tasks')
  .get(clientController.getProjectTasks);


module.exports = router;
