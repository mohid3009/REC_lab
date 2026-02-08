import React, { useState } from 'react';
import { Upload, Loader2, AlertCircle } from 'lucide-react';
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist';
import { useStore } from '../../store/useStore';

// Set worker source
GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

import { useNavigate } from 'react-router-dom';

const UploadArea: React.FC = () => {
    const [isDragOver, setIsDragOver] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { setTemplate } = useStore();
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const processFile = async (file: File) => {
        if (file.type !== 'application/pdf') {
            setError('Only PDF files are allowed.');
            return;
        }
        setError(null);
        setLoading(true);

        try {
            // 1. Read File Locally (for Analysis) & Upload in Parallel
            const fileBuffer = await file.arrayBuffer();

            // Start Upload
            const formData = new FormData();
            formData.append('pdf', file);
            const uploadPromise = fetch('/api/upload', {
                method: 'POST',
                body: formData,
                credentials: 'include', // Include session cookie
            }).then(async res => {
                if (!res.ok) {
                    const error = await res.json().catch(() => ({}));
                    throw new Error(error.message || 'Upload failed');
                }
                return res.json();
            });

            // Start Analysis (using local data)
            // Important: Pass { data: buffer } to avoid URL fetching issues
            const pdfCall = getDocument({ data: fileBuffer }).promise;

            const [uploadResult, pdf] = await Promise.all([uploadPromise, pdfCall]);
            const { url } = uploadResult;

            // Get first page dimensions
            const page = await pdf.getPage(1);
            const viewport = page.getViewport({ scale: 1 });

            const query = new URLSearchParams(window.location.search);
            const courseId = query.get('courseId');

            const templateData = {
                title: file.name.replace('.pdf', ''),
                pdfUrl: url,
                pageCount: pdf.numPages,
                dimensions: {
                    width: viewport.width, // pts
                    height: viewport.height, // pts
                },
                fields: [],
                isPublished: false,
                courseId: courseId || undefined
            };

            // 3. Create Template in DB
            const createRes = await fetch('/api/templates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(templateData),
                credentials: 'include', // Include session cookie
            });

            if (!createRes.ok) throw new Error('Failed to create template');
            const newTemplate = await createRes.json();

            setTemplate(newTemplate);
            navigate(`/hod/templates/${newTemplate._id}/edit`);

        } catch (err: any) {
            console.error(err);
            // Show detailed error
            setError(err.message || 'An error occurred during processing.');
        } finally {
            setLoading(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) processFile(file);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 animate-in fade-in duration-700">
            <div className="max-w-2xl w-full text-center space-y-8">
                <div className="space-y-2">
                    <h1 className="text-4xl font-serif text-ink">Create New Template</h1>
                    <p className="text-gray-500 font-sans">Upload a PDF to start designing your form.</p>
                </div>

                <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={handleDrop}
                    className={`
            relative group cursor-pointer
            border-2 border-dashed rounded-xl p-16 transition-all duration-300 ease-out
            bg-paper
            ${isDragOver
                            ? 'border-gold bg-gold/5 scale-[1.02]'
                            : 'border-gray-200 hover:border-gold/50 hover:bg-subtle-gray'
                        }
          `}
                >
                    <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />

                    <div className="flex flex-col items-center space-y-4">
                        <div className={`
              p-4 rounded-full bg-white shadow-sm ring-1 ring-gray-100 
              transition-transform duration-500 group-hover:rotate-12
            `}>
                            {loading ? (
                                <Loader2 className="w-10 h-10 text-gold animate-spin" />
                            ) : (
                                <Upload className="w-10 h-10 text-gold" />
                            )}
                        </div>

                        <div className="space-y-1">
                            <p className="text-lg font-medium text-ink">
                                {loading ? 'Processing...' : 'Click to upload or drag and drop'}
                            </p>
                            <p className="text-sm text-gray-400">PDF files only, up to 10MB</p>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="flex items-center justify-center space-x-2 text-red-500 bg-red-50 p-3 rounded-lg">
                        <AlertCircle className="w-5 h-5" />
                        <span>{error}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UploadArea;
