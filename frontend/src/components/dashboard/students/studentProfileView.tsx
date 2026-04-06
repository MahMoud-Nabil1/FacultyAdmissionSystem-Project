import React, {useEffect, useState} from "react";
import {useParams} from "react-router-dom";
import {addStudentToGroup, getAllGroups, getStudentById, removeStudentFromGroup} from "../../../services/api";

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

interface Group {
    _id: string;
    number: number;
    subject: string;
    type: string;
    day: string;
    from: number;
    to: number;
}

const StudentProfile: React.FC = () => {
    const {id} = useParams();
    const [student, setStudent] = useState<Student | null>(null);
    const [loading, setLoading] = useState(true);
    const [groups, setGroups] = useState<Group[]>([]);
    const [selectedGroup, setSelectedGroup] = useState("");
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                const [studentData, groupsData] = await Promise.all([
                    getStudentById(id!),
                    getAllGroups()
                ]);

                setStudent(studentData);
                setGroups(groupsData);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    const handleAddToGroup = async () => {
        if (!selectedGroup || !student) return;

        setActionLoading(true);

        try {
            await addStudentToGroup(selectedGroup, student._id);

            const updatedStudent = await getStudentById(student._id);
            setStudent(updatedStudent);
            alert("Student added to group");
        } finally {
            setActionLoading(false);
        }
    };

    const handleRemoveFromGroup = async () => {
        if (!selectedGroup || !student) return;

        setActionLoading(true);

        try {
            await removeStudentFromGroup(selectedGroup, student._id);

            const updatedStudent = await getStudentById(student._id);
            setStudent(updatedStudent);
            alert("Student removed from group");
        } finally {
            setActionLoading(false);
        }
    };

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

            <h3>Admin Controls</h3>

            <div className="admin-controls">

                <select
                    value={selectedGroup}
                    onChange={(e) => setSelectedGroup(e.target.value)}
                >
                    <option value="">Select group</option>

                    {groups.map(g => (
                        <option key={g._id} value={g._id}>
                            {g.subject} - {g.type} (#{g.number}) {g.day} {g.from}-{g.to}
                        </option>
                    ))}
                </select>

                <div style={{display: "flex", gap: "10px", marginTop: "10px"}}>
                    <button onClick={handleAddToGroup} disabled={actionLoading}>
                        Add to Group
                    </button>

                    <button onClick={handleRemoveFromGroup} disabled={actionLoading}>
                        Remove from Group
                    </button>
                </div>

            </div>

        </div>
    );
};

export default StudentProfile;