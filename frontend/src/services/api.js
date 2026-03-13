import {jwtDecode} from 'jwt-decode';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';
export {API_BASE};


function getToken() {
    return localStorage.getItem("token");
}

function getAuthHeader() {
    const token = getToken();
    if (!token) throw new Error("No token found. Please login.");
    return {Authorization: `Bearer ${token}`};
}

export function decodeToken() {
    const token = getToken();
    if (!token) return null;

    try {
        return jwtDecode(token);
    } catch {
        return null;
    }
}


export async function apiPost(path, body, auth = true) {
    const headers = {'Content-Type': 'application/json'};
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
    return {res, data};
}


export async function apiGet(path, auth = true) {
    const headers = auth ? getAuthHeader() : {};
    const res = await fetch(`${API_BASE}${path}`, {headers});
    const data = await res.json().catch(() => ({}));
    return {res, data};
}

export async function apiPut(path, body, auth = true) {
    const headers = {'Content-Type': 'application/json'};
    if (auth) {
        const token = getToken();
        if (token) headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch(`${API_BASE}${path}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return {res, data};
}


export async function apiDelete(path, auth = true) {
    const headers = {};
    if (auth) {
        const token = getToken();
        if (token) headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch(`${API_BASE}${path}`, {method: 'DELETE', headers});
    const data = await res.json().catch(() => ({}));
    return {res, data};
}


export async function createStudent(data) {
    const {res, data: body} = await apiPost("/students", data);
    if (!res.ok) {
        // eslint-disable-next-line no-throw-literal
        throw {
            message: body.error || "Failed to create student",
            status: res.status
        };
    }
    return body;
}

export async function getAllStudents() {
    const {res, data} = await apiGet("/students");
    if (!res.ok) throw new Error(data.error || "Failed to fetch students");
    return data;
}

export async function deleteStudent(id) {
    const {res, data} = await apiDelete(`/students/${id}`);
    if (!res.ok) throw new Error(data.error || "Failed to delete student");
    return data;
}

export async function createStaff(data) {
    const {res, data: body} = await apiPost("/staff", data);
    if (!res.ok) {
        // eslint-disable-next-line no-throw-literal
        throw {
            message: body.error || "Failed to create staff",
            status: res.status
        };
    }
    return body;
}

export async function getAllStaff() {
    const {res, data} = await apiGet("/staff");
    if (!res.ok) throw new Error(data.error || "Failed to fetch staff");
    return data;
}

export async function deleteStaff(id) {
    const {res, data} = await apiDelete(`/staff/${id}`);
    if (!res.ok) throw new Error(data.error || "Failed to delete staff");
    return data;
}

export async function getMe() {
    const payload = decodeToken();
    if (!payload) throw new Error("No valid token found");

    return {
        id: payload.id,
        role: payload.role,
        name: payload.name,
    };
}


export async function getAllSubjects() {
    const {res, data} = await apiGet("/subjects");
    if (!res.ok) throw new Error(data.error || "Failed to fetch subjects");
    return data;
}

export async function getSubjectById(id) {
    const {res, data} = await apiGet(`/subjects/${id}`);
    if (!res.ok) throw new Error(data.error || "Failed to fetch subject");
    return data;
}

export async function createSubject(data) {
    const {res, data: body} = await apiPost("/subjects", data);
    if (!res.ok) throw new Error(body.error || "Failed to create subject");
    return body;
}

export async function updateSubject(id, data) {
    const {res, data: body} = await apiPut(`/subjects/${id}`, data);
    if (!res.ok) throw new Error(body.error || "Failed to update subject");
    return body;
}

export async function deleteSubject(id) {
    const {res, data} = await apiDelete(`/subjects/${id}`);
    if (!res.ok) throw new Error(data.error || "Failed to delete subject");
    return data;
}