import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import type { PdfField } from '../../types';
import { useStore } from '../../store/useStore';
import clsx from 'clsx';

interface DraggableFieldProps {
    field: PdfField;
    isSelected: boolean;
    onSelect: () => void;
}

const DraggableField: React.FC<DraggableFieldProps> = ({ field, isSelected, onSelect }) => {
    const { scale, updateField } = useStore();
    const [isResizing, setIsResizing] = React.useState(false);
    const resizeStartRef = React.useRef({ x: 0, y: 0, w: 0, h: 0 });

    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: field.id,
        disabled: isResizing, // Disable dragging while resizing
        data: { field },
    });

    const handleResizeMouseDown = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        setIsResizing(true);
        resizeStartRef.current = {
            x: e.clientX,
            y: e.clientY,
            w: field.width,
            h: field.height
        };

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const dx = (moveEvent.clientX - resizeStartRef.current.x) / scale;
            const dy = (moveEvent.clientY - resizeStartRef.current.y) / scale;

            const isCheckbox = field.type === 'checkbox';
            const newWidth = Math.max(isCheckbox ? 16 : 40, resizeStartRef.current.w + dx);
            const newHeight = isCheckbox ? newWidth : Math.max(20, resizeStartRef.current.h + dy);

            updateField(field.id, {
                width: newWidth,
                height: newHeight
            });
        };

        const handleMouseUp = () => {
            setIsResizing(false);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    const style: React.CSSProperties = {
        position: 'absolute',
        left: field.x * scale,
        top: field.y * scale,
        width: field.width * scale,
        height: field.height * scale,
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        touchAction: 'none',
        fontSize: `${12 * scale}px`,
        willChange: (isDragging || isResizing) ? 'transform, width, height' : 'auto',
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={clsx(
                "border-2 rounded transition-all duration-150 group",
                isSelected
                    ? "border-accent bg-accent/20 z-50 shadow-lg ring-2 ring-accent/20"
                    : "border-blue-400/40 bg-blue-400/10 hover:border-accent/60 hover:bg-accent/10 z-20",
                isDragging && "opacity-70 scale-[1.03] shadow-2xl z-[100] cursor-grabbing",
                field.required ? "ring-1 ring-red-400" : "",
                isResizing && "cursor-nwse-resize select-none"
            )}
            onClick={(e) => {
                e.stopPropagation();
                onSelect();
            }}
            {...listeners}
            {...attributes}
        >
            {/* Field Label Tag */}
            <div
                className={clsx(
                    "absolute -top-5 left-0 px-1.5 py-0.5 rounded-t text-[9px] font-bold uppercase tracking-wider transition-all whitespace-nowrap pointer-events-none",
                    isSelected || isDragging ? "bg-accent text-white opacity-100 -translate-y-1 scale-110" : "bg-blue-400/60 text-white opacity-0 group-hover:opacity-100"
                )}
            >
                {field.label || field.type}
            </div>

            <div className="w-full h-full flex items-center justify-center p-0.5">
                <span className="text-[10px] text-ink/40 font-mono pointer-events-none select-none overflow-hidden truncate">
                    {field.type === 'checkbox' ? '' : (field.label || field.type)}
                </span>
            </div>

            {/* Resize Handle - Improved Hit Area */}
            {isSelected && !isDragging && (
                <div
                    className="absolute -bottom-1 -right-1 w-6 h-6 cursor-nwse-resize flex items-end justify-end z-[60] bg-transparent"
                    onMouseDown={handleResizeMouseDown}
                >
                    <div className="w-3 h-3 border-r-2 border-b-2 border-accent m-1 opacity-60 hover:opacity-100 transition-opacity" />
                </div>
            )}
        </div>
    );
};

export default DraggableField;
