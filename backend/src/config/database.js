const { Sequelize } = require('sequelize');
require('dotenv').config();

// Support both DATABASE_URL (for production/RDS) and individual variables (for development)
let sequelize;

if (process.env.DATABASE_URL) {
    // Production: Use DATABASE_URL (e.g., from AWS RDS)
    sequelize = new Sequelize(process.env.DATABASE_URL, {
        dialect: 'postgres',
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        dialectOptions: {
            ssl: process.env.NODE_ENV === 'production' ? {
                require: true,
                rejectUnauthorized: false // For AWS RDS
            } : false
        },
        pool: {
            max: process.env.DB_POOL_MAX ? parseInt(process.env.DB_POOL_MAX) : 5, // Lower for free tier
            min: process.env.DB_POOL_MIN ? parseInt(process.env.DB_POOL_MIN) : 0,
            acquire: 30000,
            idle: 10000,
            evict: 1000 // Check for idle connections every second
        }
    });
} else {
    // Development: Use individual environment variables
    sequelize = new Sequelize(
        process.env.DB_NAME || 'fittedin_dev',
        process.env.DB_USER || 'postgres',
        process.env.DB_PASSWORD || 'postgres',
        {
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 5432,
            dialect: 'postgres',
            logging: process.env.NODE_ENV === 'development' ? console.log : false,
            pool: {
                max: 5,
                min: 0,
                acquire: 30000,
                idle: 10000,
                evict: 1000 // Check for idle connections every second
            }
        }
    );
}

// Test database connection
const testConnection = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Database connection established successfully');
    } catch (error) {
        console.error('❌ Unable to connect to database:', error.message);
        process.exit(1);
    }
};

module.exports = { sequelize, testConnection };
