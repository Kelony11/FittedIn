const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Notification = sequelize.define('Notification', {
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
    type: {
        type: DataTypes.ENUM(
            'connection_request',
            'connection_accepted',
            'connection_rejected',
            'goal_comment',
            'post_like',
            'post_comment',
            'goal_milestone',
            'goal_completed',
            'activity_shared'
        ),
        allowNull: false
    },
    title: {
        type: DataTypes.STRING(200),
        allowNull: false
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    related_entity_type: {
        type: DataTypes.ENUM('connection', 'post', 'goal', 'activity', 'comment'),
        allowNull: true
    },
    related_entity_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    from_user_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        },
        onDelete: 'SET NULL'
    },
    is_read: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    read_at: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'notifications',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        {
            fields: ['user_id']
        },
        {
            fields: ['is_read']
        },
        {
            fields: ['created_at']
        },
        {
            fields: ['type']
        },
        {
            fields: ['user_id', 'is_read']
        }
    ]
});

// Instance methods
Notification.prototype.toJSON = function () {
    const values = Object.assign({}, this.get());
    return values;
};

Notification.prototype.markAsRead = async function () {
    this.is_read = true;
    this.read_at = new Date();
    await this.save();
};

// Define associations
Notification.associate = function (models) {
    // Notification belongs to User (recipient)
    Notification.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
    });

    // Notification can be from another User
    Notification.belongsTo(models.User, {
        foreignKey: 'from_user_id',
        as: 'fromUser'
    });
};

module.exports = Notification;

