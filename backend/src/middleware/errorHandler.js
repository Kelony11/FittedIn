const { randomBytes } = require('crypto');
const { AppError } = require('../utils/errors');
const logger = require('../utils/logger');
const ResponseHandler = require('../utils/response');

/**
 * Generate unique error ID for tracking
 */
function generateErrorId() {
    return randomBytes(8).toString('hex');
}

/**
 * Global Error Handler Middleware
 */
const errorHandler = (err, req, res, next) => {
    const isProduction = process.env.NODE_ENV === 'production';
    const errorId = generateErrorId();

    // Prepare error log data
    const errorLogData = {
        errorId,
        message: err.message,
        url: req.url,
        method: req.method,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent')
    };

    // Only include stack trace in non-production environments
    if (!isProduction && err.stack) {
        errorLogData.stack = err.stack;
    }

    // Include additional error details for logging
    if (err.statusCode) {
        errorLogData.statusCode = err.statusCode;
    }
    if (err.name) {
        errorLogData.errorName = err.name;
    }

    // Log error
    logger.error('Error occurred', errorLogData);

    // Handle known operational errors
    if (err instanceof AppError) {
        const response = {
            success: false,
            message: err.message,
            ...(isProduction && { errorId })
        };

        if (err.errors) {
            response.errors = err.errors;
        }

        return res.status(err.statusCode).json(response);
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

    // Handle database connection errors
    if (err.name === 'SequelizeConnectionError' || err.name === 'SequelizeConnectionRefusedError') {
        logger.error('Database connection error', { errorId, error: err.message });
        return ResponseHandler.error(
            res,
            isProduction ? 'Database connection failed. Please try again later.' : err.message,
            503,
            isProduction ? { errorId } : null
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
    const message = isProduction
        ? 'Internal server error'
        : err.message;

    const response = {
        success: false,
        message
    };

    if (isProduction) {
        response.errorId = errorId;
    }

    return res.status(statusCode).json(response);
};

module.exports = errorHandler;
