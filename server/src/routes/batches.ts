import express, { Response } from 'express';
import Batch from '../models/Batch';
import Classroom from '../models/Classroom';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Create batch (Teacher only)
router.post('/', authenticate, requireRole('Teacher'), async (req: AuthRequest, res: Response) => {
    try {
        const { classroomId, name, studentIds } = req.body;

        if (!classroomId || !name) {
            return res.status(400).json({ message: 'Classroom ID and name are required' });
        }

        // Verify classroom exists and teacher owns it
        const classroom = await Classroom.findById(classroomId);
        if (!classroom) {
            return res.status(404).json({ message: 'Classroom not found' });
        }

        if (classroom.teacherId.toString() !== req.user!.id) {
            return res.status(403).json({ message: 'You can only create batches for your own classrooms' });
        }

        const batch = new Batch({
            name,
            classroomId,
            studentIds: studentIds || []
        });

        await batch.save();
        res.status(201).json(batch);
    } catch (error: any) {
        console.error('Create batch error:', error);
        res.status(500).json({ message: 'Error creating batch', error: error.message });
    }
});

// Get batches for a classroom
router.get('/classroom/:classroomId', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const classroom = await Classroom.findById(req.params.classroomId);
        if (!classroom) {
            return res.status(404).json({ message: 'Classroom not found' });
        }

        // Check access permissions
        const isTeacher = classroom.teacherId.toString() === req.user!.id;
        const isHOD = req.user!.role === 'HOD';
        const isEnrolled = classroom.enrolledStudents.some(
            (studentId) => studentId.toString() === req.user!.id
        );

        if (!isTeacher && !isHOD && !isEnrolled) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const batches = await Batch.find({ classroomId: req.params.classroomId })
            .populate('studentIds', 'name email')
            .sort({ name: 1 });

        res.json(batches);
    } catch (error: any) {
        console.error('Get batches error:', error);
        res.status(500).json({ message: 'Error fetching batches', error: error.message });
    }
});

// Update batch (Teacher only)
router.put('/:id', authenticate, requireRole('Teacher'), async (req: AuthRequest, res: Response) => {
    try {
        const { name, studentIds } = req.body;
        const batch = await Batch.findById(req.params.id);

        if (!batch) {
            return res.status(404).json({ message: 'Batch not found' });
        }

        const classroom = await Classroom.findById(batch.classroomId);
        if (classroom?.teacherId.toString() !== req.user!.id) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        if (name) batch.name = name;
        if (studentIds) batch.studentIds = studentIds;

        await batch.save();
        res.json(batch);
    } catch (error: any) {
        console.error('Update batch error:', error);
        res.status(500).json({ message: 'Error updating batch', error: error.message });
    }
});

// Delete batch (Teacher only)
router.delete('/:id', authenticate, requireRole('Teacher'), async (req: AuthRequest, res: Response) => {
    try {
        const batch = await Batch.findById(req.params.id);
        if (!batch) {
            return res.status(404).json({ message: 'Batch not found' });
        }

        const classroom = await Classroom.findById(batch.classroomId);
        if (classroom?.teacherId.toString() !== req.user!.id) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        await Batch.findByIdAndDelete(req.params.id);
        res.json({ message: 'Batch deleted successfully' });
    } catch (error: any) {
        console.error('Delete batch error:', error);
        res.status(500).json({ message: 'Error deleting batch', error: error.message });
    }
});

export default router;
