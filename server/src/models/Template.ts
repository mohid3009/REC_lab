import mongoose, { Schema, Document } from 'mongoose';

export interface IPdfField {
    fieldId: string;
    type: string;
    page: number;
    x: number;
    y: number;
    width: number;
    height: number;
    label?: string;
    required?: boolean;
    fontSize?: number;
}

export interface ITemplate extends Document {
    title: string;
    pdfUrl: string;
    pageCount: number;
    dimensions: { width: number; height: number };
    fields: IPdfField[];
    isPublished: boolean;
    createdBy: mongoose.Types.ObjectId;
    courseId?: mongoose.Types.ObjectId;
    createdAt: Date;
}

const FieldSchema = new Schema({
    fieldId: { type: String, required: true },
    type: { type: String, required: true },
    page: { type: Number, required: true },
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    label: { type: String },
    required: { type: Boolean, default: false },
    fontSize: { type: Number }
}, { _id: false });

const TemplateSchema: Schema = new Schema({
    title: { type: String, required: true },
    pdfUrl: { type: String, required: true },
    pageCount: { type: Number, required: true },
    dimensions: {
        width: { type: Number, required: true },
        height: { type: Number, required: true }
    },
    fields: [FieldSchema],
    isPublished: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course' },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<ITemplate>('Template', TemplateSchema);
