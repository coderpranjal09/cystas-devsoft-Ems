const express = require('express');
const router = express.Router();

// Import controllers
const taskController = require('../controllers/taskController');

// Import middleware
const { auth, restrict } = require('../middleware/auth');

// ✅ Protect all routes after this middleware
router.use(auth);
router.use(restrict('client', 'admin')); // Allow both employees and admins

// ✅ Employee Task Routes
router
  .route('/tasks/me')
  .get(taskController.getMyTasks);

router
  .route('/tasks/:taskId/submit')
  .post(taskController.submitTask);

module.exports = router;