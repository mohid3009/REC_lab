import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Plus, Users, Clock3, Loader2, BookOpen } from 'lucide-react';
import { api } from '../../utils/api';
import { Card } from '../Shared/UI/Card';
interface DashboardStats {
    totalTemplates: number;
    totalClassrooms: number;
    totalStudents: number;
}

interface ActivityItem {
    id: string;
    type: 'template' | 'classroom';
    title: string;
    subtitle: string;
    date: string;
    user?: string;
}

const HODDashboard: React.FC = () => {
    const [stats, setStats] = useState<DashboardStats>({ totalTemplates: 0, totalClassrooms: 0, totalStudents: 0 });
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [coursesCount, setCoursesCount] = useState(0);
    const [recentClassrooms, setRecentClassrooms] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            const [templates, classrooms, courses] = await Promise.all([
                api.getTemplates(),
                api.getClassrooms(),
                api.getCourses()
            ]);

            // Calculate stats
            const totalStudents = classrooms.reduce((acc: number, c: any) => acc + (c.enrolledStudents?.length || 0), 0);
            setStats({
                totalTemplates: templates.length,
                totalClassrooms: classrooms.length,
                totalStudents
            });
            setCoursesCount(courses.length);

            // Set recent classrooms for the overview
            setRecentClassrooms(classrooms.slice(0, 5));

            // Process activities
            const templateActivities = templates.map((t: any) => ({
                id: t._id,
                type: 'template',
                title: t.title,
                subtitle: t.isPublished ? 'Published new template' : 'Created draft template',
                date: t.createdAt,
                user: 'System'
            }));

            const courseActivities = courses.map((c: any) => ({
                id: c._id,
                type: 'course',
                title: c.title,
                subtitle: `New master course directory created`,
                date: c.createdAt,
                user: c.createdBy?.name || 'HOD'
            }));

            const classroomActivities = classrooms.map((c: any) => ({
                id: c._id,
                type: 'classroom',
                title: c.name,
                subtitle: `Classroom created (${c.courseCode})`,
                date: c.createdAt,
                user: c.teacherId?.name || 'Teacher'
            }));

            const allActivities = [...templateActivities, ...courseActivities, ...classroomActivities]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 5);

            setActivities(allActivities);
        } catch (error) {
            console.error('Error loading dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center p-10 h-screen items-center">
                <Loader2 className="animate-spin text-gold w-10 h-10" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-paper p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="bg-ink text-white p-8 rounded-2xl shadow-xl mb-8 relative overflow-hidden group">
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-repeat"></div>
                    <div className="relative">
                        <h1 className="text-4xl font-serif font-bold tracking-tight text-white" style={{ color: '#FFFFFF' }}>HOD Dashboard</h1>
                        <p className="text-white font-sans mt-1 tracking-wide uppercase tracking-widest text-[10px] font-medium opacity-80">Overview of department activities</p>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="flex items-center space-x-3" hover>
                        <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center border border-blue-500/20">
                            <BookOpen className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-ink-light text-[10px] font-bold uppercase tracking-wider">Courses</p>
                            <h3 className="text-xl font-serif font-bold text-ink">{coursesCount}</h3>
                        </div>
                    </Card>

                    <Card className="flex items-center space-x-3" hover>
                        <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center border border-purple-500/20">
                            <FileText className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-ink-light text-[10px] font-bold uppercase tracking-wider">Templates</p>
                            <h3 className="text-xl font-serif font-bold text-ink">{stats.totalTemplates}</h3>
                        </div>
                    </Card>

                    <Card className="flex items-center space-x-3" hover>
                        <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center border border-emerald-500/20">
                            <Users className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-ink-light text-[10px] font-bold uppercase tracking-wider">Classrooms</p>
                            <h3 className="text-xl font-serif font-bold text-ink">{stats.totalClassrooms}</h3>
                        </div>
                    </Card>

                    <Card className="flex items-center space-x-3" hover>
                        <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center border border-amber-500/20">
                            <Users className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-ink-light text-[10px] font-bold uppercase tracking-wider">Total Students</p>
                            <h3 className="text-xl font-serif font-bold text-ink">{stats.totalStudents}</h3>
                        </div>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Actions & Activity */}
                    <div className="lg:col-span-2 space-y-6">
                        <div>
                            <h2 className="text-lg font-serif font-bold text-ink mb-3">Quick Actions</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Link to="/hod/courses">
                                    <Card className="h-full border-l-2 border-l-blue-500 hover:border-l-blue-400 transition-all bg-blue-50/30" hover>
                                        <div className="flex items-start space-x-3">
                                            <div className="bg-blue-100 p-2 rounded-lg">
                                                <BookOpen className="w-5 h-5 text-blue-600" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-sm text-ink mb-1">Manage Courses</h3>
                                                <p className="text-ink-light text-xs">Create template directories</p>
                                            </div>
                                        </div>
                                    </Card>
                                </Link>

                                <Link to="/hod/templates/new">
                                    <Card className="h-full border-l-2 border-l-purple-500 hover:border-l-purple-400 transition-all bg-purple-50/30" hover>
                                        <div className="flex items-start space-x-3">
                                            <div className="bg-purple-100 p-2 rounded-lg">
                                                <Plus className="w-5 h-5 text-purple-600" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-sm text-ink mb-1">Create Template</h3>
                                                <p className="text-ink-light text-xs">Design a new PDF form</p>
                                            </div>
                                        </div>
                                    </Card>
                                </Link>

                                <Link to="/hod/classrooms">
                                    <Card className="h-full border-l-2 border-l-emerald-500 hover:border-l-emerald-400 transition-all bg-emerald-50/30" hover>
                                        <div className="flex items-start space-x-3">
                                            <div className="bg-emerald-100 p-2 rounded-lg">
                                                <Users className="w-5 h-5 text-emerald-600" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-sm text-ink mb-1">Department View</h3>
                                                <p className="text-ink-light text-xs">Monitor faculty progress</p>
                                            </div>
                                        </div>
                                    </Card>
                                </Link>
                            </div>
                        </div>

                        {/* New Classrooms Overview Section */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <h2 className="text-lg font-serif font-bold text-ink">Classrooms Overview</h2>
                                <Link to="/hod/classrooms" className="text-xs text-accent hover:text-accent-hover font-medium">Manage All</Link>
                            </div>
                            <Card className="overflow-hidden border border-accent/10" noPadding>
                                <table className="w-full text-left">
                                    <thead className="bg-ink border-b border-white/10">
                                        <tr>
                                            <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white/40">Classroom</th>
                                            <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white/40">Teacher</th>
                                            <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white/40">Students</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-accent/5">
                                        {recentClassrooms.length === 0 ? (
                                            <tr>
                                                <td colSpan={3} className="px-6 py-8 text-center text-ink-light italic">No classrooms yet</td>
                                            </tr>
                                        ) : (
                                            recentClassrooms.map((classroom) => (
                                                <tr key={classroom._id} className="hover:bg-accent/5 transition-colors">
                                                    <td className="px-4 py-2">
                                                        <p className="font-bold text-sm text-ink">{classroom.name}</p>
                                                        <p className="text-[10px] text-ink-light font-mono">{classroom.courseCode}</p>
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <div className="flex items-center space-x-2">
                                                            <div className="w-6 h-6 bg-accent/10 rounded-full flex items-center justify-center">
                                                                <span className="text-[9px] font-bold text-accent">{(classroom.teacherId?.name || 'T')[0]}</span>
                                                            </div>
                                                            <span className="text-xs font-medium text-ink-light">{classroom.teacherId?.name || 'Unknown'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <span className="text-xs text-ink-light">{classroom.enrolledStudents?.length || 0} enrolled</span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </Card>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <h2 className="text-lg font-serif font-bold text-ink">Recent Activity</h2>
                                <button className="text-xs text-accent hover:text-accent-hover font-medium">View All</button>
                            </div>

                            <Card className="divide-y divide-accent/5 border border-accent/10" noPadding>
                                {activities.length === 0 ? (
                                    <div className="p-4 text-center border border-dashed border-accent/20 rounded-xl bg-accent/5 text-ink-light">
                                        No recent activity found
                                    </div>
                                ) : (
                                    activities.map((activity) => (
                                        <div key={`${activity.type}-${activity.id}`} className="p-3 flex items-start space-x-3 hover:bg-accent/5 transition-colors">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${activity.type === 'template' ? 'bg-orange-500/10 text-orange-500' : 'bg-blue-500/10 text-blue-500'
                                                }`}>
                                                {activity.type === 'template' ? <FileText className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-ink truncate">{activity.title}</p>
                                                <p className="text-[10px] text-ink-light">{activity.subtitle} • <span className="font-medium text-ink-light opacity-70">{activity.type === 'classroom' ? `Teacher: ${activity.user}` : activity.user}</span></p>
                                            </div>
                                            <div className="text-[10px] text-ink-light whitespace-nowrap flex items-center">
                                                <Clock3 className="w-3 h-3 mr-1" />
                                                {new Date(activity.date).toLocaleDateString()}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </Card>
                        </div>
                    </div>

                    {/* Sidebar / Secondary Info */}
                    <div className="space-y-4">
                        <Card className="bg-white text-ink border-accent/20 shadow-lg">
                            <h3 className="font-serif font-bold text-lg mb-1 text-accent">Department</h3>
                            <p className="text-ink-light text-xs mb-3">
                                High-level administration terminal
                            </p>
                            <div className="space-y-2">
                                <div className="flex justify-between text-[11px] border-b border-accent/5 pb-1.5">
                                    <span className="text-ink-light uppercase font-bold tracking-wider">Active Sem</span>
                                    <span className="font-bold text-accent">Spring 2026</span>
                                </div>
                                <div className="flex justify-between text-[11px] border-b border-accent/5 pb-1.5">
                                    <span className="text-ink-light uppercase font-bold tracking-wider">Dept</span>
                                    <span className="font-bold text-ink">CS Department</span>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HODDashboard;

