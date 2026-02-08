# PDF Template System - Data Specification

## Overview
This document defines the data structures and interfaces for the PDF Form Template System, enabling module reusability and integration with other applications.

---

## Core Data Structures

### 1. PdfField Interface

Represents a fillable field on a PDF template.

```typescript
interface PdfField {
    id: string;                    // Unique identifier for the field
    type: 'text' | 'multiline' | 'number' | 'image' | 'signature' | 'date' | 'checkbox';
    page: number;                  // Page number (1-indexed)
    x: number;                     // X coordinate in PDF points
    y: number;                     // Y coordinate in PDF points
    width: number;                 // Width in PDF points
    height: number;                // Height in PDF points
    label?: string;                // Optional field label/placeholder
    required?: boolean;            // Whether field is required
    fontSize?: number;             // Font size for text fields (default: 12)
}
```

#### Field Types:
- **text**: Single-line text input
- **multiline**: Multi-line textarea
- **number**: Numeric input
- **date**: Date picker
- **checkbox**: Boolean checkbox (renders as "X" when checked)
- **image**: Image upload field (future implementation)
- **signature**: Signature capture field (future implementation)

#### Coordinate System:
- Origin (0,0) is at **top-left** of the page
- All measurements in **PDF points** (1 point = 1/72 inch)
- Y-axis increases **downward**

---

### 2. Template Interface

Represents a complete PDF template with all metadata and fields.

```typescript
interface Template {
    _id: string;                   // MongoDB ObjectId as string
    title: string;                 // Template display name
    pdfUrl: string;                // URL/path to the source PDF file
    pageCount: number;             // Total number of pages in PDF
    dimensions: {                  // PDF dimensions in points
        width: number;
        height: number;
    };
    fields: PdfField[];            // Array of fillable fields
    isPublished: boolean;          // Publication status
    createdAt: string;             // ISO 8601 timestamp
}
```

---

### 3. Submission Interface

Represents a student's filled form submission.

```typescript
interface Submission {
    _id: string;                   // MongoDB ObjectId as string
    templateId: string;            // Reference to Template._id
    studentId: string;             // Student identifier
    values: Record<string, string | number | boolean>;  // Field values keyed by field.id
    status: 'DRAFT' | 'LOCKED';    // Submission status
    submittedAt?: string;          // ISO 8601 timestamp (when status = 'LOCKED')
}
```

#### Value Types by Field Type:
- `text`, `multiline`, `date`: `string`
- `number`: `number` or `string`
- `checkbox`: `boolean`

---

## Database Models (MongoDB)

### Template Collection

```javascript
{
    _id: ObjectId,
    title: String (required),
    pdfUrl: String (required),
    pageCount: Number (required),
    dimensions: {
        width: Number (required),
        height: Number (required)
    },
    fields: [
        {
            fieldId: String (required),
            type: String (required),
            page: Number (required),
            x: Number (required),
            y: Number (required),
            width: Number (required),
            height: Number (required),
            label: String (optional),
            required: Boolean (default: false),
            fontSize: Number (optional)
        }
    ],
    isPublished: Boolean (default: false),
    createdAt: Date (default: Date.now)
}
```

> **Note**: In the database, fields use `fieldId`, but the frontend normalizes to `id`.

### Submission Collection

```javascript
{
    _id: ObjectId,
    templateId: ObjectId (ref: 'Template', required),
    studentId: String (required),
    values: Map<String, Mixed>,
    status: String (enum: ['DRAFT', 'LOCKED'], default: 'DRAFT'),
    submittedAt: Date (optional)
}
```

---

## API Endpoints

### Upload PDF
```http
POST /api/upload
Content-Type: multipart/form-data

Request Body:
- pdf: File (PDF file)

Response:
{
    "url": "/uploads/1234567890-document.pdf",
    "filename": "1234567890-document.pdf"
}
```

### Create Template
```http
POST /api/templates
Content-Type: application/json

Request Body:
{
    "title": "Student Registration Form",
    "pdfUrl": "/uploads/1234567890-document.pdf",
    "pageCount": 2,
    "dimensions": { "width": 612, "height": 792 },
    "fields": [
        {
            "fieldId": "name_field_123",
            "type": "text",
            "page": 1,
            "x": 100,
            "y": 150,
            "width": 200,
            "height": 30,
            "label": "Full Name",
            "required": true,
            "fontSize": 14
        }
    ],
    "isPublished": false
}

Response: Template object with _id
```

### Update Template
```http
PUT /api/templates/:id
Content-Type: application/json

Request Body: Partial Template object

Response: Updated Template object
```

### Get Template by ID
```http
GET /api/templates/:id

Response: Template object
```

### Create Submission
```http
POST /api/submissions
Content-Type: application/json

Request Body:
{
    "templateId": "507f1f77bcf86cd799439011",
    "studentId": "student123",
    "values": {
        "name_field_123": "John Doe",
        "age_field_456": 25,
        "consent_checkbox_789": true
    },
    "status": "LOCKED",
    "submittedAt": "2026-02-02T03:00:00Z"
}

Response: Submission object with _id
```

### Get Submissions for Template
```http
GET /api/submissions/template/:templateId

Response: Array of Submission objects
```

---

## Frontend Integration

### 1. Loading a Template

```typescript
const response = await fetch(`/api/templates/${templateId}`);
const template: Template = await response.json();

// Template fields may use 'fieldId' - normalize to 'id'
const normalizedFields = template.fields.map(f => ({
    ...f,
    id: f.fieldId || f.id
}));
```

### 2. Rendering Input Fields

```typescript
// Calculate scaled positions
const scaledStyle = {
    position: 'absolute',
    left: field.x * scale,
    top: field.y * scale,
    width: field.width * scale,
    height: field.height * scale,
    fontSize: (field.fontSize || 12) * scale
};

// Render based on field type
switch(field.type) {
    case 'text':
        return <input type="text" style={scaledStyle} />;
    case 'multiline':
        return <textarea style={scaledStyle} />;
    case 'number':
        return <input type="number" style={scaledStyle} />;
    case 'date':
        return <input type="date" style={scaledStyle} />;
    case 'checkbox':
        return <input type="checkbox" style={scaledStyle} />;
}
```

### 3. Generating Filled PDF

```typescript
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

async function generateFilledPdf(
    template: Template, 
    values: Record<string, any>
): Promise<Blob> {
    // Load original PDF
    const pdfBytes = await fetch(template.pdfUrl).then(r => r.arrayBuffer());
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const pages = pdfDoc.getPages();

    // Fill each field
    for (const field of template.fields) {
        const value = values[field.id];
        if (!value) continue;

        const page = pages[field.page - 1];
        const { height: pageHeight } = page.getSize();
        const fontSize = field.fontSize || 12;

        if (field.type === 'checkbox') {
            if (value === true) {
                page.drawText('X', {
                    x: field.x + (field.width * 0.2),
                    y: pageHeight - field.y - (field.height * 0.8),
                    size: field.height * 0.7,
                    font,
                    color: rgb(0, 0, 0)
                });
            }
        } else {
            page.drawText(String(value), {
                x: field.x,
                y: pageHeight - field.y - fontSize,
                size: fontSize,
                font,
                color: rgb(0, 0, 0),
                maxWidth: field.width
            });
        }
    }

    const outputBytes = await pdfDoc.save();
    return new Blob([outputBytes], { type: 'application/pdf' });
}
```

---

## Module Reusability Guidelines

### Importing into Another Module

1. **Copy Type Definitions**
   ```typescript
   // types/pdf-template.ts
   export interface PdfField { /* ... */ }
   export interface Template { /* ... */ }
   export interface Submission { /* ... */ }
   ```

2. **Use Template Data**
   ```typescript
   import type { Template } from './types/pdf-template';
   
   // Fetch template from API
   const template = await fetchTemplate(templateId);
   
   // Access fields
   const textFields = template.fields.filter(f => f.type === 'text');
   ```

3. **Render Custom UI**
   ```typescript
   // You can create your own rendering logic
   function MyCustomFormRenderer({ template }: { template: Template }) {
       return template.fields.map(field => (
           <CustomField key={field.id} config={field} />
       ));
   }
   ```

4. **Export to Other Formats**
   ```typescript
   // Convert template to JSON for external systems
   const exportData = {
       templateId: template._id,
       formName: template.title,
       formFields: template.fields.map(f => ({
           name: f.label || f.id,
           type: f.type,
           required: f.required
       }))
   };
   ```

---

## Storage & File Paths

### Production Environment
- **PDF Files**: Stored in `server/uploads/` directory
- **Access URL**: Served via `/uploads/:filename` static route
- **File Naming**: `{timestamp}-{originalname}.pdf`

### Database
- **Database**: MongoDB
- **Connection**: `mongodb://localhost:27017/pdf-form-system`
- **Collections**: `templates`, `submissions`

---

## Example: Complete Template JSON

```json
{
    "_id": "67a123456789abcdef012345",
    "title": "Student Enrollment Form 2026",
    "pdfUrl": "/uploads/1738450987123-enrollment.pdf",
    "pageCount": 3,
    "dimensions": {
        "width": 612,
        "height": 792
    },
    "fields": [
        {
            "fieldId": "student_name",
            "type": "text",
            "page": 1,
            "x": 150,
            "y": 200,
            "width": 300,
            "height": 25,
            "label": "Student Full Name",
            "required": true,
            "fontSize": 14
        },
        {
            "fieldId": "dob",
            "type": "date",
            "page": 1,
            "x": 150,
            "y": 250,
            "width": 200,
            "height": 25,
            "label": "Date of Birth",
            "required": true,
            "fontSize": 12
        },
        {
            "fieldId": "grade",
            "type": "number",
            "page": 1,
            "x": 150,
            "y": 300,
            "width": 100,
            "height": 25,
            "label": "Grade Level",
            "required": true,
            "fontSize": 12
        },
        {
            "fieldId": "consent",
            "type": "checkbox",
            "page": 3,
            "x": 50,
            "y": 700,
            "width": 20,
            "height": 20,
            "label": "I agree to terms",
            "required": true
        }
    ],
    "isPublished": true,
    "createdAt": "2026-02-01T10:30:00.000Z"
}
```

---

## Example: Complete Submission JSON

```json
{
    "_id": "67a987654321fedcba098765",
    "templateId": "67a123456789abcdef012345",
    "studentId": "STU2026001",
    "values": {
        "student_name": "Alice Johnson",
        "dob": "2010-05-15",
        "grade": 10,
        "consent": true
    },
    "status": "LOCKED",
    "submittedAt": "2026-02-02T03:15:30.000Z"
}
```

---

## Best Practices

### 1. Field ID Generation
- Use descriptive, unique IDs: `student_name_field_001`
- Include field purpose in ID for clarity
- Avoid special characters except underscore

### 2. Coordinate Mapping
- Always test field positions at scale = 1.0
- Account for font descent when placing text
- For checkboxes, center the "X" mark within bounds

### 3. Validation
- Always validate required fields before submission
- Check field type matches expected value type
- Verify page number is within template.pageCount

### 4. Error Handling
- Handle missing templates gracefully
- Validate PDF URL accessibility before field rendering
- Catch PDF generation errors and provide user feedback

### 5. Performance
- Cache template data on client
- Lazy-load PDF pages for multi-page forms
- Debounce auto-save operations

---

## Integration Checklist

When integrating this template system into another module:

- [ ] Copy type definitions (`PdfField`, `Template`, `Submission`)
- [ ] Set up API client with correct base URL
- [ ] Install required dependencies (`pdf-lib`, `pdfjs-dist`)
- [ ] Implement field rendering for all field types
- [ ] Add coordinate scaling logic if using zoom
- [ ] Implement PDF generation with `pdf-lib`
- [ ] Handle file uploads if creating templates
- [ ] Set up MongoDB connection if managing persistence
- [ ] Test with multi-page PDFs
- [ ] Validate required field enforcement
- [ ] Test checkbox rendering (X mark positioning)
- [ ] Verify date format compatibility
- [ ] Handle network errors and loading states

---

## Version
**System Version**: 1.0  
**Last Updated**: 2026-02-02  
**API Compatibility**: v1
