const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Goal = sequelize.define('Goal', {
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
    title: {
        type: DataTypes.STRING(200),
        allowNull: false,
        validate: {
            len: [1, 200]
        }
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    category: {
        type: DataTypes.ENUM(
            'weight_loss', 'weight_gain', 'muscle_gain', 'cardio',
            'flexibility', 'nutrition', 'mental_health', 'sleep',
            'hydration', 'other'
        ),
        allowNull: false,
        defaultValue: 'other'
    },
    target_value: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            min: 0
        }
    },
    current_value: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: 0
        }
    },
    unit: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'units'
    },
    start_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    target_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        validate: {
            isAfterStartDate(value) {
                if (value && this.start_date && new Date(value) < new Date(this.start_date)) {
                    throw new Error('Target date must be after start date');
                }
            }
        }
    },
    status: {
        type: DataTypes.ENUM('active', 'completed', 'paused', 'cancelled'),
        allowNull: false,
        defaultValue: 'active'
    },
    priority: {
        type: DataTypes.ENUM('low', 'medium', 'high'),
        allowNull: false,
        defaultValue: 'medium'
    },
    is_public: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    },
    milestones: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: []
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'goals',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        {
            fields: ['user_id']
        },
        {
            fields: ['status']
        },
        {
            fields: ['category']
        }
    ]
});

// Instance methods
Goal.prototype.getProgressPercentage = function () {
    if (this.target_value <= 0) return 0;
    return Math.min(100, Math.round((this.current_value / this.target_value) * 100));
};

Goal.prototype.isOverdue = function () {
    if (!this.target_date) return false;
    return new Date() > new Date(this.target_date) && this.status === 'active';
};

Goal.prototype.toJSON = function () {
    const values = Object.assign({}, this.get());
    values.progress_percentage = this.getProgressPercentage();
    values.is_overdue = this.isOverdue();
    return values;
};

// Define associations
Goal.associate = function (models) {
    // Goal belongs to User
    Goal.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
    });

    // Goal has many Activities (when activity is related to this goal)
    Goal.hasMany(models.Activity, {
        foreignKey: 'related_entity_id',
        constraints: false,
        scope: {
            related_entity_type: 'goal'
        },
        as: 'activities'
    });
};

module.exports = Goal;
