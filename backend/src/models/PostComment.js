const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PostComment = sequelize.define('PostComment', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    post_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'posts',
            key: 'id'
        },
        onDelete: 'CASCADE'
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
    content: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
            len: [1, 1000]
        }
    }
}, {
    tableName: 'post_comments',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        {
            fields: ['post_id']
        },
        {
            fields: ['user_id']
        },
        {
            fields: ['created_at']
        }
    ]
});

// Instance methods
PostComment.prototype.toJSON = function () {
    const values = Object.assign({}, this.get());
    return values;
};

// Define associations
PostComment.associate = function (models) {
    // PostComment belongs to Post
    PostComment.belongsTo(models.Post, {
        foreignKey: 'post_id',
        as: 'post'
    });

    // PostComment belongs to User
    PostComment.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
    });
};

module.exports = PostComment;

