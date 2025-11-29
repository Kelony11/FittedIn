const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Connection = sequelize.define('Connection', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    requester_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    receiver_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    status: {
        type: DataTypes.ENUM('pending', 'accepted', 'rejected', 'blocked'),
        allowNull: false,
        defaultValue: 'pending'
    }
}, {
    tableName: 'connections',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        {
            unique: true,
            fields: ['requester_id', 'receiver_id'],
            name: 'unique_connection_pair'
        },
        {
            fields: ['requester_id']
        },
        {
            fields: ['receiver_id']
        },
        {
            fields: ['status']
        }
    ]
});

// Instance methods
Connection.prototype.toJSON = function () {
    const values = Object.assign({}, this.get());
    return values;
};

// Define associations
Connection.associate = function (models) {
    // Connection belongs to User (as requester)
    Connection.belongsTo(models.User, {
        foreignKey: 'requester_id',
        as: 'requester'
    });

    // Connection belongs to User (as receiver)
    Connection.belongsTo(models.User, {
        foreignKey: 'receiver_id',
        as: 'receiver'
    });
};

module.exports = Connection;

