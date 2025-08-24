const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');

router.post('/register', authController.register);
router.post('/login', authController.login);

// Add this GET /me route to return current logged-in user info
router.get('/me', authController.protect, (req, res) => {
  res.status(200).json({
    status: 'success',
    data: req.user,
  });
});

module.exports = router;
