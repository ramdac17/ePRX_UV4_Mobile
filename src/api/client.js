import axios from "axios";

// 1. Replace with your actual Railway URL
const RAILWAY_URL = "http://eprxuv1-monorepo-production.up.railway.app";

const apiClient = axios.create({
  baseURL: RAILWAY_URL,
  timeout: 15000, // 15 seconds
  headers: {
    "Content-Type": "application/json",
  },
});

// 2. Add a simple logger to help you debug in the terminal
apiClient.interceptors.request.use((config) => {
  console.log(`🚀 API Request: ${config.method.toUpperCase()} ${config.url}`);
  return config;
});

export default apiClient;
