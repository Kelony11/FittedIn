const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PostLike = sequelize.define('PostLike', {
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
    }
}, {
    tableName: 'post_likes',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
        {
            unique: true,
            fields: ['post_id', 'user_id'],
            name: 'unique_post_like'
        },
        {
            fields: ['post_id']
        },
        {
            fields: ['user_id']
        }
    ]
});

// Instance methods
PostLike.prototype.toJSON = function () {
    const values = Object.assign({}, this.get());
    return values;
};

// Define associations
PostLike.associate = function (models) {
    // PostLike belongs to Post
    PostLike.belongsTo(models.Post, {
        foreignKey: 'post_id',
        as: 'post'
    });

    // PostLike belongs to User
    PostLike.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
    });
};

module.exports = PostLike;

