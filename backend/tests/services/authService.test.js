const authService = require('../../src/services/authService');
const User = require('../../src/models/User');
const { sequelize } = require('../../src/config/database');

describe('AuthService', () => {
    beforeAll(async () => {
        // Sync database for tests
        await sequelize.sync({ force: true });
    });

    afterEach(async () => {
        // Clean up users after each test
        await User.destroy({ where: {}, truncate: true });
    });

    describe('register', () => {
        it('should register a new user successfully', async () => {
            const userData = {
                displayName: 'Test User',
                email: 'test@example.com',
                password: 'Password123'
            };

            const result = await authService.register(userData);

            expect(result).toHaveProperty('user');
            expect(result).toHaveProperty('token');
            expect(result.user.email).toBe(userData.email);
            expect(result.user.display_name).toBe(userData.displayName);
            expect(result.user.password_hash).toBeUndefined(); // Should be removed in toJSON
        });

        it('should throw error if email already exists', async () => {
            const userData = {
                displayName: 'Test User',
                email: 'test@example.com',
                password: 'Password123'
            };

            await authService.register(userData);

            await expect(authService.register(userData)).rejects.toThrow();
        });

        it('should hash password correctly', async () => {
            const userData = {
                displayName: 'Test User',
                email: 'test@example.com',
                password: 'Password123'
            };

            const result = await authService.register(userData);
            const user = await User.findByPk(result.user.id, { raw: true });

            expect(user.password_hash).not.toBe(userData.password);
            expect(user.password_hash.length).toBeGreaterThan(20); // bcrypt hash length
        });
    });

    describe('login', () => {
        beforeEach(async () => {
            // Create a test user
            await authService.register({
                displayName: 'Test User',
                email: 'test@example.com',
                password: 'Password123'
            });
        });

        it('should login with correct credentials', async () => {
            const result = await authService.login('test@example.com', 'Password123');

            expect(result).toHaveProperty('user');
            expect(result).toHaveProperty('token');
            expect(result.user.email).toBe('test@example.com');
        });

        it('should throw error with incorrect email', async () => {
            await expect(
                authService.login('wrong@example.com', 'Password123')
            ).rejects.toThrow();
        });

        it('should throw error with incorrect password', async () => {
            await expect(
                authService.login('test@example.com', 'WrongPassword')
            ).rejects.toThrow();
        });
    });
});

