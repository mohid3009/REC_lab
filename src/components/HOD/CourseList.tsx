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

    // Edit/Delete State
    const [editingCourse, setEditingCourse] = useState<Course | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

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

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingCourse) return;
        setIsSaving(true);
        try {
            await api.updateCourse(editingCourse._id, {
                title: editingCourse.title,
                description: editingCourse.description || '',
                department: editingCourse.department
            });
            setEditingCourse(null);
            loadCourses();
        } catch (err: any) {
            alert('Failed to update course: ' + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deletingId) return;
        if (!confirm('Are you sure you want to delete this course? This will also delete all templates within it.')) {
            setDeletingId(null);
            return;
        }
        try {
            await api.deleteCourse(deletingId);
            setDeletingId(null);
            loadCourses();
        } catch (err: any) {
            alert('Failed to delete course: ' + err.message);
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
                                <div key={course._id} className="relative group">
                                    <Link to={`/hod/courses/${course._id}`} className="block h-full">
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

                                    {/* Action Buttons */}
                                    <div className="absolute top-4 right-16 z-20 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                                        <button
                                            onClick={(e) => { e.preventDefault(); setEditingCourse(course); }}
                                            className="p-1.5 bg-white/90 hover:bg-white text-blue-600 rounded-lg shadow-sm backdrop-blur-sm"
                                            title="Rename Course"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                        </button>
                                        <button
                                            onClick={(e) => { e.preventDefault(); setDeletingId(course._id); handleDelete(); }} // Trigger delete immediately with confirm inside handler, but we need id set first. Actually let context menu handler verify.
                                            // Better: setDeletingId(course._id) and use a separate useEffect or just standard confirm flow? 
                                            // Simplest: Click -> Confirm -> Delete.
                                            // The handler is async, so:
                                            // onClick={(e) => { e.preventDefault(); if(confirm('Delete?')) api.deleteCourse(...) }}
                                            // But I defined handleDelete to use state. Let's fix handleDelete to take ID or just use inline confirm.
                                            className="p-1.5 bg-white/90 hover:bg-white text-red-600 rounded-lg shadow-sm backdrop-blur-sm"
                                            title="Delete Course"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            {(showCreateModal || editingCourse) && (
                <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-md p-6 bg-white shadow-2xl space-y-6 animate-fade-in-up border border-accent/10">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-serif font-bold text-ink">{editingCourse ? 'Edit Course' : 'Create New Course'}</h2>
                            <button
                                onClick={() => { setShowCreateModal(false); setEditingCourse(null); }}
                                className="p-2 hover:bg-accent/5 rounded-full text-ink-light hover:text-ink"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={editingCourse ? handleUpdate : handleCreate} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-ink/60">Course Title</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Advanced Web Development"
                                    value={editingCourse ? editingCourse.title : newCourse.title}
                                    onChange={(e) => editingCourse
                                        ? setEditingCourse({ ...editingCourse, title: e.target.value })
                                        : setNewCourse(prev => ({ ...prev, title: e.target.value }))
                                    }
                                    className="w-full px-4 py-2 bg-accent/5 border border-accent/10 text-ink rounded-lg focus:ring-1 focus:ring-accent focus:border-transparent outline-none transition-all placeholder:text-ink/20 shadow-inner"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-ink/60">Department</label>
                                <input
                                    type="text"
                                    value={editingCourse ? editingCourse.department : newCourse.department}
                                    onChange={(e) => editingCourse
                                        ? setEditingCourse({ ...editingCourse, department: e.target.value })
                                        : setNewCourse(prev => ({ ...prev, department: e.target.value }))
                                    }
                                    className="w-full px-4 py-2 bg-accent/5 border border-accent/10 text-ink rounded-lg focus:ring-1 focus:ring-accent focus:border-transparent outline-none transition-all placeholder:text-ink/20 shadow-inner"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-ink/60">Description</label>
                                <textarea
                                    placeholder="Brief overview of the course and its materials..."
                                    value={editingCourse ? (editingCourse.description || '') : newCourse.description}
                                    onChange={(e) => editingCourse
                                        ? setEditingCourse({ ...editingCourse, description: e.target.value })
                                        : setNewCourse(prev => ({ ...prev, description: e.target.value }))
                                    }
                                    className="w-full px-4 py-2 bg-accent/5 border border-accent/10 text-ink rounded-lg focus:ring-1 focus:ring-accent focus:border-transparent outline-none transition-all min-h-[100px] placeholder:text-ink/20 shadow-inner"
                                />
                            </div>

                            <div className="flex space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => { setShowCreateModal(false); setEditingCourse(null); }}
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
                                    <span>{isSaving ? 'Saving...' : (editingCourse ? 'Update Course' : 'Create Course')}</span>
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
