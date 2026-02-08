import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import PdfCanvas from '../Teacher/PdfCanvas';
import { Loader2, Save } from 'lucide-react';
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
        if (assignmentId) {
            loadExperimentAndSubmission();
        }
    }, [assignmentId, setTemplate]);

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

    const handleSubmit = async () => {
        if (!currentTemplate || !experiment) return;

        const missing = currentTemplate.fields?.filter(f => f.required && !values[f.id]);
        if (missing && missing.length > 0) {
            alert(`Please fill all required fields: ${missing.map(f => f.label).join(', ')}`);
            return;
        }

        setSubmitting(true);
        try {
            const method = submission ? 'PUT' : 'POST';
            const url = submission ? `/api/submissions/${submission._id}` : '/api/submissions';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    experimentId: assignmentId,
                    templateId: currentTemplate._id,
                    values: values,
                    status: 'SUBMITTED'
                })
            });

            if (!response.ok) throw new Error('Failed to save submission');

            const updatedSubmission = await response.json();
            setSubmission(updatedSubmission);
            alert('Submission saved successfully! Your teacher will review it.');
            await loadExperimentAndSubmission(); // Reload to get updated status
        } catch (e) {
            console.error('Submission error:', e);
            alert('Error submitting response');
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

    return (
        <div className="flex flex-col h-screen bg-[#FDFCFB] overflow-hidden">
            <header className="h-auto bg-white border-b border-gray-100 px-10 py-4 z-10 shadow-sm">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div>
                            <h1 className="font-serif text-2xl font-bold text-ink">{experiment?.title || currentTemplate.title}</h1>
                            {experiment?.classroomId?.name && (
                                <p className="text-sm text-gray-500">{experiment.classroomId.name}</p>
                            )}
                        </div>
                        <span className={`text-xs px-3 py-1 rounded-full uppercase font-bold tracking-widest ${status === 'GRADED' ? 'bg-green-100 text-green-700' :
                            status === 'NEEDS_REVISION' ? 'bg-yellow-100 text-yellow-700' :
                                status === 'SUBMITTED' ? 'bg-blue-100 text-blue-700' :
                                    'bg-gray-100 text-gray-600'
                            }`}>
                            {status === 'GRADED' ? 'Graded' :
                                status === 'NEEDS_REVISION' ? 'Needs Revision' :
                                    status === 'SUBMITTED' ? 'Submitted' :
                                        'Not Submitted'}
                        </span>
                    </div>
                    <div className="flex items-center space-x-3">
                        {canExport && (
                            <button
                                onClick={handleExportPdf}
                                className="group flex items-center space-x-3 bg-green-600 text-white px-6 py-2.5 rounded hover:bg-green-700 transition-all shadow-md hover:shadow-lg"
                            >
                                <Save className="w-5 h-5" />
                                <span className="font-medium tracking-tight">Download PDF</span>
                            </button>
                        )}
                        {!isLocked && (
                            <button
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="group flex items-center space-x-3 bg-ink text-white px-8 py-2.5 rounded hover:bg-black transition-all disabled:opacity-50 shadow-md hover:shadow-lg"
                            >
                                {submitting ? <Loader2 className="animate-spin w-5 h-5" /> : <Save className="w-5 h-5 text-gold" />}
                                <span className="font-medium tracking-tight">
                                    {status === 'NEEDS_REVISION' ? 'Resubmit' : status === 'SUBMITTED' ? 'Update Submission' : 'Submit'}
                                </span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Teacher Remarks */}
                {submission?.remarks && status === 'NEEDS_REVISION' && (
                    <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-xs font-bold text-yellow-700 mb-1">TEACHER REMARKS</p>
                        <p className="text-sm text-gray-700">{submission.remarks}</p>
                    </div>
                )}

                {/* Grade Display */}
                {status === 'GRADED' && submission?.grade !== undefined && (
                    <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold text-green-700 mb-1">FINAL GRADE</p>
                                <p className="text-2xl font-serif font-bold text-green-900">{submission.grade}/10</p>
                            </div>
                            {submission.feedback && (
                                <div className="flex-1 ml-6">
                                    <p className="text-xs font-bold text-green-700 mb-1">FEEDBACK</p>
                                    <p className="text-sm text-gray-700">{submission.feedback}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </header>

            <div className="flex-1 overflow-auto p-12 bg-subtle-gray/30">
                <div className="flex flex-col gap-12 items-center pb-32">
                    {Array.from({ length: numPages }, (_, index) => {
                        const pageNum = index + 1;
                        return (
                            <div
                                key={pageNum}
                                className="relative transition-all duration-300 shadow-2xl bg-white border border-gray-100"
                                style={{ width: 'fit-content', height: 'fit-content' }}
                            >
                                <div className="absolute -left-16 top-0 text-gray-300 font-serif italic text-sm">
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

            {/* Zoom Toolbar */}
            <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md rounded-full shadow-2xl border border-white px-8 py-3.5 flex items-center space-x-6 z-50 transition-transform hover:scale-105 duration-300">
                <button
                    onClick={() => handleZoom(Math.max(0.4, scale - 0.1))}
                    className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors text-xl text-gold font-bold"
                >
                    -
                </button>
                <div className="flex flex-col items-center">
                    <span className="font-serif font-bold text-ink text-sm">
                        {Math.round(scale * 100)}%
                    </span>
                    <span className="text-[10px] text-gray-400 uppercase tracking-tighter font-bold">Zoom</span>
                </div>
                <button
                    onClick={() => handleZoom(Math.min(2.5, scale + 0.1))}
                    className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors text-xl text-gold font-bold"
                >
                    +
                </button>
            </div>
        </div>
    );
};

export default FormFiller;
