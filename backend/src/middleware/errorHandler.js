const { AppError } = require('../utils/errors');
const logger = require('../utils/logger');
const ResponseHandler = require('../utils/response');

/**
 * Global Error Handler Middleware
 */
const errorHandler = (err, req, res, next) => {
    // Log error
    logger.error('Error occurred', {
        message: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method
    });

    // Handle known operational errors
    if (err instanceof AppError) {
        return ResponseHandler.error(
            res,
            err.message,
            err.statusCode,
            err.errors
        );
    }

    // Handle validation errors
    if (err.name === 'SequelizeValidationError') {
        const errors = err.errors.map(e => ({
            field: e.path,
            message: e.message
        }));

        return ResponseHandler.validationError(res, errors);
    }

    // Handle database errors
    if (err.name === 'SequelizeUniqueConstraintError') {
        return ResponseHandler.error(
            res,
            'A record with this value already exists',
            409
        );
    }

    // Handle JWT errors
    if (err.name === 'JsonWebTokenError') {
        return ResponseHandler.unauthorized(res, 'Invalid token');
    }

    if (err.name === 'TokenExpiredError') {
        return ResponseHandler.unauthorized(res, 'Token expired');
    }

    // Handle unknown errors
    const statusCode = err.statusCode || 500;
    const message = process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message;

    return ResponseHandler.error(res, message, statusCode);
};

module.exports = errorHandler;
