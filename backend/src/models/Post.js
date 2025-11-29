const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Post = sequelize.define('Post', {
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
    content: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
            len: [1, 5000]
        }
    }
}, {
    tableName: 'posts',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        {
            fields: ['user_id']
        },
        {
            fields: ['created_at']
        }
    ]
});

// Instance methods
Post.prototype.toJSON = function () {
    const values = Object.assign({}, this.get());
    return values;
};

// Define associations
Post.associate = function (models) {
    // Post belongs to User
    Post.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
    });

    // Post has many PostLikes
    Post.hasMany(models.PostLike, {
        foreignKey: 'post_id',
        as: 'likes'
    });

    // Post has many PostComments
    Post.hasMany(models.PostComment, {
        foreignKey: 'post_id',
        as: 'comments'
    });
};

module.exports = Post;

