const { faker } = require('@faker-js/faker');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../src/config/database');

// Import all models
const User = require('../src/models/User');
const Profile = require('../src/models/Profile');
const Goal = require('../src/models/Goal');
const Connection = require('../src/models/Connection');
const Activity = require('../src/models/Activity');
const Post = require('../src/models/Post');
const PostLike = require('../src/models/PostLike');
const PostComment = require('../src/models/PostComment');
const Notification = require('../src/models/Notification');

// Set up model associations
const models = { User, Profile, Goal, Connection, Activity, Post, PostLike, PostComment, Notification };
User.associate(models);
Profile.associate(models);
Goal.associate(models);
Connection.associate(models);
Activity.associate(models);
Post.associate(models);
PostLike.associate(models);
PostComment.associate(models);
Notification.associate(models);

// Configuration
const CONFIG = {
    NUM_USERS: parseInt(process.env.SEED_NUM_USERS) || 50,
    NUM_GOALS_PER_USER: { min: 1, max: 5 },
    NUM_CONNECTIONS: parseInt(process.env.SEED_NUM_CONNECTIONS) || 100,
    NUM_POSTS: parseInt(process.env.SEED_NUM_POSTS) || 150,
    NUM_POST_LIKES: parseInt(process.env.SEED_NUM_POST_LIKES) || 300,
    NUM_POST_COMMENTS: parseInt(process.env.SEED_NUM_COMMENTS) || 200,
    NUM_ACTIVITIES: parseInt(process.env.SEED_NUM_ACTIVITIES) || 200,
    NUM_NOTIFICATIONS: parseInt(process.env.SEED_NUM_NOTIFICATIONS) || 150,
};

// Fitness-related data pools
const FITNESS_LEVELS = ['beginner', 'intermediate', 'advanced'];
const GOAL_CATEGORIES = [
    'weight_loss', 'weight_gain', 'muscle_gain', 'cardio',
    'flexibility', 'nutrition', 'mental_health', 'sleep',
    'hydration', 'other'
];
const GOAL_STATUSES = ['active', 'completed', 'paused', 'cancelled'];
const GOAL_PRIORITIES = ['low', 'medium', 'high'];
const PRONOUNS_OPTIONS = ['he/him', 'she/her', 'they/them', 'he/they', 'she/they'];
const WELLNESS_SKILLS = [
    'yoga', 'running', 'cycling', 'swimming', 'weightlifting',
    'nutrition', 'meditation', 'pilates', 'crossfit', 'dancing',
    'hiking', 'martial_arts', 'stretching', 'cardio', 'strength_training'
];
const GOAL_CATEGORY_UNITS = {
    weight_loss: { unit: 'kg', targetMin: 2, targetMax: 30, currentMin: 0 },
    weight_gain: { unit: 'kg', targetMin: 2, targetMax: 20, currentMin: 0 },
    muscle_gain: { unit: 'kg', targetMin: 2, targetMax: 15, currentMin: 0 },
    cardio: { unit: 'minutes/week', targetMin: 60, targetMax: 600, currentMin: 0 },
    flexibility: { unit: 'sessions/week', targetMin: 2, targetMax: 7, currentMin: 0 },
    nutrition: { unit: 'meals/week', targetMin: 5, targetMax: 21, currentMin: 0 },
    mental_health: { unit: 'sessions/week', targetMin: 1, targetMax: 7, currentMin: 0 },
    sleep: { unit: 'hours/night', targetMin: 6, targetMax: 9, currentMin: 0 },
    hydration: { unit: 'liters/day', targetMin: 1.5, targetMax: 4, currentMin: 0 },
    other: { unit: 'units', targetMin: 1, targetMax: 100, currentMin: 0 }
};
const ACTIVITY_TYPES = [
    'goal_created', 'goal_updated', 'goal_progress', 'goal_completed',
    'goal_deleted', 'profile_updated', 'connection_request', 'connection_accepted'
];
const NOTIFICATION_TYPES = [
    'connection_request', 'connection_accepted', 'connection_rejected',
    'goal_comment', 'post_like', 'post_comment', 'goal_milestone',
    'goal_completed', 'activity_shared'
];
const CONNECTION_STATUSES = ['pending', 'accepted', 'rejected', 'blocked'];

// Helper functions
function getRandomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function getRandomElements(array, count) {
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, array.length));
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomDecimal(min, max, decimals = 2) {
    return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

// Generate fake data functions
async function createUsers(count) {
    console.log(`\n📝 Creating ${count} users...`);
    const users = [];

    for (let i = 0; i < count; i++) {
        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        const displayName = `${firstName} ${lastName}`;
        // Use a consistent domain pattern for seeded users so they can be auto-detected
        const email = faker.internet.email({ firstName, lastName, provider: 'fittedin-seeded.com' }).toLowerCase();
        const password = 'Password123!'; // Same password for all seeded users

        try {
            const user = await User.create({
                display_name: displayName,
                email: email,
                password_hash: password, // Will be hashed by the model hook
                avatar_url: faker.image.avatar()
            });
            users.push(user);
            if ((i + 1) % 10 === 0) {
                process.stdout.write(`   Created ${i + 1}/${count} users...\r`);
            }
        } catch (error) {
            console.error(`\n   Error creating user ${i + 1}:`, error.message);
        }
    }

    console.log(`\n✅ Created ${users.length} users`);
    return users;
}

async function createProfiles(users) {
    console.log(`\n👤 Creating profiles for ${users.length} users...`);
    const profiles = [];

    for (const user of users) {
        const age = faker.number.int({ min: 18, max: 70 });
        const birthDate = faker.date.birthdate({ min: age, max: age, mode: 'age' });
        const height = faker.number.int({ min: 150, max: 200 }); // cm
        const weight = getRandomDecimal(50, 120, 2); // kg
        const fitnessLevel = getRandomElement(FITNESS_LEVELS);
        const numGoals = getRandomInt(2, 5);
        const numSkills = getRandomInt(2, 6);

        const profileData = {
            user_id: user.id,
            pronouns: faker.helpers.arrayElement(PRONOUNS_OPTIONS),
            bio: faker.lorem.paragraph({ min: 2, max: 4 }).substring(0, 1000),
            location: `${faker.location.city()}, ${faker.location.state({ abbreviated: true })}`,
            date_of_birth: birthDate.toISOString().split('T')[0],
            height: height,
            weight: weight,
            fitness_level: fitnessLevel,
            primary_goals: getRandomElements(GOAL_CATEGORIES, numGoals),
            skills: getRandomElements(WELLNESS_SKILLS, numSkills),
            privacy_settings: {
                profile_visibility: faker.helpers.arrayElement(['public', 'connections', 'private']),
                show_activity: faker.datatype.boolean(),
                show_goals: faker.datatype.boolean(),
                show_connections: faker.datatype.boolean()
            }
        };

        try {
            const profile = await Profile.create(profileData);
            profiles.push(profile);
        } catch (error) {
            console.error(`   Error creating profile for user ${user.id}:`, error.message);
        }
    }

    console.log(`✅ Created ${profiles.length} profiles`);
    return profiles;
}

async function createGoals(users) {
    console.log(`\n🎯 Creating goals for users...`);
    const goals = [];
    let totalCreated = 0;

    for (const user of users) {
        const numGoals = getRandomInt(CONFIG.NUM_GOALS_PER_USER.min, CONFIG.NUM_GOALS_PER_USER.max);

        for (let i = 0; i < numGoals; i++) {
            const category = getRandomElement(GOAL_CATEGORIES);
            const categoryData = GOAL_CATEGORY_UNITS[category];
            const targetValue = getRandomDecimal(categoryData.targetMin, categoryData.targetMax);
            const currentValue = getRandomDecimal(
                categoryData.currentMin,
                Math.min(targetValue * 0.8, targetValue)
            );
            const startDate = faker.date.past({ years: 1 });
            const targetDate = faker.date.future({ years: 1 });
            const status = getRandomElement(GOAL_STATUSES);

            const goalTitles = {
                weight_loss: ['Lose Weight', 'Shed Pounds', 'Get Lean', 'Weight Loss Journey'],
                weight_gain: ['Gain Weight', 'Build Mass', 'Healthy Weight Gain'],
                muscle_gain: ['Build Muscle', 'Gain Strength', 'Muscle Growth', 'Get Stronger'],
                cardio: ['Improve Cardio', 'Run More', 'Cardio Fitness', 'Endurance Training'],
                flexibility: ['Improve Flexibility', 'Yoga Practice', 'Stretching Routine'],
                nutrition: ['Better Nutrition', 'Healthy Eating', 'Meal Planning'],
                mental_health: ['Mental Wellness', 'Meditation Practice', 'Mindfulness'],
                sleep: ['Better Sleep', 'Sleep Hygiene', 'Restful Nights'],
                hydration: ['Stay Hydrated', 'Drink More Water', 'Hydration Goal'],
                other: ['Fitness Goal', 'Wellness Journey', 'Health Improvement']
            };

            const title = faker.helpers.arrayElement(goalTitles[category] || goalTitles.other);

            try {
                const goal = await Goal.create({
                    user_id: user.id,
                    title: title,
                    description: faker.lorem.sentence({ min: 5, max: 15 }),
                    category: category,
                    target_value: targetValue,
                    current_value: currentValue,
                    unit: categoryData.unit,
                    start_date: startDate.toISOString().split('T')[0],
                    target_date: targetDate.toISOString().split('T')[0],
                    status: status,
                    priority: getRandomElement(GOAL_PRIORITIES),
                    is_public: faker.datatype.boolean({ probability: 0.8 }),
                    milestones: faker.helpers.multiple(() => ({
                        title: faker.lorem.words({ min: 2, max: 5 }),
                        target_value: getRandomDecimal(targetValue * 0.2, targetValue * 0.8),
                        achieved: faker.datatype.boolean({ probability: status === 'completed' ? 0.7 : 0.3 })
                    }), { count: { min: 0, max: 3 } }),
                    notes: faker.datatype.boolean({ probability: 0.3 }) ? faker.lorem.paragraph() : null
                });
                goals.push(goal);
                totalCreated++;
            } catch (error) {
                console.error(`   Error creating goal for user ${user.id}:`, error.message);
            }
        }
    }

    console.log(`✅ Created ${totalCreated} goals`);
    return goals;
}

async function createConnections(users, count) {
    console.log(`\n🤝 Creating ${count} connections...`);
    const connections = [];
    const connectionPairs = new Set();

    // Calculate how many accepted connections we want (70% accepted for better social feed)
    const acceptedCount = Math.floor(count * 0.7);
    const otherCount = count - acceptedCount;

    // First, create accepted connections (so users can see each other's posts)
    for (let i = 0; i < acceptedCount; i++) {
        let requester, receiver;
        let attempts = 0;

        // Ensure unique pairs and no self-connections
        do {
            requester = getRandomElement(users);
            receiver = getRandomElement(users);
            attempts++;
        } while (
            (requester.id === receiver.id ||
                connectionPairs.has(`${requester.id}-${receiver.id}`) ||
                connectionPairs.has(`${receiver.id}-${requester.id}`)) &&
            attempts < 100
        );

        if (requester.id === receiver.id) continue;

        const pairKey = `${Math.min(requester.id, receiver.id)}-${Math.max(requester.id, receiver.id)}`;
        connectionPairs.add(pairKey);

        try {
            const connection = await Connection.create({
                requester_id: requester.id,
                receiver_id: receiver.id,
                status: 'accepted' // Most connections are accepted
            });
            connections.push(connection);
        } catch (error) {
            // Ignore duplicate connection errors
            if (!error.message.includes('unique_connection_pair')) {
                console.error(`   Error creating connection:`, error.message);
            }
        }
    }

    // Then create other status connections (pending, rejected, blocked)
    for (let i = 0; i < otherCount; i++) {
        let requester, receiver;
        let attempts = 0;

        // Ensure unique pairs and no self-connections
        do {
            requester = getRandomElement(users);
            receiver = getRandomElement(users);
            attempts++;
        } while (
            (requester.id === receiver.id ||
                connectionPairs.has(`${requester.id}-${receiver.id}`) ||
                connectionPairs.has(`${receiver.id}-${requester.id}`)) &&
            attempts < 100
        );

        if (requester.id === receiver.id) continue;

        const pairKey = `${Math.min(requester.id, receiver.id)}-${Math.max(requester.id, receiver.id)}`;
        connectionPairs.add(pairKey);

        // Randomly choose from pending, rejected, or blocked (but not accepted)
        const otherStatuses = ['pending', 'rejected', 'blocked'];
        const status = getRandomElement(otherStatuses);

        try {
            const connection = await Connection.create({
                requester_id: requester.id,
                receiver_id: receiver.id,
                status: status
            });
            connections.push(connection);
        } catch (error) {
            // Ignore duplicate connection errors
            if (!error.message.includes('unique_connection_pair')) {
                console.error(`   Error creating connection:`, error.message);
            }
        }
    }

    const acceptedConnections = connections.filter(c => c.status === 'accepted').length;
    console.log(`✅ Created ${connections.length} connections (${acceptedConnections} accepted)`);
    return connections;
}

async function createPosts(users, count) {
    console.log(`\n📮 Creating ${count} posts...`);
    const posts = [];

    const fitnessPostTemplates = [
        "Just completed an amazing {activity} session! Feeling energized and motivated. 💪",
        "Hit a new personal record today! {achievement}",
        "Starting my {goal} journey today. Let's do this! 🎯",
        "Grateful for my fitness community. Thanks for all the support! 🙏",
        "Today's workout was intense but so rewarding. {details}",
        "Nutrition tip: {tip}",
        "Rest day today, but staying active with {activity}",
        "Progress update: {update}",
        "Feeling strong after {activity}. Consistency is key!",
        "New goal unlocked: {goal}"
    ];

    for (let i = 0; i < count; i++) {
        const user = getRandomElement(users);
        const template = getRandomElement(fitnessPostTemplates);
        const content = template
            .replace('{activity}', getRandomElement(['yoga', 'run', 'workout', 'cycling', 'swimming', 'weightlifting']))
            .replace('{achievement}', faker.lorem.sentence())
            .replace('{goal}', getRandomElement(['weight loss', 'muscle gain', 'flexibility', 'cardio improvement']))
            .replace('{details}', faker.lorem.sentence())
            .replace('{tip}', faker.lorem.sentence())
            .replace('{update}', faker.lorem.sentence());

        try {
            const post = await Post.create({
                user_id: user.id,
                content: content
            });
            posts.push(post);
        } catch (error) {
            console.error(`   Error creating post:`, error.message);
        }
    }

    console.log(`✅ Created ${posts.length} posts`);
    return posts;
}

async function createPostLikes(posts, users, count) {
    console.log(`\n❤️  Creating ${count} post likes...`);
    const likes = [];
    const likePairs = new Set();

    for (let i = 0; i < count; i++) {
        const post = getRandomElement(posts);
        const user = getRandomElement(users);
        const pairKey = `${post.id}-${user.id}`;

        // Avoid duplicate likes
        if (likePairs.has(pairKey)) continue;
        likePairs.add(pairKey);

        try {
            const like = await PostLike.create({
                post_id: post.id,
                user_id: user.id
            });
            likes.push(like);
        } catch (error) {
            // Ignore duplicate like errors
            if (!error.message.includes('unique_post_like')) {
                console.error(`   Error creating post like:`, error.message);
            }
        }
    }

    console.log(`✅ Created ${likes.length} post likes`);
    return likes;
}

async function createPostComments(posts, users, count) {
    console.log(`\n💬 Creating ${count} post comments...`);
    const comments = [];

    const commentTemplates = [
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

    for (let i = 0; i < count; i++) {
        const post = getRandomElement(posts);
        const user = getRandomElement(users);
        const content = faker.helpers.arrayElement(commentTemplates) + " " + faker.lorem.sentence();

        try {
            const comment = await PostComment.create({
                post_id: post.id,
                user_id: user.id,
                content: content.substring(0, 1000)
            });
            comments.push(comment);
        } catch (error) {
            console.error(`   Error creating post comment:`, error.message);
        }
    }

    console.log(`✅ Created ${comments.length} post comments`);
    return comments;
}

async function createActivities(users, goals, connections, count) {
    console.log(`\n📊 Creating ${count} activities...`);
    const activities = [];

    for (let i = 0; i < count; i++) {
        const user = getRandomElement(users);
        const activityType = getRandomElement(ACTIVITY_TYPES);
        let relatedEntityType = null;
        let relatedEntityId = null;
        let activityData = {};

        if (activityType.includes('goal')) {
            if (goals.length > 0) {
                const goal = getRandomElement(goals);
                relatedEntityType = 'goal';
                relatedEntityId = goal.id;
                activityData = {
                    goal_title: goal.title,
                    goal_category: goal.category,
                    progress: goal.current_value
                };
            }
        } else if (activityType.includes('connection')) {
            if (connections.length > 0) {
                const connection = getRandomElement(connections);
                relatedEntityType = 'connection';
                relatedEntityId = connection.id;
                activityData = {
                    status: connection.status
                };
            }
        } else if (activityType === 'profile_updated') {
            relatedEntityType = 'profile';
            activityData = {
                updated_fields: getRandomElements(['bio', 'location', 'fitness_level', 'skills'], getRandomInt(1, 3))
            };
        }

        try {
            const activity = await Activity.create({
                user_id: user.id,
                activity_type: activityType,
                activity_data: activityData,
                related_entity_type: relatedEntityType,
                related_entity_id: relatedEntityId
            });
            activities.push(activity);
        } catch (error) {
            console.error(`   Error creating activity:`, error.message);
        }
    }

    console.log(`✅ Created ${activities.length} activities`);
    return activities;
}

async function createNotifications(users, connections, posts, goals, count) {
    console.log(`\n🔔 Creating ${count} notifications...`);
    const notifications = [];

    for (let i = 0; i < count; i++) {
        const recipient = getRandomElement(users);
        const notificationType = getRandomElement(NOTIFICATION_TYPES);
        let fromUserId = null;
        let relatedEntityType = null;
        let relatedEntityId = null;
        let title = '';
        let message = '';

        if (notificationType.includes('connection')) {
            if (connections.length > 0) {
                const connection = getRandomElement(connections);
                fromUserId = connection.requester_id === recipient.id ? connection.receiver_id : connection.requester_id;
                relatedEntityType = 'connection';
                relatedEntityId = connection.id;

                if (notificationType === 'connection_request') {
                    title = 'New Connection Request';
                    message = 'You have a new connection request';
                } else if (notificationType === 'connection_accepted') {
                    title = 'Connection Accepted';
                    message = 'Your connection request was accepted';
                } else {
                    title = 'Connection Rejected';
                    message = 'Your connection request was rejected';
                }
            } else {
                continue; // Skip if no connections
            }
        } else if (notificationType.includes('post')) {
            if (posts.length > 0) {
                const post = getRandomElement(posts);
                fromUserId = post.user_id === recipient.id ? getRandomElement(users.filter(u => u.id !== recipient.id)).id : post.user_id;
                relatedEntityType = 'post';
                relatedEntityId = post.id;

                if (notificationType === 'post_like') {
                    title = 'New Like';
                    message = 'Someone liked your post';
                } else {
                    title = 'New Comment';
                    message = 'Someone commented on your post';
                }
            } else {
                continue; // Skip if no posts
            }
        } else if (notificationType.includes('goal')) {
            if (goals.length > 0) {
                const goal = getRandomElement(goals);
                relatedEntityType = 'goal';
                relatedEntityId = goal.id;

                if (notificationType === 'goal_milestone') {
                    title = 'Goal Milestone Reached';
                    message = `You reached a milestone in "${goal.title}"`;
                } else {
                    title = 'Goal Completed';
                    message = `Congratulations! You completed "${goal.title}"`;
                }
            } else {
                continue; // Skip if no goals
            }
        } else {
            title = 'Activity Shared';
            message = 'Someone shared an activity with you';
        }

        // Ensure fromUserId is different from recipient
        if (fromUserId === recipient.id) {
            const otherUsers = users.filter(u => u.id !== recipient.id);
            if (otherUsers.length > 0) {
                fromUserId = getRandomElement(otherUsers).id;
            } else {
                continue; // Skip if no other users
            }
        }

        try {
            const notification = await Notification.create({
                user_id: recipient.id,
                type: notificationType,
                title: title,
                message: message,
                related_entity_type: relatedEntityType,
                related_entity_id: relatedEntityId,
                from_user_id: fromUserId,
                is_read: faker.datatype.boolean({ probability: 0.3 }),
                read_at: faker.datatype.boolean({ probability: 0.2 }) ? faker.date.recent() : null
            });
            notifications.push(notification);
        } catch (error) {
            console.error(`   Error creating notification:`, error.message);
        }
    }

    console.log(`✅ Created ${notifications.length} notifications`);
    return notifications;
}

// Main seeding function
async function seedDatabase() {
    try {
        console.log('🌱 Starting database seeding...\n');
        console.log('📊 Configuration:');
        console.log(`   Users: ${CONFIG.NUM_USERS}`);
        console.log(`   Connections: ${CONFIG.NUM_CONNECTIONS}`);
        console.log(`   Posts: ${CONFIG.NUM_POSTS}`);
        console.log(`   Post Likes: ${CONFIG.NUM_POST_LIKES}`);
        console.log(`   Post Comments: ${CONFIG.NUM_POST_COMMENTS}`);
        console.log(`   Activities: ${CONFIG.NUM_ACTIVITIES}`);
        console.log(`   Notifications: ${CONFIG.NUM_NOTIFICATIONS}`);

        // Connect to database
        await sequelize.authenticate();
        console.log('\n✅ Database connection established.\n');

        // Check if we should clear existing data
        const shouldClear = process.env.SEED_CLEAR === 'true';
        if (shouldClear) {
            console.log('🗑️  Clearing existing data...');
            await Notification.destroy({ where: {}, force: true });
            await PostComment.destroy({ where: {}, force: true });
            await PostLike.destroy({ where: {}, force: true });
            await Post.destroy({ where: {}, force: true });
            await Activity.destroy({ where: {}, force: true });
            await Connection.destroy({ where: {}, force: true });
            await Goal.destroy({ where: {}, force: true });
            await Profile.destroy({ where: {}, force: true });
            await User.destroy({ where: {}, force: true });
            console.log('✅ Existing data cleared.\n');
        }

        // Create data in order
        const users = await createUsers(CONFIG.NUM_USERS);
        const profiles = await createProfiles(users);
        const goals = await createGoals(users);
        const connections = await createConnections(users, CONFIG.NUM_CONNECTIONS);
        const posts = await createPosts(users, CONFIG.NUM_POSTS);
        const postLikes = await createPostLikes(posts, users, CONFIG.NUM_POST_LIKES);
        const postComments = await createPostComments(posts, users, CONFIG.NUM_POST_COMMENTS);
        const activities = await createActivities(users, goals, connections, CONFIG.NUM_ACTIVITIES);
        const notifications = await createNotifications(users, connections, posts, goals, CONFIG.NUM_NOTIFICATIONS);

        // Summary
        const acceptedConnections = connections.filter(c => c.status === 'accepted').length;
        console.log('\n' + '='.repeat(50));
        console.log('✅ Database seeding completed successfully!');
        console.log('='.repeat(50));
        console.log('\n📊 Summary:');
        console.log(`   Users: ${users.length}`);
        console.log(`   Profiles: ${profiles.length}`);
        console.log(`   Goals: ${goals.length}`);
        console.log(`   Connections: ${connections.length} (${acceptedConnections} accepted)`);
        console.log(`   Posts: ${posts.length}`);
        console.log(`   Post Likes: ${postLikes.length}`);
        console.log(`   Post Comments: ${postComments.length}`);
        console.log(`   Activities: ${activities.length}`);
        console.log(`   Notifications: ${notifications.length}`);
        console.log('\n💡 Notes:');
        console.log('   - All seeded users have password: Password123!');
        console.log(`   - ${acceptedConnections} accepted connections ensure users can see each other's posts`);
        console.log('   - Login with any seeded user to see posts from your connections in the feed');
        console.log('\n');

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error seeding database:', error);
        console.error(error.stack);
        process.exit(1);
    }
}

// Run the seeding
if (require.main === module) {
    seedDatabase();
}

module.exports = { seedDatabase };

