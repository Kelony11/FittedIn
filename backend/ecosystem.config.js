module.exports = {
    apps: [
        {
            name: 'fittedin-backend',
            script: './server.js',
            // For free tier (single CPU core), use fork mode instead of cluster
            instances: process.env.PM2_INSTANCES ? parseInt(process.env.PM2_INSTANCES) : 1,
            exec_mode: (process.env.PM2_INSTANCES && parseInt(process.env.PM2_INSTANCES) > 1) ? 'cluster' : 'fork',
            env: {
                NODE_ENV: 'development',
                PORT: 3000
            },
            env_production: {
                NODE_ENV: 'production',
                PORT: 3000
            },
            // Logging with rotation
            error_file: './logs/pm2-error.log',
            out_file: './logs/pm2-out.log',
            log_file: './logs/pm2-combined.log',
            time: true,
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
            merge_logs: true,
            // Log rotation (rotate when log exceeds 10MB, keep 10 files)
            max_size: '10M',
            retain: 10,
            compress: true,

            // Auto restart
            autorestart: true,
            watch: false,
            // Lower memory limit for free tier (400MB, adjust if you have more RAM)
            max_memory_restart: process.env.PM2_MAX_MEMORY || '400M',

            // Advanced features
            min_uptime: '10s',
            max_restarts: 10,
            restart_delay: 4000,

            // Graceful shutdown
            kill_timeout: 5000,
            wait_ready: true,
            listen_timeout: 10000,

            // Health check
            health_check_grace_period: 3000
        },
        {
            name: 'fittedin-content-generator',
            script: './scripts/generateDynamicContent.js',
            instances: 1,
            exec_mode: 'fork',
            env: {
                NODE_ENV: 'production',
                ENABLE_DYNAMIC_CONTENT: 'true',
                MIN_CONTENT_PER_RUN: '5',
                MAX_CONTENT_PER_RUN: '15'
            },
            // Run every hour
            cron_restart: '0 * * * *',
            autorestart: false, // Don't restart after cron runs, let cron handle it
            watch: false,
            error_file: './logs/content-generator-error.log',
            out_file: './logs/content-generator-out.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
        }
    ]
};

