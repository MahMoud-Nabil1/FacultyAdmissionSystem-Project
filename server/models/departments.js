import mongoose from 'mongoose';

const { Schema } = mongoose;

const departmentSchema = new Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    dname: {
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

const Departments = mongoose.model('Departments', departmentSchema);

module.exports(Departments);