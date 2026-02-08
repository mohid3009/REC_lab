import React, { useEffect, useState } from 'react';
import { BookOpen, Users, Loader2, Edit2, Trash2, X, Check } from 'lucide-react';
import { api } from '../../utils/api';
import { Card } from '../Shared/UI/Card';


interface Classroom {
    _id: string;
    name: string;
    description?: string;
    courseCode: string;
    code: string;
    enrolledStudents: any[];
    teacherId: any;
    createdAt: string;
}

const HODClassroomList: React.FC = () => {
    const [classrooms, setClassrooms] = useState<Classroom[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Modal & Action states
    const [editingClassroom, setEditingClassroom] = useState<Classroom | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Edit form state
    const [editForm, setEditForm] = useState({ name: '', description: '', courseCode: '' });

    useEffect(() => {
        loadClassrooms();
    }, []);

    const loadClassrooms = async () => {
        try {
            const data = await api.getClassrooms();
            setClassrooms(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = (classroom: Classroom) => {
        setEditingClassroom(classroom);
        setEditForm({
            name: classroom.name,
            description: classroom.description || '',
            courseCode: classroom.courseCode
        });
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingClassroom) return;

        setIsSaving(true);
        try {
            await api.updateClassroom(editingClassroom._id, editForm);
            setEditingClassroom(null);
            loadClassrooms();
        } catch (err: any) {
            alert('Failed to update: ' + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this classroom? This action cannot be undone.')) return;

        try {
            await api.deleteClassroom(id);
            loadClassrooms();
        } catch (err: any) {
            alert('Failed to delete: ' + err.message);
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
                    <div className="relative">
                        <h1 className="text-4xl font-serif font-bold tracking-tight text-white">Department Classrooms</h1>
                        <p className="text-white/60 font-sans mt-1 tracking-wide uppercase tracking-widest text-[10px] font-medium opacity-80">Overview of all classrooms in the department</p>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-500 p-4 rounded-lg">
                        {error}
                    </div>
                )}

                {classrooms.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-md p-12 text-center border-2 border-dashed border-accent/10">
                        <BookOpen className="w-16 h-16 text-accent/20 mx-auto mb-4" />
                        <h3 className="text-xl font-serif font-bold text-ink mb-2">No classrooms found</h3>
                        <p className="text-ink-light">Teachers haven't created any classrooms yet</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {classrooms.map((classroom) => {
                            return (
                                <Card key={classroom._id} hover className="p-6 flex flex-col h-full relative group">
                                    <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                        <button
                                            onClick={() => handleEditClick(classroom)}
                                            className="p-2 bg-white/80 text-ink-light hover:text-accent hover:bg-accent/10 rounded-lg border border-accent/10 shadow-sm"
                                            title="Edit Classroom"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(classroom._id)}
                                            className="p-2 bg-white/80 text-ink-light hover:text-red-500 hover:bg-red-500/10 rounded-lg border border-accent/10 shadow-sm"
                                            title="Delete Classroom"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="bg-ink -mx-6 -mt-6 p-6 rounded-t-xl mb-4">
                                        <div className="flex justify-between items-start">
                                            <div className="pr-12">
                                                <h3 className="font-serif font-bold text-xl text-white mb-1 group-hover:text-accent transition-colors">
                                                    {classroom.name}
                                                </h3>
                                                <span className="inline-block bg-white/10 text-white text-xs px-2 py-1 rounded font-mono border border-white/10">
                                                    {classroom.courseCode}
                                                </span>
                                            </div>
                                            <div className="bg-white/10 text-white px-2 py-1 rounded text-xs font-mono font-bold tracking-wider border border-white/20" title="Class Code">
                                                {classroom.code}
                                            </div>
                                        </div>
                                    </div>

                                    <p className="text-ink-light text-sm mb-6 flex-1 line-clamp-2 italic">
                                        {classroom.description || 'No description provided'}
                                    </p>

                                    <div className="pt-4 border-t border-accent/5 flex items-center justify-between text-sm text-ink-light">
                                        <div className="flex items-center space-x-2">
                                            <Users className="w-4 h-4 text-accent/50" />
                                            <span>{classroom.enrolledStudents?.length || 0} Students</span>
                                        </div>
                                        <div className="font-medium text-accent">
                                            {typeof classroom.teacherId === 'object' ? classroom.teacherId?.name : 'Unknown Teacher'}
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {editingClassroom && (
                <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-md p-6 bg-white shadow-2xl space-y-6 animate-fade-in-up border border-accent/10">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-serif font-bold text-ink">Edit Classroom</h2>
                            <button
                                onClick={() => setEditingClassroom(null)}
                                className="p-2 hover:bg-accent/5 rounded-full text-ink-light hover:text-ink"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleUpdate} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-ink/60">Classroom Name</label>
                                <input
                                    type="text"
                                    value={editForm.name}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full px-4 py-2 bg-accent/5 border border-accent/10 text-ink rounded-lg focus:ring-1 focus:ring-accent focus:border-transparent outline-none transition-all placeholder:text-ink/20 shadow-inner"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-ink/60">Course Code</label>
                                <input
                                    type="text"
                                    value={editForm.courseCode}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, courseCode: e.target.value }))}
                                    className="w-full px-4 py-2 bg-accent/5 border border-accent/10 text-ink rounded-lg focus:ring-1 focus:ring-accent focus:border-transparent outline-none transition-all uppercase font-mono placeholder:text-ink/20 shadow-inner"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-ink/60">Description</label>
                                <textarea
                                    value={editForm.description}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                                    className="w-full px-4 py-2 bg-accent/5 border border-accent/10 text-ink rounded-lg focus:ring-1 focus:ring-accent focus:border-transparent outline-none transition-all min-h-[100px] placeholder:text-ink/20 shadow-inner"
                                />
                            </div>

                            <div className="flex space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setEditingClassroom(null)}
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
                                    <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                                </button>
                            </div>
                        </form>
                    </Card>
                </div>
            )
            }
        </div >
    );
};

export default HODClassroomList;
