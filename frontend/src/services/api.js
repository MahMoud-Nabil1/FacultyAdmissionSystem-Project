import {jwtDecode} from 'jwt-decode';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';
export {API_BASE};


function getToken() {
    return sessionStorage.getItem("token");
}

function clearToken() {
    sessionStorage.removeItem("token");
}

function getAuthHeader() {
    const token = getToken();
    if (!token) return null;
    return {Authorization: `Bearer ${token}`};
}

export function decodeToken() {
    const token = getToken();
    if (!token) return null;

    try {
        const decoded = jwtDecode(token);
        const now = Date.now() / 1000;
        if (decoded.exp && decoded.exp < now) {
            clearToken();
            return null;
        }
        return decoded;
    } catch {
        clearToken();
        return null;
    }
}

async function handleResponse(res) {
    if (res.status === 401) {
        clearToken();
        window.location.href = '/login';
    }
    const data = await res.json().catch(() => ({}));
    return {res, data};
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

    return handleResponse(res);
}


export async function apiGet(path, auth = true) {
    const headers = {};
    if (auth) {
        const authHeader = getAuthHeader();
        if (authHeader) Object.assign(headers, authHeader);
    }
    const res = await fetch(`${API_BASE}${path}`, {headers});
    return handleResponse(res);
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
    return handleResponse(res);
}


export async function apiDelete(path, auth = true) {
    const headers = {};
    if (auth) {
        const token = getToken();
        if (token) headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch(`${API_BASE}${path}`, {method: 'DELETE', headers});
    return handleResponse(res);
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

export async function assignAcademicAdvisor(studentId, advisorId) {
    const {res, data} = await apiPut(`/students/${studentId}/assign-advisor`, { advisorId });
    if (!res.ok) throw new Error(data.error || "Failed to assign academic advisor");
    return data;
}

export async function getRegistrationStats() {
    const {res, data} = await apiGet("/students/stats");
    if (!res.ok) throw new Error(data.error || "Failed to fetch stats");
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
    if (!payload) return null;

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

export async function getEligibleSubjects() {
    const {res, data} = await apiGet("/subjects/eligible");
    if (!res.ok) throw new Error(data.error || "Failed to fetch eligible subjects");
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

export async function getSystemSettings() {
    const {res, data} = await apiGet("/settings", false);
    if (!res.ok) throw new Error(data.error || "Failed to fetch settings");
    return data;
}

export async function updateSystemSettings(settings) {
    const {res, data} = await apiPut("/settings", settings);
    if (!res.ok) throw new Error(data.error || "Failed to update settings");
    return data;
}

export async function getAnnouncementSettings() {
    const {res, data} = await apiGet("/announcements/settings");
    if (!res.ok) throw new Error(data.error || "Failed to fetch announcement settings");
    return data;
}

export async function updateAnnouncementSettings(settings) {
    const {res, data} = await apiPut("/announcements/settings", settings);
    if (!res.ok) throw new Error(data.error || "Failed to update announcement settings");
    return data;
}

export const getStudentById = async (id) => {
    const res = await apiGet(`/students/${id}`);
    return res.data;
};

export const getAllGroups = async () => {
    const res = await apiGet("/groups");
    return res.data;
};

export const addStudentToGroup = async (groupId, studentId) => {
    const res = await apiPost(`/groups/${groupId}/students`, { studentId });
    return res.data;
};

export const removeStudentFromGroup = async (groupId, studentId) => {
    const res = await apiDelete(`/groups/${groupId}/students?studentId=${studentId}`);
    return res.data;
};

// Places API
export const getAllPlaces = async () => {
    const { res, data } = await apiGet("/places", false);
    if (!res.ok) throw new Error(data.error || "Failed to fetch places");
    return data;
};

export const getPlaceById = async (id) => {
    const { res, data } = await apiGet(`/places/${id}`);
    if (!res.ok) throw new Error(data.error || "Failed to fetch place");
    return data;
};

export const createPlace = async (data) => {
    const { res, data: body } = await apiPost("/places", data);
    if (!res.ok) throw new Error(body.error || "Failed to create place");
    return body;
};

export const updatePlace = async (id, data) => {
    const { res, data: body } = await apiPut(`/places/${id}`, data);
    if (!res.ok) throw new Error(body.error || "Failed to update place");
    return body;
};

export const deletePlace = async (id) => {
    const { res, data } = await apiDelete(`/places/${id}`);
    if (!res.ok) throw new Error(data.error || "Failed to delete place");
    return data;
};