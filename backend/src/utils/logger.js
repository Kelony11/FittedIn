/**
 * Logging Utility
 * Centralized logging system for the application
 * Supports both structured JSON logging (production) and formatted logging (development)
 */
const fs = require('fs');
const path = require('path');

class Logger {
    constructor() {
        this.logDir = path.join(__dirname, '../../logs');
        this.ensureLogDirectory();
        this.isProduction = process.env.NODE_ENV === 'production';
        this.useJsonLogs = process.env.LOG_FORMAT === 'json' || this.isProduction;
    }

    ensureLogDirectory() {
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    getTimestamp() {
        return new Date().toISOString();
    }

    /**
     * Format log entry as JSON (for production/CloudWatch)
     */
    formatJsonLog(level, message, data = null) {
        const logEntry = {
            timestamp: this.getTimestamp(),
            level,
            message,
            environment: process.env.NODE_ENV || 'development'
        };

        if (data) {
            // Merge data into log entry
            if (typeof data === 'object') {
                Object.assign(logEntry, data);
            } else {
                logEntry.data = data;
            }
        }

        return JSON.stringify(logEntry);
    }

    /**
     * Format log entry as human-readable string (for development)
     */
    formatTextLog(level, message, data = null) {
        let formattedMessage = `[${this.getTimestamp()}] [${level}] ${message}`;

        if (data) {
            formattedMessage += `\n${JSON.stringify(data, null, 2)}`;
        }

        return formattedMessage;
    }

    log(level, message, data = null) {
        const logMessage = this.useJsonLogs
            ? this.formatJsonLog(level, message, data)
            : this.formatTextLog(level, message, data);

        // Output to console (PM2 will handle file writing)
        if (level === 'ERROR') {
            console.error(logMessage);
        } else if (level === 'WARN') {
            console.warn(logMessage);
        } else {
            console.log(logMessage);
        }
    }

    info(message, data = null) {
        this.log('INFO', message, data);
    }

    error(message, error = null) {
        // Handle error objects specially
        const errorData = error instanceof Error
            ? {
                message: error.message,
                stack: this.isProduction ? undefined : error.stack,
                name: error.name
            }
            : error;

        this.log('ERROR', message, errorData);
    }

    warn(message, data = null) {
        this.log('WARN', message, data);
    }

    debug(message, data = null) {
        if (process.env.NODE_ENV === 'development' || process.env.LOG_LEVEL === 'debug') {
            this.log('DEBUG', message, data);
        }
    }
}

module.exports = new Logger();
