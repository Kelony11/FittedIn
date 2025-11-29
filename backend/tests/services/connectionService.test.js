const connectionService = require('../../src/services/connectionService');
const User = require('../../src/models/User');
const Connection = require('../../src/models/Connection');
const { sequelize } = require('../../src/config/database');

describe('ConnectionService', () => {
    let user1, user2, user3;

    beforeAll(async () => {
        await sequelize.sync({ force: true });
    });

    beforeEach(async () => {
        // Create test users
        user1 = await User.create({
            display_name: 'User 1',
            email: 'user1@test.com',
            password: 'hashed1'
        });

        user2 = await User.create({
            display_name: 'User 2',
            email: 'user2@test.com',
            password: 'hashed2'
        });

        user3 = await User.create({
            display_name: 'User 3',
            email: 'user3@test.com',
            password: 'hashed3'
        });
    });

    afterEach(async () => {
        await Connection.destroy({ where: {}, truncate: true });
        await User.destroy({ where: {}, truncate: true });
    });

    describe('sendConnectionRequest', () => {
        it('should send a connection request successfully', async () => {
            const connection = await connectionService.sendConnectionRequest(
                user1.id,
                user2.id
            );

            expect(connection).toHaveProperty('id');
            expect(connection.requester_id).toBe(user1.id);
            expect(connection.receiver_id).toBe(user2.id);
            expect(connection.status).toBe('pending');
        });

        it('should throw error when trying to connect to self', async () => {
            await expect(
                connectionService.sendConnectionRequest(user1.id, user1.id)
            ).rejects.toThrow('Cannot send connection request to yourself');
        });

        it('should throw error if connection already exists', async () => {
            await connectionService.sendConnectionRequest(user1.id, user2.id);

            await expect(
                connectionService.sendConnectionRequest(user1.id, user2.id)
            ).rejects.toThrow('Connection request already pending');
        });
    });

    describe('acceptConnectionRequest', () => {
        it('should accept a connection request', async () => {
            const connection = await connectionService.sendConnectionRequest(
                user1.id,
                user2.id
            );

            const accepted = await connectionService.acceptConnectionRequest(
                user2.id,
                connection.id
            );

            expect(accepted.status).toBe('accepted');
        });

        it('should throw error if connection not found', async () => {
            await expect(
                connectionService.acceptConnectionRequest(user2.id, 99999)
            ).rejects.toThrow('Connection request not found');
        });
    });

    describe('getConnections', () => {
        it('should get all accepted connections', async () => {
            await connectionService.sendConnectionRequest(user1.id, user2.id);
            const connection = await Connection.findOne({
                where: { requester_id: user1.id, receiver_id: user2.id }
            });
            await connectionService.acceptConnectionRequest(user2.id, connection.id);

            const connections = await connectionService.getConnections(user1.id);

            expect(connections).toHaveLength(1);
            expect(connections[0].status).toBe('accepted');
        });
    });
});

