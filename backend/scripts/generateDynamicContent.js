const { faker } = require('@faker-js/faker');
const { sequelize } = require('../src/config/database');
const { Op } = require('sequelize');

// Import models
const User = require('../src/models/User');
const Profile = require('../src/models/Profile');
const Goal = require('../src/models/Goal');
const Post = require('../src/models/Post');
const PostLike = require('../src/models/PostLike');
const PostComment = require('../src/models/PostComment');
const Connection = require('../src/models/Connection');
const Activity = require('../src/models/Activity');
const Notification = require('../src/models/Notification');

// Import services
const postService = require('../src/services/postService');
const activityService = require('../src/services/activityService');
const connectionService = require('../src/services/connectionService');

// Set up model associations
const models = { User, Profile, Goal, Post, PostLike, PostComment, Connection, Activity, Notification };
User.associate(models);
Profile.associate(models);
Goal.associate(models);
Post.associate(models);
PostLike.associate(models);
PostComment.associate(models);
Connection.associate(models);
Activity.associate(models);
Notification.associate(models);

// Configuration
const CONFIG = {
    ENABLED: process.env.ENABLE_DYNAMIC_CONTENT !== 'false', // Default: enabled
    MIN_CONTENT_PER_RUN: parseInt(process.env.MIN_CONTENT_PER_RUN) || 5,
    MAX_CONTENT_PER_RUN: parseInt(process.env.MAX_CONTENT_PER_RUN) || 15,
    SEEDED_USER_DOMAIN: '@fittedin-seeded.com'
};

// Post templates for fitness-related content
const POST_TEMPLATES = [
    "Just completed an amazing {activity} session! Feeling energized and motivated. 💪",
    "Hit a new personal record today! {achievement}",
    "Starting my {goal} journey today. Let's do this! 🎯",
    "Grateful for my fitness community. Thanks for all the support! 🙏",
    "Today's workout was intense but so rewarding. {details}",
    "Nutrition tip: {tip}",
    "Rest day today, but staying active with {activity}",
    "Progress update: {update}",
    "Feeling strong after {activity}. Consistency is key!",
    "New goal unlocked: {goal}",
    "Sharing my morning routine: {activity} every day keeps me motivated!",
    "Week {number} of my fitness journey - making great progress!",
    "Celebrating small wins: {achievement}",
    "My favorite {activity} session this week!",
    "Inspired by the community here. Keep pushing everyone!"
];

const ACTIVITIES = ['yoga', 'run', 'workout', 'cycling', 'swimming', 'weightlifting', 'pilates', 'hiking'];
const GOAL_TYPES = ['weight loss', 'muscle gain', 'flexibility', 'cardio improvement', 'nutrition', 'endurance'];

// Comment templates
const COMMENT_TEMPLATES = [
    "Great job! Keep it up! 💪",
    "This is so inspiring!",
    "You're doing amazing!",
    "Love seeing your progress!",
    "This motivates me to work harder!",
    "Awesome work!",
    "Keep pushing forward!",
    "You've got this!",
    "Incredible dedication!",
    "So proud of you!"
];

// Helper functions
function getRandomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomDecimal(min, max, decimals = 2) {
    return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

// Generate a random post content
function generatePostContent() {
    const template = getRandomElement(POST_TEMPLATES);
    return template
        .replace('{activity}', getRandomElement(ACTIVITIES))
        .replace('{achievement}', faker.lorem.sentence())
        .replace('{goal}', getRandomElement(GOAL_TYPES))
        .replace('{details}', faker.lorem.sentence())
        .replace('{tip}', faker.lorem.sentence())
        .replace('{update}', faker.lorem.sentence())
        .replace('{number}', getRandomInt(1, 12));
}

// Generate a random comment
function generateComment() {
    return getRandomElement(COMMENT_TEMPLATES) + " " + faker.lorem.sentence();
}

// Get all seeded users
async function getSeededUsers() {
    try {
        const users = await User.findAll({
            where: {
                email: {
                    [Op.like]: `%${CONFIG.SEEDED_USER_DOMAIN}`
                }
            }
        });
        return users;
    } catch (error) {
        console.error('Error getting seeded users:', error);
        return [];
    }
}

// Generate a new post
async function generatePost(user) {
    try {
        const content = generatePostContent();

        // Generate recent timestamp (within last 1-24 hours)
        const recentTime = faker.date.recent({ days: 1 });

        // Create post with custom timestamp using raw query
        const [result] = await sequelize.query(`
            INSERT INTO posts (user_id, content, created_at, updated_at)
            VALUES (:userId, :content, :createdAt, :updatedAt)
            RETURNING id
        `, {
            replacements: {
                userId: user.id,
                content: content,
                createdAt: recentTime,
                updatedAt: recentTime
            },
            type: sequelize.QueryTypes.INSERT
        });

        // Get the post ID and reload
        const postId = result[0]?.id || result.id;
        const post = await Post.findByPk(postId);

        console.log(`   ✓ Created post by ${user.display_name}`);
        return post;
    } catch (error) {
        console.error(`   ✗ Failed to create post for ${user.display_name}:`, error.message);
        return null;
    }
}

// Update goal progress
async function updateGoalProgress(user) {
    try {
        // Get user's active goals
        const goals = await Goal.findAll({
            where: {
                user_id: user.id,
                status: 'active'
            }
        });

        if (goals.length === 0) {
            return null;
        }

        const goal = getRandomElement(goals);

        // Calculate new progress (increase by 1-10% of target, but don't exceed target)
        const progressIncrease = getRandomDecimal(
            goal.target_value * 0.01,
            goal.target_value * 0.10
        );
        const newValue = Math.min(
            parseFloat(goal.current_value) + progressIncrease,
            parseFloat(goal.target_value)
        );

        const previousValue = parseFloat(goal.current_value);

        // Update goal
        await goal.update({
            current_value: newValue,
            // Mark as completed if reached target
            status: newValue >= parseFloat(goal.target_value) ? 'completed' : goal.status
        });

        // Log activity
        if (newValue >= parseFloat(goal.target_value)) {
            await activityService.logGoalCompleted(user.id, goal);
            console.log(`   ✓ Completed goal "${goal.title}" for ${user.display_name}`);
        } else {
            await activityService.logGoalProgress(user.id, goal, previousValue, newValue);
            console.log(`   ✓ Updated progress on "${goal.title}" for ${user.display_name}`);
        }

        return goal;
    } catch (error) {
        console.error(`   ✗ Failed to update goal progress for ${user.display_name}:`, error.message);
        return null;
    }
}

// Generate post interaction (like or comment)
async function generatePostInteraction(users, user) {
    try {
        // Get recent posts (from last 7 days)
        const recentPosts = await Post.findAll({
            where: {
                created_at: {
                    [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                }
            },
            limit: 50,
            order: [['created_at', 'DESC']]
        });

        if (recentPosts.length === 0) {
            return null;
        }

        const post = getRandomElement(recentPosts);

        // Don't interact with own posts
        if (post.user_id === user.id) {
            return null;
        }

        const actionType = Math.random() < 0.6 ? 'like' : 'comment'; // 60% likes, 40% comments

        if (actionType === 'like') {
            // Check if already liked
            const existingLike = await PostLike.findOne({
                where: {
                    post_id: post.id,
                    user_id: user.id
                }
            });

            if (!existingLike) {
                const recentTime = faker.date.recent({ days: 1 });

                // Create like with custom timestamp
                await sequelize.query(`
                    INSERT INTO post_likes (post_id, user_id, created_at)
                    VALUES (:postId, :userId, :createdAt)
                `, {
                    replacements: {
                        postId: post.id,
                        userId: user.id,
                        createdAt: recentTime
                    },
                    type: sequelize.QueryTypes.INSERT
                });

                console.log(`   ✓ ${user.display_name} liked a post`);
                return { type: 'like', post_id: post.id };
            }
        } else {
            // Add comment with custom timestamp
            const recentTime = faker.date.recent({ days: 1 });

            await sequelize.query(`
                INSERT INTO post_comments (post_id, user_id, content, created_at, updated_at)
                VALUES (:postId, :userId, :content, :createdAt, :updatedAt)
            `, {
                replacements: {
                    postId: post.id,
                    userId: user.id,
                    content: generateComment(),
                    createdAt: recentTime,
                    updatedAt: recentTime
                },
                type: sequelize.QueryTypes.INSERT
            });

            console.log(`   ✓ ${user.display_name} commented on a post`);
            return { type: 'comment', post_id: post.id };
        }

        return null;
    } catch (error) {
        console.error(`   ✗ Failed to generate post interaction for ${user.display_name}:`, error.message);
        return null;
    }
}

// Generate new connection request
async function generateConnectionRequest(users, user) {
    try {
        // Get users that this user is not connected with
        const existingConnections = await Connection.findAll({
            where: {
                [Op.or]: [
                    { requester_id: user.id },
                    { receiver_id: user.id }
                ]
            }
        });

        const connectedUserIds = new Set([user.id]);
        existingConnections.forEach(conn => {
            if (conn.requester_id === user.id) {
                connectedUserIds.add(conn.receiver_id);
            } else {
                connectedUserIds.add(conn.requester_id);
            }
        });

        const availableUsers = users.filter(u => !connectedUserIds.has(u.id));

        if (availableUsers.length === 0) {
            return null;
        }

        const receiver = getRandomElement(availableUsers);

        // Use connection service to create request (handles auto-accept)
        await connectionService.sendConnectionRequest(user.id, receiver.id);
        console.log(`   ✓ ${user.display_name} sent connection request to ${receiver.display_name}`);
        return { receiver_id: receiver.id };
    } catch (error) {
        // Ignore duplicate connection errors
        if (!error.message.includes('already') && !error.message.includes('Already')) {
            console.error(`   ✗ Failed to generate connection request for ${user.display_name}:`, error.message);
        }
        return null;
    }
}

// Main generation function
async function generateDynamicContent() {
    if (!CONFIG.ENABLED) {
        console.log('Dynamic content generation is disabled. Set ENABLE_DYNAMIC_CONTENT=true to enable.');
        return;
    }

    try {
        console.log('🎲 Starting dynamic content generation...\n');

        // Connect to database
        await sequelize.authenticate();
        console.log('✅ Database connection established.\n');

        // Get seeded users
        const users = await getSeededUsers();
        if (users.length === 0) {
            console.log('⚠️  No seeded users found. Please run the seeding script first.');
            process.exit(0);
        }

        console.log(`📊 Found ${users.length} seeded users\n`);

        // Determine how much content to generate
        const numContent = getRandomInt(CONFIG.MIN_CONTENT_PER_RUN, CONFIG.MAX_CONTENT_PER_RUN);
        console.log(`📝 Generating ${numContent} content items...\n`);

        const results = {
            posts: 0,
            goalUpdates: 0,
            interactions: 0,
            connections: 0
        };

        // Generate content
        for (let i = 0; i < numContent; i++) {
            const user = getRandomElement(users);
            const actionType = Math.random();

            if (actionType < 0.5) {
                // 50% - Generate new post
                const post = await generatePost(user);
                if (post) results.posts++;
            } else if (actionType < 0.7) {
                // 20% - Update goal progress
                const goal = await updateGoalProgress(user);
                if (goal) results.goalUpdates++;
            } else if (actionType < 0.9) {
                // 20% - Post interaction (like/comment)
                const interaction = await generatePostInteraction(users, user);
                if (interaction) results.interactions++;
            } else {
                // 10% - New connection request
                const connection = await generateConnectionRequest(users, user);
                if (connection) results.connections++;
            }

            // Small delay to spread out content creation
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Summary
        console.log('\n' + '='.repeat(50));
        console.log('✅ Dynamic content generation completed!');
        console.log('='.repeat(50));
        console.log('\n📊 Summary:');
        console.log(`   Posts: ${results.posts}`);
        console.log(`   Goal Updates: ${results.goalUpdates}`);
        console.log(`   Post Interactions: ${results.interactions}`);
        console.log(`   Connection Requests: ${results.connections}`);
        console.log(`   Total: ${results.posts + results.goalUpdates + results.interactions + results.connections}`);
        console.log('\n');

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error generating dynamic content:', error);
        console.error(error.stack);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    generateDynamicContent();
}

module.exports = { generateDynamicContent };

