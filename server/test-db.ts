
import mongoose from 'mongoose';
import User from './src/models/User';
import dotenv from 'dotenv';

dotenv.config();

const run = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/pdf-form-system');
        console.log('Connected.');

        console.log('Creating test user...');
        const user = new User({
            email: 'test-script@gmail.com',
            password: '123456',
            name: 'Test Script User',
            role: 'Student',
            department: 'CS'
        });

        console.log('Saving user...');
        await user.save();
        console.log('User saved successfully');
        console.log('User:', user);

        console.log('Finding user...');
        const found = await User.findOne({ email: 'test-script@gmail.com' });
        console.log('Found user:', found?.email);

        await mongoose.disconnect();
    } catch (error) {
        console.error('Test script error:', error);
    }
};

run();
