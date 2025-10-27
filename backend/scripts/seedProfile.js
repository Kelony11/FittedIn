const bcrypt = require('bcryptjs');
const { User, Profile } = require('../src/models');
const { sequelize } = require('../src/config/database');

async function seedProfile() {
    try {
        console.log('Starting profile seeding...');

        // Connect to database
        await sequelize.authenticate();
        console.log('Database connection established.');

        // Create demo user
        const hashedPassword = await bcrypt.hash('DemoUser123!', 10);

        let demoUser = await User.findOne({ where: { email: 'demo@fittedin.com' } });

        if (demoUser) {
            console.log('Demo user already exists. Updating profile...');
        } else {
            demoUser = await User.create({
                display_name: 'Demo User',
                email: 'demo@fittedin.com',
                password: hashedPassword,
                avatar_url: null
            });
            console.log('Demo user created:', demoUser.id);
        }

        // Create or update profile with complete data
        const profileData = {
            user_id: demoUser.id,
            pronouns: 'they/them',
            bio: 'Fitness enthusiast passionate about holistic wellness. Love running, yoga, and nutrition. Always striving to be the best version of myself!',
            location: 'San Francisco, CA',
            date_of_birth: '1990-05-15',
            height: 175,
            weight: 70,
            fitness_level: 'intermediate',
            primary_goals: ['weight_loss', 'cardio', 'strength', 'flexibility'],
            skills: ['yoga', 'running', 'nutrition', 'meditation', 'weightlifting'],
            privacy_settings: {
                profile_visibility: 'public',
                show_activity: true,
                show_goals: true,
                show_connections: true
            }
        };

        let profile = await Profile.findOne({ where: { user_id: demoUser.id } });

        if (profile) {
            await profile.update(profileData);
            console.log('Demo profile updated.');
        } else {
            profile = await Profile.create(profileData);
            console.log('Demo profile created.');
        }

        console.log('\n✅ Demo profile seeded successfully!');
        console.log('\n📋 Demo Credentials:');
        console.log('   Email: demo@fittedin.com');
        console.log('   Password: DemoUser123!');
        console.log('\n🎯 Profile Features:');
        console.log('   - Complete bio and location');
        console.log('   - Physical information (height, weight, fitness level)');
        console.log('   - 4 wellness goals');
        console.log('   - 5 wellness skills');
        console.log('   - Public profile visibility');
        console.log('\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding profile:', error);
        process.exit(1);
    }
}

// Run the seeding
seedProfile();

