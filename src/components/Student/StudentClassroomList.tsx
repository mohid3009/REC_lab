import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Loader2, Calendar } from 'lucide-react';
import { api } from '../../utils/api';

interface Classroom {
    _id: string;
    name: string;
    description?: string;
    courseCode: string;
    teacherId: {
        name: string;
        email: string;
    };
}

interface Experiment {
    _id: string;
    title: string;
    description?: string;
    dueDate?: string;
    classroomId: {
        _id: string;
        name: string;
        courseCode: string;
    };
    templateId: {
        _id: string;
        title: string;
    };
}

const StudentClassroomList: React.FC = () => {
    const [classrooms, setClassrooms] = useState<Classroom[]>([]);
    const [experiments, setExperiments] = useState<Experiment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [classroomsData] = await Promise.all([
                api.getClassrooms()
            ]);
            setClassrooms(classroomsData);

            // Load experiments from all classrooms
            const allExperiments: Experiment[] = [];
            for (const classroom of classroomsData) {
                try {
                    const classroomExperiments = await api.getExperiments(classroom._id);
                    allExperiments.push(...classroomExperiments);
                } catch (err) {
                    console.error(`Failed to load experiments for classroom ${classroom._id}`);
                }
            }
            setExperiments(allExperiments);
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
                    <div className="relative">
                        <h1 className="text-4xl font-serif font-bold tracking-tight !text-white">My Classrooms</h1>
                        <p className="!text-white font-sans mt-1 tracking-wide uppercase tracking-widest text-[10px] font-medium">View your enrolled classrooms and experiments</p>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-500 p-4 rounded-lg">
                        {error}
                    </div>
                )}

                {/* Upcoming Experiments */}
                {experiments.length > 0 && (
                    <div className="bg-white rounded-xl shadow-md p-6 space-y-4 border border-accent/10">
                        <h2 className="text-2xl font-serif font-bold text-ink">Upcoming Experiments</h2>
                        <div className="space-y-3">
                            {experiments
                                .filter(a => !a.dueDate || new Date(a.dueDate) >= new Date())
                                .sort((a, b) => {
                                    if (!a.dueDate) return 1;
                                    if (!b.dueDate) return -1;
                                    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
                                })
                                .slice(0, 5)
                                .map((experiment) => (
                                    <Link
                                        key={experiment._id}
                                        to={`/student/assignment/${experiment._id}/fill`}
                                        className="block p-4 bg-accent/5 border border-accent/10 rounded-lg hover:border-accent hover:shadow-md transition-all group"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h3 className="font-serif font-bold text-ink group-hover:text-accent transition-colors">{experiment.title}</h3>
                                                <p className="text-sm text-ink-light mt-1">
                                                    {experiment.classroomId?.name} ({experiment.classroomId?.courseCode})
                                                </p>
                                                {experiment.description && (
                                                    <p className="text-sm text-ink-light mt-1 italic opacity-70">{experiment.description}</p>
                                                )}
                                            </div>
                                            {experiment.dueDate && (
                                                <div className="flex items-center space-x-2 text-sm text-accent bg-accent/10 px-3 py-1 rounded border border-accent/20">
                                                    <Calendar className="w-4 h-4" />
                                                    <span>Due {new Date(experiment.dueDate).toLocaleDateString()}</span>
                                                </div>
                                            )}
                                        </div>
                                    </Link>
                                ))}
                        </div>
                    </div>
                )}

                {/* Classrooms */}
                {classrooms.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-md p-12 text-center border-2 border-dashed border-accent/10">
                        <BookOpen className="w-16 h-16 text-accent/20 mx-auto mb-4" />
                        <h3 className="text-xl font-serif font-bold text-ink mb-2">No classrooms yet</h3>
                        <p className="text-ink-light">You haven't been enrolled in any classrooms yet</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-md p-6 space-y-4 border border-accent/10">
                        <h2 className="text-2xl font-serif font-bold text-ink">Enrolled Classrooms</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                                        to={`/student/classrooms/${classroom._id}`}
                                        className={`p-4 rounded-lg shadow-soft transition-all group border ${colorClass} hover:shadow-md hover:-translate-y-1 block`}
                                    >
                                        <div className="bg-ink -mx-4 -mt-4 p-4 rounded-t-lg mb-3">
                                            <h3 className="font-serif font-bold !text-white text-lg transition-colors">
                                                {classroom.name}
                                            </h3>
                                            <p className="text-xs text-white font-mono italic mt-1">
                                                {classroom.courseCode}
                                            </p>
                                        </div>
                                        {classroom.description && (
                                            <p className="text-sm text-ink-light mb-3 line-clamp-2 italic opacity-80">
                                                {classroom.description}
                                            </p>
                                        )}
                                        <div className="text-[10px] uppercase tracking-widest font-bold text-ink-light">
                                            Instructor: <span className="text-accent">{classroom.teacherId?.name}</span>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                )
                }
            </div>
        </div>
    );
};

export default StudentClassroomList;
