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

// Trust Proxy for Render (Required for secure cookies behind load balancer)
app.set('trust proxy', 1);

// Middleware
// For production, accept requests from same origin (monolithic deployment)
// or from FRONTEND_URL if deploying frontend separately
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (server-side, Postman, curl, etc.)
        if (!origin) return callback(null, true);

        // In production, allow same-origin requests (when frontend is served by same server)
        // Check if origin matches current host
        const requestOrigin = new URL(origin);
        const isLocalhost = requestOrigin.hostname === 'localhost' || requestOrigin.hostname === '127.0.0.1';
        const isRenderDomain = requestOrigin.hostname.includes('.onrender.com');

        if (isLocalhost || isRenderDomain) {
            return callback(null, true);
        }

        // Also check against FRONTEND_URL if set
        if (process.env.FRONTEND_URL && origin.startsWith(process.env.FRONTEND_URL)) {
            return callback(null, true);
        }

        callback(new Error('Not allowed by CORS'));
    },
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
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax', // Use 'lax' for same-origin deployment (frontend + backend together)
        path: '/'
    }
}));

app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../uploads');
console.log('Upload directory path:', uploadDir);
try {
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
        console.log('Created upload directory');
    } else {
        console.log('Upload directory already exists');
    }
    // Test write permissions
    const testFile = path.join(uploadDir, '.write-test');
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
    console.log('Upload directory is writable');
} catch (error) {
    console.error('Upload directory error:', error);
    console.error('WARNING: File uploads may not work!');
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

const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        // Accept PDFs only
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'));
        }
    }
});

// API Health check (specific route, won't interfere with SPA)
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'PDF Form System API' });
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
app.post('/api/upload', authenticate, (req: AuthRequest, res: Response, next) => {
    upload.single('pdf')(req, res, (err) => {
        if (err) {
            console.error('Multer upload error:', err);
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({ message: 'File too large. Maximum size is 10MB.' });
                }
                return res.status(400).json({ message: `Upload error: ${err.message}` });
            }
            return res.status(400).json({ message: err.message || 'Upload failed' });
        }

        try {
            if (!req.file) {
                console.error('Upload failed: No file in request');
                return res.status(400).json({ message: 'No file uploaded' });
            }
            console.log('File uploaded successfully:', req.file.filename);
            const fileUrl = `/uploads/${req.file.filename}`;
            res.json({ url: fileUrl, filename: req.file.filename });
        } catch (error: any) {
            console.error('Upload error:', error);
            res.status(500).json({ message: 'Upload failed', error: error.message });
        }
    });
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
    console.log('Production mode: Serving static files from:', frontendDistPath);
    console.log('Directory exists:', fs.existsSync(frontendDistPath));

    app.use(express.static(frontendDistPath, {
        maxAge: '1d',
        index: false // Don't serve index.html automatically, let our middleware handle it
    }));

    // Fallback for SPA routing - serve index.html for all non-API routes
    app.use((req, res, next) => {
        // Don't intercept API calls, uploads, or static assets
        if (req.path.startsWith('/api') ||
            req.path.startsWith('/uploads') ||
            req.path.startsWith('/assets') ||
            req.path.includes('.')) {  // Skip files with extensions (CSS, JS, images, etc.)
            return next();
        }
        console.log('Serving index.html for path:', req.path);
        res.sendFile(path.join(frontendDistPath, 'index.html'));
    });
} else {
    console.log('Development mode: Static files not served by Express');
}

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});
