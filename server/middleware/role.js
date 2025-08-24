const AppError = require('../utils/errorHandler');

/**
 * Role-based access control middleware
 * @param {...String} allowedRoles - Roles that are permitted to access the route
 * @returns {Function} Middleware function
 */
const restrictTo = (...allowedRoles) => {
  return (req, res, next) => {
    // Check if user exists and has a role
    if (!req.user || !req.user.role) {
      return next(
        new AppError('You are not authorized to perform this action', 403)
      );
    }

    // Check if user's role is included in the allowed roles
    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }

    // For admin-specific permissions
    if (req.user.role === 'admin') {
      // Check if admin has specific permissions if required
      if (req.adminPermissions) {
        const hasPermission = req.adminPermissions.some(permission => 
          req.user.permissions.includes(permission)
        );
        
        if (!hasPermission) {
          return next(
            new AppError('You do not have sufficient privileges for this action', 403)
          );
        }
      }
    }

    next();
  };
};

/**
 * Middleware to set required admin permissions for specific routes
 * @param {...String} requiredPermissions - Permissions required for the route
 * @returns {Function} Middleware function
 */
const requireAdminPermissions = (...requiredPermissions) => {
  return (req, res, next) => {
    req.adminPermissions = requiredPermissions;
    next();
  };
};

/**
 * Middleware to check resource ownership
 * @param {String} modelName - Name of the model to check ownership against
 * @param {String} [idParam='id'] - Route parameter name containing the resource ID
 * @returns {Function} Middleware function
 */
const checkOwnership = (modelName, idParam = 'id') => {
  return async (req, res, next) => {
    try {
      const Model = require(`../models/${modelName}`);
      const resource = await Model.findById(req.params[idParam]);

      if (!resource) {
        return next(new AppError('Resource not found', 404));
      }

      // Check if the resource belongs to the user
      let isOwner = false;
      
      if (modelName === 'User') {
        isOwner = resource._id.equals(req.user.id);
      } else if (resource.user) {
        isOwner = resource.user.equals(req.user.id);
      } else if (resource.employee) {
        isOwner = resource.employee.equals(req.user.id);
      } else if (resource.client) {
        isOwner = resource.client.equals(req.user.id);
      }

      if (!isOwner && req.user.role !== 'admin') {
        return next(
          new AppError('You are not authorized to access this resource', 403)
        );
      }

      // Attach resource to request for use in subsequent middleware
      req.resource = resource;
      next();
    } catch (err) {
      next(err);
    }
  };
};

module.exports = {
  restrictTo,
  requireAdminPermissions,
  checkOwnership
};