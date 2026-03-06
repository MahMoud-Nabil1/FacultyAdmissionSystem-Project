import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from 'jwt-decode';
import Constants from 'expo-constants';


const API_BASE: string =
    (Constants.expoConfig?.extra?.apiBaseUrl as string) ||
    process.env.EXPO_PUBLIC_API_BASE_URL ||
    'http://10.0.2.2:5000/api';

export { API_BASE };
async function fetchWithTimeout(url: string, options: RequestInit, ms = 10000): Promise<Response> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), ms);
    try {
        return await fetch(url, { ...options, signal: controller.signal });
    } finally {
        clearTimeout(id);
    }
}


async function getToken(): Promise<string | null> {
    return SecureStore.getItemAsync('token');
}

export interface DecodedUser {
    id: string;
    role: string;
    name?: string;
}

export async function decodeToken(): Promise<DecodedUser | null> {
    const token = await getToken();
    if (!token) return null;
    try {
        return jwtDecode<DecodedUser>(token);
    } catch {
        return null;
    }
}


export interface ApiResponse<T = Record<string, unknown>> {
    res: Response;
    data: T;
}

export async function apiPost<T = Record<string, unknown>>(
    path: string,
    body: Record<string, unknown>,
    auth = true
): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (auth) {
        const token = await getToken();
        if (token) headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetchWithTimeout(`${API_BASE}${path}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
    });
    const data: T = await res.json().catch(() => ({}) as T);
    return { res, data };
}

export async function apiGet<T = Record<string, unknown>>(
    path: string,
    auth = true
): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {};
    if (auth) {
        const token = await getToken();
        if (token) headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch(`${API_BASE}${path}`, { headers });
    const data: T = await res.json().catch(() => ({}) as T);
    return { res, data };
}

export async function apiPut<T = Record<string, unknown>>(
    path: string,
    body: Record<string, unknown>,
    auth = true
): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (auth) {
        const token = await getToken();
        if (token) headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetchWithTimeout(`${API_BASE}${path}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(body),
    });
    const data: T = await res.json().catch(() => ({}) as T);
    return { res, data };
}

export async function apiDelete<T = Record<string, unknown>>(
    path: string,
    auth = true
): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {};
    if (auth) {
        const token = await getToken();
        if (token) headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch(`${API_BASE}${path}`, { method: 'DELETE', headers });
    const data: T = await res.json().catch(() => ({}) as T);
    return { res, data };
}


export async function getMe(): Promise<DecodedUser> {
    const payload = await decodeToken();
    if (!payload) throw new Error('No valid token found');
    return payload;
}

export async function getAllStudents() {
    const { res, data } = await apiGet('/students');
    if (!res.ok) throw new Error((data as { error?: string }).error || 'Failed to fetch students');
    return data;
}

export async function getAllStaff() {
    const { res, data } = await apiGet('/staff');
    if (!res.ok) throw new Error((data as { error?: string }).error || 'Failed to fetch staff');
    return data;
}

export async function getAllSubjects() {
    const { res, data } = await apiGet('/subjects');
    if (!res.ok) throw new Error((data as { error?: string }).error || 'Failed to fetch subjects');
    return data;
}
