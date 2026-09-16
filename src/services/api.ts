import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

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

api.interceptors.response.use(
    (response) => response,
    (error: unknown) => {
        if (axios.isAxiosError(error)) {
            const code = error.response?.data?.code;
            if (code === 'SESSION_INVALIDATED' || code === 'SESSION_EXPIRED') {
                useAuthStore.getState().logout();
                sessionStorage.setItem(
                    'auth_notice',
                    code === 'SESSION_INVALIDATED'
                        ? '계정 보안 정보가 변경되어 로그아웃되었습니다. 다시 로그인해 주세요.'
                        : '로그인 세션이 만료되었습니다. 다시 로그인해 주세요.',
                );
                if (window.location.pathname !== '/login') window.location.assign('/login');
            }
        }
        return Promise.reject(error);
    },
);
