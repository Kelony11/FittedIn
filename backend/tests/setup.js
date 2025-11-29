// Test setup file
const { sequelize } = require('../src/config/database');

// Close database connection after all tests
afterAll(async () => {
    await sequelize.close();
});

