/**
 * Example Integration Module
 * Demonstrates how to use the PDF Template System in another application
 */

// ============================================================================
// 1. TYPE DEFINITIONS - Copy these to your project
// ============================================================================

export interface PdfField {
    id: string;
    type: 'text' | 'multiline' | 'number' | 'image' | 'signature' | 'date' | 'checkbox';
    page: number;
    x: number;
    y: number;
    width: number;
    height: number;
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
    values: Record<string, string | number | boolean>;
    status: 'DRAFT' | 'LOCKED';
    submittedAt?: string;
}

// ============================================================================
// 2. API CLIENT - Reusable API functions
// ============================================================================

export class TemplateApiClient {
    constructor(private baseUrl: string = 'http://localhost:5000') { }

    /**
     * Upload a PDF file to the server
     */
    async uploadPdf(file: File): Promise<{ url: string; filename: string }> {
        const formData = new FormData();
        formData.append('pdf', file);

        const response = await fetch(`${this.baseUrl}/api/upload`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error('Failed to upload PDF');
        }

        return response.json();
    }

    /**
     * Create a new template
     */
    async createTemplate(templateData: Omit<Template, '_id' | 'createdAt'>): Promise<Template> {
        const response = await fetch(`${this.baseUrl}/api/templates`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(templateData),
        });

        if (!response.ok) {
            throw new Error('Failed to create template');
        }

        return response.json();
    }

    /**
     * Get a template by ID
     */
    async getTemplate(templateId: string): Promise<Template> {
        const response = await fetch(`${this.baseUrl}/api/templates/${templateId}`);

        if (!response.ok) {
            throw new Error('Template not found');
        }

        const template = await response.json();

        // Normalize fieldId to id
        template.fields = template.fields.map((f: any) => ({
            ...f,
            id: f.fieldId || f.id
        }));

        return template;
    }

    /**
     * Update an existing template
     */
    async updateTemplate(templateId: string, updates: Partial<Template>): Promise<Template> {
        const response = await fetch(`${this.baseUrl}/api/templates/${templateId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
        });

        if (!response.ok) {
            throw new Error('Failed to update template');
        }

        return response.json();
    }

    /**
     * Create a submission
     */
    async createSubmission(submissionData: Omit<Submission, '_id'>): Promise<Submission> {
        const response = await fetch(`${this.baseUrl}/api/submissions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(submissionData),
        });

        if (!response.ok) {
            throw new Error('Failed to create submission');
        }

        return response.json();
    }

    /**
     * Get all submissions for a template
     */
    async getSubmissionsByTemplate(templateId: string): Promise<Submission[]> {
        const response = await fetch(`${this.baseUrl}/api/submissions/template/${templateId}`);

        if (!response.ok) {
            throw new Error('Failed to fetch submissions');
        }

        return response.json();
    }
}

// ============================================================================
// 3. PDF GENERATION UTILITY
// ============================================================================

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export class PdfGenerator {
    /**
     * Generate a filled PDF from template and values
     */
    async generateFilledPdf(
        template: Template,
        values: Record<string, any>,
        baseUrl: string = 'http://localhost:5000'
    ): Promise<Blob> {
        // Fetch the original PDF
        const pdfUrl = template.pdfUrl.startsWith('http')
            ? template.pdfUrl
            : `${baseUrl}${template.pdfUrl}`;

        const existingPdfBytes = await fetch(pdfUrl).then(res => res.arrayBuffer());
        const pdfDoc = await PDFDocument.load(existingPdfBytes);
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const pages = pdfDoc.getPages();

        // Fill each field
        for (const field of template.fields) {
            const value = values[field.id];
            if (value === undefined || value === '') continue;

            const pageIndex = field.page - 1;
            if (pageIndex < 0 || pageIndex >= pages.length) continue;

            const page = pages[pageIndex];
            const { height: pageHeight } = page.getSize();
            const fontSize = field.fontSize || 12;

            if (field.type === 'checkbox') {
                if (value === true) {
                    page.drawText('X', {
                        x: field.x + (field.width * 0.2),
                        y: pageHeight - field.y - (field.height * 0.8),
                        size: field.height * 0.7,
                        font,
                        color: rgb(0, 0, 0),
                    });
                }
            } else {
                const text = String(value);
                page.drawText(text, {
                    x: field.x,
                    y: pageHeight - field.y - fontSize,
                    size: fontSize,
                    font,
                    color: rgb(0, 0, 0),
                    maxWidth: field.width,
                });
            }
        }

        const pdfBytes = await pdfDoc.save();
        return new Blob([pdfBytes], { type: 'application/pdf' });
    }

    /**
     * Download a blob as a file
     */
    downloadBlob(blob: Blob, filename: string): void {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
}

// ============================================================================
// 4. VALIDATION UTILITIES
// ============================================================================

export class TemplateValidator {
    /**
     * Validate if all required fields are filled
     */
    validateRequiredFields(
        template: Template,
        values: Record<string, any>
    ): { valid: boolean; missingFields: PdfField[] } {
        const requiredFields = template.fields.filter(f => f.required);
        const missingFields = requiredFields.filter(
            f => values[f.id] === undefined || values[f.id] === '' || values[f.id] === null
        );

        return {
            valid: missingFields.length === 0,
            missingFields,
        };
    }

    /**
     * Validate field value type
     */
    validateFieldValue(field: PdfField, value: any): boolean {
        if (value === undefined || value === null || value === '') {
            return !field.required;
        }

        switch (field.type) {
            case 'number':
                return typeof value === 'number' || !isNaN(Number(value));
            case 'checkbox':
                return typeof value === 'boolean';
            case 'date':
                return typeof value === 'string' && !isNaN(Date.parse(value));
            case 'text':
            case 'multiline':
                return typeof value === 'string';
            default:
                return true;
        }
    }
}

// ============================================================================
// 5. USAGE EXAMPLES
// ============================================================================

async function exampleUsage() {
    const apiClient = new TemplateApiClient('http://localhost:5000');
    const pdfGenerator = new PdfGenerator();
    const validator = new TemplateValidator();

    // -------------------------------------------------------------------------
    // Example 1: Creating a new template from scratch
    // -------------------------------------------------------------------------
    const file = new File(['...'], 'form.pdf', { type: 'application/pdf' });

    // Upload PDF
    const { url } = await apiClient.uploadPdf(file);

    // Create template
    const newTemplate = await apiClient.createTemplate({
        title: 'Student Registration Form',
        pdfUrl: url,
        pageCount: 2,
        dimensions: { width: 612, height: 792 },
        fields: [
            {
                id: 'student_name',
                type: 'text',
                page: 1,
                x: 150,
                y: 200,
                width: 300,
                height: 25,
                label: 'Full Name',
                required: true,
                fontSize: 14,
            }
        ],
        isPublished: false,
    });

    console.log('Template created:', newTemplate._id);

    // -------------------------------------------------------------------------
    // Example 2: Loading and filling a template
    // -------------------------------------------------------------------------
    const template = await apiClient.getTemplate(newTemplate._id);

    const studentValues = {
        student_name: 'John Doe',
    };

    // Validate
    const validation = validator.validateRequiredFields(template, studentValues);
    if (!validation.valid) {
        console.error('Missing fields:', validation.missingFields.map(f => f.label));
        return;
    }

    // Generate PDF
    const filledPdfBlob = await pdfGenerator.generateFilledPdf(template, studentValues);
    pdfGenerator.downloadBlob(filledPdfBlob, 'registration_filled.pdf');

    // -------------------------------------------------------------------------
    // Example 3: Saving submission to database
    // -------------------------------------------------------------------------
    const submission = await apiClient.createSubmission({
        templateId: template._id,
        studentId: 'STU2026001',
        values: studentValues,
        status: 'LOCKED',
        submittedAt: new Date().toISOString(),
    });

    console.log('Submission saved:', submission._id);

    // -------------------------------------------------------------------------
    // Example 4: Retrieving all submissions for a template
    // -------------------------------------------------------------------------
    const allSubmissions = await apiClient.getSubmissionsByTemplate(template._id);
    console.log(`Found ${allSubmissions.length} submissions`);

    // -------------------------------------------------------------------------
    // Example 5: Filtering fields by type
    // -------------------------------------------------------------------------
    const textFields = template.fields.filter(f => f.type === 'text');
    const checkboxFields = template.fields.filter(f => f.type === 'checkbox');

    console.log(`Text fields: ${textFields.length}`);
    console.log(`Checkboxes: ${checkboxFields.length}`);

    // -------------------------------------------------------------------------
    // Example 6: Converting template to custom format
    // -------------------------------------------------------------------------
    const customExport = {
        formId: template._id,
        formTitle: template.title,
        questions: template.fields.map(f => ({
            id: f.id,
            question: f.label || f.id,
            type: f.type,
            required: f.required || false,
        })),
    };

    console.log('Custom export:', JSON.stringify(customExport, null, 2));
}

// ============================================================================
// 6. REACT COMPONENT EXAMPLE (Optional)
// ============================================================================

/**
 * Example React component for rendering a form from template
 */
/*
import React, { useState, useEffect } from 'react';

export function TemplateFormRenderer({ templateId }: { templateId: string }) {
    const [template, setTemplate] = useState<Template | null>(null);
    const [values, setValues] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(true);

    const apiClient = new TemplateApiClient();
    const pdfGenerator = new PdfGenerator();
    const validator = new TemplateValidator();

    useEffect(() => {
        apiClient.getTemplate(templateId).then(t => {
            setTemplate(t);
            setLoading(false);
        });
    }, [templateId]);

    const handleSubmit = async () => {
        if (!template) return;

        const validation = validator.validateRequiredFields(template, values);
        if (!validation.valid) {
            alert(`Missing fields: ${validation.missingFields.map(f => f.label).join(', ')}`);
            return;
        }

        // Save submission
        await apiClient.createSubmission({
            templateId: template._id,
            studentId: 'current-user-id',
            values,
            status: 'LOCKED',
            submittedAt: new Date().toISOString(),
        });

        // Generate PDF
        const pdf = await pdfGenerator.generateFilledPdf(template, values);
        pdfGenerator.downloadBlob(pdf, `${template.title}_filled.pdf`);
    };

    if (loading) return <div>Loading...</div>;
    if (!template) return <div>Template not found</div>;

    return (
        <div>
            <h1>{template.title}</h1>
            {template.fields.map(field => (
                <div key={field.id}>
                    <label>{field.label || field.id}</label>
                    {field.type === 'text' && (
                        <input
                            type="text"
                            value={values[field.id] || ''}
                            onChange={e => setValues({ ...values, [field.id]: e.target.value })}
                            required={field.required}
                        />
                    )}
                    {field.type === 'checkbox' && (
                        <input
                            type="checkbox"
                            checked={!!values[field.id]}
                            onChange={e => setValues({ ...values, [field.id]: e.target.checked })}
                            required={field.required}
                        />
                    )}
                </div>
            ))}
            <button onClick={handleSubmit}>Submit</button>
        </div>
    );
}
*/

// ============================================================================
// 7. EXPORT ALL UTILITIES
// ============================================================================

export default {
    TemplateApiClient,
    PdfGenerator,
    TemplateValidator,
};
