/**
 * CloudWatch Logger Utility
 * 
 * This module provides CloudWatch Logs integration for production environments.
 * In development, it falls back to console logging.
 */

const logger = require('./logger');

class CloudWatchLogger {
    constructor() {
        this.cloudwatchLogs = null;
        this.logGroupName = process.env.LOG_GROUP_NAME || 'fittedin-backend';
        this.logStreamName = process.env.LOG_STREAM_NAME || 'production';
        this.initialized = false;
        this.sequenceToken = null; // For CloudWatch log ordering

        // Initialize CloudWatch if AWS credentials are available
        if (process.env.NODE_ENV === 'production' &&
            process.env.AWS_ACCESS_KEY_ID &&
            process.env.AWS_SECRET_ACCESS_KEY) {
            this.initializeCloudWatch();
        }
    }

    /**
     * Initialize AWS CloudWatch Logs client
     */
    initializeCloudWatch() {
        try {
            const AWS = require('aws-sdk');

            AWS.config.update({
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
                region: process.env.AWS_REGION || 'us-east-1'
            });

            this.cloudwatchLogs = new AWS.CloudWatchLogs();
            this.initialized = true;

            // Create log group and stream if they don't exist
            this.ensureLogGroupAndStream();
        } catch (error) {
            logger.error('Failed to initialize CloudWatch:', error);
            this.initialized = false;
        }
    }

    /**
     * Ensure log group and stream exist
     */
    async ensureLogGroupAndStream() {
        if (!this.cloudwatchLogs) return;

        try {
            // Create log group if it doesn't exist
            try {
                await this.cloudwatchLogs.createLogGroup({
                    logGroupName: this.logGroupName
                }).promise();
            } catch (error) {
                if (error.code !== 'ResourceAlreadyExistsException') {
                    throw error;
                }
            }

            // Create log stream if it doesn't exist
            try {
                await this.cloudwatchLogs.createLogStream({
                    logGroupName: this.logGroupName,
                    logStreamName: this.logStreamName
                }).promise();
            } catch (error) {
                if (error.code !== 'ResourceAlreadyExistsException') {
                    throw error;
                }
            }
        } catch (error) {
            logger.error('Failed to create CloudWatch log group/stream:', error);
        }
    }

    /**
     * Send log to CloudWatch
     */
    async sendToCloudWatch(level, message, metadata = {}) {
        if (!this.initialized || !this.cloudwatchLogs) {
            return;
        }

        try {
            const logEvent = {
                message: JSON.stringify({
                    timestamp: new Date().toISOString(),
                    level,
                    message,
                    ...metadata
                }),
                timestamp: Date.now()
            };

            const params = {
                logGroupName: this.logGroupName,
                logStreamName: this.logStreamName,
                logEvents: [logEvent]
            };

            // Add sequence token if available (required for subsequent log events)
            if (this.sequenceToken) {
                params.sequenceToken = this.sequenceToken;
            }

            const response = await this.cloudwatchLogs.putLogEvents(params).promise();

            // Update sequence token for next log event
            if (response.nextSequenceToken) {
                this.sequenceToken = response.nextSequenceToken;
            }
        } catch (error) {
            // Handle CloudWatch specific errors
            if (error.code === 'InvalidSequenceTokenException') {
                // Get the expected sequence token from error message
                const expectedToken = error.message.match(/expectedSequenceToken: (\S+)/)?.[1];
                if (expectedToken) {
                    this.sequenceToken = expectedToken;
                    // Retry once with correct token
                    try {
                        params.sequenceToken = this.sequenceToken;
                        const retryResponse = await this.cloudwatchLogs.putLogEvents(params).promise();
                        if (retryResponse.nextSequenceToken) {
                            this.sequenceToken = retryResponse.nextSequenceToken;
                        }
                        return; // Success on retry
                    } catch (retryError) {
                        // Fall through to fallback logging
                    }
                }
            } else if (error.code === 'DataAlreadyAcceptedException') {
                // Log was already accepted, update sequence token
                const expectedToken = error.message.match(/expectedSequenceToken: (\S+)/)?.[1];
                if (expectedToken) {
                    this.sequenceToken = expectedToken;
                }
                return; // Don't log error for this case
            }

            // Fallback to console if CloudWatch fails
            console.error('CloudWatch logging failed:', error);
            logger.error(message, metadata);
        }
    }

    /**
     * Log info message
     */
    info(message, metadata = {}) {
        logger.info(message, metadata);
        if (this.initialized) {
            this.sendToCloudWatch('INFO', message, metadata);
        }
    }

    /**
     * Log error message
     */
    error(message, metadata = {}) {
        logger.error(message, metadata);
        if (this.initialized) {
            this.sendToCloudWatch('ERROR', message, metadata);
        }
    }

    /**
     * Log warning message
     */
    warn(message, metadata = {}) {
        logger.warn(message, metadata);
        if (this.initialized) {
            this.sendToCloudWatch('WARN', message, metadata);
        }
    }

    /**
     * Log debug message
     */
    debug(message, metadata = {}) {
        if (process.env.NODE_ENV === 'development') {
            logger.debug(message, metadata);
        }
        // Don't send debug logs to CloudWatch in production
    }
}

// Export singleton instance
module.exports = new CloudWatchLogger();

