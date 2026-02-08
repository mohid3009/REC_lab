import mongoose, { Schema, Document } from 'mongoose';

export interface ICourse extends Document {
    title: string;
    description?: string;
    department: string;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
}

const CourseSchema: Schema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    department: {
        type: String,
        required: true,
        trim: true
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for faster queries
CourseSchema.index({ createdBy: 1 });
CourseSchema.index({ department: 1 });

export default mongoose.model<ICourse>('Course', CourseSchema);
