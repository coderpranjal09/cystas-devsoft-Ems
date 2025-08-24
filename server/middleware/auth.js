const { protect, restrictTo } = require('../controllers/authController');

exports.auth = protect;
exports.restrict = restrictTo;