import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/updateBalance": "http://localhost:1337", // Added this to fix your 404
      "/updateName": "http://localhost:1337",
      "/requestPasswordResetCode": "http://localhost:1337",
      "/resetStatistics": "http://localhost:1337",
      "/resetPassword": "http://localhost:1337",
      "/oddsChecker": "http://localhost:1337",
      "/tipStats": "http://localhost:1337",
      "/removeBet": "http://localhost:1337",
      "/addPayment": "http://localhost:1337",
      "/login": "http://localhost:1337",
      "/register": "http://localhost:1337",
      "/verification": "http://localhost:1337",
      "/user": "http://localhost:1337",
      "/tips": "http://localhost:1337",
      "/statistics": "http://localhost:1337",
      "/updateCapital": "http://localhost:1337",
      "/updateStatistics": "http://localhost:1337",
      "/updateBet": "http://localhost:1337",
      "/resend-code": "http://localhost:1337",
      "/dropping-odds": "http://localhost:1337",
      "/teaser-odds": "http://localhost:1337",
      "/matches": "http://localhost:1337",

      // Special configuration for WebSockets
      "/socket.io": {
        target: "ws://localhost:1337",
        ws: true,
      },
    },
  },
});