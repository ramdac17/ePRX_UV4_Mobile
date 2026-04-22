import axios from "axios";
import { getToken, removeToken } from "./authStorage";

const RAILWAY_PRODUCTION =
  "https://eprxuv1-monorepo-production.up.railway.app/api";
// const LOCAL_DEV_URL = "http://192.168.0.152:3000/api";

// ✅ FIXED: Determine target correctly
const API_URL = RAILWAY_PRODUCTION;

if (__DEV__) {
  console.log(`📡 SYSTEM_UPLINK_ESTABLISHED: [TARGET: ${API_URL}]`);
}

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 🚀 Increased to 30s for image processing
  headers: {
    // Remove "Content-Type" from here entirely!
    Accept: "application/json",
  },
});

api.interceptors.request.use(async (config) => {
  try {
    const token = await getToken();

    // 🛡️ AUTH INJECTION
    if (token && typeof token === "string" && token.length > 20) {
      config.headers.Authorization = `Bearer ${token.trim()}`;
    }

    // 🛰️ DYNAMIC CONTENT TYPE
    // If we are sending FormData, delete the Content-Type header
    // and let the browser/native layer set the boundary.
    const isFormData =
      Object.prototype.toString.call(config.data) === "[object FormData]";
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"]; // THIS IS CRITICAL
    } else {
      config.headers["Content-Type"] = "application/json";
    }
  } catch (e) {
    console.error("🔴 TOKEN_RETRIEVAL_ERROR", e);
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const isPublicRoute = error.config.url?.includes("/auth/login");

      if (!isPublicRoute) {
        console.warn("🛡️ SESSION_INVALID: TERMINATING_UPLINK");
        await removeToken();
        // Option: Trigger router.replace('/login') via a Global State/Event
      }
    }
    return Promise.reject(error);
  },
);

export default api;
