import {jwtDecode} from 'jwt-decode';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';
export { API_BASE };

/** Get JWT token from localStorage */
function getToken() {
    return localStorage.getItem("token");
}

/** Decode JWT payload locally without hitting backend */
export function decodeToken() {
    const token = getToken();
    if (!token) return null;

    try {
        return jwtDecode(token); // using jwt-decode package
    } catch {
        return null;
    }
}

/** Generic POST request with optional auth */
export async function apiPost(path, body, auth = true) {
    const headers = { 'Content-Type': 'application/json' };
    if (auth) {
        const token = getToken();
        if (token) headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}${path}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));
    return { res, data };
}

/** Generic GET request with optional auth */
export async function apiGet(path, auth = true) {
    const headers = {};
    if (auth) {
        const token = getToken();
        if (token) headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}${path}`, { headers });
    const data = await res.json().catch(() => ({}));
    return { res, data };
}

/** Student endpoints */
export async function createStudent(data) {
    const { res, data: body } = await apiPost("/students", data);
    if (!res.ok) throw new Error(body.error || "Failed to create student");
    return body;
}

export async function getAllStudents() {
    const { res, data } = await apiGet("/students");
    if (!res.ok) throw new Error(data.error || "Failed to fetch students");
    return data;
}

/** Staff endpoints */
export async function createStaff(data) {
    const { res, data: body } = await apiPost("/staff", data);
    if (!res.ok) throw new Error(body.error || "Failed to create staff");
    return body;
}

export async function getAllStaff() {
    const { res, data } = await apiGet("/staff");
    if (!res.ok) throw new Error(data.error || "Failed to fetch staff");
    return data;
}

/** Get current user info from decoded JWT */
export async function getMe() {
    const payload = decodeToken();
    if (!payload) throw new Error("No valid token found");

    return {
        id: payload.id,
        role: payload.role,
        name: payload.name,
    };
}