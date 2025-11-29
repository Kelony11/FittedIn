const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    password_hash: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    display_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            len: [2, 100]
        }
    },
    avatar_url: {
        type: DataTypes.STRING(500),
        allowNull: true,
        validate: {
            isUrl(value) {
                // 允许null或空字符串
                if (value !== null && value !== '' && !/^https?:\/\/.+/.test(value)) {
                    throw new Error('Avatar URL must be a valid URL');
                }
            }
        }
    }
}, {
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    hooks: {
        beforeCreate: async (user) => {
            if (user.password_hash) {
                user.password_hash = await bcrypt.hash(user.password_hash, 10);
            }
        },
        beforeUpdate: async (user) => {
            if (user.changed('password_hash')) {
                user.password_hash = await bcrypt.hash(user.password_hash, 10);
            }
        }
    }
});

// Instance methods
User.prototype.validatePassword = async function (password) {
    return await bcrypt.compare(password, this.password_hash);
};

User.prototype.toJSON = function () {
    const values = Object.assign({}, this.get());
    delete values.password_hash;
    return values;
};

// Define associations
User.associate = function (models) {
    // User has one Profile
    User.hasOne(models.Profile, {
        foreignKey: 'user_id',
        as: 'profile'
    });

    // User has many Goals
    User.hasMany(models.Goal, {
        foreignKey: 'user_id',
        as: 'goals'
    });

    // User has many Connections as requester
    User.hasMany(models.Connection, {
        foreignKey: 'requester_id',
        as: 'sentConnections'
    });

    // User has many Connections as receiver
    User.hasMany(models.Connection, {
        foreignKey: 'receiver_id',
        as: 'receivedConnections'
    });

    // User has many Activities
    User.hasMany(models.Activity, {
        foreignKey: 'user_id',
        as: 'activities'
    });

    // User has many Posts
    User.hasMany(models.Post, {
        foreignKey: 'user_id',
        as: 'posts'
    });

    // User has many PostLikes
    User.hasMany(models.PostLike, {
        foreignKey: 'user_id',
        as: 'postLikes'
    });

    // User has many PostComments
    User.hasMany(models.PostComment, {
        foreignKey: 'user_id',
        as: 'postComments'
    });

    // User has many Notifications (as recipient)
    User.hasMany(models.Notification, {
        foreignKey: 'user_id',
        as: 'notifications'
    });

    // User has many Notifications (as sender)
    User.hasMany(models.Notification, {
        foreignKey: 'from_user_id',
        as: 'sentNotifications'
    });
};

module.exports = User;
