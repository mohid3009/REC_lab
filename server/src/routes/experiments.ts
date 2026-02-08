import express, { Response } from 'express';
import Experiment from '../models/Experiment';
import Classroom from '../models/Classroom';
import Template from '../models/Template';
import Batch from '../models/Batch';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Create experiment (Teacher only)
router.post('/', authenticate, requireRole('Teacher'), async (req: AuthRequest, res: Response) => {
    try {
        const { classroomId, templateId, title, description, dueDate, batchId } = req.body;

        if (!classroomId || !templateId || !title) {
            return res.status(400).json({
                message: 'Classroom ID, template ID, and title are required'
            });
        }

        // Verify classroom exists and teacher owns it
        const classroom = await Classroom.findById(classroomId);
        if (!classroom) {
            return res.status(404).json({ message: 'Classroom not found' });
        }

        if (classroom.teacherId.toString() !== req.user!.id) {
            return res.status(403).json({ message: 'You can only create experiments for your own classrooms' });
        }

        // Verify template exists and is published
        const template = await Template.findById(templateId);
        if (!template) {
            return res.status(404).json({ message: 'Template not found' });
        }

        if (!template.isPublished) {
            return res.status(400).json({ message: 'Template must be published before assigning' });
        }

        const experiment = new Experiment({
            classroomId,
            templateId,
            batchId: batchId || undefined,
            title,
            description,
            dueDate: dueDate ? new Date(dueDate) : undefined,
            createdBy: req.user!.id
        });

        await experiment.save();

        const populatedExperiment = await Experiment.findById(experiment._id)
            .populate('templateId', 'title pdfUrl pageCount')
            .populate('batchId', 'name')
            .populate('classroomId', 'name courseCode')
            .populate('createdBy', 'name email');

        res.status(201).json(populatedExperiment);
    } catch (error: any) {
        console.error('Create experiment error:', error);
        res.status(500).json({ message: 'Error creating experiment', error: error.message });
    }
});

// Get experiments for a classroom
router.get('/classroom/:classroomId', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const classroom = await Classroom.findById(req.params.classroomId);
        if (!classroom) {
            return res.status(404).json({ message: 'Classroom not found' });
        }

        // Check access permissions
        const isTeacher = classroom.teacherId.toString() === req.user!.id;
        const isEnrolled = classroom.enrolledStudents.some(
            (studentId) => studentId.toString() === req.user!.id
        );
        const isHOD = req.user!.role === 'HOD';

        if (!isTeacher && !isEnrolled && !isHOD) {
            return res.status(403).json({ message: 'Access denied' });
        }

        let query: any = { classroomId: req.params.classroomId };

        // If student, only show experiments they are assigned to (via batch or global)
        if (req.user!.role === 'Student') {
            const studentBatches = await Batch.find({
                classroomId: req.params.classroomId,
                studentIds: req.user!.id
            });
            const batchIds = studentBatches.map((b: any) => b._id);
            query.$or = [
                { batchId: { $exists: false } },
                { batchId: null },
                { batchId: { $in: batchIds } }
            ];
        }

        const experiments = await Experiment.find(query)
            .populate('templateId', 'title pdfUrl pageCount fields')
            .populate('batchId', 'name')
            .populate('classroomId', 'name courseCode')
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 });

        res.json(experiments);
    } catch (error: any) {
        console.error('Get experiments error:', error);
        res.status(500).json({ message: 'Error fetching experiments', error: error.message });
    }
});

// Get experiment by ID
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const experiment = await Experiment.findById(req.params.id)
            .populate('templateId', 'title pdfUrl pageCount fields dimensions')
            .populate({
                path: 'classroomId',
                select: 'name courseCode teacherId enrolledStudents',
                populate: {
                    path: 'enrolledStudents',
                    select: 'name email'
                }
            })
            .populate('createdBy', 'name email');

        if (!experiment) {
            return res.status(404).json({ message: 'Experiment not found' });
        }

        // Check access permissions
        const classroom = experiment.classroomId as any;
        const isTeacher = classroom.teacherId.toString() === req.user!.id;
        const isEnrolled = classroom.enrolledStudents.some(
            (student: any) => {
                const sId = student._id || student;
                return sId.toString() === req.user!.id;
            }
        );
        const isHOD = req.user!.role === 'HOD';

        if (!isTeacher && !isEnrolled && !isHOD) {
            return res.status(403).json({ message: 'Access denied' });
        }

        res.json(experiment);
    } catch (error: any) {
        console.error('Get experiment error:', error);
        res.status(500).json({ message: 'Error fetching experiment', error: error.message });
    }
});

// Update experiment (Teacher only)
router.put('/:id', authenticate, requireRole('Teacher'), async (req: AuthRequest, res: Response) => {
    try {
        const { title, description, dueDate, batchId } = req.body;
        const experiment = await Experiment.findById(req.params.id);

        if (!experiment) {
            return res.status(404).json({ message: 'Experiment not found' });
        }

        // Verify classroom exists and teacher owns it
        const classroom = await Classroom.findById(experiment.classroomId);
        if (!classroom) {
            return res.status(404).json({ message: 'Classroom not found' });
        }

        if (classroom.teacherId.toString() !== req.user!.id) {
            return res.status(403).json({ message: 'You can only update experiments for your own classrooms' });
        }

        // Update fields
        if (title) experiment.title = title;
        if (description !== undefined) experiment.description = description;
        if (dueDate !== undefined) experiment.dueDate = dueDate ? new Date(dueDate) : undefined;
        if (batchId !== undefined) experiment.batchId = batchId || undefined;

        await experiment.save();

        const updatedExperiment = await Experiment.findById(experiment._id)
            .populate('templateId', 'title pdfUrl pageCount')
            .populate('batchId', 'name')
            .populate('classroomId', 'name courseCode')
            .populate('createdBy', 'name email');

        res.json(updatedExperiment);
    } catch (error: any) {
        console.error('Update experiment error:', error);
        res.status(500).json({ message: 'Error updating experiment', error: error.message });
    }
});

export default router;
