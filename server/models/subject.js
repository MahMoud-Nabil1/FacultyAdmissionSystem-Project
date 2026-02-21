import mongoose from 'mongoose';

const { Schema } = mongoose;

const subjectSchema = new Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    prerequisites: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Subject'
        }
    ],
    creditHours: {
        type: Number,
        required: true
    }
});

const Subject = mongoose.model('Subject', subjectSchema);

module.exports(Subject);
