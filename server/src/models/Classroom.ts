import mongoose, { Schema, Document } from 'mongoose';

export interface IClassroom extends Document {
    name: string;
    description?: string;
    courseCode: string;
    code: string;
    teacherId: mongoose.Types.ObjectId;
    enrolledStudents: mongoose.Types.ObjectId[];
    courseId?: mongoose.Types.ObjectId;
    createdAt: Date;
}

const ClassroomSchema = new Schema<IClassroom>({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    courseCode: {
        type: String,
        required: true,
        trim: true,
        uppercase: true
    },
    code: {
        type: String,
        unique: true,
        uppercase: true
    },
    teacherId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    enrolledStudents: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    courseId: {
        type: Schema.Types.ObjectId,
        ref: 'Course'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for faster queries
ClassroomSchema.index({ teacherId: 1 });
ClassroomSchema.index({ enrolledStudents: 1 });
ClassroomSchema.index({ code: 1 });

// Generate random code before saving
ClassroomSchema.pre('save', async function () {
    const classroom = this as IClassroom;
    if (!classroom.isNew) return;

    // Generate unique 6-character code
    let code: string | null = null;
    let isUnique = false;

    // Retry loop for uniqueness
    while (!isUnique) {
        // Generate random 6-char alphanumeric code
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude I, O, 1, 0 to avoid confusion
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        // Check uniqueness
        try {
            const existing = await mongoose.model('Classroom').findOne({ code: result });
            if (!existing) {
                code = result;
                isUnique = true;
            }
        } catch (err) {
            throw err;
        }
    }

    if (code) {
        classroom.code = code;
    }
});

export default mongoose.model<IClassroom>('Classroom', ClassroomSchema);
