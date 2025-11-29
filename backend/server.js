const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Initialize database connection
const { testConnection } = require('./src/config/database');

// Initialize models and associations
const User = require('./src/models/User');
const Profile = require('./src/models/Profile');
const Goal = require('./src/models/Goal');
const Connection = require('./src/models/Connection');
const Activity = require('./src/models/Activity');
const Post = require('./src/models/Post');
const PostLike = require('./src/models/PostLike');
const PostComment = require('./src/models/PostComment');
const Notification = require('./src/models/Notification');

// Set up model associations
const models = { User, Profile, Goal, Connection, Activity, Post, PostLike, PostComment, Notification };
User.associate(models);
Profile.associate(models);
Goal.associate(models);
Connection.associate(models);
Activity.associate(models);
Post.associate(models);
PostLike.associate(models);
PostComment.associate(models);
Notification.associate(models);

const authRoutes = require('./src/routes/auth');
const userRoutes = require('./src/routes/users');
const profileRoutes = require('./src/routes/profiles');
const goalRoutes = require('./src/routes/goals');
const connectionRoutes = require('./src/routes/connections');
const activityRoutes = require('./src/routes/activities');
const postRoutes = require('./src/routes/posts');
const notificationRoutes = require('./src/routes/notifications');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware with CSP configured to allow external images
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
            imgSrc: ["'self'", "data:", "https:", "http:"], // Allow images from any source
            connectSrc: ["'self'", "https:", "http:"],
            frameAncestors: ["'self'"]
        }
    }
}));

// Rate limiting configuration
const isProduction = process.env.NODE_ENV === 'production';
const rateLimitMax = parseInt(process.env.RATE_LIMIT_MAX) || (isProduction ? 100 : 500);

// General API rate limiter (stricter for production)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: rateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            message: 'Too many requests from this IP, please try again later.'
        });
    }
});

// Stricter rate limiter for authentication endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isProduction ? 5 : 20, // Only 5 login/register attempts per 15 minutes in production
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Don't count successful requests
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            message: 'Too many authentication attempts from this IP, please try again later.'
        });
    }
});

// Apply rate limiters
app.use('/api/', limiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// CORS configuration
const corsOptions = {
    credentials: true
};

if (process.env.NODE_ENV === 'production') {
    // Support multiple origins from environment variable
    if (process.env.CORS_ORIGINS) {
        corsOptions.origin = process.env.CORS_ORIGINS.split(',').map(origin => origin.trim());
    } else {
        // Fallback to default production origins
        corsOptions.origin = ['https://yourdomain.com'];
    }
} else {
    // Development origins
    corsOptions.origin = ['http://localhost:8080', 'http://127.0.0.1:8080', 'http://localhost:3000'];
}

app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files from frontend
app.use(express.static('../frontend/public'));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/connections', connectionRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check endpoint with database status
app.get('/api/health', async (req, res) => {
    const health = {
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        uptime: process.uptime()
    };

    // Check database connection
    try {
        const { sequelize } = require('./src/config/database');
        await sequelize.authenticate();
        health.database = 'connected';
    } catch (error) {
        health.database = 'disconnected';
        health.status = 'DEGRADED';
        return res.status(503).json(health);
    }

    // Include memory usage (basic metrics)
    const memUsage = process.memoryUsage();
    health.memory = {
        used: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
        total: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB'
    };

    res.json(health);
});

// 404 handler for API routes (must be before catch-all)
app.use('/api/*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'API route not found'
    });
});

// Import error handler
const errorHandler = require('./src/middleware/errorHandler');

// Global error handler (must be last middleware, before catch-all)
app.use(errorHandler);

// Catch-all handler for SPA routing (must be last)
app.get('*', (req, res) => {
    res.sendFile('index.html', { root: '../frontend/public' });
});

// Import startup checks and logger
const { runStartupChecks } = require('./src/config/startupChecks');
const logger = require('./src/utils/logger');

// Start server after validation and database connection
const startServer = async () => {
    try {
        // Run startup checks
        await runStartupChecks();

        app.listen(PORT, () => {
            logger.info('Server started successfully', {
                port: PORT,
                environment: process.env.NODE_ENV,
                nodeVersion: process.version
            });
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📱 Frontend: http://localhost:${PORT}`);
            console.log(`🔗 API: http://localhost:${PORT}/api`);
            console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
        });
    } catch (error) {
        logger.error('Failed to start server', {
            message: error.message,
            stack: error.stack
        });
        console.error('❌ Failed to start server:', error.message);
        process.exit(1);
    }
};

startServer();

module.exports = app;
