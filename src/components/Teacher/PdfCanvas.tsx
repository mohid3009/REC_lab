import React, { useEffect, useRef, useState } from 'react';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import { useStore } from '../../store/useStore';

// Ensure worker is set
if (!GlobalWorkerOptions.workerSrc) {
    GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
}

interface PdfCanvasProps {
    pageNumber: number;
}

const PdfCanvas: React.FC<PdfCanvasProps> = ({ pageNumber }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const { currentTemplate, scale, setScale } = useStore();
    const [rendered, setRendered] = useState(false);

    useEffect(() => {
        const renderPage = async () => {
            if (!currentTemplate || !canvasRef.current || !containerRef.current) return;

            try {
                const loadingTask = getDocument(currentTemplate.pdfUrl);
                const pdf = await loadingTask.promise;
                const page = await pdf.getPage(pageNumber);

                // Calculate scale to fit width if first load
                let currentScale = scale;
                if (!rendered) {
                    const viewportUnscaled = page.getViewport({ scale: 1 });
                    const containerWidth = containerRef.current.clientWidth - 48; // padding
                    currentScale = containerWidth / viewportUnscaled.width;
                    // If generated scale is weird, limit it?
                    if (currentScale > 1.5) currentScale = 1.5;
                    if (currentScale < 0.5) currentScale = 0.5;
                    setScale(currentScale);
                }

                const viewport = page.getViewport({ scale: currentScale });
                const canvas = canvasRef.current;
                const context = canvas.getContext('2d');

                if (context) {
                    // High DPI rendering
                    const pixelRatio = window.devicePixelRatio || 1;
                    canvas.height = viewport.height * pixelRatio;
                    canvas.width = viewport.width * pixelRatio;

                    // Maintain visual size
                    canvas.style.height = `${viewport.height}px`;
                    canvas.style.width = `${viewport.width}px`;

                    context.scale(pixelRatio, pixelRatio);

                    await page.render({
                        canvasContext: context,
                        viewport: viewport,
                    }).promise;

                    setRendered(true);
                }
            } catch (error) {
                console.error('Error rendering PDF page:', error);
            }
        };

        renderPage();
    }, [currentTemplate, pageNumber, scale, rendered, setScale]);

    return (
        <div ref={containerRef} className="relative shadow-lg border border-gray-200 bg-white">
            <canvas ref={canvasRef} className="block" />
            {/* Field Layer will go here as children or separate absolute overlay */}
        </div>
    );
};

export default PdfCanvas;
