import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Edit, CheckCircle, XCircle, Loader2, Plus } from 'lucide-react';
import { api } from '../../utils/api';
import { Card } from '../Shared/UI/Card';

interface Template {
    _id: string;
    title: string;
    pdfUrl: string;
    pageCount: number;
    isPublished: boolean;
    createdAt: string;
    fields: any[];
}

const TemplateList: React.FC = () => {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadTemplates();
    }, []);

    const loadTemplates = async () => {
        try {
            const data = await api.getTemplates();
            setTemplates(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handlePublish = async (id: string, currentStatus: boolean) => {
        try {
            await api.updateTemplate(id, { isPublished: !currentStatus });
            loadTemplates();
        } catch (err: any) {
            alert('Failed to update template: ' + err.message);
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
                            <h1 className="text-4xl font-serif font-bold tracking-tight text-white">My Templates</h1>
                            <p className="text-white/60 font-sans mt-1 tracking-wide uppercase tracking-widest text-[10px] font-medium opacity-80">Manage your PDF form templates</p>
                        </div>
                        <Link
                            to="/hod/templates/new"
                            className="bg-accent text-white px-6 py-3 rounded-full font-bold hover:bg-accent-hover transition-all flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-1 border border-white/10"
                        >
                            <Plus className="w-5 h-5" />
                            <span>Create New Template</span>
                        </Link>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-500 p-4 rounded-lg">
                        {error}
                    </div>
                )}

                {templates.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-md p-12 text-center border-2 border-dashed border-accent/10">
                        <FileText className="w-16 h-16 text-accent/20 mx-auto mb-4" />
                        <h3 className="text-xl font-serif font-bold text-ink mb-2">No templates yet</h3>
                        <p className="text-ink-light mb-6">Create your first PDF form template to get started</p>
                        <Link
                            to="/hod/templates/new"
                            className="inline-block bg-accent text-white px-6 py-3 rounded-lg hover:bg-accent-hover transition-all font-bold shadow-md"
                        >
                            Create Template
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {templates.map((template) => {
                            return (
                                <Card
                                    key={template._id}
                                    className="p-6 space-y-4 flex flex-col group"
                                    hover
                                >
                                    <div className="bg-ink -mx-6 -mt-6 p-6 rounded-t-xl mb-4 group-hover:bg-black transition-colors">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <h3 className="font-serif font-bold text-white text-lg transition-colors">
                                                    {template.title}
                                                </h3>
                                                <p className="text-xs text-white/50 font-mono italic mt-1">
                                                    {template.pageCount} page{template.pageCount !== 1 ? 's' : ''} · {template.fields?.length || 0} fields
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex-1 flex flex-col justify-between space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="text-[10px] uppercase tracking-widest font-bold text-ink/40">
                                                Created {new Date(template.createdAt).toLocaleDateString()}
                                            </div>
                                            {template.isPublished ? (
                                                <span className="flex items-center space-x-1 text-emerald-600 text-[10px] uppercase font-bold tracking-widest bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">
                                                    <CheckCircle className="w-3 h-3" />
                                                    <span>Published</span>
                                                </span>
                                            ) : (
                                                <span className="flex items-center space-x-1 text-ink/40 text-[10px] uppercase font-bold tracking-widest bg-accent/5 px-2 py-1 rounded-full border border-accent/10">
                                                    <XCircle className="w-3 h-3" />
                                                    <span>Draft</span>
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-2 pt-2 border-t border-accent/5">
                                        <Link
                                            to={`/hod/templates/${template._id}/edit`}
                                            className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-accent/5 hover:bg-accent/10 text-accent rounded-lg transition-all text-sm font-medium border border-accent/10"
                                        >
                                            <Edit className="w-4 h-4" />
                                            <span>Edit</span>
                                        </Link>
                                        <button
                                            onClick={() => handlePublish(template._id, template.isPublished)}
                                            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition-all text-sm font-bold ${template.isPublished
                                                ? 'bg-accent/5 hover:bg-accent/10 text-ink-light border border-accent/10'
                                                : 'bg-accent hover:bg-accent-hover text-white shadow-md'
                                                }`}
                                        >
                                            {template.isPublished ? (
                                                <>
                                                    <XCircle className="w-4 h-4" />
                                                    <span>Unpublish</span>
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle className="w-4 h-4" />
                                                    <span>Publish</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TemplateList;
