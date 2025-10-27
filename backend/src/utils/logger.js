/**
 * Logging Utility
 * Centralized logging system for the application
 */
const fs = require('fs');
const path = require('path');

class Logger {
    constructor() {
        this.logDir = path.join(__dirname, '../../logs');
        this.ensureLogDirectory();
    }

    ensureLogDirectory() {
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    getTimestamp() {
        return new Date().toISOString();
    }

    formatMessage(level, message, data = null) {
        let formattedMessage = `[${this.getTimestamp()}] [${level}] ${message}`;

        if (data) {
            formattedMessage += `\n${JSON.stringify(data, null, 2)}`;
        }

        return formattedMessage;
    }

    info(message, data = null) {
        const logMessage = this.formatMessage('INFO', message, data);
        console.log(logMessage);
    }

    error(message, error = null) {
        const logMessage = this.formatMessage('ERROR', message, error);
        console.error(logMessage);
    }

    warn(message, data = null) {
        const logMessage = this.formatMessage('WARN', message, data);
        console.warn(logMessage);
    }

    debug(message, data = null) {
        if (process.env.NODE_ENV === 'development') {
            const logMessage = this.formatMessage('DEBUG', message, data);
            console.log(logMessage);
        }
    }
}

module.exports = new Logger();
