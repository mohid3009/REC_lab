import React from 'react';
import type { PdfField } from '../../types';
import { X, Trash2 } from 'lucide-react';

interface PropertiesPanelProps {
    field: PdfField;
    onUpdate: (updates: Partial<PdfField>) => void;
    onDelete: () => void;
    onClose: () => void;
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ field, onUpdate, onDelete, onClose }) => {
    return (
        <div className="p-4">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-serif font-bold text-ink">Properties</h2>
                <button onClick={onClose}><X className="w-5 h-5 text-gray-400 hover:text-ink" /></button>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Label</label>
                    <input
                        type="text"
                        value={field.label || ''}
                        onChange={(e) => onUpdate({ label: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded focus:border-gold focus:outline-none"
                    />
                </div>

                <div className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        checked={field.required || false}
                        onChange={(e) => onUpdate({ required: e.target.checked })}
                        id="required"
                        className="rounded border-gray-300 text-gold focus:ring-gold"
                    />
                    <label htmlFor="required" className="text-sm text-ink">Required Field</label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Width (pt)</label>
                        <input
                            type="number"
                            value={Math.round(field.width)}
                            onChange={(e) => onUpdate({ width: Number(e.target.value) })}
                            className="w-full px-3 py-2 border border-gray-200 rounded focus:border-gold focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Height (pt)</label>
                        <input
                            type="number"
                            value={Math.round(field.height)}
                            onChange={(e) => onUpdate({ height: Number(e.target.value) })}
                            className="w-full px-3 py-2 border border-gray-200 rounded focus:border-gold focus:outline-none"
                        />
                    </div>
                </div>

                <div className="pt-6 border-t border-gray-100">
                    <button
                        onClick={onDelete}
                        className="w-full flex items-center justify-center space-x-2 py-2 text-red-500 hover:bg-red-50 rounded transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete Field</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PropertiesPanel;
