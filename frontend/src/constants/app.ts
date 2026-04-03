export const APP_TITLE = '折纸云图库';
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8123/api';
export const WS_BASE_URL =
  import.meta.env.VITE_WS_BASE_URL || API_BASE_URL.replace(/^http/i, 'ws');
export const DEFAULT_PAGE_SIZE = 10;