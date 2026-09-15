import axios from 'axios';

export const api = axios.create({
    baseURL: import.meta.env.PROD
        ? window.location.origin
        : import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
    headers: {
        'Content-Type': 'application/json',
    },
    xsrfCookieName: 'csrf_access_token',
    xsrfHeaderName: 'X-CSRF-TOKEN',
    withXSRFToken: true,
    withCredentials: true,
});
