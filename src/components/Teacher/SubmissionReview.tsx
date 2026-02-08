import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Loader2, ArrowLeft, AlertCircle, CheckCircle, FileText, Send, ZoomIn, ZoomOut } from 'lucide-react';
import { api } from '../../utils/api';
import PdfCanvas from './PdfCanvas';
import { useStore } from '../../store/useStore';

interface Submission {
    _id: string;
    studentId: {
        _id: string;
        name: string;
        email: string;
    };
    experimentId: {
        _id: string;
        title: string;
        classroomId: string;
    };
    templateId: {
        _id: string;
        title: string;
        pdfUrl: string;
        pageCount: number;
        fields: any[];
    };
    values: Record<string, any>;
    status: 'NOT_SUBMITTED' | 'SUBMITTED' | 'NEEDS_REVISION' | 'GRADED';
    submittedAt?: string;
    remarks?: string;
    grade?: number;
    feedback?: string;
    isLocked: boolean;
    reviewedAt?: string;
    gradedAt?: string;
}

const SubmissionReview: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { setTemplate, scale, setScale, fields } = useStore();

    const [submission, setSubmission] = useState<Submission | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [remarks, setRemarks] = useState('');
    const [grade, setGrade] = useState<number>(0);
    const [feedback, setFeedback] = useState('');
    const [showGradeModal, setShowGradeModal] = useState(false);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        if (id) {
            loadSubmission();
        }
    }, [id]);

    const loadSubmission = async () => {
        try {
            setLoading(true);
            setError(null);

            // Use fetch directly since we need the full populated data
            const response = await fetch(`/api/submissions/${id}`, {
                credentials: 'include'
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || 'Failed to fetch submission');
            }

            const data = await response.json();
            console.log('Submission loaded:', data);

            setSubmission(data);
            setRemarks(data.remarks || '');
            setGrade(data.grade || 0);
            setFeedback(data.feedback || '');

            // Set template in store for PdfCanvas and overlays
            if (data.templateId) {
                // Adjust field ID mapping if necessary (as seen in useStore.ts)
                const mappedTemplate = {
                    ...data.templateId,
                    fields: (data.templateId.fields || []).map((f: any) => ({
                        ...f,
                        id: f.fieldId || f.id
                    }))
                };
                setTemplate(mappedTemplate);
            }
        } catch (err: any) {
            console.error('Error loading submission:', err);
            setError(err.message || 'Failed to load submission');
        } finally {
            setLoading(false);
        }
    };

    const handleZoom = (newScale: number) => {
        setScale(newScale);
    };

    const handleRequestRevision = async () => {
        if (!remarks.trim()) {
            alert('Please add remarks explaining what needs to be revised');
            return;
        }

        setProcessing(true);
        try {
            await api.reviewSubmission(id!, 'NEEDS_REVISION', remarks);
            alert('Revision request sent to student');
            navigate(`/teacher/experiments/${submission?.experimentId._id}/submissions`);
        } catch (err: any) {
            alert('Failed to request revision: ' + err.message);
        } finally {
            setProcessing(false);
        }
    };

    const handleGradeAndLock = async () => {
        if (grade < 0 || grade > 100) {
            alert('Grade must be between 0 and 100');
            return;
        }

        setProcessing(true);
        try {
            await api.finalizeSubmission(id!, grade, feedback);
            alert('Submission graded and locked successfully');
            navigate(`/teacher/experiments/${submission?.experimentId._id}/submissions`);
        } catch (err: any) {
            alert('Failed to grade submission: ' + err.message);
        } finally {
            setProcessing(false);
            setShowGradeModal(false);
        }
    };

    const renderOverlayValue = (field: any) => {
        const value = submission?.values?.[field.id] || submission?.values?.[field.label || ''] || '';

        const style: React.CSSProperties = {
            position: 'absolute',
            left: `${field.x * scale}px`,
            top: `${field.y * scale}px`,
            width: `${field.width * scale}px`,
            height: `${field.height * scale}px`,
            display: 'flex',
            alignItems: field.type === 'multiline' ? 'flex-start' : 'center',
            justifyContent: field.type === 'checkbox' ? 'center' : 'flex-start',
            fontSize: `${(field.fontSize || 12) * scale}px`,
            color: '#1a1a1a',
            pointerEvents: 'none',
            overflow: 'hidden',
            fontFamily: 'serif'
        };

        if (field.type === 'checkbox') {
            return (
                <div key={field.id} style={style}>
                    {value === true || value === 'true' || value === 'on' ? '✓' : ''}
                </div>
            );
        }

        return (
            <div key={field.id} style={style} className="whitespace-pre-wrap">
                {String(value)}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <Loader2 className="animate-spin text-gold w-8 h-8" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-subtle-gray p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                        <AlertCircle className="w-12 h-12 mx-auto mb-3 text-red-500" />
                        <p className="text-red-700 font-medium">{error}</p>
                        <button
                            onClick={() => navigate(-1)}
                            className="mt-4 text-sm text-red-600 hover:text-red-800 underline"
                        >
                            Go Back
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!submission) {
        return (
            <div className="min-h-screen bg-subtle-gray p-8">
                <div className="max-w-4xl mx-auto text-center text-gray-500">
                    Submission not found
                </div>
            </div>
        );
    }

    const isGraded = submission.status === 'GRADED';
    const studentName = submission.studentId?.name || 'Unknown Student';
    const experimentTitle = submission.experimentId?.title || 'Unknown Experiment';
    const experimentId = submission.experimentId?._id;

    return (
        <div className="min-h-screen bg-subtle-gray p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="bg-white rounded-xl shadow-md p-6">
                    {experimentId && (
                        <Link
                            to={`/teacher/experiments/${experimentId}/submissions`}
                            className="text-sm text-gold hover:text-gold/80 font-medium mb-4 inline-flex items-center"
                        >
                            <ArrowLeft className="w-4 h-4 mr-1" />
                            Back to Submissions
                        </Link>
                    )}

                    <div className="flex items-start justify-between mt-4">
                        <div className="space-y-2">
                            <h1 className="text-3xl font-serif font-bold text-ink">
                                Review Submission
                            </h1>
                            <div className="space-y-1">
                                <p className="text-gray-600">
                                    <span className="font-medium">Student:</span> {studentName}
                                </p>
                                <p className="text-gray-600">
                                    <span className="font-medium">Experiment:</span> {experimentTitle}
                                </p>
                                {submission.submittedAt && (
                                    <p className="text-sm text-gray-500">
                                        Submitted: {new Date(submission.submittedAt).toLocaleString()}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="text-right">
                            {isGraded ? (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <div className="flex items-center space-x-2 text-green-700 mb-1">
                                        <CheckCircle className="w-5 h-5" />
                                        <span className="font-bold">Graded & Locked</span>
                                    </div>
                                    <p className="text-2xl font-serif font-bold text-green-900">
                                        {submission.grade}/100
                                    </p>
                                </div>
                            ) : (
                                <span className={`px-4 py-2 rounded-full text-sm font-bold inline-block ${submission.status === 'SUBMITTED' ? 'bg-blue-100 text-blue-700' :
                                    submission.status === 'NEEDS_REVISION' ? 'bg-yellow-100 text-yellow-700' :
                                        'bg-gray-100 text-gray-600'
                                    }`}>
                                    {submission.status === 'SUBMITTED' ? 'Awaiting Review' :
                                        submission.status === 'NEEDS_REVISION' ? 'Revision Requested' :
                                            submission.status}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* PDF Preview / Submitted Values */}
                    <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-6 flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-serif font-bold text-ink flex items-center">
                                <FileText className="w-5 h-5 mr-2" />
                                Submitted Work
                            </h2>

                            {/* Zoom Controls */}
                            <div className="flex items-center space-x-4 bg-gray-50 rounded-lg px-3 py-1.5 border border-gray-200">
                                <button
                                    onClick={() => handleZoom(Math.max(0.4, scale - 0.1))}
                                    className="p-1 hover:bg-white rounded transition-colors text-ink"
                                    title="Zoom Out"
                                >
                                    <ZoomOut className="w-4 h-4" />
                                </button>
                                <span className="text-xs font-bold text-ink min-w-[40px] text-center">
                                    {Math.round(scale * 100)}%
                                </span>
                                <button
                                    onClick={() => handleZoom(Math.min(2.5, scale + 0.1))}
                                    className="p-1 hover:bg-white rounded transition-colors text-ink"
                                    title="Zoom In"
                                >
                                    <ZoomIn className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* PDF Viewer Area */}
                        <div className="flex-1 overflow-auto bg-gray-100 rounded-lg p-8 border border-gray-200" style={{ minHeight: '600px', maxHeight: '800px' }}>
                            <div className="flex flex-col gap-8 items-center">
                                {submission.templateId?.pageCount && Array.from({ length: submission.templateId.pageCount }, (_, index) => {
                                    const pageNum = index + 1;
                                    return (
                                        <div
                                            key={pageNum}
                                            className="relative shadow-2xl bg-white"
                                            style={{ width: 'fit-content', height: 'fit-content' }}
                                        >
                                            <div className="absolute -left-12 top-0 text-gray-400 font-serif italic text-xs">
                                                Pg. {pageNum}
                                            </div>

                                            <PdfCanvas pageNumber={pageNum} />

                                            {/* Overlay Layer */}
                                            <div className="absolute inset-0 pointer-events-none">
                                                {fields
                                                    .filter(f => f.page === pageNum)
                                                    .map(field => renderOverlayValue(field))
                                                }
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="mt-6 border-t border-gray-100 pt-6">
                            <h3 className="text-sm font-bold text-gray-700 mb-3">Data Summary:</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {Object.entries(submission.values || {}).map(([key, value]) => (
                                    <div key={key} className="bg-gray-50 p-2 rounded border border-gray-100">
                                        <div className="text-[10px] text-gray-500 uppercase font-bold truncate" title={key}>{key}</div>
                                        <div className="text-sm text-ink font-medium truncate">{String(value)}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Review Panel */}
                    <div className="lg:col-span-1 space-y-4">
                        {/* Remarks Section */}
                        <div className="bg-white rounded-xl shadow-md p-6">
                            <h3 className="text-lg font-serif font-bold text-ink mb-3">Teacher Remarks</h3>

                            {isGraded ? (
                                <div className="space-y-3">
                                    {submission.remarks && (
                                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                            <p className="text-xs font-bold text-yellow-700 mb-1">REVISION NOTES</p>
                                            <p className="text-sm text-gray-700">{submission.remarks}</p>
                                        </div>
                                    )}
                                    {submission.feedback && (
                                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                            <p className="text-xs font-bold text-green-700 mb-1">FINAL FEEDBACK</p>
                                            <p className="text-sm text-gray-700">{submission.feedback}</p>
                                        </div>
                                    )}
                                    <div className="pt-3 border-t border-gray-100">
                                        <p className="text-xs text-gray-500">
                                            Graded on {submission.gradedAt ? new Date(submission.gradedAt).toLocaleString() : 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <textarea
                                        value={remarks}
                                        onChange={(e) => setRemarks(e.target.value)}
                                        placeholder="Add comments or revision requests..."
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-gold focus:border-transparent resize-none"
                                        rows={4}
                                    />
                                    <button
                                        onClick={handleRequestRevision}
                                        disabled={processing || !remarks.trim()}
                                        className="w-full bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                                    >
                                        {processing ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <>
                                                <Send className="w-4 h-4" />
                                                <span>Request Revision</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Grading Section */}
                        {!isGraded && (
                            <div className="bg-white rounded-xl shadow-md p-6">
                                <h3 className="text-lg font-serif font-bold text-ink mb-3">Final Grading</h3>

                                <button
                                    onClick={() => setShowGradeModal(true)}
                                    disabled={processing}
                                    className="w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 font-medium"
                                >
                                    <CheckCircle className="w-5 h-5" />
                                    <span>Grade & Lock Submission</span>
                                </button>

                                <p className="text-xs text-gray-500 mt-2 text-center">
                                    This will lock the submission and allow the student to export their PDF
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Grade Modal */}
            {showGradeModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
                        <h3 className="text-2xl font-serif font-bold text-ink">Grade Submission</h3>

                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Grade (0-10)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    max="10"
                                    step="0.1"
                                    value={grade}
                                    onChange={(e) => setGrade(Number(e.target.value))}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-lg font-bold focus:ring-2 focus:ring-gold focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Final Feedback (Optional)
                                </label>
                                <textarea
                                    value={feedback}
                                    onChange={(e) => setFeedback(e.target.value)}
                                    placeholder="Add final comments for the student..."
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-gold focus:border-transparent resize-none"
                                    rows={4}
                                />
                            </div>
                        </div>

                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                            <p className="text-xs text-yellow-800">
                                <strong>Note:</strong> Once graded and locked, this submission cannot be edited by the student or reviewed again.
                            </p>
                        </div>

                        <div className="flex space-x-3">
                            <button
                                onClick={() => setShowGradeModal(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleGradeAndLock}
                                disabled={processing}
                                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                            >
                                {processing ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        <CheckCircle className="w-4 h-4" />
                                        <span>Confirm Grade</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SubmissionReview;
