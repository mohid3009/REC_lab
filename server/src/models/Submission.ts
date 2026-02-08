import mongoose, { Schema, Document } from 'mongoose';

export interface ISubmission extends Document {
    templateId: string;
    experimentId?: mongoose.Types.ObjectId;
    studentId: string;
    values: Map<string, any>;
    status: 'NOT_SUBMITTED' | 'SUBMITTED' | 'NEEDS_REVISION' | 'GRADED';
    submittedAt?: Date;
    remarks?: string;
    isLocked: boolean;
    reviewedAt?: Date;
    grade?: number;
    feedback?: string;
    gradedBy?: mongoose.Types.ObjectId;
    gradedAt?: Date;
}

const SubmissionSchema: Schema = new Schema({
    templateId: { type: Schema.Types.ObjectId, ref: 'Template', required: true },
    experimentId: { type: Schema.Types.ObjectId, ref: 'Experiment' },
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    values: { type: Map, of: Schema.Types.Mixed },
    status: {
        type: String,
        enum: ['NOT_SUBMITTED', 'SUBMITTED', 'NEEDS_REVISION', 'GRADED'],
        default: 'NOT_SUBMITTED'
    },
    submittedAt: { type: Date },
    remarks: { type: String },
    isLocked: { type: Boolean, default: false },
    reviewedAt: { type: Date },
    grade: { type: Number, min: 0, max: 10 },
    feedback: { type: String },
    gradedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    gradedAt: { type: Date }
});

// Index for faster queries
SubmissionSchema.index({ experimentId: 1 });
SubmissionSchema.index({ studentId: 1 });
SubmissionSchema.index({ status: 1 });

export default mongoose.model<ISubmission>('Submission', SubmissionSchema);
