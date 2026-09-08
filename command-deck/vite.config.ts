import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// PentAGI 后端地址（Vite dev 代理；生产环境由 nginx 反代）
const PENTAGI_TARGET = process.env.PENTAGI_TARGET || "https://localhost:8443";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      // GraphQL HTTP + WebSocket 订阅
      "/graphql": {
        target: PENTAGI_TARGET,
        changeOrigin: true,
        secure: false,
        ws: true,
      },
      // 认证（cookie 会话）
      "/auth": {
        target: PENTAGI_TARGET,
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: "dist",
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ["three"],
          r3f: ["@react-three/fiber", "@react-three/drei"],
        },
      },
    },
  },
});
