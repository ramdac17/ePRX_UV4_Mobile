import axios from "axios";

// 1. Replace with your actual Railway URL
// const RAILWAY_URL = "http://eprxuv1-monorepo-production.up.railway.app";
const LOCAL_IP = "192.168.0.152";
const API_URL = `http://${LOCAL_IP}:3000/api`;
console.log("🚀 MOBILE_UPLINK_TARGET:", API_URL);

const apiClient = axios.create({
  // Enable this on production
  // baseURL: RAILWAY_URL,
  baseURL: API_URL,
  timeout: 10000, // 15 seconds
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
