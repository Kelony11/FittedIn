/**
 * Environment Variable Validation
 * Validates required environment variables on application startup
 */

const logger = require('../utils/logger');

const REQUIRED_VARS = {
    production: [
        'NODE_ENV',
        'PORT',
        'JWT_SECRET',
        'DATABASE_URL'
    ],
    development: [
        'NODE_ENV'
    ]
};

const OPTIONAL_VARS = {
    production: [
        'CORS_ORIGINS',
        'JWT_EXPIRES_IN',
        'RATE_LIMIT_MAX',
        'LOG_GROUP_NAME',
        'AWS_ACCESS_KEY_ID',
        'AWS_SECRET_ACCESS_KEY',
        'AWS_REGION'
    ]
};

/**
 * Validate environment variables
 */
function validateEnv() {
    const env = process.env.NODE_ENV || 'development';
    const required = REQUIRED_VARS[env] || REQUIRED_VARS.development;
    const missing = [];
    const warnings = [];

    // Check required variables
    for (const varName of required) {
        if (!process.env[varName]) {
            missing.push(varName);
        }
    }

    // Check production-specific requirements
    if (env === 'production') {
        // Validate JWT_SECRET strength
        if (process.env.JWT_SECRET) {
            if (process.env.JWT_SECRET.length < 32) {
                warnings.push('JWT_SECRET should be at least 32 characters long for production');
            }
            if (process.env.JWT_SECRET.includes('development') ||
                process.env.JWT_SECRET.includes('test') ||
                process.env.JWT_SECRET === 'your-super-secret-jwt-key-change-this-in-production') {
                warnings.push('JWT_SECRET appears to be using a default/insecure value');
            }
        }

        // Validate CORS_ORIGINS
        if (!process.env.CORS_ORIGINS) {
            warnings.push('CORS_ORIGINS not set. Default origins will be used.');
        }

        // Validate DATABASE_URL format
        if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith('postgresql://')) {
            warnings.push('DATABASE_URL should start with postgresql://');
        }
    }

    // Report missing variables
    if (missing.length > 0) {
        logger.error('Missing required environment variables:', { missing });
        throw new Error(
            `Missing required environment variables: ${missing.join(', ')}\n` +
            `Please check your .env file or environment configuration.`
        );
    }

    // Report warnings
    if (warnings.length > 0) {
        warnings.forEach(warning => logger.warn(warning));
    }

    logger.info('Environment variables validated successfully', {
        environment: env,
        requiredVars: required.length,
        optionalVars: OPTIONAL_VARS[env]?.length || 0
    });
}

/**
 * Get validated environment variable with fallback
 */
function getEnv(key, defaultValue = null) {
    const value = process.env[key];
    if (value === undefined || value === null) {
        if (defaultValue === null) {
            throw new Error(`Environment variable ${key} is required but not set`);
        }
        return defaultValue;
    }
    return value;
}

module.exports = {
    validateEnv,
    getEnv,
    REQUIRED_VARS,
    OPTIONAL_VARS
};

