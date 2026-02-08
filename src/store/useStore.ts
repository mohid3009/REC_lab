import { create } from 'zustand';
import type { PdfField, Template } from '../types';

interface AppState {
    userRole: 'teacher' | 'student';
    currentTemplate: Template | null;
    fields: PdfField[];
    isUploading: boolean;
    scale: number;
    activePage: number;
    isZooming: boolean;
    selectedFieldIds: string[];

    setRole: (role: 'teacher' | 'student') => void;
    setTemplate: (template: Template) => void;
    setFields: (fields: PdfField[]) => void;
    setActivePage: (page: number) => void;
    setIsZooming: (isZooming: boolean) => void;
    addField: (field: PdfField) => void;
    updateField: (id: string, updates: Partial<PdfField>) => void;
    removeField: (id: string) => void;
    removeFields: (ids: string[]) => void;
    setScale: (scale: number) => void;
    moveFields: (ids: string[], dx: number, dy: number) => void;
    setSelectedFieldIds: (ids: string[]) => void;
    updateTemplateTitle: (title: string) => void;
}

export const useStore = create<AppState>((set) => ({
    userRole: 'teacher',
    currentTemplate: null,
    fields: [],
    isUploading: false,
    scale: 1,

    activePage: 1,

    isZooming: false,
    selectedFieldIds: [],

    setRole: (role) => set({ userRole: role }),
    setTemplate: (template) => {
        const mappedFields = ((template.fields as any[]) || []).map((f) => ({
            ...f,
            id: f.fieldId || f.id
        }));
        set({ currentTemplate: template, fields: mappedFields });
    },
    setFields: (fields) => set({ fields }),
    setActivePage: (page) => set({ activePage: page }),
    setIsZooming: (isZooming) => set({ isZooming }),

    addField: (field) => set((state) => ({
        fields: [...state.fields, field]
    })),

    updateField: (id, updates) => set((state) => ({
        fields: state.fields.map((f) => (f.id === id ? { ...f, ...updates } : f))
    })),

    removeField: (id) => set((state) => ({
        fields: state.fields.filter((f) => f.id !== id),
        selectedFieldIds: state.selectedFieldIds.filter(fid => fid !== id)
    })),

    removeFields: (ids) => set((state) => ({
        fields: state.fields.filter((f) => !ids.includes(f.id)),
        selectedFieldIds: state.selectedFieldIds.filter(fid => !ids.includes(fid))
    })),

    moveFields: (ids: string[], dx: number, dy: number) => set((state) => ({
        fields: state.fields.map((f) =>
            ids.includes(f.id) ? { ...f, x: f.x + dx, y: f.y + dy } : f
        )
    })),

    setScale: (scale) => set({ scale }),
    setSelectedFieldIds: (ids) => set({ selectedFieldIds: ids }),
    updateTemplateTitle: (title) => set((state) => ({
        currentTemplate: state.currentTemplate ? { ...state.currentTemplate, title } : null
    })),
}));
