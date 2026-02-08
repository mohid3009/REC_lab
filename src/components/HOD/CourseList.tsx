import React, { useEffect, useState } from 'react';
import { BookOpen, Plus, Loader2, X, Check, ArrowRight } from 'lucide-react';
import { api } from '../../utils/api';
import { Card } from '../Shared/UI/Card';
import { Link } from 'react-router-dom';

interface Course {
    _id: string;
    title: string;
    description?: string;
    department: string;
    createdBy: any;
    createdAt: string;
}

const CourseList: React.FC = () => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [newCourse, setNewCourse] = useState({ title: '', description: '', department: 'Computer Science' });

    useEffect(() => {
        loadCourses();
    }, []);

    const loadCourses = async () => {
        try {
            const data = await api.getCourses();
            setCourses(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await api.createCourse(newCourse);
            setShowCreateModal(false);
            setNewCourse({ title: '', description: '', department: 'Computer Science' });
            loadCourses();
        } catch (err: any) {
            alert('Failed to create course: ' + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center p-10 h-screen items-center">
                <Loader2 className="animate-spin text-accent w-10 h-10" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-paper p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="bg-ink text-white p-8 rounded-2xl shadow-xl mb-8 relative overflow-hidden group">
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-repeat"></div>
                    <div className="relative flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-serif font-bold tracking-tight text-white" style={{ color: '#FFFFFF' }}>Department Courses</h1>
                            <p className="text-white/60 font-sans mt-1 tracking-wide uppercase tracking-widest text-[10px] font-medium opacity-80">Master directory of courses and their template libraries</p>
                        </div>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="bg-accent text-white px-6 py-3 rounded-full font-bold hover:bg-accent-hover transition-all flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-1 border border-white/10"
                        >
                            <Plus className="w-5 h-5" />
                            <span>Create New Course</span>
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-500 p-4 rounded-lg">
                        {error}
                    </div>
                )}

                {courses.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-md p-12 text-center border-2 border-dashed border-accent/10">
                        <BookOpen className="w-16 h-16 text-accent/20 mx-auto mb-4" />
                        <h3 className="text-xl font-serif font-bold text-ink mb-2">No master courses found</h3>
                        <p className="text-ink-light">Create your first course directory to start managing templates.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {courses.map((course) => {
                            return (
                                <Link key={course._id} to={`/hod/courses/${course._id}`}>
                                    <Card hover className="p-6 flex flex-col h-full group">
                                        <div className="bg-ink -mx-6 -mt-6 p-6 rounded-t-xl mb-4 group-hover:bg-black transition-colors">
                                            <div className="flex justify-between items-start">
                                                <h3 className="font-serif font-bold text-xl text-white transition-colors" style={{ color: '#FFFFFF' }}>
                                                    {course.title}
                                                </h3>
                                                <div className="bg-accent/20 p-2 rounded-lg group-hover:bg-accent/30 transition-colors">
                                                    <ArrowRight className="w-5 h-5 text-accent" />
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-ink-light text-sm mb-6 flex-1 line-clamp-2 italic">
                                            {course.description || 'No description provided'}
                                        </p>
                                        <div className="pt-4 border-t border-accent/5 flex items-center justify-between text-xs text-ink/40">
                                            <span className="font-bold uppercase tracking-widest">{course.department}</span>
                                            <span>{new Date(course.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </Card>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-md p-6 bg-white shadow-2xl space-y-6 animate-fade-in-up border border-accent/10">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-serif font-bold text-ink">Create New Course</h2>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="p-2 hover:bg-accent/5 rounded-full text-ink-light hover:text-ink"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-ink/60">Course Title</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Advanced Web Development"
                                    value={newCourse.title}
                                    onChange={(e) => setNewCourse(prev => ({ ...prev, title: e.target.value }))}
                                    className="w-full px-4 py-2 bg-accent/5 border border-accent/10 text-ink rounded-lg focus:ring-1 focus:ring-accent focus:border-transparent outline-none transition-all placeholder:text-ink/20 shadow-inner"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-ink/60">Department</label>
                                <input
                                    type="text"
                                    value={newCourse.department}
                                    onChange={(e) => setNewCourse(prev => ({ ...prev, department: e.target.value }))}
                                    className="w-full px-4 py-2 bg-accent/5 border border-accent/10 text-ink rounded-lg focus:ring-1 focus:ring-accent focus:border-transparent outline-none transition-all placeholder:text-ink/20 shadow-inner"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-ink/60">Description</label>
                                <textarea
                                    placeholder="Brief overview of the course and its materials..."
                                    value={newCourse.description}
                                    onChange={(e) => setNewCourse(prev => ({ ...prev, description: e.target.value }))}
                                    className="w-full px-4 py-2 bg-accent/5 border border-accent/10 text-ink rounded-lg focus:ring-1 focus:ring-accent focus:border-transparent outline-none transition-all min-h-[100px] placeholder:text-ink/20 shadow-inner"
                                />
                            </div>

                            <div className="flex space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 px-4 py-2 text-ink-light font-medium hover:bg-accent/5 rounded-lg transition-all border border-accent/10"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex-1 bg-accent text-white font-bold px-4 py-2 rounded-lg hover:bg-accent-hover transition-all flex items-center justify-center space-x-2 disabled:opacity-50 shadow-md"
                                >
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                    <span>{isSaving ? 'Creating...' : 'Create Course'}</span>
                                </button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default CourseList;
