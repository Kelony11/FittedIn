'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('activities', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      activity_type: {
        type: Sequelize.ENUM(
          'goal_created',
          'goal_updated',
          'goal_progress',
          'goal_completed',
          'goal_deleted',
          'profile_updated',
          'connection_request',
          'connection_accepted'
        ),
        allowNull: false
      },
      activity_data: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Stores additional data about the activity'
      },
      related_entity_type: {
        type: Sequelize.ENUM('goal', 'profile', 'connection', 'user'),
        allowNull: true
      },
      related_entity_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'ID of related entity (goal_id, profile_id, etc.)'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add indexes for better performance
    await queryInterface.addIndex('activities', ['user_id']);
    await queryInterface.addIndex('activities', ['activity_type']);
    await queryInterface.addIndex('activities', ['created_at']);
    await queryInterface.addIndex('activities', ['related_entity_type', 'related_entity_id']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('activities');
  }
};
