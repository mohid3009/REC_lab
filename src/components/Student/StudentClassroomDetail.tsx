import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { BookOpen, FileText, Loader2, ChevronRight, Download, CheckCircle2, Clock3, AlertCircle } from 'lucide-react';
import { api } from '../../utils/api';
import { Button } from '../Shared/UI/Button';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

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
    templateId: {
        _id: string;
        title: string;
        pdfUrl: string;
        fields: any[];
    };
    createdAt: string;
}

interface Submission {
    _id: string;
    experimentId: string;
    status: string;
    grade?: number;
    feedback?: string;
    values: any;
    isLocked: boolean;
}

const StudentClassroomDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [classroom, setClassroom] = useState<Classroom | null>(null);
    const [experiments, setExperiments] = useState<Experiment[]>([]);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState<string | null>(null);

    useEffect(() => {
        if (id) {
            loadData();
        }
    }, [id]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [classroomData, experimentsData, submissionsData] = await Promise.all([
                api.getClassroom(id!),
                api.getExperiments(id!),
                api.getMySubmissions()
            ]);
            setClassroom(classroomData);
            setExperiments(experimentsData);
            setSubmissions(submissionsData);
        } catch (err: any) {
            console.error('Error loading student classroom data:', err);
        } finally {
            setLoading(false);
        }
    };

    const getSubmissionForExperiment = (expId: string) => {
        return submissions.find(s => s.experimentId === expId || (s.experimentId as any)?._id === expId);
    };

    const handleExportPdf = async (experiment: Experiment, submission: Submission) => {
        setExporting(experiment._id);
        try {
            const template = experiment.templateId;
            const existingPdfBytes = await fetch(template.pdfUrl).then(res => res.arrayBuffer());
            const pdfDoc = await PDFDocument.load(existingPdfBytes);
            const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
            const pages = pdfDoc.getPages();

            const values = submission.values instanceof Map
                ? Object.fromEntries(submission.values)
                : submission.values || {};

            for (const field of template.fields) {
                const val = values[field.id];
                if (val === undefined || val === '') continue;

                const pageIndex = field.page - 1;
                if (pageIndex < 0 || pageIndex >= pages.length) continue;

                const page = pages[pageIndex];
                const { height } = page.getSize();
                const fontSize = field.fontSize || 12;

                if (field.type === 'checkbox') {
                    if (val === true) {
                        page.drawText('X', {
                            x: field.x + (field.width * 0.2),
                            y: height - field.y - (field.height * 0.8),
                            size: field.height * 0.7,
                            font: helveticaFont,
                            color: rgb(0, 0, 0),
                        });
                    }
                } else {
                    const text = String(val);
                    page.drawText(text, {
                        x: field.x,
                        y: height - field.y - fontSize,
                        size: fontSize,
                        font: helveticaFont,
                        color: rgb(0, 0, 0),
                        maxWidth: field.width,
                    });
                }
            }

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${experiment.title}_Graded.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Error exporting PDF:', error);
            alert('Failed to export PDF');
        } finally {
            setExporting(null);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center p-10">
                <Loader2 className="animate-spin text-accent w-8 h-8" />
            </div>
        );
    }

    if (!classroom) {
        return <div className="p-8 text-center text-gray-500 font-serif">Classroom not found</div>;
    }

    return (
        <div className="min-h-screen bg-subtle-gray p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="bg-ink text-white p-8 rounded-2xl shadow-xl mb-8 relative overflow-hidden group">
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-repeat"></div>
                    <div className="relative">
                        <div className="flex items-start justify-between">
                            <div className="space-y-4">
                                <div>
                                    <h1 className="text-4xl font-serif font-bold tracking-tight !text-white">{classroom.name}</h1>
                                    <p className="!text-white font-mono italic mt-1 tracking-wider">{classroom.courseCode}</p>
                                </div>
                                <div className="flex items-center space-x-6">
                                    <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-lg backdrop-blur-sm">
                                        <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-0.5">Instructor</p>
                                        <p className="text-sm font-medium text-white">{classroom.teacherId.name}</p>
                                    </div>
                                    <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-lg backdrop-blur-sm">
                                        <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-0.5">Experiments</p>
                                        <p className="text-sm font-medium text-white">{experiments.length} Active</p>
                                    </div>
                                </div>
                            </div>
                            <BookOpen className="w-16 h-16 text-white/10 group-hover:text-white/20 transition-colors duration-500" />
                        </div>
                        {classroom.description && (
                            <div className="mt-6 pt-6 border-t border-white/10">
                                <p className="text-white/70 max-w-2xl text-sm leading-relaxed italic font-serif">"{classroom.description}"</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    {/* Experiments Section */}
                    <div className="bg-beige rounded-2xl shadow-md p-8 space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-serif font-bold text-ink flex items-center space-x-3">
                                <FileText className="w-6 h-6 text-accent" />
                                <span>Class Experiments</span>
                            </h2>
                        </div>

                        {experiments.length === 0 ? (
                            <div className="text-center py-16 bg-white/50 rounded-xl border-2 border-dashed border-accent/10">
                                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500 font-serif italic">No experiments have been assigned to this classroom yet.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {experiments.map((experiment) => {
                                    const sub = getSubmissionForExperiment(experiment._id);
                                    const status = sub?.status || 'NOT_SUBMITTED';
                                    const isGraded = status === 'GRADED';
                                    const isSubmitted = status === 'SUBMITTED' || status === 'GRADED';

                                    return (
                                        <div key={experiment._id} className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                                            <div className="flex items-start justify-between relative z-10">
                                                <div className="space-y-3 flex-1">
                                                    <div>
                                                        <h3 className="font-serif font-bold text-ink text-lg group-hover:text-accent transition-colors">{experiment.title}</h3>
                                                        {experiment.description && (
                                                            <p className="text-xs text-gray-500 mt-1 line-clamp-1 italic">{experiment.description}</p>
                                                        )}
                                                    </div>

                                                    <div className="flex flex-wrap gap-2">
                                                        {experiment.dueDate && (
                                                            <div className="flex items-center space-x-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                                                <Clock3 className="w-3 h-3" />
                                                                <span>Due {new Date(experiment.dueDate).toLocaleDateString()}</span>
                                                            </div>
                                                        )}
                                                        <div className={`flex items-center space-x-1.5 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${isGraded ? 'bg-green-100 text-green-700' :
                                                            status === 'SUBMITTED' ? 'bg-blue-100 text-blue-700' :
                                                                status === 'NEEDS_REVISION' ? 'bg-amber-100 text-amber-700' :
                                                                    'bg-gray-100 text-gray-500'
                                                            }`}>
                                                            {isGraded ? <CheckCircle2 className="w-3 h-3" /> :
                                                                status === 'NEEDS_REVISION' ? <AlertCircle className="w-3 h-3" /> : <Clock3 className="w-3 h-3" />}
                                                            <span>{status.replace('_', ' ')}</span>
                                                        </div>
                                                    </div>

                                                    {isGraded && sub?.grade !== undefined && (
                                                        <div className="pt-2 border-t border-gray-50">
                                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Result</p>
                                                            <div className="flex items-baseline space-x-1">
                                                                <span className="text-2xl font-serif font-bold text-green-600">{sub.grade}</span>
                                                                <span className="text-xs text-gray-400">/ 10</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex flex-col space-y-2 ml-4">
                                                    {!sub?.isLocked ? (
                                                        <Link
                                                            to={`/student/assignment/${experiment._id}/fill`}
                                                            className="flex items-center justify-center space-x-2 bg-ink text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-black transition-all shadow-sm"
                                                        >
                                                            <span>{isSubmitted ? 'View/Update' : 'Start Experiment'}</span>
                                                            <ChevronRight className="w-4 h-4" />
                                                        </Link>
                                                    ) : (
                                                        <div className="space-y-2">
                                                            {isGraded && (
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => handleExportPdf(experiment, sub)}
                                                                    isLoading={exporting === experiment._id}
                                                                    leftIcon={<Download className="w-4 h-4" />}
                                                                    className="w-full text-green-600 border-green-200 hover:bg-green-50"
                                                                >
                                                                    Export PDF
                                                                </Button>
                                                            )}
                                                            <Link
                                                                to={`/student/assignment/${experiment._id}/fill`}
                                                                className="flex items-center justify-center space-x-2 bg-gray-50 text-gray-400 px-4 py-2 rounded-lg text-xs font-bold border border-gray-100 cursor-not-allowed"
                                                            >
                                                                <span>Locked</span>
                                                            </Link>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            {/* Subtle art deco accent */}
                                            <div className="absolute top-0 right-0 w-16 h-16 bg-accent/5 -mr-8 -mt-8 rounded-full"></div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentClassroomDetail;
