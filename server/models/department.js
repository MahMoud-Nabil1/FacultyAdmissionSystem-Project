import mongoose from 'mongoose';

const { Schema } = mongoose;

const departmentSchema = new Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    subjects: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Subjects'
        }
    ]
});

const Department = mongoose.model('Department', departmentSchema);

module.exports(Department);