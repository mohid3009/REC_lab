import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Plus, FileText, Loader2, UserPlus, ChevronRight, Edit2, Users, Copy, Check } from 'lucide-react';
import { api } from '../../utils/api';
import BatchManager from './BatchManager';

interface Classroom {
    _id: string;
    name: string;
    description?: string;
    courseCode: string;
    code: string;
    courseId?: {
        _id: string;
        title: string;
        department: string;
    };
    enrolledStudents: any[];
    teacherId: any;
}

interface Experiment {
    _id: string;
    title: string;
    description?: string;
    dueDate?: string;
    templateId: any;
    batchId?: {
        _id: string;
        name: string;
    };
    createdAt: string;
}

const ClassroomDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [classroom, setClassroom] = useState<Classroom | null>(null);
    const [experiments, setExperiments] = useState<Experiment[]>([]);
    const [loading, setLoading] = useState(true);
    const [enrollEmail, setEnrollEmail] = useState('');
    const [enrolling, setEnrolling] = useState(false);
    const [copied, setCopied] = useState(false);
    const [stats, setStats] = useState({ batchCount: 0, pendingReviews: 0, totalExperiments: 0 });

    useEffect(() => {
        if (id) {
            loadClassroom();
            loadExperiments();
            loadStats();
        }
    }, [id]);

    const loadClassroom = async () => {
        try {
            const data = await api.getClassroom(id!);
            setClassroom(data);
        } catch (err: any) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            const data = await api.getClassroomStats(id!);
            setStats(data);
        } catch (err: any) {
            console.error('Error loading stats:', err);
        }
    };

    const copyCode = () => {
        if (classroom?.code) {
            navigator.clipboard.writeText(classroom.code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const loadExperiments = async () => {
        try {
            const data = await api.getExperiments(id!);
            setExperiments(data);
        } catch (err: any) {
            console.error(err);
        }
    };

    const handleEnroll = async (e: React.FormEvent) => {
        e.preventDefault();
        setEnrolling(true);
        try {
            await api.enrollStudent(id!, enrollEmail);
            setEnrollEmail('');
            loadClassroom();
            loadStats();
        } catch (err: any) {
            alert('Failed to enroll student: ' + err.message);
        } finally {
            setEnrolling(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center p-10">
                <Loader2 className="animate-spin text-gold w-8 h-8" />
            </div>
        );
    }

    if (!classroom) {
        return <div className="p-8 text-center text-gray-500">Classroom not found</div>;
    }

    return (
        <div className="min-h-screen bg-subtle-gray p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="bg-ink text-white p-8 rounded-2xl shadow-xl mb-8 relative overflow-hidden group">
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-repeat"></div>
                    <div className="relative flex items-start justify-between">
                        <div className="space-y-4 flex-1">
                            <div>
                                <h1 className="text-4xl font-serif font-bold tracking-tight !text-white">{classroom.name}</h1>
                                <p className="!text-white font-mono italic mt-1">{classroom.courseCode}</p>
                            </div>

                            <div className="flex items-center space-x-4">
                                <div className="bg-white/5 border border-white/10 p-4 rounded-xl backdrop-blur-sm flex items-center space-x-8">
                                    <div>
                                        <p className="text-[10px] uppercase tracking-widest text-white/50 font-bold mb-1">Joining Code</p>
                                        <div className="flex items-center space-x-3">
                                            <div className="px-4 py-1.5 border-2 border-dashed border-white/20 rounded-lg bg-white/5">
                                                <span className="text-2xl font-mono font-bold text-white tracking-tighter">{classroom.code}</span>
                                            </div>
                                            <button
                                                onClick={copyCode}
                                                className={`p-2 rounded-lg transition-all ${copied ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10 border border-white/10'}`}
                                                title={copied ? 'Copied!' : 'Copy Joining Code'}
                                            >
                                                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="h-10 w-px bg-white/10"></div>

                                    <div className="text-center">
                                        <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-1">Students</p>
                                        <p className="text-2xl font-serif font-bold text-white leading-none">{classroom.enrolledStudents?.length || 0}</p>
                                    </div>

                                    <div className="h-10 w-px bg-white/10"></div>

                                    <div className="text-center">
                                        <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-1">Batches</p>
                                        <p className="text-2xl font-serif font-bold text-white leading-none">{stats.batchCount}</p>
                                    </div>

                                    <div className="h-10 w-px bg-white/10"></div>

                                    <div className="text-center relative">
                                        <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-1">To Review</p>
                                        <p className={`text-2xl font-serif font-bold leading-none ${stats.pendingReviews > 0 ? 'text-amber-400' : 'text-white'}`}>
                                            {stats.pendingReviews}
                                        </p>
                                        {stats.pendingReviews > 0 && (
                                            <div className="absolute -top-1 -right-2 w-2 h-2 bg-amber-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.5)]"></div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {classroom.description && (
                                <p className="text-white/70 max-w-2xl text-sm leading-relaxed">{classroom.description}</p>
                            )}
                        </div>
                        <div className="flex flex-col space-y-3">
                            <Link
                                to={`/teacher/classrooms/${id}/experiments/new`}
                                className="bg-accent text-white px-6 py-3 rounded-lg hover:bg-accent-hover transition-all shadow-md hover:shadow-lg font-bold flex items-center justify-center space-x-2 border border-white/10 uppercase tracking-widest text-xs"
                            >
                                <Plus className="w-5 h-5" />
                                <span>Create Experiment</span>
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Students */}
                    <div className="lg:col-span-1 bg-white rounded-xl shadow-md p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-serif font-bold text-ink">Students</h2>
                            <span className="text-sm text-gray-500">
                                {classroom.enrolledStudents?.length || 0} enrolled
                            </span>
                        </div>

                        <form onSubmit={handleEnroll} className="flex space-x-2">
                            <input
                                type="email"
                                value={enrollEmail}
                                onChange={(e) => setEnrollEmail(e.target.value)}
                                placeholder="student@email.com"
                                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-gold focus:border-transparent"
                            />
                            <button
                                type="submit"
                                disabled={enrolling}
                                className="bg-gold text-white px-4 py-2 rounded-lg hover:bg-gold/90 transition-all disabled:opacity-50"
                            >
                                {enrolling ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                            </button>
                        </form>

                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {classroom.enrolledStudents?.map((student: any) => (
                                <div key={student._id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                    <div>
                                        <div className="text-sm font-medium text-ink">{student.name}</div>
                                        <div className="text-xs text-gray-500">{student.email}</div>
                                    </div>
                                </div>
                            ))}
                            {(!classroom.enrolledStudents || classroom.enrolledStudents.length === 0) && (
                                <p className="text-sm text-gray-400 text-center py-4">No students enrolled yet</p>
                            )}
                        </div>
                    </div>

                    {/* Batch Management */}
                    <div className="lg:col-span-2 bg-beige rounded-xl shadow-md p-6">
                        <BatchManager
                            classroomId={id!}
                            students={classroom.enrolledStudents}
                        />
                    </div>

                    {/* Experiments */}
                    <div className="lg:col-span-2 bg-beige rounded-xl shadow-md p-6 space-y-4">
                        <h2 className="text-xl font-serif font-bold text-ink">Experiments</h2>

                        {experiments.length === 0 ? (
                            <div className="text-center py-12">
                                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500 mb-4">No experiments yet</p>
                                <Link
                                    to={`/teacher/classrooms/${id}/experiments/new`}
                                    className="inline-block bg-ink text-white px-6 py-2 rounded-lg hover:bg-black transition-all"
                                >
                                    Create First Experiment
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {experiments.map((experiment) => (
                                    <div className="block p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:border-gold hover:shadow-md transition-all group">
                                        <div className="flex items-start justify-between">
                                            <Link
                                                to={`/teacher/experiments/${experiment._id}/submissions`}
                                                className="flex-1"
                                            >
                                                <h3 className="font-serif font-bold text-ink">{experiment.title}</h3>
                                                {experiment.description && (
                                                    <p className="text-sm text-gray-600 mt-1">{experiment.description}</p>
                                                )}
                                                <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                                                    <span>Template: {experiment.templateId?.title || 'Unknown'}</span>
                                                    {experiment.batchId && (
                                                        <span className="flex items-center space-x-1 text-accent font-bold">
                                                            <Users className="w-3 h-3" />
                                                            <span>Batch: {experiment.batchId.name}</span>
                                                        </span>
                                                    )}
                                                    {experiment.dueDate && (
                                                        <span>Due: {new Date(experiment.dueDate).toLocaleDateString()}</span>
                                                    )}
                                                </div>
                                            </Link>
                                            <div className="flex items-center space-x-2">
                                                <Link
                                                    to={`/teacher/experiments/${experiment._id}/edit`}
                                                    className="p-2 text-gray-400 hover:text-accent transition-colors"
                                                    title="Edit Experiment"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </Link>
                                                <Link
                                                    to={`/teacher/experiments/${experiment._id}/submissions`}
                                                    className="p-2 text-gray-400 hover:text-accent transition-colors"
                                                >
                                                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div >
                        )}
                    </div >
                </div >
            </div >
        </div >
    );
};

export default ClassroomDetail;
