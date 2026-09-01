import { fileURLToPath, URL } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
export default defineConfig(function (_a) {
    var mode = _a.mode;
    var env = loadEnv(mode, process.cwd(), '');
    var devBackendTarget = env.DEV_API_TARGET || 'http://localhost:8123';
    return {
        plugins: [vue()],
        resolve: {
            alias: {
                '@': fileURLToPath(new URL('./src', import.meta.url)),
            },
        },
        server: {
            host: '0.0.0.0',
            port: 5173,
            proxy: {
                '/api': {
                    target: devBackendTarget,
                    changeOrigin: true,
                    ws: true,
                },
            },
        },
    };
});
