import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { IGroup } from '../components/Dashboards/Groups';

const API_BASE: string =
    (Constants.expoConfig?.extra?.apiBaseUrl as string) ||
    process.env.EXPO_PUBLIC_API_BASE_URL ||
    (Platform.OS === 'web' ? 'http://localhost:5000/api' : 'http://10.0.2.2:5000/api');

export { API_BASE };
async function fetchWithTimeout(url: string, options: RequestInit, ms = 10000): Promise<Response> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), ms);
    try {
        return await fetch(url, { ...options, signal: controller.signal });
    } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
            throw new Error('Request timed out');
        }
        if (error instanceof Error) {
            throw new Error(`Network error: ${error.message}`);
        }
        throw new Error('An unexpected error occurred');
    } finally {
        clearTimeout(id);
    }
}


async function getToken(): Promise<string | null> {
    if (Platform.OS === 'web') {
        return await AsyncStorage.getItem('token');
    }
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
    try {
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
    } catch (error) {
        if (error instanceof Error) {
            throw error;
        }
        throw new Error('An unexpected error occurred');
    }
}

export async function apiGet<T = Record<string, unknown>>(
    path: string,
    auth = true
): Promise<ApiResponse<T>> {
    try {
        const headers: Record<string, string> = {};
        if (auth) {
            const token = await getToken();
            if (token) headers['Authorization'] = `Bearer ${token}`;
        }
        const res = await fetchWithTimeout(`${API_BASE}${path}`, { headers });
        const data: T = await res.json().catch(() => ({}) as T);
        return { res, data };
    } catch (error) {
        if (error instanceof Error) {
            throw error;
        }
        throw new Error('An unexpected error occurred');
    }
}

export async function apiPut<T = Record<string, unknown>>(
    path: string,
    body: Record<string, unknown>,
    auth = true
): Promise<ApiResponse<T>> {
    try {
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
    } catch (error) {
        if (error instanceof Error) {
            throw error;
        }
        throw new Error('An unexpected error occurred');
    }
}

export async function apiDelete<T = Record<string, unknown>>(
    path: string,
    auth = true
): Promise<ApiResponse<T>> {
    try {
        const headers: Record<string, string> = {};
        if (auth) {
            const token = await getToken();
            if (token) headers['Authorization'] = `Bearer ${token}`;
        }
        const res = await fetchWithTimeout(`${API_BASE}${path}`, { method: 'DELETE', headers });
        const data: T = await res.json().catch(() => ({}) as T);
        return { res, data };
    } catch (error) {
        if (error instanceof Error) {
            throw error;
        }
        throw new Error('An unexpected error occurred');
    }
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

export async function createStudent(form: Record<string, unknown>) {
    const { res, data } = await apiPost('/students', form);
    if (!res.ok) throw Object.assign(new Error((data as any).error || 'Failed to create student'), { status: res.status });
    return data;
}

export async function deleteStudent(id: string) {
    const { res, data } = await apiDelete(`/students/${id}`);
    if (!res.ok) throw new Error((data as any).error || 'Failed to delete student');
    return data;
}
export async function getRegistrationStats() {
    const { res, data } = await apiGet('/students/stats');
    if (!res.ok) throw new Error((data as any).error || 'Failed to fetch stats');
    return data;
}

export async function getAllStaff() {
    const { res, data } = await apiGet('/staff');
    if (!res.ok) throw new Error((data as { error?: string }).error || 'Failed to fetch staff');
    return data;
}

export async function createStaff(form: Record<string, unknown>) {
    const { res, data } = await apiPost('/staff', form);
    if (!res.ok) throw Object.assign(new Error((data as any).error || 'Failed to create staff'), { status: res.status });
    return data;
}

export async function deleteStaff(id: string) {
    const { res, data } = await apiDelete(`/staff/${id}`);
    if (!res.ok) throw new Error((data as any).error || 'Failed to delete staff');
    return data;
}

export async function getAllSubjects() {
    const { res, data } = await apiGet('/subjects');
    if (!res.ok) throw new Error((data as { error?: string }).error || 'Failed to fetch subjects');
    return data;
}

export interface ISubject {
    _id: string;
    code: string;
    name: string;
    level: '1' | '2' | '3' | '4';
    creditHours: number;
    prerequisites: { _id: string; code: string; name: string }[];
    corequisites: { _id: string; code: string; name: string }[];
}

export async function getEligibleSubjects() {
    const { res, data } = await apiGet<ISubject[]>('/subjects/eligible');
    if (!res.ok) throw new Error((data as { error?: string }).error || 'Failed to fetch eligible subjects');
    return data;
}

export async function createSubject(form: Record<string, unknown>) {
    const { res, data } = await apiPost('/subjects', form);
    if (!res.ok) throw new Error((data as any).error || 'Failed to create subject');
    return data;
}

export async function updateSubject(id: string, form: Record<string, unknown>) {
    const { res, data } = await apiPut(`/subjects/${id}`, form);
    if (!res.ok) throw new Error((data as any).error || 'Failed to update subject');
    return data;
}

export async function deleteSubject(id: string) {
    const { res, data } = await apiDelete(`/subjects/${id}`);
    if (!res.ok) throw new Error((data as any).error || 'Failed to delete subject');
    return data;
}

export async function getAllGroups() {

    const { res, data } = await apiGet<IGroup[]>('/groups');
    if (!res.ok) throw new Error((data as any).error || 'Failed to fetch groups');
    return data;
}

export async function createGroup(form: Record<string, unknown>) {
    const { res, data } = await apiPost('/groups', form);
    if (!res.ok) throw new Error((data as any).error || 'Failed to create group');
    return data;
}

export async function deleteGroup(id: string) {
    const { res, data } = await apiDelete(`/groups/${id}`);
    if (!res.ok) throw new Error((data as any).error || 'Failed to delete group');
    return data;
}

export async function getAdvisees() {
    const { res, data } = await apiGet('/students/my-advisees');
    if (!res.ok) throw new Error((data as { error?: string }).error || 'Failed to fetch advisees');
    return data;
}

export async function getStudentDetails(id: string) {
    const { res, data } = await apiGet(`/students/${id}`);
    if (!res.ok) throw new Error((data as { error?: string }).error || 'Failed to fetch student details');
    return data;
}

export async function getStudentSchedule(studentId: string) {
    const { res, data } = await apiGet(`/groups/student/${studentId}`);
    if (!res.ok) throw new Error((data as { error?: string }).error || 'Failed to fetch student schedule');
    return data;
}

export async function registerStudentToGroup(groupId: string, studentId: string) {
    const { res, data } = await apiPost(`/groups/${groupId}/students`, { studentId });
    if (!res.ok) throw new Error((data as { error?: string }).error || 'Failed to register student');
    return data;
}

export async function getAllGroupsForAdvisor() {
    const { res, data } = await apiGet('/groups');
    if (!res.ok) throw new Error((data as { error?: string }).error || 'Failed to fetch groups');
    return data;
}
