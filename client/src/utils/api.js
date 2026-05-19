// Base URL for the API. It relies entirely on the environment variable set by Vite.
export const API_BASE = `${import.meta.env.VITE_API_URL}/api`;

export function getSocketUrl() {
    return import.meta.env.VITE_API_URL;
}
export async function apiFetch(endpoint, options = {}) {
    const token = localStorage.getItem('skillintel_token');
    const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
    const headers = {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...options.headers,
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
    });
    if (response.status === 401) {
        localStorage.removeItem('skillintel_token');
        localStorage.removeItem('skillintel_user');
        if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
        }
    }
    if (options.raw) {
        if (!response.ok) {
            const text = await response.text().catch(() => '');
            throw { status: response.status, message: text || response.statusText };
        }
        return response;
    }
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw { status: response.status, ...data };
    }
    return data;
}
/**
 * Helper: Check if user is currently authenticated
 */
export function isAuthenticated() {
    return !!localStorage.getItem('skillintel_token');
}
export function getStoredUser() {
    try {
        const raw = localStorage.getItem('skillintel_user');
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}
export function clearAuth() {
    localStorage.removeItem('skillintel_token');
    localStorage.removeItem('skillintel_user');
}
