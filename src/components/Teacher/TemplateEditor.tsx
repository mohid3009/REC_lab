import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DndContext, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { useStore } from '../../store/useStore';
import PdfCanvas from './PdfCanvas';
import DraggableField from './DraggableField';
import Sidebar from './Sidebar';
import PropertiesPanel from './PropertiesPanel';
import { Loader2 } from 'lucide-react';
import { getDocument } from 'pdfjs-dist';
import { v4 as uuidv4 } from 'uuid';
import { api } from '../../utils/api';

const TemplateEditor: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const {
        currentTemplate, fields, updateField, removeField, removeFields, moveFields, setTemplate,
        scale, setScale, setActivePage,
        selectedFieldIds, setSelectedFieldIds, updateTemplateTitle
    } = useStore();
    const [loading, setLoading] = useState(!currentTemplate);
    const [numPages, setNumPages] = useState<number>(0);
    const pageRefs = React.useRef<(HTMLDivElement | null)[]>([]);
    const cursorRef = React.useRef({ x: 0, y: 0 });

    // Marquee selection state
    const [selectionBox, setSelectionBox] = useState<{ startX: number, startY: number, endX: number, endY: number } | null>(null);
    const [isSelecting, setIsSelecting] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 2,
            },
        })
    );

    // Fetch template if not present (reload scenario)
    React.useEffect(() => {
        if (!currentTemplate && id) {
            fetch(`/api/templates/${id}`)
                .then(res => res.json())
                .then(data => {
                    setTemplate(data);
                    setLoading(false);
                })
                .catch(err => console.error(err));
        } else if (currentTemplate) {
            setLoading(false);
        }
    }, [id, currentTemplate, setTemplate]);

    // Fetch PDF page count
    React.useEffect(() => {
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

    // Track active page
    React.useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const pageIndex = Number(entry.target.getAttribute('data-page'));
                        if (!isNaN(pageIndex)) {
                            setActivePage(pageIndex);
                        }
                    }
                });
            },
            {
                threshold: 0.5,
                root: document.querySelector('.overflow-auto') // Watch within the scroll container
            }
        );

        pageRefs.current.forEach((ref) => {
            if (ref) observer.observe(ref);
        });

        return () => observer.disconnect();
    }, [numPages, setActivePage]);

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, delta } = event;
        const fieldId = active.id as string;

        // If multiple are selected, we move all of them.
        const isPartofSelection = selectedFieldIds.includes(fieldId);
        const targets = isPartofSelection ? selectedFieldIds : [fieldId];

        targets.forEach(tid => {
            const field = fields.find(f => f.id === tid);
            if (field) {
                updateField(tid, {
                    x: field.x + (delta.x / scale),
                    y: field.y + (delta.y / scale),
                });
            }
        });
    };

    const handleZoom = (newScale: number) => {
        // Immediate zoom without hiding fields
        setScale(newScale);
    };

    // Keyboard Shortcuts, Mouse Tracking & Scroll Zoom
    React.useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            cursorRef.current = { x: e.clientX, y: e.clientY };
        };



        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't trigger shortcuts if user is typing in an input
            const isTyping = ['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName);
            if (isTyping) return;

            // Zoom Shortcuts (+ and -)
            if (e.key === '+' || e.key === '=') {
                e.preventDefault();
                const currentScale = useStore.getState().scale;
                handleZoom(Math.min(2.0, currentScale + 0.1));
                return;
            }
            if (e.key === '-') {
                e.preventDefault();
                const currentScale = useStore.getState().scale;
                handleZoom(Math.max(0.5, currentScale - 0.1));
                return;
            }

            // Delete / Backspace Logic - handle multiple
            if ((e.key === 'Delete' || e.key === 'Backspace') && selectedFieldIds.length > 0) {
                removeFields(selectedFieldIds);
                return;
            }

            // Arrow Key Precision Movement
            const arrowKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
            if (arrowKeys.includes(e.key) && selectedFieldIds.length > 0) {
                e.preventDefault();
                const step = e.shiftKey ? 10 : 1;
                let dx = 0;
                let dy = 0;

                if (e.key === 'ArrowUp') dy = -step;
                if (e.key === 'ArrowDown') dy = step;
                if (e.key === 'ArrowLeft') dx = -step;
                if (e.key === 'ArrowRight') dx = step;

                moveFields(selectedFieldIds, dx, dy);
                return;
            }

            // Select All (Ctrl+A / Cmd+A)
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
                e.preventDefault();
                setSelectedFieldIds(fields.map(f => f.id));
                return;
            }

            // Field Creation Shortcuts
            const shortcutMap: Record<string, string> = {
                't': 'text',
                'a': 'multiline',
                'n': 'number',
                'c': 'checkbox',
                'd': 'date',
                's': 'signature'
            };

            const type = shortcutMap[e.key.toLowerCase()];
            if (type && currentTemplate) {
                e.preventDefault();

                // Find which page is under the cursor
                let targetPage = 1;
                let relativeX = 100;
                let relativeY = 100;

                for (let i = 0; i < pageRefs.current.length; i++) {
                    const rect = pageRefs.current[i]?.getBoundingClientRect();
                    if (rect &&
                        cursorRef.current.x >= rect.left &&
                        cursorRef.current.x <= rect.right &&
                        cursorRef.current.y >= rect.top &&
                        cursorRef.current.y <= rect.bottom) {

                        targetPage = i + 1;
                        relativeX = (cursorRef.current.x - rect.left) / scale;
                        relativeY = (cursorRef.current.y - rect.top) / scale;
                        break;
                    }
                }

                const { addField: storeAddField } = useStore.getState();
                const newId = uuidv4();
                storeAddField({
                    id: newId,
                    type: type as any,
                    page: targetPage,
                    x: relativeX,
                    y: relativeY,
                    width: type === 'checkbox' ? 24 : 150,
                    height: type === 'checkbox' ? 24 : 32,
                    label: `New ${type}`,
                    required: false,
                });
                setSelectedFieldIds([newId]);
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [selectedFieldIds, removeFields, currentTemplate, scale, setSelectedFieldIds]);

    // Marquee Mouse Handlers
    const handleMouseDown = (e: React.MouseEvent) => {
        // Only start selection if clicking the background (not a field)
        const target = e.target as HTMLElement;
        if (target.closest('.pointer-events-auto')) return;

        setIsSelecting(true);
        setSelectionBox({
            startX: e.clientX,
            startY: e.clientY,
            endX: e.clientX,
            endY: e.clientY
        });
    };

    const handleContainerMouseMove = (e: React.MouseEvent) => {
        if (!isSelecting || !selectionBox) return;

        setSelectionBox(prev => prev ? ({
            ...prev,
            endX: e.clientX,
            endY: e.clientY
        }) : null);
    };

    const handleMouseUp = () => {
        if (!isSelecting || !selectionBox) {
            setIsSelecting(false);
            setSelectionBox(null);
            return;
        }

        // Calculate selected fields
        const xmin = Math.min(selectionBox.startX, selectionBox.endX);
        const xmax = Math.max(selectionBox.startX, selectionBox.endX);
        const ymin = Math.min(selectionBox.startY, selectionBox.endY);
        const ymax = Math.max(selectionBox.startY, selectionBox.endY);

        const newSelectedIds: string[] = [];

        fields.forEach(field => {
            const pageDiv = pageRefs.current[field.page - 1];
            if (pageDiv) {
                const pageRect = pageDiv.getBoundingClientRect();
                const fieldX = pageRect.left + (field.x * scale);
                const fieldY = pageRect.top + (field.y * scale);
                const fieldW = field.width * scale;
                const fieldH = field.height * scale;

                if (fieldX < xmax && (fieldX + fieldW) > xmin &&
                    fieldY < ymax && (fieldY + fieldH) > ymin) {
                    newSelectedIds.push(field.id);
                }
            }
        });

        setSelectedFieldIds(newSelectedIds);
        setIsSelecting(false);
        setSelectionBox(null);
    };

    const handleSave = async () => {
        if (!currentTemplate) return;

        try {
            // Map 'id' to 'fieldId' for Mongoose compatibility
            const mappedFields = fields.map(({ id, ...rest }) => ({
                fieldId: id,
                ...rest
            }));

            const response = await fetch(`/api/templates/${currentTemplate._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: currentTemplate.title,
                    fields: mappedFields
                })
            });

            if (!response.ok) throw new Error('Failed to save template');
            const updatedData = await response.json();
            setTemplate(updatedData);

            alert('Template saved successfully');
        } catch (error) {
            console.error('Save template error:', error);
            alert('Error saving template');
        }
    };

    const handleDelete = async () => {
        if (!currentTemplate || !id) return;

        if (!confirm('Are you sure you want to delete this template? This action cannot be undone.')) {
            return;
        }

        try {
            await api.deleteTemplate(id);
            // Navigate back to the course details or template list
            if (currentTemplate.courseId) {
                navigate(`/hod/courses/${currentTemplate.courseId}`);
            } else {
                navigate('/hod/templates');
            }
        } catch (error: any) {
            console.error('Delete template error:', error);
            alert('Error deleting template: ' + error.message);
        }
    };

    if (loading) return <div className="flex items-center justify-center h-screen"><Loader2 className="animate-spin" /></div>;
    if (!currentTemplate) return <div>Template not found</div>;

    const selectedField = selectedFieldIds.length === 1 ? fields.find(f => f.id === selectedFieldIds[0]) : null;

    return (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden">
                {/* Editor Header */}
                <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-20 shadow-sm">
                    <div className="flex items-center space-x-4">
                        <input
                            type="text"
                            value={currentTemplate.title}
                            onChange={(e) => updateTemplateTitle(e.target.value)}
                            className="font-serif font-bold text-ink bg-transparent border-b-2 border-transparent focus:border-gold focus:outline-none text-xl min-w-[200px]"
                            placeholder="Enter form title..."
                        />
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded uppercase font-medium tracking-wider">Editor</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={handleDelete}
                            className="bg-red-50 text-red-600 px-4 py-1.5 rounded text-sm hover:bg-red-100 transition-all flex items-center space-x-2"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span>Delete</span>
                        </button>
                        <button
                            onClick={handleSave}
                            className="bg-ink text-white px-4 py-1.5 rounded text-sm hover:bg-black transition-all flex items-center space-x-2 shadow-sm"
                        >
                            <span>Save Template</span>
                        </button>
                    </div>
                </header>

                <div className="flex flex-1 overflow-hidden" onMouseUp={handleMouseUp}>
                    {/* Sidebar for adding fields */}
                    <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
                        <Sidebar />
                    </div>

                    {/* Main Canvas Area */}
                    <div
                        className="flex-1 bg-subtle-gray overflow-auto p-8 flex justify-center relative select-none editor-scroll-container"
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleContainerMouseMove}
                    >
                        <div className="flex flex-col gap-8 items-center pb-20">
                            {Array.from({ length: numPages }, (_, index) => {
                                const pageNum = index + 1;
                                return (
                                    <div
                                        key={pageNum}
                                        ref={el => { pageRefs.current[index] = el; }}
                                        data-page={pageNum}
                                        className="relative transition-all duration-200 ease-in-out shadow-lg"
                                        style={{ width: 'fit-content', height: 'fit-content' }}
                                    >
                                        <div className="absolute -left-12 top-0 text-gray-400 font-medium font-serif">
                                            Page {pageNum}
                                        </div>
                                        <PdfCanvas pageNumber={pageNum} />

                                        {/* Fields Layer */}
                                        <div
                                            className="absolute inset-0 pointer-events-none"
                                        >
                                            {fields.filter(f => f.page === pageNum).map(field => (
                                                <div key={field.id} className="pointer-events-auto">
                                                    <DraggableField
                                                        field={field}
                                                        isSelected={selectedFieldIds.includes(field.id)}
                                                        onSelect={() => {
                                                            if (!selectedFieldIds.includes(field.id)) {
                                                                setSelectedFieldIds([field.id]);
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Selection Box Overlay */}
                        {isSelecting && selectionBox && (
                            <div
                                className="fixed border-2 border-gold bg-gold/10 z-[100] pointer-events-none"
                                style={{
                                    left: Math.min(selectionBox.startX, selectionBox.endX),
                                    top: Math.min(selectionBox.startY, selectionBox.endY),
                                    width: Math.abs(selectionBox.startX - selectionBox.endX),
                                    height: Math.abs(selectionBox.startY - selectionBox.endY)
                                }}
                            />
                        )}

                        {/* Zoom Toolbar */}
                        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-white rounded-full shadow-xl border border-gray-200 px-6 py-3 flex items-center space-x-4 z-50">
                            <button
                                onClick={() => handleZoom(Math.max(0.5, scale - 0.1))}
                                className="p-1 hover:bg-gray-100 rounded-full transition-colors font-medium text-lg leading-none"
                            >
                                -
                            </button>
                            <span className="font-medium text-ink min-w-[3rem] text-center">
                                {Math.round(scale * 100)}%
                            </span>
                            <button
                                onClick={() => handleZoom(Math.min(2.0, scale + 0.1))}
                                className="p-1 hover:bg-gray-100 rounded-full transition-colors font-medium text-lg leading-none"
                            >
                                +
                            </button>
                        </div>
                    </div>

                    {/* Properties Panel */}
                    <div className="w-72 bg-white border-l border-gray-200 overflow-y-auto">
                        {selectedFieldIds.length === 1 && selectedField ? (
                            <PropertiesPanel
                                field={selectedField}
                                onUpdate={(updates) => updateField(selectedField.id, updates)}
                                onDelete={() => {
                                    removeField(selectedField.id);
                                }}
                                onClose={() => setSelectedFieldIds([])}
                            />
                        ) : selectedFieldIds.length > 1 ? (
                            <div className="p-6">
                                <h3 className="text-lg font-serif font-bold text-ink mb-4">{selectedFieldIds.length} Fields Selected</h3>
                                <button
                                    onClick={() => removeFields(selectedFieldIds)}
                                    className="w-full py-2 bg-red-50 text-red-600 rounded border border-red-100 hover:bg-red-100 transition-colors font-medium flex items-center justify-center gap-2"
                                >
                                    Delete Selected
                                </button>
                                <button
                                    onClick={() => setSelectedFieldIds([])}
                                    className="w-full mt-2 py-2 text-gray-400 text-sm hover:text-gray-600 transition-colors"
                                >
                                    Clear Selection
                                </button>
                            </div>
                        ) : (
                            <div className="p-4 text-gray-400 text-center mt-10">Select fields to edit properties</div>
                        )}
                    </div>
                </div>
            </div>
        </DndContext>
    );
};

export default TemplateEditor;
