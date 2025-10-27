const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Profile = sequelize.define('Profile', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        references: {
            model: 'users',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    pronouns: {
        type: DataTypes.STRING(50),
        allowNull: true,
        validate: {
            len: [0, 50]
        }
    },
    bio: {
        type: DataTypes.TEXT,
        allowNull: true,
        validate: {
            len: [0, 1000]
        }
    },
    location: {
        type: DataTypes.STRING(100),
        allowNull: true,
        validate: {
            len: [0, 100]
        }
    },
    date_of_birth: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    height: {
        type: DataTypes.INTEGER, // in centimeters
        allowNull: true,
        validate: {
            min: 50,
            max: 300
        }
    },
    weight: {
        type: DataTypes.DECIMAL(5, 2), // in kg, supports up to 999.99
        allowNull: true,
        validate: {
            min: 10,
            max: 500
        }
    },
    fitness_level: {
        type: DataTypes.ENUM('beginner', 'intermediate', 'advanced'),
        allowNull: true
    },
    primary_goals: {
        type: DataTypes.JSON, // Array of goal categories
        allowNull: true,
        defaultValue: []
    },
    skills: {
        type: DataTypes.JSON, // Array of wellness skills
        allowNull: true,
        defaultValue: []
    },
    privacy_settings: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {
            profile_visibility: 'public', // public, connections, private
            show_activity: true,
            show_goals: true,
            show_connections: true
        }
    }
}, {
    tableName: 'profiles',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

// Instance methods
Profile.prototype.toJSON = function () {
    const values = Object.assign({}, this.get());
    return values;
};

// Define associations
Profile.associate = function (models) {
    // Profile belongs to User
    Profile.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
    });
};

module.exports = Profile;
