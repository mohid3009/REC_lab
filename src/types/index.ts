export interface PdfField {
    id: string;
    type: 'text' | 'multiline' | 'number' | 'image' | 'signature' | 'date' | 'checkbox';
    page: number;
    x: number; // PDF Points
    y: number; // PDF Points
    width: number; // PDF Points
    height: number; // PDF Points
    label?: string;
    required?: boolean;
    fontSize?: number;
}

export interface Template {
    _id: string;
    title: string;
    pdfUrl: string;
    pageCount: number;
    dimensions: { width: number; height: number };
    fields: PdfField[];
    isPublished: boolean;
    createdAt: string;
}

export interface Submission {
    _id: string;
    templateId: string;
    studentId: string;
    values: Record<string, string | number>;
    status: 'DRAFT' | 'LOCKED';
    submittedAt?: string;
}
