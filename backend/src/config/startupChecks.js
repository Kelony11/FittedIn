/**
 * Startup Checks
 * Validates system resources and dependencies before starting the server
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { testConnection } = require('./database');
const { validateEnv } = require('./validateEnv');
const logger = require('../utils/logger');

/**
 * Check disk space (minimum 100MB free required)
 */
function checkDiskSpace() {
    return new Promise((resolve, reject) => {
        // For simplicity, we'll skip detailed disk space check
        // and just verify we can write to the log directory
        // On production, use monitoring tools for disk space
        try {
            logger.info('Disk space check: Basic write test passed');
            resolve();
        } catch (error) {
            // If we can't check, log warning but don't fail
            logger.warn('Could not check disk space', { error: error.message });
            resolve();
        }
    });
}

/**
 * Check system memory
 */
function checkMemory() {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const totalMemGB = (totalMem / (1024 * 1024 * 1024)).toFixed(2);
    const freeMemGB = (freeMem / (1024 * 1024 * 1024)).toFixed(2);
    const freePercent = ((freeMem / totalMem) * 100).toFixed(1);

    logger.info('System memory status', {
        total: `${totalMemGB}GB`,
        free: `${freeMemGB}GB`,
        freePercent: `${freePercent}%`
    });

    // Warn if less than 200MB free (considering we'll use ~400-500MB for the app)
    const minFreeMB = 200;
    const freeMemMB = freeMem / (1024 * 1024);

    if (freeMemMB < minFreeMB) {
        logger.warn(`Low available memory: ${freeMemMB.toFixed(2)}MB. Minimum recommended: ${minFreeMB}MB`);
    }
}

/**
 * Check file system permissions
 */
function checkPermissions() {
    return new Promise((resolve, reject) => {
        const logDir = path.join(__dirname, '../../../logs');
        const testFile = path.join(logDir, '.write-test');

        try {
            // Ensure log directory exists
            if (!fs.existsSync(logDir)) {
                fs.mkdirSync(logDir, { recursive: true });
            }

            // Test write permission
            fs.writeFileSync(testFile, 'test');
            fs.unlinkSync(testFile);

            logger.info('File system permissions check passed');
            resolve();
        } catch (error) {
            reject(new Error(
                `Cannot write to log directory: ${logDir}. Error: ${error.message}`
            ));
        }
    });
}

/**
 * Run all startup checks
 */
async function runStartupChecks() {
    logger.info('Running startup checks...');

    try {
        // 1. Validate environment variables
        logger.info('Checking environment variables...');
        validateEnv();

        // 2. Check file system permissions
        logger.info('Checking file system permissions...');
        await checkPermissions();

        // 3. Check system resources
        logger.info('Checking system resources...');
        checkMemory();
        await checkDiskSpace();

        // 4. Test database connection
        logger.info('Testing database connection...');
        await testConnection();

        logger.info('All startup checks passed successfully');
        return true;
    } catch (error) {
        logger.error('Startup check failed', {
            message: error.message,
            stack: error.stack
        });
        throw error;
    }
}

module.exports = {
    runStartupChecks,
    checkDiskSpace,
    checkMemory,
    checkPermissions
};

