import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle, Plus } from 'lucide-react';
import { api } from '../../utils/api';

const CreateClassroom: React.FC = () => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [courseCode, setCourseCode] = useState('');
    const [courseId, setCourseId] = useState('');
    const [courses, setCourses] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [fetchingCourses, setFetchingCourses] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    React.useEffect(() => {
        const fetchCourses = async () => {
            try {
                const data = await api.getCourses();
                setCourses(data);
            } catch (err) {
                console.error('Failed to fetch courses:', err);
            } finally {
                setFetchingCourses(false);
            }
        };
        fetchCourses();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const classroom = await api.createClassroom({ name, description, courseCode, courseId });
            navigate(`/teacher/classrooms/${classroom._id}`);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-subtle-gray p-8">
            <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-xl shadow-md p-8 space-y-6">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-serif font-bold text-ink">Create Classroom</h1>
                        <p className="text-gray-500 font-sans">Set up a new classroom for your students</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Classroom Name *
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent transition-all"
                                placeholder="e.g., Computer Networks Lab"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Course Code *
                            </label>
                            <input
                                type="text"
                                value={courseCode}
                                onChange={(e) => setCourseCode(e.target.value.toUpperCase())}
                                required
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent transition-all"
                                placeholder="e.g., CS301"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Link to Master Course (Optional)
                            </label>
                            <select
                                value={courseId}
                                onChange={(e) => setCourseId(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent transition-all bg-white"
                                disabled={fetchingCourses}
                            >
                                <option value="">No Course (Standalone Classroom)</option>
                                {courses.map(course => (
                                    <option key={course._id} value={course._id}>{course.title} ({course.department})</option>
                                ))}
                            </select>
                            <p className="mt-1 text-xs text-slate-400">Linking allows access to HOD-curated templates stored in that course directory.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description (Optional)
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent transition-all resize-none"
                                placeholder="Brief description of the classroom..."
                            />
                        </div>

                        {error && (
                            <div className="flex items-center space-x-2 text-red-500 bg-red-50 p-3 rounded-lg">
                                <AlertCircle className="w-5 h-5" />
                                <span className="text-sm">{error}</span>
                            </div>
                        )}

                        <div className="flex items-center space-x-4 pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 bg-ink text-white py-3 rounded-lg hover:bg-black transition-all disabled:opacity-50 flex items-center justify-center space-x-2 font-medium shadow-md hover:shadow-lg"
                            >
                                {loading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        <Plus className="w-5 h-5" />
                                        <span>Create Classroom</span>
                                    </>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate('/teacher/dashboard')}
                                className="px-6 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-all font-medium"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateClassroom;
