import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getStudentById } from "../../../services/api";

interface Subject {
    _id: string;
    name: string;
    code: string;
}

interface Student {
    _id: string;
    studentId: number;
    name: string;
    email: string;
    gpa: number;
    completedSubjects: Subject[];
    requestedSubjects: Subject[];
}

const StudentProfile: React.FC = () => {
    const { id } = useParams();
    const [student, setStudent] = useState<Student | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStudent = async () => {
            try {
                const data = await getStudentById(id!);
                setStudent(data);
            } finally {
                setLoading(false);
            }
        };

        fetchStudent();
    }, [id]);

    if (loading) return <p>Loading...</p>;
    if (!student) return <p>Student not found</p>;

    return (
        <div className="dashboard-container">

            <h2>Student Profile</h2>

            <div className="student-info">
                <p><strong>ID:</strong> {student.studentId}</p>
                <p><strong>Name:</strong> {student.name}</p>
                <p><strong>Email:</strong> {student.email}</p>
                <p><strong>GPA:</strong> {student.gpa}</p>
            </div>

            <h3>Completed Subjects</h3>
            <ul>
                {student.completedSubjects.map(s => (
                    <li key={s._id}>{s.code} - {s.name}</li>
                ))}
            </ul>

            <h3>Requested Subjects</h3>
            <ul>
                {student.requestedSubjects.map(s => (
                    <li key={s._id}>{s.code} - {s.name}</li>
                ))}
            </ul>

        </div>
    );
};

export default StudentProfile;