/**
 * ═══════════════════════════════════════════════════════════════
 * API Utility — Configured Axios Instance
 * ═══════════════════════════════════════════════════════════════
 *
 * WHAT ARE INTERCEPTORS?
 * ──────────────────────
 * Axios interceptors are functions that run automatically on
 * EVERY request or response. They act as middleware for HTTP calls:
 *
 * REQUEST INTERCEPTOR:
 *   Runs before every request is sent. We use it to automatically
 *   attach the JWT token to the Authorization header. This means
 *   every API call is authenticated without manually adding headers.
 *
 * RESPONSE INTERCEPTOR:
 *   Runs after every response is received. We use it to detect
 *   401 (Unauthorized) errors — if the token is expired or invalid,
 *   we automatically clear stored credentials and redirect to login.
 *
 * WHY USE INTERCEPTORS?
 *   Without them, every fetch/axios call would need:
 *     headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
 *   Interceptors handle this automatically, keeping code DRY.
 * ═══════════════════════════════════════════════════════════════
 */

const API_BASE = '/api';

/**
 * Make an API request with automatic JWT authorization
 * @param {string} endpoint - API path (e.g., '/skills', '/auth/login')
 * @param {object} options - fetch options (method, body, etc.)
 * @returns {Promise<object>} - Parsed JSON response
 */
export async function apiFetch(endpoint, options = {}) {
    const token = localStorage.getItem('skillintel_token');

    // FormData uploads need the browser-managed multipart boundary, so we
    // skip the JSON Content-Type header in that case. Callers can also
    // pass `raw: true` to get the Response object back (used for file downloads).
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

/**
 * Helper: Get stored user info
 */
export function getStoredUser() {
    try {
        const raw = localStorage.getItem('skillintel_user');
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

/**
 * Helper: Clear all authentication data
 */
export function clearAuth() {
    localStorage.removeItem('skillintel_token');
    localStorage.removeItem('skillintel_user');
}
