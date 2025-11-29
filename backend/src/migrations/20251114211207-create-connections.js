'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('connections', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            requester_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'id'
                },
                onDelete: 'CASCADE'
            },
            receiver_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'id'
                },
                onDelete: 'CASCADE'
            },
            status: {
                type: Sequelize.ENUM('pending', 'accepted', 'rejected', 'blocked'),
                allowNull: false,
                defaultValue: 'pending'
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE
            },
            updated_at: {
                allowNull: false,
                type: Sequelize.DATE
            }
        });

        // Add unique constraint to prevent duplicate connections
        await queryInterface.addIndex('connections', ['requester_id', 'receiver_id'], {
            unique: true,
            name: 'unique_connection_pair'
        });

        // Add indexes for better query performance
        await queryInterface.addIndex('connections', ['requester_id']);
        await queryInterface.addIndex('connections', ['receiver_id']);
        await queryInterface.addIndex('connections', ['status']);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('connections');
    }
};

