import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Loader2, Eye, Users, FileText, Clock3, ArrowLeft } from 'lucide-react';
import { api } from '../../utils/api';

interface Student {
    _id: string;
    name: string;
    email: string;
}

interface Submission {
    _id: string;
    studentId: string | { _id: string; name: string; email: string };
    status: 'NOT_SUBMITTED' | 'SUBMITTED' | 'NEEDS_REVISION' | 'GRADED';
    submittedAt?: string;
    grade?: number;
    remarks?: string;
    isLocked: boolean;
}

interface Experiment {
    _id: string;
    title: string;
    description?: string;
    dueDate?: string;
    classroomId: {
        _id: string;
        name: string;
        enrolledStudents: Student[];
    };
    templateId: {
        _id: string;
        title: string;
    };
}

const ExperimentSubmissions: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [experiment, setExperiment] = useState<Experiment | null>(null);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (id) {
            loadData();
        }
    }, [id]);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Load experiment details
            const expData = await api.getExperiment(id!);
            console.log('Experiment loaded:', expData);
            setExperiment(expData);

            // Load submissions for this experiment
            const subData = await api.getSubmissionsByExperiment(id!);
            console.log('Submissions loaded:', subData);
            setSubmissions(subData);
        } catch (err: any) {
            console.error('Error loading data:', err);
            setError(err.message || 'Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    // Get student ID from submission (handles both populated and unpopulated)
    const getStudentIdFromSubmission = (sub: Submission): string => {
        if (typeof sub.studentId === 'string') {
            return sub.studentId;
        }
        return sub.studentId._id;
    };

    // Get submission for a specific student
    const getSubmissionForStudent = (studentId: string): Submission | undefined => {
        if (!studentId) return undefined;

        return submissions.find(sub => {
            const subStudentId = getStudentIdFromSubmission(sub);
            return String(subStudentId) === String(studentId);
        });
    };

    // Get status badge with proper styling
    const getStatusBadge = (status: string) => {
        const config: Record<string, { bg: string; text: string; label: string }> = {
            NOT_SUBMITTED: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Not Submitted' },
            SUBMITTED: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Submitted' },
            NEEDS_REVISION: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Needs Revision' },
            GRADED: { bg: 'bg-green-100', text: 'text-green-700', label: 'Graded' }
        };

        const style = config[status] || config.NOT_SUBMITTED;

        return (
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${style.bg} ${style.text}`}>
                {style.label}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <Loader2 className="animate-spin text-gold w-8 h-8" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-subtle-gray p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                        <p className="text-red-700 font-medium">{error}</p>
                        <button
                            onClick={() => navigate(-1)}
                            className="mt-4 text-sm text-red-600 hover:text-red-800"
                        >
                            Go Back
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!experiment) {
        return (
            <div className="min-h-screen bg-subtle-gray p-8">
                <div className="max-w-4xl mx-auto text-center text-gray-500">
                    Experiment not found
                </div>
            </div>
        );
    }

    const enrolledStudents = experiment.classroomId?.enrolledStudents || [];
    const submittedCount = submissions.filter(s => s.status !== 'NOT_SUBMITTED').length;

    return (
        <div className="min-h-screen bg-subtle-gray p-8">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="bg-ink text-white p-8 rounded-2xl shadow-xl mb-8 relative overflow-hidden group">
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-repeat"></div>
                    <div className="relative">
                        <Link
                            to={`/teacher/classrooms/${experiment.classroomId?._id}`}
                            className="text-sm text-accent hover:text-accent/80 font-medium mb-4 inline-flex items-center"
                        >
                            <ArrowLeft className="w-4 h-4 mr-1" />
                            Back to {experiment.classroomId?.name || 'Classroom'}
                        </Link>

                        <div className="flex items-start justify-between">
                            <div className="space-y-2">
                                <h1 className="text-3xl font-serif font-bold tracking-tight text-white">
                                    {experiment.title}
                                </h1>
                                {experiment.description && (
                                    <p className="text-white text-sm opacity-80">{experiment.description}</p>
                                )}
                                <div className="flex items-center space-x-4 text-xs text-white opacity-60">
                                    {experiment.dueDate && (
                                        <span className="flex items-center">
                                            <Clock3 className="w-4 h-4 mr-1" />
                                            Due: {new Date(experiment.dueDate).toLocaleDateString()}
                                        </span>
                                    )}
                                    <span className="flex items-center">
                                        <FileText className="w-4 h-4 mr-1" />
                                        Template: {experiment.templateId?.title || 'N/A'}
                                    </span>
                                </div>
                            </div>

                            <div className="text-right">
                                <div className="text-3xl font-serif font-bold text-white">
                                    {submittedCount} / {enrolledStudents.length}
                                </div>
                                <div className="text-[10px] uppercase tracking-widest text-white font-bold opacity-60">Submissions</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Submissions Table */}
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    <div className="p-6 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-serif font-bold text-ink flex items-center">
                                <Users className="w-5 h-5 mr-2" />
                                Student Submissions
                            </h2>
                            <span className="text-sm text-gray-500">
                                {enrolledStudents.length} students enrolled
                            </span>
                        </div>
                    </div>

                    {enrolledStudents.length === 0 ? (
                        <div className="p-12 text-center text-gray-400">
                            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>No students enrolled in this classroom yet</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                            Student
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                            Submitted
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                            Grade
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {enrolledStudents.map((student) => {
                                        const submission = getSubmissionForStudent(student._id);
                                        const status = submission?.status || 'NOT_SUBMITTED';

                                        return (
                                            <tr key={student._id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <div className="text-sm font-medium text-ink">{student.name}</div>
                                                        <div className="text-xs text-gray-500">{student.email}</div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {getStatusBadge(status)}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600">
                                                    {submission?.submittedAt
                                                        ? new Date(submission.submittedAt).toLocaleString()
                                                        : '-'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {submission?.grade !== undefined ? (
                                                        <span className="text-sm font-bold text-ink">
                                                            {submission.grade}/10
                                                        </span>
                                                    ) : (
                                                        <span className="text-sm text-gray-400">-</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    {submission && status !== 'NOT_SUBMITTED' ? (
                                                        <Link
                                                            to={`/teacher/submissions/${submission._id}/review`}
                                                            className="inline-flex items-center px-4 py-2 bg-ink text-white rounded-lg hover:bg-black transition-all text-sm font-medium"
                                                        >
                                                            <Eye className="w-4 h-4 mr-2" />
                                                            Review
                                                        </Link>
                                                    ) : (
                                                        <span className="text-xs text-gray-400 italic">Awaiting submission</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Debug Info */}
                <div className="bg-gray-800 text-green-400 rounded-xl p-4 text-xs font-mono">
                    <div>Experiment ID: {id}</div>
                    <div>Students: {enrolledStudents.length}</div>
                    <div>Submissions: {submissions.length}</div>
                    <div>Submitted: {submittedCount}</div>
                </div>
            </div>
        </div>
    );
};

export default ExperimentSubmissions;
