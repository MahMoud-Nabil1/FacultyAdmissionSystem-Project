import React, { useEffect, useState } from "react";
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
    const [copiedId, setCopiedId] = useState(null);

    const load = async () => setStudents(await getAllStudents());

    useEffect(() => { load(); }, []);

    const submit = async e => {
        e.preventDefault();
        await createStudent(form);
        setShowForm(false);
        await load();
    };

    const slice = students.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

    return (
        <div className="dashboard-container">
            <h2>الطلاب</h2>

            <button className="add-btn" onClick={() => setShowForm(true)}>
                اضف طالب جديد
            </button>

            {showForm && (
                <form className="form" onSubmit={submit}>
                    <input
                        placeholder="كود الطالب"
                        value={form.studentId}
                        onChange={e => setForm({ ...form, studentId: e.target.value })}
                    />
                    <input
                        placeholder="الإسم"
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                    />
                    <input
                        placeholder="الإيميل"
                        value={form.email}
                        onChange={e => setForm({ ...form, email: e.target.value })}
                    />
                    <input
                        placeholder="المعدل التراكمى"
                        value={form.gpa}
                        onChange={e => setForm({ ...form, gpa: e.target.value })}
                    />
                    <input
                        type="password"
                        placeholder="كلمة السر"
                        value={form.password}
                        onChange={e => setForm({ ...form, password: e.target.value })}
                    />
                    <button className="submit-btn">سجل طالب جديد</button>
                </form>
            )}

            <table>
                <thead>
                    <tr>
                        <th>كود الطالب</th>
                        <th>الإسم</th>
                        <th>الإيميل</th>
                        <th>المعدل التراكمى</th>
                        <th>ID</th>
                    </tr>
                </thead>
                <tbody>
                    {slice.map(s => (
                        <tr key={s._id}>
                            <td>{s.studentId}</td>
                            <td>{s.name}</td>
                            <td>{s.email}</td>
                            <td>{s.gpa}</td>
                            <td>
                                <button
                                    className="copy-btn"
                                    onClick={() => {
                                        navigator.clipboard.writeText(s._id);
                                        setCopiedId(s._id);
                                        setTimeout(() => setCopiedId(null), 3000);
                                    }}
                                >
                                    {copiedId === s._id ? "تم!" : "نسخ"}
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <Pagination page={page} setPage={setPage} total={students.length} />
        </div>
    );
};

export default StudentPanel;