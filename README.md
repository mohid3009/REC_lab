# PDF Form Template System

A complete system for creating fillable PDF forms with a web interface. Teachers can upload PDFs, define fillable fields, and students can fill and export completed forms.

---

## 📚 Module Documentation

This project includes comprehensive documentation for using the template system in other modules:

### Core Documentation Files

1. **[TEMPLATE_SPECIFICATION.md](./TEMPLATE_SPECIFICATION.md)** - Complete technical specification
   - Data structures and interfaces
   - Database models (MongoDB)
   - API endpoint reference
   - Frontend integration guide
   - Best practices and examples

2. **[template-schema.json](./template-schema.json)** - JSON Schema validation
   - Schema definitions for Template, PdfField, and Submission
   - Validation rules
   - Example data structures

3. **[integration-example.ts](./integration-example.ts)** - Practical integration guide
   - Ready-to-use TypeScript classes
   - API client implementation
   - PDF generation utilities
   - Validation helpers
   - Complete usage examples

### Quick Start for Integration

To use this template system in another module:

```typescript
// 1. Copy types from integration-example.ts
import { Template, PdfField, Submission } from './integration-example';

// 2. Initialize the API client
import { TemplateApiClient } from './integration-example';
const apiClient = new TemplateApiClient('http://localhost:5000');

// 3. Load a template
const template = await apiClient.getTemplate(templateId);

// 4. Fill and generate PDF
import { PdfGenerator } from './integration-example';
const generator = new PdfGenerator();
const filledPdf = await generator.generateFilledPdf(template, values);
```

See [integration-example.ts](./integration-example.ts) for complete examples.

---

## 🚀 Project Setup

### Prerequisites
- Node.js v16+
- MongoDB running on `localhost:27017`

### Installation

1. **Install frontend dependencies**
   ```bash
   npm install
   ```

2. **Install server dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Configure environment**
   Create `server/.env`:
   ```
   MONGO_URI=mongodb://localhost:27017/pdf-form-system
   PORT=5000
   ```

### Running the Application

**Development Mode (Recommended)**
```bash
# Terminal 1: Frontend (Vite dev server on port 5173)
npm run dev

# Terminal 2: Backend (Express server on port 5000)
cd server
npm run dev
```

**Alternative: Run both simultaneously**
```bash
npm run dev:all
```

The application will be available at:
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`

---

## 🎯 Features

### Teacher Features
- Upload PDF documents
- Visual PDF editor with drag-and-drop
- Define fillable fields:
  - Text (single line)
  - Multiline (textarea)
  - Number
  - Date
  - Checkbox
- Field properties (label, required, font size)
- Multi-page support
- Save and publish templates

### Student Features
- Fill forms in browser
- Live PDF preview
- Zoom controls
- Form validation
- Export filled PDF
- Auto-save to database

---

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **PDF Rendering**: PDF.js
- **PDF Manipulation**: pdf-lib
- **Backend**: Node.js, Express, TypeScript
- **Database**: MongoDB with Mongoose
- **State Management**: Zustand

### Project Structure
```
uploadtopdf_template/
├── src/
│   ├── components/
│   │   ├── Teacher/          # Template creation interface
│   │   │   ├── TemplateEditor.tsx
│   │   │   ├── PdfCanvas.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── ...
│   │   └── Student/          # Form filling interface
│   │       └── FormFiller.tsx
│   ├── store/
│   │   └── useStore.ts       # Zustand state management
│   ├── types/
│   │   └── index.ts          # TypeScript interfaces
│   └── App.tsx
├── server/
│   ├── src/
│   │   ├── models/
│   │   │   ├── Template.ts   # Template schema
│   │   │   └── Submission.ts # Submission schema
│   │   └── index.ts          # Express API server
│   └── uploads/              # Uploaded PDF files
├── TEMPLATE_SPECIFICATION.md # Module integration docs
├── template-schema.json      # JSON Schema definitions
└── integration-example.ts    # TypeScript integration guide
```

---

## 📖 Usage

### Creating a Template (Teacher)

1. Navigate to the teacher view
2. Upload a PDF document
3. Add fields by dragging from the sidebar
4. Position fields on the PDF canvas
5. Configure field properties (label, type, required)
6. Save the template

### Filling a Form (Student)

1. Open the form URL: `http://localhost:5173/fill/:templateId`
2. Fill in all required fields
3. Click "Finish & Download PDF"
4. The filled PDF will be generated and downloaded

---

## 🔌 API Reference

See [TEMPLATE_SPECIFICATION.md](./TEMPLATE_SPECIFICATION.md) for complete API documentation.

### Quick Reference

```http
POST   /api/upload                      # Upload PDF file
POST   /api/templates                   # Create template
GET    /api/templates/:id               # Get template
PUT    /api/templates/:id               # Update template
POST   /api/submissions                 # Create submission
GET    /api/submissions/template/:id   # Get submissions
```

---

## 📦 NPM Scripts

### Frontend
- `npm run dev` - Start Vite dev server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run dev:all` - Run frontend and backend concurrently

### Backend
- `npm run dev` - Start server with nodemon (auto-reload)
- `npm run build` - Compile TypeScript
- `npm start` - Run compiled JavaScript

---

## 🎨 Design System

This project follows an **Editorial/Magazine aesthetic** with **Art Deco influences**:

- **Typography**: Serif fonts for headings, sans-serif for body
- **Colors**: 
  - Ink: `#1a1a1a` (primary text)
  - Gold: `#c9a55c` (accents)
  - Subtle gray backgrounds
- **Motion**: Subtle transitions and page load choreography

---

## 🔧 Configuration

### PDF.js Worker
The project uses PDF.js for rendering PDFs. The worker is configured in `src/main.tsx`:

```typescript
import * as pdfjsLib from 'pdfjs-dist';
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
```

### MongoDB Connection
Configure in `server/.env`:
```
MONGO_URI=mongodb://localhost:27017/pdf-form-system
```

### File Uploads
PDFs are stored in `server/uploads/` and served via:
```
http://localhost:5000/uploads/{filename}
```

---

## 🐛 Troubleshooting

### White screen on load
- Ensure MongoDB is running
- Check browser console for errors
- Verify PDF.js worker is loading correctly

### PDF not rendering
- Check network tab for 404 errors on PDF file
- Ensure `pdfUrl` in template is correct
- Verify uploads directory exists

### Fields not saving
- Check MongoDB connection
- Verify API endpoints are responding
- Check browser console for validation errors

---

## 📄 License

MIT

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## 📬 Support

For questions about integrating this template system into your project, refer to:
- [TEMPLATE_SPECIFICATION.md](./TEMPLATE_SPECIFICATION.md) for technical details
- [integration-example.ts](./integration-example.ts) for code examples

---

**Built with ❤️ using React, TypeScript, and pdf-lib**
