import mongoose from 'mongoose';

const { Schema } = mongoose;

const subjectSchema = new Schema({
    sid: {
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
            ref: 'Subjects'
        }
    ],
    creditHours: {
        type: Number,
        required: true
    }
});

const Subjects = mongoose.model('Subjects', subjectSchema);

module.exports(Subjects);
