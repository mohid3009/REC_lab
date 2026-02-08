import mongoose, { Schema, Document } from 'mongoose';

export interface IExperiment extends Document {
    classroomId: mongoose.Types.ObjectId;
    batchId?: mongoose.Types.ObjectId;
    templateId: mongoose.Types.ObjectId;
    title: string;
    description?: string;
    dueDate?: Date;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
}

const ExperimentSchema: Schema = new Schema({
    classroomId: {
        type: Schema.Types.ObjectId,
        ref: 'Classroom',
        required: true
    },
    batchId: {
        type: Schema.Types.ObjectId,
        ref: 'Batch'
    },
    templateId: {
        type: Schema.Types.ObjectId,
        ref: 'Template',
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    dueDate: {
        type: Date
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
ExperimentSchema.index({ classroomId: 1 });
ExperimentSchema.index({ templateId: 1 });

export default mongoose.model<IExperiment>('Experiment', ExperimentSchema);
