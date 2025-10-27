const authService = require('../services/authService');
const ResponseHandler = require('../utils/response');
const logger = require('../utils/logger');
const asyncHandler = require('../utils/asyncHandler');

class AuthController {
    /**
     * Register new user
     * POST /api/auth/register
     */
    register = asyncHandler(async (req, res) => {
        const { displayName, email, password } = req.body;

        logger.info('Registration request', { email });

        const result = await authService.register({
            displayName,
            email,
            password
        });

        ResponseHandler.success(
            res,
            result,
            'User registered successfully',
            201
        );
    });

    /**
     * Login user
     * POST /api/auth/login
     */
    login = asyncHandler(async (req, res) => {
        const { email, password } = req.body;

        logger.info('Login request', { email });

        const result = await authService.login(email, password);

        ResponseHandler.success(
            res,
            result,
            'Login successful'
        );
    });

    /**
     * Verify token
     * GET /api/auth/verify
     */
    verify = asyncHandler(async (req, res) => {
        const token = req.headers.authorization?.replace('Bearer ', '');

        if (!token) {
            return ResponseHandler.unauthorized(res, 'No token provided');
        }

        const decoded = await authService.verifyToken(token);

        ResponseHandler.success(res, decoded, 'Token is valid');
    });
}

module.exports = new AuthController();
