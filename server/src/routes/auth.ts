import express from 'express';
import User from '../models/User';

const router = express.Router();

// Signup route
router.post('/signup', async (req, res) => {
    try {
        const { email, password, name, role, department } = req.body;

        if (!email || !password || !name) {
            return res.status(400).json({ message: 'Email, password, and name are required' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = new User({
            email,
            password,
            name,
            role: role || 'Student',
            department
        });

        await user.save();

        // Auto-login
        req.session.userId = user._id.toString();
        req.session.email = user.email;
        req.session.role = user.role;
        req.session.name = user.name;

        // Explicitly save session before responding
        req.session.save((err) => {
            if (err) {
                console.error('Session save error:', err);
                return res.status(500).json({ message: 'Error saving session' });
            }

            console.log('Session saved successfully for new user:', user.email);
            res.status(201).json({
                message: 'User created successfully',
                user: {
                    id: user._id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    department: user.department
                }
            });
        });
    } catch (error: any) {
        console.error('Signup error:', error);
        res.status(500).json({ message: 'Error creating user', error: error.message });
    }
});

// Login route
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        // Find user
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Create session
        req.session.userId = user._id.toString();
        req.session.email = user.email;
        req.session.role = user.role;
        req.session.name = user.name;

        // Explicitly save session before responding
        req.session.save((err) => {
            if (err) {
                console.error('Session save error:', err);
                return res.status(500).json({ message: 'Error saving session' });
            }

            console.log('Session saved successfully for user:', user.email);
            res.json({
                message: 'Login successful',
                user: {
                    id: user._id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    department: user.department
                }
            });
        });
    } catch (error: any) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Error logging in', error: error.message });
    }
});


// Logout route
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ message: 'Error logging out' });
        }
        res.clearCookie('connect.sid');
        res.json({ message: 'Logged out successfully' });
    });
});

// Get current user
router.get('/me', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ message: 'Not authenticated' });
        }

        const user = await User.findById(req.session.userId).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error: any) {
        res.status(500).json({ message: 'Error fetching user', error: error.message });
    }
});

export default router;
