import React, { useState, useEffect } from "react";
import { createStudent, getAllStudents } from "../../services/api";
import Pagination from "./pagination";
import { PAGE_SIZE } from "./constants";

const StudentPanel = () => {
    const [students, setStudents] = useState([]);
    const [page, setPage] = useState(0);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({
        studentId: "",
        name: "",
        email: "",
        password: "",
        gpa: ""
    });

    const load = async () => setStudents(await getAllStudents());

    useEffect(() => { load(); }, []);

    const submit = async e => {
        e.preventDefault();
        await createStudent(form);
        setShowForm(false);
        load();
    };

    const slice = students.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

    return (
        <div className="panel">
            <h2>Students</h2>

            <button className="add-btn" onClick={() => setShowForm(true)}>
                Add Student
            </button>

            {showForm && (
                <form className="form" onSubmit={submit}>
                    {Object.keys(form).map(k => (
                        <input
                            key={k}
                            name={k}
                            type={k === "password" ? "password" : "text"}
                            placeholder={k}
                            onChange={e => setForm({ ...form, [k]: e.target.value })}
                        />
                    ))}
                    <button className="submit-btn">Create</button>
                </form>
            )}

            <table>
                <thead>
                <tr>
                    <th>ID</th><th>Name</th><th>Email</th><th>GPA</th>
                </tr>
                </thead>
                <tbody>
                {slice.map(s => (
                    <tr key={s._id}>
                        <td>{s.studentId}</td>
                        <td>{s.name}</td>
                        <td>{s.email}</td>
                        <td>{s.gpa}</td>
                    </tr>
                ))}
                </tbody>
            </table>

            <Pagination page={page} setPage={setPage} total={students.length}/>
        </div>
    );
};

export default StudentPanel;