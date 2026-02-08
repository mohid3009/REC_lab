import express, { Response } from 'express'; // Server restart trigger
import mongoose from 'mongoose';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import dotenv from 'dotenv';
import fs from 'fs';
import session from 'express-session';
import MongoStore from 'connect-mongo';

import Template from './models/Template';
import Submission from './models/Submission';
import { authenticate, requireRole, AuthRequest } from './middleware/auth';

// Import routes
import authRoutes from './routes/auth';
import classroomRoutes from './routes/classrooms';
import experimentRoutes from './routes/experiments';
import courseRoutes from './routes/courses';
import batchRoutes from './routes/batches';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());

// Session middleware
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-session-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGO_URI || 'mongodb://localhost:27017/pdf-form-system',
        touchAfter: 24 * 3600 // lazy session update
    }),
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
        httpOnly: true,
        secure: false // set to true in production with HTTPS
    }
}));

app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Database Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/pdf-form-system')
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// Storage Engine
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const upload = multer({ storage });

// Routes
app.get('/', (req, res) => {
    res.send('PDF Form System API');
});

// Auth routes
app.use('/api/auth', authRoutes);

// Classroom routes
app.use('/api/classrooms', classroomRoutes);

// Experiment routes
app.use('/api/experiments', experimentRoutes);

// Course routes
app.use('/api/courses', courseRoutes);

// Batch routes
app.use('/api/batches', batchRoutes);

// Upload Route (requires authentication)
app.post('/api/upload', authenticate, upload.single('pdf'), (req: AuthRequest, res: Response) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ url: fileUrl, filename: req.file.filename });
});

// Create Template (HOD only)
app.post('/api/templates', authenticate, requireRole('HOD'), async (req: AuthRequest, res: Response) => {
    try {
        const newTemplate = new Template({
            ...req.body,
            createdBy: req.user!.id
        });
        await newTemplate.save();
        console.log('Template created:', newTemplate._id);
        res.status(201).json(newTemplate);
    } catch (error) {
        console.error('Create template error:', error);
        res.status(500).json({ message: 'Error creating template', error });
    }
});

// Update Template (HOD only, must own template)
app.put('/api/templates/:id', authenticate, requireRole('HOD'), async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        // Verify ownership
        const template = await Template.findById(id);
        if (!template) {
            return res.status(404).json({ message: 'Template not found' });
        }

        if (template.createdBy.toString() !== req.user!.id) {
            return res.status(403).json({ message: 'You can only edit your own templates' });
        }

        const updatedTemplate = await Template.findByIdAndUpdate(
            id,
            { $set: req.body },
            { new: true, runValidators: true }
        );

        console.log('Template updated successfully:', id);
        res.json(updatedTemplate);
    } catch (error: any) {
        console.error('Update template error detail:', error);
        res.status(500).json({
            message: 'Error updating template',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Get Template (authenticated users only)
app.get('/api/templates/:id', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const template = await Template.findById(req.params.id);
        if (!template) return res.status(404).json({ message: 'Template not found' });
        res.json(template);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching template', error });
    }
});

// Get all templates (filtered by role)
app.get('/api/templates', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        let templates;

        if (req.user!.role === 'HOD') {
            // HOD sees all templates they created
            templates = await Template.find({ createdBy: req.user!.id });
        } else if (req.user!.role === 'Teacher') {
            // Teachers see only published templates
            templates = await Template.find({ isPublished: true });
        } else {
            // Students shouldn't directly access templates
            return res.status(403).json({ message: 'Access denied' });
        }

        res.json(templates);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching templates', error });
    }
});

// Create Submission (authenticated users)
app.post('/api/submissions', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const newSubmission = new Submission({
            ...req.body,
            studentId: req.user!.id
        });
        console.log('Creating submission:', {
            studentId: req.user!.id,
            experimentId: req.body.experimentId,
            templateId: req.body.templateId,
            status: req.body.status
        });
        await newSubmission.save();
        console.log('Submission saved:', newSubmission._id);
        res.status(201).json(newSubmission);
    } catch (error) {
        console.error('Save submission error:', error);
        res.status(500).json({ message: 'Error saving submission', error });
    }
});

// Update Submission (Student only - before grading)
app.put('/api/submissions/:id', authenticate, requireRole('Student'), async (req: AuthRequest, res: Response) => {
    try {
        const submission = await Submission.findById(req.params.id);

        if (!submission) {
            return res.status(404).json({ message: 'Submission not found' });
        }

        // Check if student owns this submission
        if (submission.studentId.toString() !== req.user!.id) {
            return res.status(403).json({ message: 'You can only update your own submissions' });
        }

        // Check if submission is locked
        if (submission.isLocked) {
            return res.status(400).json({ message: 'Cannot update a locked submission' });
        }

        // Update submission
        const updatedSubmission = await Submission.findByIdAndUpdate(
            req.params.id,
            {
                ...req.body,
                studentId: req.user!.id, // Ensure studentId doesn't change
                submittedAt: new Date() // Update submission time
            },
            { new: true }
        );

        res.json(updatedSubmission);
    } catch (error) {
        console.error('Update submission error:', error);
        res.status(500).json({ message: 'Error updating submission', error });
    }
});

// Get student's own submissions
app.get('/api/submissions/my', authenticate, requireRole('Student'), async (req: AuthRequest, res: Response) => {
    try {
        const submissions = await Submission.find({ studentId: req.user!.id })
            .populate('templateId', 'title')
            .populate({
                path: 'experimentId',
                populate: {
                    path: 'classroomId',
                    model: 'Classroom',
                    select: 'name courseCode'
                }
            })
            .sort({ submittedAt: -1 });
        res.json(submissions);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching submissions', error });
    }
});

// Get Single Submission
app.get('/api/submissions/:id', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const submission = await Submission.findById(req.params.id)
            .populate('studentId', 'name email')
            .populate('experimentId', 'title')
            .populate('templateId', 'pdfUrl title pageCount fields dimensions')
            .populate('gradedBy', 'name');

        if (!submission) {
            return res.status(404).json({ message: 'Submission not found' });
        }

        // Access control: Teacher or the Student who owns it
        const studentIdArg = (submission.studentId as any)?._id || submission.studentId;

        if (!studentIdArg) {
            return res.status(500).json({ message: 'Submission has no student associated' });
        }

        if (req.user!.role !== 'Teacher' && studentIdArg.toString() !== req.user!.id) {
            return res.status(403).json({ message: 'Unauthorized access to submission' });
        }

        res.json(submission);
    } catch (error) {
        console.error('Error fetching submission:', error);
        res.status(500).json({ message: 'Error fetching submission', error });
    }
});

// Get Submissions for Assignment (Teacher only) - Legacy endpoint
app.get('/api/submissions/assignment/:assignmentId', authenticate, requireRole('Teacher'), async (req: AuthRequest, res: Response) => {
    try {
        const results = await Submission.find({ assignmentId: req.params.assignmentId as any })
            .populate('studentId', 'name email');
        res.json(results);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching submissions', error });
    }
});

// Review Submission - Update status and add remarks (Teacher only)
app.put('/api/submissions/:id/review', authenticate, requireRole('Teacher'), async (req: AuthRequest, res: Response) => {
    try {
        const { status, remarks } = req.body;

        if (!status || !['SUBMITTED', 'NEEDS_REVISION'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status. Must be SUBMITTED or NEEDS_REVISION' });
        }

        const submission = await Submission.findByIdAndUpdate(
            req.params.id,
            {
                status,
                remarks: remarks || '',
                reviewedAt: new Date()
            },
            { new: true }
        ).populate('studentId', 'name email');

        if (!submission) {
            return res.status(404).json({ message: 'Submission not found' });
        }

        res.json(submission);
    } catch (error: any) {
        console.error('Review submission error:', error);
        res.status(500).json({ message: 'Error reviewing submission', error: error.message });
    }
});

// Finalize Submission - Grade and lock (Teacher only)
app.put('/api/submissions/:id/finalize', authenticate, requireRole('Teacher'), async (req: AuthRequest, res: Response) => {
    try {
        const { grade, feedback } = req.body;

        if (grade === undefined || grade < 0 || grade > 10) {
            return res.status(400).json({ message: 'Grade must be between 0 and 10' });
        }

        const submission = await Submission.findByIdAndUpdate(
            req.params.id,
            {
                status: 'GRADED',
                grade,
                feedback: feedback || '',
                isLocked: true,
                gradedBy: req.user!.id,
                gradedAt: new Date(),
                reviewedAt: new Date()
            },
            { new: true }
        ).populate('studentId', 'name email').populate('gradedBy', 'name email');

        if (!submission) {
            return res.status(404).json({ message: 'Submission not found' });
        }

        res.json(submission);
    } catch (error: any) {
        console.error('Finalize submission error:', error);
        res.status(500).json({ message: 'Error finalizing submission', error: error.message });
    }
});

// Get Submissions for Experiment (Teacher only)
app.get('/api/submissions/experiment/:experimentId', authenticate, requireRole('Teacher'), async (req: AuthRequest, res: Response) => {
    try {
        const submissions = await Submission.find({ experimentId: req.params.experimentId as any })
            .populate('studentId', 'name email')
            .populate('templateId', 'title')
            .sort({ submittedAt: -1 });
        res.json(submissions);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching experiment submissions', error });
    }
});

// Get Submissions for Template (backward compatibility)
app.get('/api/submissions/template/:templateId', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const results = await Submission.find({ templateId: req.params.templateId as any });
        res.json(results);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching submissions', error });
    }
});

// Grade Submission (Teacher only)
app.put('/api/submissions/:id/grade', authenticate, requireRole('Teacher'), async (req: AuthRequest, res: Response) => {
    try {
        const { grade, feedback } = req.body;

        if (grade === undefined || grade < 0 || grade > 10) {
            return res.status(400).json({ message: 'Grade must be between 0 and 10' });
        }

        const submission = await Submission.findByIdAndUpdate(
            req.params.id,
            {
                grade,
                feedback,
                gradedBy: req.user!.id,
                gradedAt: new Date()
            },
            { new: true }
        ).populate('studentId', 'name email');

        if (!submission) {
            return res.status(404).json({ message: 'Submission not found' });
        }

        res.json(submission);
    } catch (error: any) {
        console.error('Grade submission error:', error);
        res.status(500).json({ message: 'Error grading submission', error: error.message });
    }
});

// Serve static files from the React app if in production
if (process.env.NODE_ENV === 'production') {
    const frontendDistPath = path.join(__dirname, '../../dist');
    app.use(express.static(frontendDistPath));

    app.get('/:any*', (req, res) => {
        // Don't intercept API calls
        if (req.path.startsWith('/api')) {
            return res.status(404).json({ message: 'API endpoint not found' });
        }
        res.sendFile(path.join(frontendDistPath, 'index.html'));
    });
}

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});
