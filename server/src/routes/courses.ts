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

// Update a course (HOD only)
router.put('/:id', authenticate, requireRole('HOD'), async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { title, description, department } = req.body;

        const course = await Course.findByIdAndUpdate(
            id,
            { title, description, department },
            { new: true, runValidators: true }
        );

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        res.json(course);
    } catch (error) {
        console.error('Update course error:', error);
        res.status(500).json({ message: 'Error updating course', error });
    }
});

// Delete a course (HOD only)
router.delete('/:id', authenticate, requireRole('HOD'), async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        // Check if course exists
        const course = await Course.findById(id);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Delete associated templates first
        await Template.deleteMany({ courseId: id });

        // Delete the course
        await Course.findByIdAndDelete(id);

        res.json({ message: 'Course and associated templates deleted successfully' });
    } catch (error) {
        console.error('Delete course error:', error);
        res.status(500).json({ message: 'Error deleting course', error });
    }
});

export default router;
