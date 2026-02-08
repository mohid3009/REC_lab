import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, FileText, Plus, X, School, FlaskConical, GraduationCap, Clock, Loader2 } from 'lucide-react';
import { api } from '../../utils/api';
import { Button } from '../Shared/UI/Button';
import { Card } from '../Shared/UI/Card';

interface StudentStats {
    totalClassrooms: number;
    totalExperiments: number;
    completedExperiments: number;
    pendingExperiments: number;
    averageGrade: string;
}

const StudentDashboard: React.FC = () => {
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [joinCode, setJoinCode] = useState('');
    const [joining, setJoining] = useState(false);
    const [error, setError] = useState('');
    const [stats, setStats] = useState<StudentStats | null>(null);
    const [loadingStats, setLoadingStats] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const data = await api.getStudentStats();
            setStats(data);
        } catch (err) {
            console.error('Failed to fetch stats:', err);
        } finally {
            setLoadingStats(false);
        }
    };

    const handleJoinClass = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!joinCode.trim()) return;

        setJoining(true);
        setError('');

        try {
            await api.joinClassroom(joinCode.trim());
            setShowJoinModal(false);
            setJoinCode('');
            // Navigate to classrooms list to see new class
            navigate('/student/classrooms');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setJoining(false);
        }
    };

    return (
        <div className="min-h-screen bg-paper p-6">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="bg-ink text-white p-8 rounded-2xl shadow-xl relative overflow-hidden group">
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-repeat"></div>
                    <div className="relative flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-serif font-bold tracking-tight !text-white">Student Dashboard</h1>
                            <p className="!text-white font-sans mt-1 tracking-wide uppercase tracking-widest text-[10px] font-medium opacity-80">Overview & Quick Actions</p>
                        </div>
                        <Button
                            onClick={() => setShowJoinModal(true)}
                            leftIcon={<Plus className="w-5 h-5" />}
                            className="bg-accent text-white hover:bg-accent-hover transform hover:-translate-y-1 transition-all shadow-lg hover:shadow-xl"
                        >
                            Join Class
                        </Button>
                    </div>
                </div>

                {/* Stats Grid */}
                {loadingStats ? (
                    <div className="flex justify-center p-8">
                        <Loader2 className="w-8 h-8 animate-spin text-gold" />
                    </div>
                ) : stats && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card className="bg-white p-6 flex items-center space-x-4 border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
                            <div className="p-3 bg-blue-50 rounded-full text-blue-600">
                                <School className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-wider font-bold text-gray-400">Classrooms</p>
                                <p className="text-2xl font-serif font-bold text-ink">{stats.totalClassrooms}</p>
                            </div>
                        </Card>

                        <Card className="bg-white p-6 flex items-center space-x-4 border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-shadow">
                            <div className="p-3 bg-purple-50 rounded-full text-purple-600">
                                <FlaskConical className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-wider font-bold text-gray-400">Experiments</p>
                                <div className="flex items-baseline space-x-1">
                                    <p className="text-2xl font-serif font-bold text-ink">{stats.completedExperiments}</p>
                                    <span className="text-xs text-gray-400">/ {stats.totalExperiments}</span>
                                </div>
                            </div>
                        </Card>

                        <Card className="bg-white p-6 flex items-center space-x-4 border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-shadow">
                            <div className="p-3 bg-green-50 rounded-full text-green-600">
                                <GraduationCap className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-wider font-bold text-gray-400">Avg Grade</p>
                                <div className="flex items-baseline space-x-1">
                                    <p className="text-2xl font-serif font-bold text-ink">{stats.averageGrade}</p>
                                    <span className="text-xs text-gray-400">/ 10</span>
                                </div>
                            </div>
                        </Card>

                        <Card className="bg-white p-6 flex items-center space-x-4 border-l-4 border-l-orange-500 shadow-sm hover:shadow-md transition-shadow">
                            <div className="p-3 bg-orange-50 rounded-full text-orange-600">
                                <Clock className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-wider font-bold text-gray-400">Pending</p>
                                <p className="text-2xl font-serif font-bold text-ink">{stats.pendingExperiments}</p>
                            </div>
                        </Card>
                    </div>
                )}

                {/* Quick Links */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Link to="/student/classrooms" className="group">
                        <Card hover className="h-full p-6 flex items-center justify-between bg-white border border-gray-100 hover:border-blue-200 transition-all shadow-sm hover:shadow-lg">
                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                                    <BookOpen className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-serif font-bold text-ink text-xl mb-1">My Classrooms</h3>
                                    <p className="text-sm text-gray-500">Access your enrolled courses and materials</p>
                                </div>
                            </div>
                        </Card>
                    </Link>

                    <Link to="/student/submissions" className="group">
                        <Card hover className="h-full p-6 flex items-center justify-between bg-white border border-gray-100 hover:border-purple-200 transition-all shadow-sm hover:shadow-lg">
                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-all duration-300">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-serif font-bold text-ink text-xl mb-1">My Submissions</h3>
                                    <p className="text-sm text-gray-500">View your grades, feedback, and history</p>
                                </div>
                            </div>
                        </Card>
                    </Link>
                </div>
            </div>

            {/* Join Class Modal */}
            {showJoinModal && (
                <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-fade-in-up border border-accent/10">
                        <div className="flex justify-between items-center mb-5">
                            <h3 className="text-xl font-serif font-bold text-ink">Join Classroom</h3>
                            <button
                                onClick={() => setShowJoinModal(false)}
                                className="text-ink-light hover:text-accent transition-colors p-1.5 hover:bg-accent/5 rounded-full"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleJoinClass} className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold text-ink/60 mb-1.5 uppercase tracking-widest text-center">Class Code</label>
                                <input
                                    type="text"
                                    value={joinCode}
                                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                    placeholder="000 000"
                                    maxLength={6}
                                    className="w-full px-4 py-3 bg-accent/5 border border-accent/10 rounded-xl focus:ring-1 focus:ring-accent focus:border-transparent outline-none uppercase font-mono font-bold tracking-[0.3em] text-center text-xl text-accent placeholder:tracking-normal placeholder:text-sm placeholder:text-accent/30 transition-all shadow-inner"
                                />
                                <p className="text-[10px] text-ink-light mt-2 text-center italic">Ask your teacher for the 6-character code</p>
                            </div>

                            {error && (
                                <div className="p-4 bg-red-50 text-red-600 text-sm rounded-xl flex items-center justify-center gap-2 border border-red-100">
                                    <span className="font-bold">Error:</span> {error}
                                </div>
                            )}

                            <div className="flex justify-center pt-2">
                                <Button
                                    type="submit"
                                    disabled={joining || !joinCode}
                                    isLoading={joining}
                                    variant="secondary"
                                    className="w-full"
                                >
                                    Join Class
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentDashboard;
