import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, FileText, Plus, X } from 'lucide-react';
import { api } from '../../utils/api';
import { Button } from '../Shared/UI/Button';
import { Card } from '../Shared/UI/Card';

const StudentDashboard: React.FC = () => {
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [joinCode, setJoinCode] = useState('');
    const [joining, setJoining] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

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
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="bg-ink text-white p-8 rounded-2xl shadow-xl mb-8 relative overflow-hidden group">
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-repeat"></div>
                    <div className="relative flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-serif font-bold tracking-tight !text-white">Student Dashboard</h1>
                            <p className="!text-white font-sans mt-1 tracking-wide uppercase tracking-widest text-[10px] font-medium">View your enrolled classrooms and experiments</p>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Link to="/student/classrooms">
                        <Card hover className="h-full flex items-center space-x-4 bg-blue-50/30 group">
                            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-sm border border-blue-200">
                                <BookOpen className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-serif font-bold text-ink text-lg mb-0.5">My Classrooms</h3>
                                <p className="text-xs text-ink-light">View enrolled classrooms</p>
                            </div>
                        </Card>
                    </Link>

                    <Link to="/student/submissions">
                        <Card hover className="h-full flex items-center space-x-4 bg-purple-50/30 group">
                            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-all duration-300 shadow-sm border border-purple-200">
                                <FileText className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-serif font-bold text-ink text-lg mb-0.5">My Submissions</h3>
                                <p className="text-xs text-ink-light">View grades and feedback</p>
                            </div>
                        </Card>
                    </Link>
                </div>

                <Card className="bg-white">
                    <h2 className="text-lg font-serif font-bold text-ink mb-3">Upcoming Experiments</h2>
                    <div className="p-6 text-center border border-dashed border-accent/10 rounded-xl bg-accent/5">
                        <p className="text-ink-light text-sm italic">No experiments due soon</p>
                    </div>
                </Card>
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
