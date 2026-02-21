import mongoose from 'mongoose';

const {schema} = mongoose;

const staffSchema = new schema({
    name: {
        type: String,
        required: true
    },
    role: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    hash:{
        type: String,
        required: true
    },
    salt:{
        type: String,
    },
    departments: {
        type: schema.Types.ObjectId,
        ref: 'Departments'
    },
    students: {
        type: [schema.Types.ObjectId],
        ref: 'Student'
    }
})

const Staff = mongoose.model('Staff', staffSchema);

export default Staff;