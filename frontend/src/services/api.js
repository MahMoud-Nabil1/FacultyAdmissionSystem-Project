const API_BASE =
    process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

export { API_BASE };

export async function apiPost(path, body) {
    const res = await fetch(`${API_BASE}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return { res, data };
}

export async function apiGet(path) {
    const res = await fetch(`${API_BASE}${path}`);
    const data = await res.json().catch(() => ({}));
    return { res, data };
}

export async function createStudent(data) {
    const res = await fetch("http://localhost:5000/api/students", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(data)
    });

    if (!res.ok) throw new Error("Failed");
    return res.json();
}

export async function getAllStudents() {
    const { res, data } = await apiGet("/students");

    if (!res.ok) {
        throw new Error(data.error || "Failed to fetch students");
    }

    return data;
}

export async function getAllStaff() {
    const { res, data } = await apiGet("/staff");
    if (!res.ok) throw new Error(data.error || "Failed to fetch staff");
    return data;
}

export async function createStaff(data) {
    const { res, data: body } = await apiPost("/staff", data);
    if (!res.ok) throw new Error(body.error || "Failed to create staff");
    return body;
}