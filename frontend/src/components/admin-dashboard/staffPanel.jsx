import React, { useState, useEffect } from "react";
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

    const load = async () => setStaff(await getAllStaff());
    useEffect(() => { load(); }, []);

    const submit = async e => {
        e.preventDefault();
        await createStaff(form);
        setShowForm(false);
        load();
    };

    const slice = staff.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

    return (
        <div className="panel">
            <h2>Staff</h2>

            <button className="add-btn" onClick={() => setShowForm(true)}>
                Add Staff
            </button>

            {showForm && (
                <form className="form" onSubmit={submit}>
                    <input placeholder="Name"
                           onChange={e => setForm({...form, name:e.target.value})}/>
                    <input placeholder="Email"
                           onChange={e => setForm({...form, email:e.target.value})}/>

                    <select
                        value={form.role}
                        onChange={e => setForm({...form, role:e.target.value})}
                    >
                        {Object.entries(ROLES).map(([v,l]) =>
                            <option key={v} value={v}>{l}</option>
                        )}
                    </select>

                    <input type="password" placeholder="Password"
                           onChange={e => setForm({...form, password:e.target.value})}/>

                    <button className="submit-btn">Create</button>
                </form>
            )}

            <table>
                <thead>
                <tr><th>Name</th><th>Email</th><th>Role</th></tr>
                </thead>
                <tbody>
                {slice.map(s => (
                    <tr key={s._id}>
                        <td>{s.name}</td>
                        <td>{s.email}</td>
                        <td>{ROLES[s.role]}</td>
                    </tr>
                ))}
                </tbody>
            </table>

            <Pagination page={page} setPage={setPage} total={staff.length}/>
        </div>
    );
};

export default StaffPanel;