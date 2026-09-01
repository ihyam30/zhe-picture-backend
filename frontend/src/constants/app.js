export const APP_TITLE = '折纸云图库';
function getDefaultWebSocketBaseUrl(path = '/api') {
    if (typeof window === 'undefined') {
        return `ws://localhost:8123${path}`;
    }
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}${path}`;
}
function resolveWebSocketBaseUrl(configuredBaseUrl) {
    const value = configuredBaseUrl?.trim();
    if (!value) {
        return getDefaultWebSocketBaseUrl();
    }
    if (/^wss?:\/\//i.test(value)) {
        return value.replace(/\/+$/, '');
    }
    if (/^https?:\/\//i.test(value)) {
        return value.replace(/^http/i, 'ws').replace(/\/+$/, '');
    }
    if (value.startsWith('/')) {
        return getDefaultWebSocketBaseUrl(value);
    }
    return value.replace(/\/+$/, '');
}
const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
export const API_BASE_URL = (configuredApiBaseUrl || '/api').replace(/\/+$/, '');
export const WS_BASE_URL = resolveWebSocketBaseUrl(import.meta.env.VITE_WS_BASE_URL);
export const DEFAULT_PAGE_SIZE = 10;
