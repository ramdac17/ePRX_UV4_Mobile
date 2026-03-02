import axios from "axios";
import { getToken } from "./authStorage";

/**
 * 🛰️ ePRX UV1 MISSION CONTROL: API CONFIGURATION
 * Priority:
 * 1. .env EXPO_PUBLIC_API_URL
 * 2. Production Railway URL
 */
const RAILWAY_PRODUCTION =
  "https://eprxuv1-monorepo-production.up.railway.app/api";
const API_URL = process.env.EXPO_PUBLIC_API_URL || RAILWAY_PRODUCTION;

// Log target on initialization to verify the bridge
console.log(`📡 SYSTEM_UPLINK_ESTABLISHED: [TARGET: ${API_URL}]`);

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// ⬆️ REQUEST INTERCEPTOR: Injecting the Secure Vault Token
api.interceptors.request.use(async (config) => {
  try {
    const token = await getToken();

    // Debugging only: confirm token exists before uplink
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log("🔑 AUTH_GATE: TOKEN_INJECTED");
    } else {
      console.log("🔑 AUTH_GATE: NO_TOKEN_FOUND (PUBLIC_ACCESS)");
    }
  } catch (e) {
    console.error("🔴 TOKEN_RETRIEVAL_ERROR", e);
  }
  return config;
});

// ⬇️ RESPONSE INTERCEPTOR: Handling Network Transitions (WiFi -> Data)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (!error.response) {
      // This usually triggers during Network/DNS failures on mobile data
      console.error("📡 UPLINK_LOST: NETWORK_ERROR_OR_TIMEOUT");
    } else if (error.response.status === 401) {
      console.warn("🛡️ SESSION_EXPIRED: REDIRECTING_TO_AUTH");
      // Handle auto-logout logic here if needed
    }
    return Promise.reject(error);
  },
);

export default api;
