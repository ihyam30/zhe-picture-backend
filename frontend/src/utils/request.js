import axios from 'axios';
import { ElMessage } from 'element-plus';
import { API_BASE_URL } from '@/constants/app';
import { AUTH_USER_STORAGE_KEY } from '@/constants/storage';
function handleAuthError(code) {
    if (!code) {
        return;
    }
    if (code === 40100) {
        localStorage.removeItem(AUTH_USER_STORAGE_KEY);
        if (!location.pathname.startsWith('/login')) {
            const redirect = encodeURIComponent(`${location.pathname}${location.search}`);
            location.href = `/login?redirect=${redirect}`;
        }
        return;
    }
    if (code === 40101 || code === 40300) {
        if (location.pathname !== '/403') {
            location.href = '/403';
        }
    }
}
const request = axios.create({
    baseURL: API_BASE_URL,
    timeout: 20000,
    withCredentials: true,
});
request.interceptors.response.use((response) => {
    const result = response.data;
    if (typeof result?.code === 'number') {
        if (result.code === 0) {
            return result.data;
        }
        const message = result.message || '请求失败';
        ElMessage.error(message);
        handleAuthError(result.code);
        return Promise.reject(new Error(message));
    }
    return response.data;
}, (error) => {
    const code = error.response?.data?.code;
    const message = error.response?.data?.message ||
        (error.message === 'Network Error'
            ? '网络连接失败，请确认前端代理或后端服务已启动，且接口 /api 可访问'
            : error.message) ||
        '网络异常，请稍后重试';
    ElMessage.error(message);
    handleAuthError(code);
    return Promise.reject(error);
});
export default request;
