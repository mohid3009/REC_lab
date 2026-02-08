import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle, Save, ArrowLeft } from 'lucide-react';
import { api } from '../../utils/api';

const EditExperiment: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [templateTitle, setTemplateTitle] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [batchId, setBatchId] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);
    const [batches, setBatches] = useState<any[]>([]);
    const [error, setError] = useState('');
    const [experiment, setExperiment] = useState<any>(null);

    useEffect(() => {
        const init = async () => {
            try {
                const data = await api.getExperiment(id!);
                setExperiment(data);
                setTitle(data.title);
                setDescription(data.description || '');
                setTemplateTitle(data.templateId?.title || 'Unknown Template');
                if (data.dueDate) {
                    setDueDate(new Date(data.dueDate).toISOString().split('T')[0]);
                }
                setBatchId(data.batchId?._id || '');

                const batchesData = await api.getBatches(data.classroomId._id);
                setBatches(batchesData);
            } catch (err: any) {
                setError('Failed to load experiment data');
                console.error(err);
            } finally {
                setLoadingData(false);
            }
        };
        init();
    }, [id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await api.updateExperiment(id!, {
                title,
                description,
                dueDate: dueDate || undefined,
                batchId: batchId || undefined
            });
            navigate(`/teacher/classrooms/${experiment.classroomId._id}`);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loadingData) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Loader2 className="animate-spin text-accent w-8 h-8" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-subtle-gray p-8">
            <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-xl shadow-md p-8 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-2">
                            <h1 className="text-3xl font-serif font-bold text-ink">Edit Experiment</h1>
                            <p className="text-gray-500 font-sans">Modify experiment details and deadlines</p>
                        </div>
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 text-gray-400 hover:text-ink transition-colors"
                            title="Back"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="p-4 bg-accent/5 rounded-lg border border-accent/10">
                        <p className="text-xs font-bold text-accent uppercase tracking-widest mb-1">Current Template</p>
                        <p className="text-sm font-medium text-ink">{templateTitle}</p>
                        <p className="text-[10px] text-ink/40 mt-1 italic">Note: The template cannot be changed for an existing experiment.</p>
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
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all"
                                placeholder="e.g., Lab Report 1"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description (Optional)
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={4}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all resize-none font-sans text-sm"
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
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Target Batch (Optional)
                            </label>
                            <select
                                value={batchId}
                                onChange={(e) => setBatchId(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all"
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
                            <div className="flex items-center space-x-2 text-red-500 bg-red-50 p-3 rounded-lg border border-red-100 animate-fade-in-up">
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
                                        <Save className="w-5 h-5" />
                                        <span>Save Changes</span>
                                    </>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate(-1)}
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

export default EditExperiment;
