import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, ".", "");
    const apiTarget = env.VITE_API_TARGET;

    if (!apiTarget) {
        throw new Error("Missing VITE_API_TARGET in frontend/.env");
    }

    return {
        plugins: [react()],
        server: {
            port: 3000,
            host: true,
            proxy: {
                "/api": {
                    target: apiTarget,
                    changeOrigin: true,
                },
            },
        },
    };
});
