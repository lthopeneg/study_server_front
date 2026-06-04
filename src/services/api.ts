import axios from 'axios';

export const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
    headers: {
        'Content-Type': 'application/json',
    },
    // [중요] 프론트엔드가 백엔드와 통신할 때 브라우저의 HttpOnly 쿠키를 자동으로 포함해서 보내도록 허용!
    withCredentials: true,
});
