import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Users, Plus, Loader2 } from 'lucide-react';
import { api } from '../../utils/api';

interface Classroom {
    _id: string;
    name: string;
    description?: string;
    courseCode: string;
    code: string;
    enrolledStudents: any[];
    createdAt: string;
}

const ClassroomList: React.FC = () => {
    const [classrooms, setClassrooms] = useState<Classroom[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

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

    if (loading) {
        return (
            <div className="flex justify-center p-10">
                <Loader2 className="animate-spin text-accent w-8 h-8" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-paper p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="bg-ink text-white p-8 rounded-2xl shadow-xl mb-8 relative overflow-hidden group">
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-repeat"></div>
                    <div className="relative flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-serif font-bold tracking-tight text-white">My Classrooms</h1>
                            <p className="text-white/60 font-sans mt-1 tracking-wide">Manage your classrooms and experiments</p>
                        </div>
                        <Link
                            to="/teacher/classrooms/new"
                            className="bg-accent text-white px-6 py-2.5 rounded-lg hover:bg-accent-hover transition-all shadow-md hover:shadow-lg font-bold flex items-center space-x-2 border border-white/10 uppercase tracking-widest text-sm"
                        >
                            <Plus className="w-5 h-5" />
                            <span>Create Classroom</span>
                        </Link>
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
                        <h3 className="text-xl font-serif font-bold text-ink mb-2">No classrooms yet</h3>
                        <p className="text-ink-light mb-6">Create your first classroom to get started</p>
                        <Link
                            to="/teacher/classrooms/new"
                            className="inline-block bg-accent text-white px-6 py-3 rounded-lg hover:bg-accent-hover transition-all font-bold shadow-md"
                        >
                            Create Classroom
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {classrooms.map((classroom, index) => {
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
                                    className={`${colorClass} rounded-xl shadow-soft hover:shadow-lg transition-all p-6 space-y-4 group border`}
                                >
                                    <div className="bg-ink -mx-6 -mt-6 p-6 rounded-t-xl mb-4 group-hover:bg-black transition-colors">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-serif font-bold !text-white text-lg mb-1 transition-colors">
                                                    {classroom.name}
                                                </h3>
                                                <p className="text-sm text-white font-mono">
                                                    {classroom.courseCode}
                                                </p>
                                            </div>
                                            <div className="bg-white/10 text-white px-2 py-1 rounded text-xs font-mono font-bold tracking-wider border border-white/20" title="Class Code">
                                                {classroom.code}
                                            </div>
                                        </div>
                                    </div>

                                    {classroom.description && (
                                        <p className="text-sm text-ink-light line-clamp-2 italic opacity-80">
                                            {classroom.description}
                                        </p>
                                    )}

                                    <div className="flex items-center justify-between pt-2 border-t border-accent/5">
                                        <div className="flex items-center space-x-2 text-ink-light text-sm">
                                            <Users className="w-4 h-4 text-accent/50" />
                                            <span>{classroom.enrolledStudents?.length || 0} students</span>
                                        </div>
                                        <div className="text-[10px] text-ink-light opacity-50 uppercase font-bold tracking-widest">
                                            {new Date(classroom.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )
                }
            </div>
        </div>
    );
};

export default ClassroomList;
