import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, BookOpen, Users, Hash, Clock3, FileText, ChevronRight } from 'lucide-react';
import { api } from '../../utils/api';
import { Card } from '../Shared/UI/Card';

interface Classroom {
    _id: string;
    name: string;
    description?: string;
    courseCode: string;
    code: string;
    enrolledStudents: any[];
}

const TeacherDashboard: React.FC = () => {
    const [classrooms, setClassrooms] = useState<Classroom[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadDashboard = async () => {
            try {
                const [classroomsData, statsData] = await Promise.all([
                    api.getClassrooms(),
                    api.getTeacherStats()
                ]);
                setClassrooms(classroomsData);
                setStats(statsData);
            } catch (error) {
                console.error('Failed to load dashboard:', error);
            } finally {
                setLoading(false);
            }
        };
        loadDashboard();
    }, []);

    return (
        <div className="min-h-screen bg-paper p-6">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="bg-ink text-white p-8 rounded-2xl shadow-xl relative overflow-hidden group">
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-repeat"></div>
                    <div className="relative flex justify-between items-end">
                        <div className="space-y-1">
                            <h1 className="text-3xl font-serif font-bold tracking-tight !text-white">Teacher Dashboard</h1>
                            <p className="!text-white font-sans text-sm tracking-wide">Manage your classrooms and experiments</p>
                        </div>
                        <Link
                            to="/teacher/classrooms/new"
                            className="bg-accent text-white px-6 py-2.5 rounded-lg hover:bg-accent-hover transition-all shadow-md hover:shadow-lg font-bold flex items-center space-x-2 text-sm uppercase tracking-widest border border-white/10"
                        >
                            <Plus className="w-5 h-5" />
                            <span>Create Classroom</span>
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Main Content Area */}
                    <div className="lg:col-span-8 space-y-8">
                        {/* Stats Section */}
                        {!loading && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in-up">
                                <Card className="flex items-center space-x-4 bg-white border-blue-100/50" hover>
                                    <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20">
                                        <Users className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-blue-600/60 mb-1">Total Students</p>
                                        <h3 className="text-2xl font-serif font-bold text-ink">{stats?.totalStudents || 0}</h3>
                                    </div>
                                </Card>

                                <Card className="flex items-center space-x-4 bg-white border-purple-100/50" hover>
                                    <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center border border-purple-500/20">
                                        <BookOpen className="w-6 h-6 text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-purple-600/60 mb-1">Classrooms</p>
                                        <h3 className="text-2xl font-serif font-bold text-ink">{stats?.totalClassrooms || 0}</h3>
                                    </div>
                                </Card>

                                <Card className="flex items-center space-x-4 bg-white border-emerald-100/50" hover>
                                    <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20">
                                        <FileText className="w-6 h-6 text-emerald-600" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-emerald-600/60 mb-1">Experiments</p>
                                        <h3 className="text-2xl font-serif font-bold text-ink">{stats?.totalExperiments || 0}</h3>
                                    </div>
                                </Card>

                                <Card className="flex items-center space-x-4 bg-white border-rose-100/50" hover>
                                    <div className="w-12 h-12 bg-rose-500/10 rounded-xl flex items-center justify-center border border-rose-500/20">
                                        <Clock3 className="w-6 h-6 text-rose-600" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-rose-600/60 mb-1">Pending Review</p>
                                        <h3 className="text-2xl font-serif font-bold text-ink font-mono">{stats?.pendingReviews || 0}</h3>
                                    </div>
                                </Card>
                            </div>
                        )}

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-serif font-bold text-ink tracking-tight">Active Classrooms</h2>
                                <Link to="/teacher/classrooms" className="text-[10px] uppercase tracking-widest font-bold text-accent hover:text-accent-hover transition-colors">View All List</Link>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {loading ? (
                                    Array(2).fill(0).map((_, i) => (
                                        <div key={i} className="bg-surface p-4 rounded-xl shadow-md animate-pulse h-32"></div>
                                    ))
                                ) : (
                                    classrooms.map((classroom, index) => {
                                        const colors = [
                                            'bg-white border-blue-100/50 hover:border-blue-400/50',
                                            'bg-white border-purple-100/50 hover:border-purple-400/50',
                                            'bg-white border-emerald-100/50 hover:border-emerald-400/50',
                                            'bg-white border-amber-100/50 hover:border-amber-400/50',
                                            'bg-white border-rose-100/50 hover:border-rose-400/50'
                                        ];
                                        const colorClass = colors[index % colors.length];

                                        return (
                                            <Link
                                                key={classroom._id}
                                                to={`/teacher/classrooms/${classroom._id}`}
                                                className={`${colorClass} p-4 rounded-xl shadow-soft hover:shadow-lg transition-all group border`}
                                            >
                                                <div className="space-y-3">
                                                    <div className="bg-ink -mx-4 -mt-4 p-4 rounded-t-xl mb-4 group-hover:bg-black transition-colors">
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <h3 className="font-serif font-bold !text-white text-lg transition-colors">{classroom.name}</h3>
                                                                <p className="text-[10px] text-white font-mono italic">{classroom.courseCode}</p>
                                                            </div>
                                                            <div className="flex flex-col items-end">
                                                                <span className="text-[9px] uppercase tracking-widest text-white font-bold mb-0.5 opacity-60">Join Code</span>
                                                                <div className="bg-white/10 text-white px-2 py-0.5 rounded border border-white/20 font-mono font-bold text-xs tracking-widest flex items-center space-x-1">
                                                                    <Hash className="w-2.5 h-2.5" />
                                                                    <span>{classroom.code}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center space-x-4 text-[11px] text-ink/40 pt-3 border-t border-accent/5">
                                                        <div className="flex items-center space-x-1">
                                                            <Users className="w-3.5 h-3.5 mb-0.5 text-accent/50" />
                                                            <span>{classroom.enrolledStudents?.length || 0} Students</span>
                                                        </div>
                                                        <div className="flex items-center space-x-1">
                                                            <BookOpen className="w-3.5 h-3.5 mb-0.5 text-accent/50" />
                                                            <span>Manage</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Link>
                                        );
                                    })
                                )}

                                {!loading && classrooms.length === 0 && (
                                    <div className="col-span-full bg-white rounded-xl shadow-md p-10 text-center border-2 border-dashed border-accent/10">
                                        <BookOpen className="w-12 h-12 text-accent/20 mx-auto mb-3" />
                                        <h2 className="text-xl font-serif font-bold text-ink">No classrooms yet</h2>
                                        <p className="text-ink-light mt-1 mb-5 text-sm">Create your first classroom to start inviting students.</p>
                                        <Link
                                            to="/teacher/classrooms/new"
                                            className="inline-block bg-accent text-white px-6 py-2 rounded-lg hover:bg-accent-hover transition-all text-sm font-bold shadow-lg hover:shadow-xl uppercase tracking-widest"
                                        >
                                            Get Started
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar: Pending Reviews */}
                    <div className="lg:col-span-4 sticky top-6">
                        <Card className="bg-white border-accent/10 min-h-[500px] flex flex-col p-0 overflow-hidden">
                            <div className="bg-ink p-6 border-b border-white/5">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-serif font-bold !text-white tracking-tight">Pending Reviews</h2>
                                    <div className="bg-accent text-white px-2 py-0.5 rounded-full text-[10px] font-bold font-mono">
                                        {stats?.pendingReviews || 0}
                                    </div>
                                </div>
                                <p className="text-[10px] text-white uppercase tracking-widest mt-1 font-bold opacity-60">Action Required</p>
                            </div>

                            <div className="flex-1 overflow-y-auto max-h-[calc(100vh-300px)] custom-scrollbar">
                                {loading ? (
                                    <div className="p-6 space-y-4">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="animate-pulse flex items-center space-x-4">
                                                <div className="w-10 h-10 bg-accent/5 rounded-full" />
                                                <div className="flex-1 space-y-2">
                                                    <div className="h-3 bg-accent/5 rounded w-1/2" />
                                                    <div className="h-2 bg-accent/5 rounded w-3/4" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : stats?.pendingSubmissions?.length > 0 ? (
                                    <div className="divide-y divide-accent/5">
                                        {stats.pendingSubmissions.map((sub: any) => (
                                            <Link
                                                key={sub._id}
                                                to={`/teacher/submissions/${sub._id}/review`}
                                                className="block p-4 hover:bg-accent/[0.02] transition-colors group"
                                            >
                                                <div className="flex items-center space-x-4">
                                                    <div className="w-10 h-10 bg-ink text-white rounded-full flex items-center justify-center font-serif font-bold text-sm shadow-sm border border-white/10 group-hover:bg-accent transition-colors">
                                                        {(sub.studentId?.name || 'S').charAt(0)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-serif font-bold text-ink text-sm truncate group-hover:text-accent transition-colors">
                                                            {sub.studentId?.name}
                                                        </h4>
                                                        <p className="text-[10px] text-ink/40 font-mono truncate tracking-tight">
                                                            {sub.experimentId?.title}
                                                        </p>
                                                        <div className="flex items-center mt-1 space-x-2">
                                                            <span className="text-[9px] uppercase tracking-widest font-bold text-accent px-1.5 py-0.5 bg-accent/5 rounded leading-none">
                                                                {sub.experimentId?.classroomId?.courseCode}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <ChevronRight className="w-4 h-4 text-accent/20 group-hover:text-accent transition-all group-hover:translate-x-1" />
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-10 text-center space-y-3">
                                        <div className="w-16 h-16 bg-accent/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed border-accent/10">
                                            <Clock3 className="w-8 h-8 text-accent/20" />
                                        </div>
                                        <h3 className="text-ink/60 font-serif font-bold">All caught up!</h3>
                                        <p className="text-xs text-ink/30 px-6 font-medium">No pending submissions to review at the moment.</p>
                                    </div>
                                )}
                            </div>

                            {stats?.pendingSubmissions?.length > 0 && (
                                <div className="p-4 bg-paper/50 border-t border-accent/5">
                                    <p className="text-[9px] text-center text-ink/30 font-bold uppercase tracking-[0.2em]">Showing oldest 10 submissions</p>
                                </div>
                            )}
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TeacherDashboard;
