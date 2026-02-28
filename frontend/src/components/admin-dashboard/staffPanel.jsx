import React, { useEffect, useState } from "react";
import { createStaff, getAllStaff } from "../../services/api";
import Pagination from "./pagination";
import { PAGE_SIZE, ROLES } from "./constants";

const StaffPanel = () => {
    const [staff, setStaff] = useState([]);
    const [page, setPage] = useState(0);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({
        name: "",
        email: "",
        role: "admin",
        password: ""
    });
    const [copiedId, setCopiedId] = useState(null);

    const load = async () => setStaff(await getAllStaff());
    useEffect(() => {
        load();
    }, []);

    const submit = async e => {
        e.preventDefault();
        await createStaff(form);
        setShowForm(false);
        await load();
    };

    const slice = staff.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

    return (
        <div className="dashboard-container">
            <h2>الموظفين</h2>

            <button className="add-btn" onClick={() => setShowForm(true)}>
                اضف موظف جديد
            </button>

            {showForm && (
                <form className="form" onSubmit={submit}>
                    <input placeholder="الإسم"
                        onChange={e => setForm({ ...form, name: e.target.value })} />
                    <input placeholder="الإيميل"
                        onChange={e => setForm({ ...form, email: e.target.value })} />
                    <select
                        value={form.role}
                        onChange={e => setForm({ ...form, role: e.target.value })}
                    >
                        {Object.entries(ROLES).map(([v, l]) =>
                            <option key={v} value={v}>{l}</option>
                        )}
                    </select>

                    <input type="password" placeholder="كلمة السر"
                        onChange={e => setForm({ ...form, password: e.target.value })} />

                    <button className="submit-btn">سجل موظف جديد</button>
                </form>
            )}

            <table>
                <thead>
                    <tr>
                        <th>الإسم</th>
                        <th>الإيميل</th>
                        <th>الرتبة</th>
                        <th>ID</th>
                    </tr>
                </thead>
                <tbody>
                    {slice.map(s => (
                        <tr key={s._id}>
                            <td>{s.name}</td>
                            <td>{s.email}</td>
                            <td>{ROLES[s.role]}</td>
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

            <Pagination page={page} setPage={setPage} total={staff.length} />
        </div>
    );
};

export default StaffPanel;