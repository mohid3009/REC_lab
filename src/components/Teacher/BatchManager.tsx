import React, { useState, useEffect } from 'react';
import { Loader2, Users, Plus, Trash2, Check, X, Edit2 } from 'lucide-react';
import { api } from '../../utils/api';
import { Button } from '../Shared/UI/Button';
import { Card } from '../Shared/UI/Card';

interface Student {
    _id: string;
    name: string;
    email: string;
}

interface Batch {
    _id: string;
    name: string;
    studentIds: any[]; // populated or IDs
}

interface BatchManagerProps {
    classroomId: string;
    students: Student[];
}

const BatchManager: React.FC<BatchManagerProps> = ({ classroomId, students }) => {
    const [batches, setBatches] = useState<Batch[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
    const [batchName, setBatchName] = useState('');
    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadBatches();
    }, [classroomId]);

    const loadBatches = async () => {
        try {
            const data = await api.getBatches(classroomId);
            setBatches(data);
        } catch (err) {
            console.error('Failed to load batches:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveBatch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!batchName.trim()) return;

        setSaving(true);
        try {
            if (editingBatch) {
                await api.updateBatch(editingBatch._id, {
                    name: batchName,
                    studentIds: selectedStudents
                });
            } else {
                await api.createBatch({
                    classroomId,
                    name: batchName,
                    studentIds: selectedStudents
                });
            }
            resetForm();
            loadBatches();
        } catch (err: any) {
            alert(`Error ${editingBatch ? 'updating' : 'creating'} batch: ` + err.message);
        } finally {
            setSaving(false);
        }
    };

    const resetForm = () => {
        setBatchName('');
        setSelectedStudents([]);
        setIsCreating(false);
        setEditingBatch(null);
    };

    const handleEditBatch = (batch: Batch) => {
        setEditingBatch(batch);
        setBatchName(batch.name);
        // Ensure studentIds are extracted as strings (IDs)
        const sIds = batch.studentIds.map(s => typeof s === 'string' ? s : s._id);
        setSelectedStudents(sIds);
        setIsCreating(true);
    };

    const handleDeleteBatch = async (batchId: string) => {
        if (!window.confirm('Are you sure you want to delete this batch?')) return;

        try {
            await api.deleteBatch(batchId);
            loadBatches();
        } catch (err: any) {
            alert('Error deleting batch: ' + err.message);
        }
    };

    const toggleStudent = (studentId: string) => {
        setSelectedStudents(prev =>
            prev.includes(studentId)
                ? prev.filter(id => id !== studentId)
                : [...prev, studentId]
        );
    };

    if (loading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="animate-spin text-accent w-6 h-6" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-serif font-bold text-ink">Student Batches</h2>
                    <p className="text-sm text-ink/40">Group students for targeted experiments</p>
                </div>
                {!isCreating && (
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setIsCreating(true)}
                        className="flex items-center space-x-2"
                    >
                        <Plus className="w-4 h-4" />
                        <span>New Batch</span>
                    </Button>
                )}
            </div>

            {isCreating && (
                <Card className="p-6 border-accent/20 bg-accent/5">
                    <form onSubmit={handleSaveBatch} className="space-y-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-ink flex items-center space-x-2">
                                <Users className="w-5 h-5 text-accent" />
                                <span>{editingBatch ? `Edit Batch: ${editingBatch.name}` : 'Create New Batch'}</span>
                            </h3>
                            <button
                                type="button"
                                onClick={resetForm}
                                className="text-ink/40 hover:text-ink"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-ink/60 mb-2">
                                Batch Name
                            </label>
                            <input
                                type="text"
                                value={batchName}
                                onChange={(e) => setBatchName(e.target.value)}
                                placeholder="e.g., Morning Batch, Honors Group"
                                className="w-full px-4 py-2 bg-white border border-accent/10 rounded-lg focus:ring-2 focus:ring-accent outline-none font-serif"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-ink/60 mb-2">
                                Select Students ({selectedStudents.length})
                            </label>
                            <div className="max-h-48 overflow-y-auto border border-accent/10 rounded-lg bg-white p-2 divide-y divide-gray-50">
                                {students.length === 0 ? (
                                    <p className="p-4 text-center text-sm text-ink/40 italic">No students enrolled yet</p>
                                ) : (
                                    students.map(student => (
                                        <div
                                            key={student._id}
                                            onClick={() => toggleStudent(student._id)}
                                            className={`
                                                flex items-center justify-between p-3 rounded-md cursor-pointer transition-colors
                                                ${selectedStudents.includes(student._id) ? 'bg-accent/10' : 'hover:bg-gray-50'}
                                            `}
                                        >
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-ink">{student.name}</span>
                                                <span className="text-[10px] text-ink/40">{student.email}</span>
                                            </div>
                                            {selectedStudents.includes(student._id) && (
                                                <Check className="w-4 h-4 text-accent" />
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="flex items-center space-x-3 pt-2">
                            <Button
                                type="submit"
                                disabled={saving || !batchName.trim()}
                                className="flex-1"
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingBatch ? 'Update Batch' : 'Create Batch')}
                            </Button>
                            <Button
                                variant="secondary"
                                onClick={resetForm}
                                type="button"
                            >
                                Cancel
                            </Button>
                        </div>
                    </form>
                </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {batches.length === 0 && !isCreating ? (
                    <div className="col-span-full py-12 text-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                        <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <h3 className="text-lg font-serif font-bold text-ink">No Batches Defined</h3>
                        <p className="text-sm text-ink/40 mb-4">Group students to assign different experiments to each group.</p>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setIsCreating(true)}
                        >
                            Create Your First Batch
                        </Button>
                    </div>
                ) : (
                    batches.map(batch => (
                        <Card key={batch._id} className="p-4 border-accent/10 hover:border-accent/30 hover:shadow-lg transition-all">
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <h4 className="text-lg font-serif font-bold text-ink">{batch.name}</h4>
                                    <div className="flex items-center space-x-2 text-[10px] font-bold uppercase tracking-widest text-accent">
                                        <Users className="w-3 h-3" />
                                        <span>{batch.studentIds.length} Students</span>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-1">
                                    <button
                                        onClick={() => handleEditBatch(batch)}
                                        className="p-2 text-ink/20 hover:text-accent transition-colors"
                                        title="Edit Batch"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteBatch(batch._id)}
                                        className="p-2 text-ink/20 hover:text-red-500 transition-colors"
                                        title="Delete Batch"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                                {batch.studentIds.slice(0, 3).map((s: any) => (
                                    <div key={s._id || s} className="text-[10px] bg-accent/5 text-ink/60 px-2 py-1 rounded border border-accent/10">
                                        {s.name || 'Student'}
                                    </div>
                                ))}
                                {batch.studentIds.length > 3 && (
                                    <div className="text-[10px] text-ink/40 px-2 py-1">
                                        +{batch.studentIds.length - 3} more
                                    </div>
                                )}
                            </div>
                        </Card>
                    ))
                )}
            </div>

        </div>
    );
};

export default BatchManager;
