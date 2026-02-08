import express, { Response } from 'express';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import Course from '../models/Course';
import Template from '../models/Template';

const router = express.Router();

// Create a new course (HOD only)
router.post('/', authenticate, requireRole('HOD'), async (req: AuthRequest, res: Response) => {
    try {
        const { title, description, department } = req.body;
        const newCourse = new Course({
            title,
            description,
            department,
            createdBy: req.user!.id
        });
        await newCourse.save();
        res.status(201).json(newCourse);
    } catch (error) {
        console.error('Create course error:', error);
        res.status(500).json({ message: 'Error creating course', error });
    }
});

// Get all courses
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const courses = await Course.find().populate('createdBy', 'name email');
        res.json(courses);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching courses', error });
    }
});

// Get course by ID with templates
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const course = await Course.findById(req.params.id).populate('createdBy', 'name email');
        if (!course) return res.status(404).json({ message: 'Course not found' });

        // Fetch templates belonging to this course
        const templates = await Template.find({ courseId: course._id });

        res.json({
            ...course.toObject(),
            templates
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching course details', error });
    }
});

export default router;
