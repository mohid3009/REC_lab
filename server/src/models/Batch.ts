import mongoose, { Schema, Document } from 'mongoose';

export interface IBatch extends Document {
    name: string;
    classroomId: mongoose.Types.ObjectId;
    studentIds: mongoose.Types.ObjectId[];
    createdAt: Date;
}

const BatchSchema: Schema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    classroomId: {
        type: Schema.Types.ObjectId,
        ref: 'Classroom',
        required: true
    },
    studentIds: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for faster queries
BatchSchema.index({ classroomId: 1 });

export default mongoose.model<IBatch>('Batch', BatchSchema);
