import express, { Response } from 'express';
import mongoose from 'mongoose';
import Classroom from '../models/Classroom';
import User from '../models/User';
import Experiment from '../models/Experiment';
import Submission from '../models/Submission';
import Batch from '../models/Batch';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get specific classroom stats
router.get('/:id/stats', authenticate, requireRole('Teacher'), async (req: AuthRequest, res: Response) => {
    try {
        const classroomId = req.params.id;
        const experiments = await Experiment.find({ classroomId });
        const batchCount = await Batch.countDocuments({ classroomId });
        const experimentIds = experiments.map(e => e._id);

        const pendingReviews = await Submission.countDocuments({
            experimentId: { $in: experimentIds },
            status: 'SUBMITTED'
        });

        res.json({
            batchCount,
            pendingReviews,
            totalExperiments: experiments.length
        });
    } catch (error: any) {
        console.error('Classroom stats error:', error);
        res.status(500).json({ message: 'Error fetching classroom stats', error: error.message });
    }
});

// Get student dashboard stats
router.get('/stats/student', authenticate, requireRole('Student'), async (req: AuthRequest, res: Response) => {
    try {
        const studentId = req.user!.id;

        // 1. Get Enrolled Classrooms
        const classrooms = await Classroom.find({ enrolledStudents: studentId });
        const classroomIds = classrooms.map(c => c._id);

        // 2. Get Total Experiments in those classrooms
        const experiments = await Experiment.find({
            classroomId: { $in: classroomIds }
        });
        const totalExperiments = experiments.length;

        // 3. Get Student Submissions
        const submissions = await Submission.find({ studentId });

        // Calculate Completed (Unique experiments submitted)
        const completedExperimentIds = new Set(
            submissions
                .filter(s => s.experimentId)
                .map(s => s.experimentId!.toString())
        );
        const completedExperiments = completedExperimentIds.size;

        // Calculate Pending
        const pendingExperiments = totalExperiments - completedExperiments;

        // Calculate Average Grade
        const gradedSubmissions = submissions.filter(s => s.status === 'GRADED' && s.grade !== undefined);
        const totalGrade = gradedSubmissions.reduce((sum, s) => sum + (s.grade || 0), 0);
        const averageGrade = gradedSubmissions.length > 0
            ? (totalGrade / gradedSubmissions.length).toFixed(1)
            : '0';

        res.json({
            totalClassrooms: classrooms.length,
            totalExperiments,
            completedExperiments,
            pendingExperiments: Math.max(0, pendingExperiments),
            averageGrade
        });
    } catch (error: any) {
        console.error('Student stats error:', error);
        res.status(500).json({ message: 'Error fetching student stats', error: error.message });
    }
});

// Create classroom (Teacher only)
router.post('/', authenticate, requireRole('Teacher'), async (req: AuthRequest, res: Response) => {
    try {
        const { name, description, courseCode, courseId } = req.body;

        if (!name || !courseCode) {
            return res.status(400).json({ message: 'Name and course code are required' });
        }

        const classroom = new Classroom({
            name,
            description,
            courseCode,
            courseId: courseId || undefined,
            teacherId: req.user!.id,
            enrolledStudents: []
        });

        await classroom.save();
        res.status(201).json(classroom);
    } catch (error: any) {
        console.error('Create classroom error:', error);
        res.status(500).json({ message: 'Error creating classroom', error: error.message });
    }
});

// Get all classrooms (filtered by role)
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        let classrooms;

        if (req.user!.role === 'Teacher') {
            // Teachers see only their classrooms
            classrooms = await Classroom.find({ teacherId: req.user!.id })
                .populate('teacherId', 'name email')
                .populate('enrolledStudents', 'name email');
        } else if (req.user!.role === 'Student') {
            // Students see classrooms they're enrolled in
            classrooms = await Classroom.find({ enrolledStudents: req.user!.id })
                .populate('teacherId', 'name email')
                .populate('enrolledStudents', 'name email');
        } else {
            // HOD sees all classrooms
            classrooms = await Classroom.find()
                .populate('teacherId', 'name email')
                .populate('enrolledStudents', 'name email');
        }

        res.json(classrooms);
    } catch (error: any) {
        console.error('Get classrooms error:', error);
        res.status(500).json({ message: 'Error fetching classrooms', error: error.message });
    }
});

// Get teacher dashboard stats
router.get('/stats/teacher', authenticate, requireRole('Teacher'), async (req: AuthRequest, res: Response) => {
    try {
        const teacherId = req.user!.id;

        const [classrooms, experiments] = await Promise.all([
            Classroom.find({ teacherId }),
            Experiment.find({ createdBy: teacherId })
        ]);

        const totalClassrooms = classrooms.length;
        const totalExperiments = experiments.length;

        // Count unique students
        const studentIds = new Set();
        classrooms.forEach(c => {
            c.enrolledStudents.forEach(id => studentIds.add(id.toString()));
        });
        const totalStudents = studentIds.size;

        // Detailed Pending Submissions for Sidebar
        const experimentIds = experiments.map(e => e._id);
        const pendingSubmissions = await Submission.find({
            experimentId: { $in: experimentIds },
            status: 'SUBMITTED'
        })
            .populate('studentId', 'name email')
            .populate({
                path: 'experimentId',
                select: 'title classroomId',
                populate: {
                    path: 'classroomId',
                    select: 'name courseCode'
                }
            })
            .sort({ submittedAt: 1 })
            .limit(10);

        res.json({
            totalClassrooms,
            totalStudents,
            totalExperiments,
            pendingReviews: await Submission.countDocuments({
                experimentId: { $in: experimentIds },
                status: 'SUBMITTED'
            }),
            pendingSubmissions
        });
    } catch (error: any) {
        console.error('Teacher stats error:', error);
        res.status(500).json({ message: 'Error fetching teacher stats', error: error.message });
    }
});

// Get classroom by ID
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const classroom = await Classroom.findById(req.params.id)
            .populate('teacherId', 'name email')
            .populate('enrolledStudents', 'name email');

        if (!classroom) {
            return res.status(404).json({ message: 'Classroom not found' });
        }

        // Check access permissions
        const isTeacher = classroom.teacherId._id.toString() === req.user!.id;
        const isEnrolled = classroom.enrolledStudents.some(
            (student: any) => student._id.toString() === req.user!.id
        );
        const isHOD = req.user!.role === 'HOD';

        if (!isTeacher && !isEnrolled && !isHOD) {
            return res.status(403).json({ message: 'Access denied' });
        }

        res.json(classroom);
    } catch (error: any) {
        console.error('Get classroom error:', error);
        res.status(500).json({ message: 'Error fetching classroom', error: error.message });
    }
});

// Join classroom by code (Student only)
router.post('/join', authenticate, requireRole('Student'), async (req: AuthRequest, res: Response) => {
    try {
        const { code } = req.body;

        if (!code) {
            return res.status(400).json({ message: 'Classroom code is required' });
        }

        const classroom = await Classroom.findOne({ code: code.toUpperCase() });

        if (!classroom) {
            return res.status(404).json({ message: 'Invalid classroom code' });
        }

        // Check if already enrolled
        if (classroom.enrolledStudents.some(id => id.toString() === req.user!.id)) {
            return res.status(400).json({ message: 'You are already enrolled in this classroom' });
        }

        classroom.enrolledStudents.push(new mongoose.Types.ObjectId(req.user!.id));
        await classroom.save();

        const updatedClassroom = await Classroom.findById(classroom._id)
            .populate('teacherId', 'name email')
            .populate('enrolledStudents', 'name email');

        res.json(updatedClassroom);
    } catch (error: any) {
        console.error('Join classroom error:', error);
        res.status(500).json({ message: 'Error joining classroom', error: error.message });
    }
});

// Enroll student in classroom
router.post('/:id/enroll', authenticate, requireRole('Teacher'), async (req: AuthRequest, res: Response) => {
    try {
        const { studentEmail } = req.body;

        if (!studentEmail) {
            return res.status(400).json({ message: 'Student email is required' });
        }

        const classroom = await Classroom.findById(req.params.id);
        if (!classroom) {
            return res.status(404).json({ message: 'Classroom not found' });
        }

        // Verify teacher owns this classroom
        if (classroom.teacherId.toString() !== req.user!.id) {
            return res.status(403).json({ message: 'Only the classroom teacher can enroll students' });
        }

        // Find student by email
        const student = await User.findOne({ email: studentEmail, role: 'Student' });
        if (!student) {
            return res.status(404).json({ message: 'Student not found with that email' });
        }

        // Check if already enrolled
        if (classroom.enrolledStudents.some(id => id.toString() === student._id.toString())) {
            return res.status(400).json({ message: 'Student already enrolled' });
        }

        classroom.enrolledStudents.push(student._id);
        await classroom.save();

        const updatedClassroom = await Classroom.findById(classroom._id)
            .populate('teacherId', 'name email')
            .populate('enrolledStudents', 'name email');

        res.json(updatedClassroom);
    } catch (error: any) {
        console.error('Enroll student error:', error);
        res.status(500).json({ message: 'Error enrolling student', error: error.message });
    }
});

// Remove student from classroom
router.delete('/:id/students/:studentId', authenticate, requireRole('Teacher'), async (req: AuthRequest, res: Response) => {
    try {
        const classroom = await Classroom.findById(req.params.id);
        if (!classroom) {
            return res.status(404).json({ message: 'Classroom not found' });
        }

        // Verify teacher owns this classroom
        if (classroom.teacherId.toString() !== req.user!.id) {
            return res.status(403).json({ message: 'Only the classroom teacher can remove students' });
        }

        classroom.enrolledStudents = classroom.enrolledStudents.filter(
            (studentId) => studentId.toString() !== req.params.studentId
        );

        await classroom.save();

        const updatedClassroom = await Classroom.findById(classroom._id)
            .populate('teacherId', 'name email')
            .populate('enrolledStudents', 'name email');

        res.json(updatedClassroom);
    } catch (error: any) {
        console.error('Remove student error:', error);
        res.status(500).json({ message: 'Error removing student', error: error.message });
    }
});

// Update classroom
router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const classroom = await Classroom.findById(req.params.id);
        if (!classroom) {
            return res.status(404).json({ message: 'Classroom not found' });
        }

        // Only teacher owner or HOD can update
        if (classroom.teacherId.toString() !== req.user!.id && req.user!.role !== 'HOD') {
            return res.status(403).json({ message: 'Not authorized to update this classroom' });
        }

        const { name, description, courseCode } = req.body;
        if (name) classroom.name = name;
        if (description !== undefined) classroom.description = description;
        if (courseCode) classroom.courseCode = courseCode.toUpperCase();

        await classroom.save();
        res.json(classroom);
    } catch (error: any) {
        console.error('Update classroom error:', error);
        res.status(500).json({ message: 'Error updating classroom', error: error.message });
    }
});

// Delete classroom
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const classroom = await Classroom.findById(req.params.id);
        if (!classroom) {
            return res.status(404).json({ message: 'Classroom not found' });
        }

        // Only teacher owner or HOD can delete
        if (classroom.teacherId.toString() !== req.user!.id && req.user!.role !== 'HOD') {
            return res.status(403).json({ message: 'Not authorized to delete this classroom' });
        }

        await Classroom.findByIdAndDelete(req.params.id);
        res.json({ message: 'Classroom deleted successfully' });
    } catch (error: any) {
        console.error('Delete classroom error:', error);
        res.status(500).json({ message: 'Error deleting classroom', error: error.message });
    }
});

export default router;
