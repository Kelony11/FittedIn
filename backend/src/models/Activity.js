const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Activity = sequelize.define('Activity', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    activity_type: {
        type: DataTypes.ENUM(
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
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Stores additional data about the activity (e.g., goal title, progress value)'
    },
    related_entity_type: {
        type: DataTypes.ENUM('goal', 'profile', 'connection', 'user'),
        allowNull: true
    },
    related_entity_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'ID of related entity (goal_id, profile_id, etc.)'
    }
}, {
    tableName: 'activities',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        {
            fields: ['user_id']
        },
        {
            fields: ['activity_type']
        },
        {
            fields: ['created_at']
        },
        {
            fields: ['related_entity_type', 'related_entity_id']
        }
    ]
});

// Instance methods
Activity.prototype.toJSON = function () {
    const values = Object.assign({}, this.get());
    return values;
};

// Define associations
Activity.associate = function (models) {
    // Activity belongs to User
    Activity.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
    });

    // Activity can belong to a Goal (optional)
    Activity.belongsTo(models.Goal, {
        foreignKey: 'related_entity_id',
        constraints: false,
        as: 'goal'
    });
};

module.exports = Activity;

