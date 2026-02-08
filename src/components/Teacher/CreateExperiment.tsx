import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle, Plus } from 'lucide-react';
import { api } from '../../utils/api';

interface Template {
    _id: string;
    title: string;
    isPublished: boolean;
}

const CreateExperiment: React.FC = () => {
    const { id: classroomId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [templateId, setTemplateId] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [batchId, setBatchId] = useState('');
    const [templates, setTemplates] = useState<Template[]>([]);
    const [batches, setBatches] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingTemplates, setLoadingTemplates] = useState(true);
    const [error, setError] = useState('');
    const [classroom, setClassroom] = useState<any>(null);

    useEffect(() => {
        const init = async () => {
            try {
                const classroomData = await api.getClassroom(classroomId!);
                setClassroom(classroomData);

                const templatesData = await api.getTemplates();
                const published = templatesData.filter((t: any) => t.isPublished);

                if (classroomData.courseId) {
                    // Filter templates belonging to this course
                    const cid = typeof classroomData.courseId === 'string'
                        ? classroomData.courseId
                        : classroomData.courseId._id;
                    setTemplates(published.filter((t: any) => t.courseId === cid));
                } else {
                    // Filter templates with no course (standalone/global)
                    setTemplates(published.filter((t: any) => !t.courseId));
                }

                const batchesData = await api.getBatches(classroomId!);
                setBatches(batchesData);
            } catch (err: any) {
                setError('Failed to load required data');
                console.error(err);
            } finally {
                setLoadingTemplates(false);
            }
        };
        init();
    }, [classroomId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await api.createExperiment({
                classroomId: classroomId || '',
                templateId,
                title,
                description,
                dueDate: dueDate || undefined,
                batchId: batchId || undefined
            });
            navigate(`/teacher/classrooms/${classroomId}`);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loadingTemplates) {
        return (
            <div className="flex justify-center p-10">
                <Loader2 className="animate-spin text-gold w-8 h-8" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-subtle-gray p-8">
            <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-xl shadow-md p-8 space-y-6">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-serif font-bold text-ink">Create Experiment</h1>
                        <p className="text-gray-500 font-sans">Assign a PDF form to your students as an experiment</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Experiment Title *
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent transition-all"
                                placeholder="e.g., Lab Report 1"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Select Template *
                            </label>
                            <select
                                value={templateId}
                                onChange={(e) => setTemplateId(e.target.value)}
                                required
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent transition-all"
                            >
                                <option value="">Choose a template...</option>
                                {templates.map((template) => (
                                    <option key={template._id} value={template._id}>
                                        {template.title}
                                    </option>
                                ))}
                            </select>
                            {templates.length === 0 && (
                                <p className="text-sm text-amber-600 mt-1">
                                    {classroom?.courseId
                                        ? "No templates found in this Master Course. Ask your HOD to add templates to the course directory."
                                        : "No global templates available. Ask your HOD to publish templates."
                                    }
                                </p>
                            )}
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
                                placeholder="Experiment instructions..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Due Date (Optional)
                            </label>
                            <input
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Target Batch (Optional)
                            </label>
                            <select
                                value={batchId}
                                onChange={(e) => setBatchId(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent transition-all"
                            >
                                <option value="">Entire Classroom (All Students)</option>
                                {batches.map((batch) => (
                                    <option key={batch._id} value={batch._id}>
                                        {batch.name} ({batch.studentIds.length} students)
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-500 mt-1">
                                Assign this experiment only to students in a specific batch.
                            </p>
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
                                disabled={loading || templates.length === 0}
                                className="flex-1 bg-ink text-white py-3 rounded-lg hover:bg-black transition-all disabled:opacity-50 flex items-center justify-center space-x-2 font-medium shadow-md hover:shadow-lg"
                            >
                                {loading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        <Plus className="w-5 h-5" />
                                        <span>Create Experiment</span>
                                    </>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate(`/teacher/classrooms/${classroomId}`)}
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

export default CreateExperiment;
