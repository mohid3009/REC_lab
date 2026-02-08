import React, { useEffect, useState } from 'react';
import { FileText, Loader2, FileEdit, ArrowRight } from 'lucide-react';
import { api } from '../../utils/api';
import { Button } from '../Shared/UI/Button';
import { useNavigate } from 'react-router-dom';

interface Submission {
    _id: string;
    templateId: {
        _id: string;
        title: string;
    };
    experimentId?: {
        _id: string;
        title: string;
        classroomId: {
            name: string;
            courseCode: string;
        };
    };
    status: 'NOT_SUBMITTED' | 'SUBMITTED' | 'NEEDS_REVISION' | 'GRADED';
    submittedAt: string;
    grade?: number;
    feedback?: string;
    remarks?: string;
    isLocked?: boolean;
    gradedAt?: string;
}

const StudentSubmissions: React.FC = () => {
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        loadSubmissions();
    }, []);

    const loadSubmissions = async () => {
        try {
            const data = await api.getMySubmissions();
            setSubmissions(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center p-10">
                <Loader2 className="animate-spin text-gold w-8 h-8" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-subtle-gray p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="bg-ink text-white p-8 rounded-2xl shadow-xl mb-8 relative overflow-hidden group">
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-repeat"></div>
                    <div className="relative">
                        <h1 className="text-4xl font-serif font-bold tracking-tight !text-white">My Submissions</h1>
                        <p className="!text-white font-sans mt-1 tracking-wide">View your submitted experiments and grades</p>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-500 p-4 rounded-lg">
                        {error}
                    </div>
                )}

                {submissions.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-md p-12 text-center">
                        <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-serif font-bold text-ink mb-2">No experiments yet</h3>
                        <p className="text-gray-500">You haven't submitted any experiments yet</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
                        <div className="space-y-3">
                            {submissions.map((submission) => (
                                <div
                                    key={submission._id}
                                    className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h3 className="font-serif font-bold text-ink">
                                                {submission.experimentId?.title || submission.templateId?.title}
                                            </h3>
                                            {submission.experimentId?.classroomId && (
                                                <p className="text-sm text-gray-600 mt-1">
                                                    {submission.experimentId.classroomId.name} ({submission.experimentId.classroomId.courseCode})
                                                </p>
                                            )}
                                            <div className="flex items-center space-x-4 mt-2 text-xs">
                                                <span className="text-gray-500">
                                                    Submitted {new Date(submission.submittedAt).toLocaleDateString()}
                                                </span>
                                                <span className={`px-3 py-1 rounded-full font-bold uppercase tracking-wider ${submission.status === 'GRADED' ? 'bg-green-100 text-green-700' :
                                                    submission.status === 'NEEDS_REVISION' ? 'bg-yellow-100 text-yellow-700' :
                                                        submission.status === 'SUBMITTED' ? 'bg-blue-100 text-blue-700' :
                                                            'bg-gray-100 text-gray-600'
                                                    }`}>
                                                    {submission.status === 'GRADED' ? 'Graded' :
                                                        submission.status === 'NEEDS_REVISION' ? 'Needs Revision' :
                                                            submission.status === 'SUBMITTED' ? 'Submitted' :
                                                                'Not Submitted'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            {submission.grade !== undefined ? (
                                                <div className="space-y-1">
                                                    <div className="text-2xl font-bold text-green-700">
                                                        {submission.grade}/10
                                                    </div>
                                                    {submission.gradedAt && (
                                                        <div className="text-xs text-gray-500">
                                                            Graded {new Date(submission.gradedAt).toLocaleDateString()}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="text-sm text-gray-400">
                                                    Not graded yet
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Teacher Remarks for Revision */}
                                    {submission.remarks && submission.status === 'NEEDS_REVISION' && (
                                        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                            <div className="text-xs font-bold text-yellow-700 mb-1">TEACHER REMARKS</div>
                                            <div className="text-sm text-gray-700">{submission.remarks}</div>
                                        </div>
                                    )}

                                    {/* Feedback for Graded Submissions */}
                                    {submission.feedback && submission.status === 'GRADED' && (
                                        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                                            <div className="text-xs font-bold text-green-700 mb-1">TEACHER FEEDBACK</div>
                                            <div className="text-sm text-gray-700">{submission.feedback}</div>
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="mt-4 flex justify-end border-t border-gray-100 pt-4">
                                        {(submission.status === 'NEEDS_REVISION' || submission.status === 'NOT_SUBMITTED') && (
                                            <Button
                                                onClick={() => navigate(`/student/assignment/${submission.experimentId?._id}/fill`)}
                                                variant="secondary"
                                                size="sm"
                                                leftIcon={<FileEdit className="w-4 h-4" />}
                                            >
                                                {submission.status === 'NEEDS_REVISION' ? 'Edit & Resubmit' : 'Resume Draft'}
                                            </Button>
                                        )}
                                        {submission.status === 'SUBMITTED' && (
                                            <div className="text-xs text-gray-400 italic flex items-center">
                                                Awaiting teacher review <ArrowRight className="w-3 h-3 ml-1" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentSubmissions;
