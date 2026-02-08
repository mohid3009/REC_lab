import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FileText, Plus, Loader2, ChevronLeft, Users } from 'lucide-react';
import { api } from '../../utils/api';
import { Card } from '../Shared/UI/Card';


interface CourseDetail {
    _id: string;
    title: string;
    description?: string;
    department: string;
    templates: any[];
}

const CourseDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [course, setCourse] = useState<CourseDetail | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) loadCourseData();
    }, [id]);

    const loadCourseData = async () => {
        try {
            const data = await api.getCourse(id!);
            setCourse(data);
        } catch (err: any) {
            console.error('Failed to load course:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center p-10 h-screen items-center">
                <Loader2 className="animate-spin text-accent w-10 h-10" />
            </div>
        );
    }

    if (!course) return <div>Course not found</div>;

    return (
        <div className="min-h-screen bg-paper p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                <Link to="/hod/courses" className="inline-flex items-center text-ink-light hover:text-accent transition-colors space-x-1 group">
                    <ChevronLeft className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-medium">Back to Courses</span>
                </Link>

                <div className="bg-ink text-white p-8 rounded-2xl shadow-xl mb-8 relative overflow-hidden group">
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-repeat"></div>
                    <div className="relative flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-serif font-bold tracking-tight text-white" style={{ color: '#FFFFFF' }}>{course.title}</h1>
                            <p className="text-white/60 font-sans mt-1 tracking-wide uppercase tracking-widest text-[10px] font-medium opacity-80">{course.department} • Master Directory</p>
                        </div>
                        <Link
                            to={`/hod/templates/new?courseId=${course._id}`}
                            className="bg-accent text-white px-6 py-3 rounded-full font-bold hover:bg-accent-hover transition-all flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-1 border border-white/10"
                        >
                            <Plus className="w-5 h-5" />
                            <span>Add Template to Course</span>
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <section>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-2xl font-serif font-bold text-ink">Template Library</h2>
                                <span className="text-xs font-bold uppercase tracking-widest text-ink-light">{course.templates.length} Templates</span>
                            </div>

                            {course.templates.length === 0 ? (
                                <Card className="p-12 text-center border-2 border-dashed border-accent/10 bg-white">
                                    <FileText className="w-12 h-12 text-accent/20 mx-auto mb-4" />
                                    <h3 className="font-bold text-ink/60">Library is empty</h3>
                                    <p className="text-sm text-ink-light">Add templates to this course for teachers to use in their classrooms.</p>
                                </Card>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {course.templates.map((template) => (
                                        <Card key={template._id} className="p-4 flex items-center space-x-4 hover:border-accent/40 transition-colors group bg-white border-accent/5" hover>
                                            <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-accent/20 transition-colors">
                                                <FileText className="w-6 h-6 text-accent" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-ink truncate group-hover:text-accent transition-colors">{template.title}</h4>
                                                <p className="text-xs text-ink-light">{template.pageCount} Pages • {template.fields.length} Fields</p>
                                            </div>
                                            <Link
                                                to={`/hod/templates/${template._id}/edit`}
                                                className="p-2 text-ink-light hover:text-accent transition-colors"
                                            >
                                                <Plus className="w-5 h-5" />
                                            </Link>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>

                    <aside className="space-y-6">
                        <Card className="p-6 bg-surface border border-accent/10">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-ink/40 mb-4">Course Info</h3>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-xs text-ink-light uppercase tracking-tighter mb-1">Description</p>
                                    <p className="text-sm text-ink leading-relaxed font-serif italic">{course.description || 'No description provided.'}</p>
                                </div>
                                <div className="flex items-center space-x-3 text-ink-light">
                                    <Users className="w-4 h-4 text-accent/60" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">Shared Directory</span>
                                </div>
                            </div>
                        </Card>

                        <Card className="p-6 bg-surface text-ink border border-accent/20 shadow-lg shadow-accent/5">
                            <h3 className="font-serif font-bold text-lg mb-2 text-accent">HOD Controls</h3>
                            <p className="text-ink-light text-xs mb-4">All templates saved here will be automatically curated into the Course Directory for faculty use.</p>
                            <button className="w-full bg-accent/10 hover:bg-accent/20 text-accent text-xs font-bold py-3 rounded-lg transition-colors border border-accent/20 uppercase tracking-widest">
                                Move All to Shared
                            </button>
                        </Card>
                    </aside>
                </div>
            </div>
        </div>
    );
};

export default CourseDetail;
