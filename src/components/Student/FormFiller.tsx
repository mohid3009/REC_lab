import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import PdfCanvas from '../Teacher/PdfCanvas';
import { Loader2, ArrowLeft, Download, Send } from 'lucide-react';
import { getDocument } from 'pdfjs-dist';
import clsx from 'clsx';
import type { PdfField } from '../../types';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

const FormFiller: React.FC = () => {
    const { assignmentId } = useParams<{ assignmentId: string }>();
    const { currentTemplate, fields, setTemplate, scale, setScale, isZooming, setIsZooming } = useStore();
    const [values, setValues] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [numPages, setNumPages] = useState<number>(0);
    const [submission, setSubmission] = useState<any>(null);
    const [experiment, setExperiment] = useState<any>(null);

    useEffect(() => {
        // Set default zoom to 120% for students
        setScale(1.2);
        if (assignmentId) {
            loadExperimentAndSubmission();
        }
    }, [assignmentId, setTemplate, setScale]);

    const loadExperimentAndSubmission = async () => {
        try {
            // Fetch experiment details
            const expResponse = await fetch(`/api/experiments/${assignmentId}`, {
                credentials: 'include'
            });
            const expData = await expResponse.json();
            setExperiment(expData);

            // Fetch template
            const templateResponse = await fetch(`/api/templates/${expData.templateId._id}`, {
                credentials: 'include'
            });
            const templateData = await templateResponse.json();
            setTemplate(templateData);

            // Check for existing submission
            const submissionsResponse = await fetch('/api/submissions/my', {
                credentials: 'include'
            });
            const submissions = await submissionsResponse.json();
            const existingSubmission = submissions.find((s: any) =>
                s.experimentId?._id === assignmentId || s.assignmentId === assignmentId
            );

            if (existingSubmission) {
                setSubmission(existingSubmission);
                // Convert Map to object if needed
                const submittedValues = existingSubmission.values instanceof Map
                    ? Object.fromEntries(existingSubmission.values)
                    : existingSubmission.values || {};
                setValues(submittedValues);
            }

            setLoading(false);
        } catch (err) {
            console.error('Error loading data:', err);
            setLoading(false);
        }
    };

    // Fetch PDF page count
    useEffect(() => {
        if (currentTemplate?.pdfUrl) {
            const fetchPdf = async () => {
                try {
                    const loadingTask = getDocument(currentTemplate.pdfUrl);
                    const pdf = await loadingTask.promise;
                    setNumPages(pdf.numPages);
                } catch (error) {
                    console.error("Error loading PDF for page count:", error);
                }
            };
            fetchPdf();
        }
    }, [currentTemplate]);

    const handleInputChange = (fieldId: string, value: any) => {
        // Prevent changes if submission is locked
        if (submission?.isLocked) return;
        setValues(prev => ({ ...prev, [fieldId]: value }));
    };

    const handleZoom = (newScale: number) => {
        setIsZooming(true);
        setScale(newScale);
        setTimeout(() => setIsZooming(false), 500);
    };

    const generatePdf = async () => {
        if (!currentTemplate) return;

        try {
            const existingPdfBytes = await fetch(currentTemplate.pdfUrl).then(res => res.arrayBuffer());
            const pdfDoc = await PDFDocument.load(existingPdfBytes);
            const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
            const pages = pdfDoc.getPages();

            for (const field of fields) {
                const val = values[field.id];
                if (val === undefined || val === '') continue;

                const pageIndex = field.page - 1;
                if (pageIndex < 0 || pageIndex >= pages.length) continue;

                const page = pages[pageIndex];
                const { height } = page.getSize();
                const fontSize = field.fontSize || 12;

                if (field.type === 'checkbox') {
                    if (val === true) {
                        // Draw an X for checked
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
            link.download = `${experiment?.title || currentTemplate.title}_filled.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            return true;
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Failed to generate PDF');
            return false;
        }
    };

    const renderInput = (field: PdfField) => {
        const style: React.CSSProperties = {
            position: 'absolute',
            left: field.x * scale,
            top: field.y * scale,
            width: field.width * scale,
            height: field.height * scale,
            fontSize: (field.fontSize || 12) * scale,
        };

        const commonClasses = "bg-white/60 border border-gray-200 focus:bg-white focus:border-gold focus:ring-1 focus:ring-gold/50 focus:outline-none transition-all rounded shadow-sm hover:shadow-md p-2 placeholder:text-gray-300 font-serif";

        switch (field.type) {
            case 'multiline':
                return (
                    <textarea
                        style={style}
                        className={clsx(commonClasses, "resize-none leading-relaxed")}
                        placeholder={field.label}
                        value={values[field.id] || ''}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        required={field.required}
                    />
                );
            case 'number':
                return (
                    <input
                        type="number"
                        style={style}
                        className={commonClasses}
                        placeholder={field.label}
                        value={values[field.id] || ''}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        required={field.required}
                    />
                );
            case 'date':
                return (
                    <input
                        type="date"
                        style={style}
                        className={clsx(commonClasses, "appearance-none")}
                        value={values[field.id] || ''}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        required={field.required}
                    />
                );
            case 'checkbox':
                return (
                    <div
                        style={style}
                        className="flex items-center justify-center"
                    >
                        <input
                            type="checkbox"
                            className="w-full h-full cursor-pointer accent-gold border-gray-300 rounded focus:ring-gold"
                            checked={!!values[field.id]}
                            onChange={(e) => handleInputChange(field.id, e.target.checked)}
                            required={field.required}
                        />
                    </div>
                );
            default:
                return (
                    <input
                        type="text"
                        style={style}
                        className={commonClasses}
                        placeholder={field.label}
                        value={values[field.id] || ''}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        required={field.required}
                    />
                );
        }
    };

    const handleSave = async (submitFn: boolean = false) => {
        if (!currentTemplate || !experiment) return;

        // If submitting, validate required fields
        if (submitFn) {
            const missing = currentTemplate.fields?.filter(f => f.required && !values[f.id]);
            if (missing && missing.length > 0) {
                alert(`Please fill all required fields: ${missing.map(f => f.label).join(', ')}`);
                return;
            }
        }

        setSubmitting(true);
        try {
            const method = submission ? 'PUT' : 'POST';
            const url = submission ? `/api/submissions/${submission._id}` : '/api/submissions';

            // Determine status: 
            // - If submitting: 'SUBMITTED'
            // - If saving: Keep current status, or 'NOT_SUBMITTED' if new
            let newStatus = submission?.status || 'NOT_SUBMITTED';
            if (submitFn) {
                newStatus = 'SUBMITTED';
            }

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    experimentId: assignmentId,
                    templateId: currentTemplate._id,
                    values: values,
                    status: newStatus
                })
            });

            if (!response.ok) throw new Error('Failed to save submission');

            const updatedSubmission = await response.json();
            setSubmission(updatedSubmission);

            if (submitFn) {
                alert('Submission submitted successfully! Your teacher will review it.');
            } else {
                // Optional: Toast notification for auto-save/manual save
                // alert('Draft saved successfully.'); 
            }

            await loadExperimentAndSubmission();
        } catch (e) {
            console.error('Submission error:', e);
            alert('Error saving response');
        } finally {
            setSubmitting(false);
        }
    };

    const handleExportPdf = async () => {
        const success = await generatePdf();
        if (success) {
            alert('PDF downloaded successfully!');
        }
    };

    if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-gold" /></div>;
    if (!currentTemplate) return <div>Form not found</div>;

    const isLocked = submission?.isLocked;
    const status = submission?.status || 'NOT_SUBMITTED';
    const canExport = status === 'GRADED' && isLocked;

    // derived display values
    const courseName = experiment?.classroomId?.name || 'Course';
    const experimentTitle = experiment?.title || currentTemplate.title;

    return (
        <div className="flex h-screen bg-[#FDFCFB] overflow-hidden">
            {/* Left Panel - Beige Sidebar */}
            <aside className="w-80 bg-[#F9F7F1] border-r border-[#E8E6DE] flex flex-col z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
                {/* Panel Header */}
                <div className="p-6 border-b border-[#E8E6DE]">
                    <div className="flex items-center text-gray-400 mb-4 hover:text-ink transition-colors cursor-pointer w-fit" onClick={() => window.history.back()}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        <span className="text-xs font-bold uppercase tracking-wider">Back</span>
                    </div>

                    <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">{courseName}</h2>
                    <h1 className="font-serif text-2xl font-bold text-ink leading-tight">{experimentTitle}</h1>

                    <div className="mt-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${status === 'GRADED' ? 'bg-green-100 text-green-700' :
                                status === 'NEEDS_REVISION' ? 'bg-yellow-100 text-yellow-700' :
                                    status === 'SUBMITTED' ? 'bg-blue-100 text-blue-700' :
                                        'bg-gray-100 text-gray-600'
                            }`}>
                            {status === 'GRADED' ? 'Graded' :
                                status === 'NEEDS_REVISION' ? 'Needs Revision' :
                                    status === 'SUBMITTED' ? 'Submitted' :
                                        'Draft'}
                        </span>
                    </div>
                </div>

                {/* Panel Content - Scrollable */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Teacher Remarks / Feedback */}
                    {(submission?.remarks || submission?.feedback) && (
                        <div className="space-y-4">
                            {submission.remarks && status === 'NEEDS_REVISION' && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 shadow-sm">
                                    <h3 className="text-xs font-bold text-yellow-800 uppercase tracking-wide mb-2 flex items-center">
                                        <div className="w-2 h-2 rounded-full bg-yellow-500 mr-2" />
                                        Teacher Remarks
                                    </h3>
                                    <p className="text-sm text-gray-700 leading-relaxed italic">"{submission.remarks}"</p>
                                </div>
                            )}

                            {submission.feedback && status === 'GRADED' && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4 shadow-sm">
                                    <h3 className="text-xs font-bold text-green-800 uppercase tracking-wide mb-2 flex items-center">
                                        <div className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                                        Feedback
                                    </h3>
                                    <p className="text-sm text-gray-700 leading-relaxed italic">"{submission.feedback}"</p>
                                    {submission.grade !== undefined && (
                                        <div className="mt-3 pt-3 border-t border-green-200 flex justify-between items-center">
                                            <span className="text-xs font-bold text-green-700 uppercase">Grade</span>
                                            <span className="font-serif font-bold text-xl text-green-900">{submission.grade}/10</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Details / Instructions Placeholder */}
                    <div className="bg-white border border-[#E8E6DE] rounded-lg p-4 shadow-sm">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Details</h3>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Page Count</span>
                                <span className="font-medium text-ink">{numPages} Pages</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Submissions</span>
                                <span className="font-medium text-ink">{submission?.submittedAt ? '1' : '0'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Panel Footer - Actions */}
                <div className="p-6 bg-white border-t border-[#E8E6DE] space-y-3 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] z-30">
                    {!isLocked ? (
                        <>
                            <button
                                onClick={() => handleSave(false)}
                                disabled={submitting}
                                className="w-full flex items-center justify-center space-x-2 bg-white border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-all font-medium disabled:opacity-50"
                            >
                                <Save className="w-4 h-4" />
                                <span>Save Draft</span>
                            </button>

                            <button
                                onClick={() => handleSave(true)}
                                disabled={submitting}
                                className="w-full flex items-center justify-center space-x-2 bg-ink text-white px-4 py-2.5 rounded-lg hover:bg-black transition-all shadow-lg hover:shadow-xl font-medium disabled:opacity-50"
                            >
                                {submitting ? <Loader2 className="animate-spin w-4 h-4" /> : <Send className="w-4 h-4 text-gold" />}
                                <span>{status === 'NEEDS_REVISION' ? 'Resubmit' : 'Submit for Review'}</span>
                            </button>
                        </>
                    ) : (
                        <div className="text-center p-2 text-sm text-gray-500 italic">
                            Submission is locked
                        </div>
                    )}

                    {canExport && (
                        <button
                            onClick={handleExportPdf}
                            className="w-full flex items-center justify-center space-x-2 bg-green-600 text-white px-4 py-2.5 rounded-lg hover:bg-green-700 transition-all shadow-lg hover:shadow-xl font-medium"
                        >
                            <Download className="w-4 h-4" />
                            <span>Download PDF</span>
                        </button>
                    )}
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
                {/* Beige Header */}
                <header className="h-16 bg-[#F9F7F1] border-b border-[#E8E6DE] flex items-center px-8 justify-center shadow-sm z-10">
                    <div className="text-center">
                        <span className="text-[10px] text-gray-400 uppercase tracking-[0.2em] font-bold">Previewing</span>
                        <h3 className="font-serif font-bold text-ink opacity-80 text-sm truncate max-w-md">{currentTemplate.title}</h3>
                    </div>
                </header>

                <div className="flex-1 overflow-auto p-12 bg-subtle-gray/30 relative">
                    <div className="flex flex-col gap-12 items-center pb-32">
                        {Array.from({ length: numPages }, (_, index) => {
                            const pageNum = index + 1;
                            return (
                                <div
                                    key={pageNum}
                                    className="relative transition-all duration-300 shadow-xl bg-white"
                                    style={{ width: 'fit-content', height: 'fit-content' }}
                                >
                                    <div className="absolute -left-12 top-0 text-gray-300 font-serif italic text-xs">
                                        Pg. {pageNum}
                                    </div>
                                    <PdfCanvas pageNumber={pageNum} />

                                    <div
                                        className={clsx(
                                            "absolute inset-0 transition-opacity duration-300",
                                            isZooming ? "opacity-0" : "opacity-100"
                                        )}
                                    >
                                        {fields.filter(f => f.page === pageNum).map(field => (
                                            <div key={field.id}>
                                                {renderInput(field)}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Zoom Toolbar (Floating) */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md rounded-full shadow-2xl border border-white px-6 py-2 flex items-center space-x-4 z-50 transition-transform hover:scale-105 duration-300 hover:shadow-gold/20">
                    <button
                        onClick={() => handleZoom(Math.max(0.4, scale - 0.1))}
                        className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors text-lg text-gold font-bold"
                    >
                        -
                    </button>
                    <div className="flex flex-col items-center min-w-[3rem]">
                        <span className="font-serif font-bold text-ink text-sm">
                            {Math.round(scale * 100)}%
                        </span>
                    </div>
                    <button
                        onClick={() => handleZoom(Math.min(2.5, scale + 0.1))}
                        className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors text-lg text-gold font-bold"
                    >
                        +
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FormFiller;
