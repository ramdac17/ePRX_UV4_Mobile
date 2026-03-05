import axios from "axios";
import { getToken, removeToken } from "./authStorage";

/**
 * 🛰️ ePRX UV1 MISSION CONTROL: API CONFIGURATION
 */
const RAILWAY_PRODUCTION =
  "https://eprxuv1-monorepo-production.up.railway.app/api";
const LOCAL_DEV_URL = "http://192.168.0.152:3000/api";

const API_URL = __DEV__
  ? LOCAL_DEV_URL
  : process.env.EXPO_PUBLIC_API_URL || RAILWAY_PRODUCTION;

// Log target once on initialization
if (__DEV__) {
  console.log(`📡 SYSTEM_UPLINK_ESTABLISHED: [TARGET: ${API_URL}]`);
}

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

/**
 * ⬆️ REQUEST INTERCEPTOR
 * Logic: Inject token only if it exists.
 * Silence logs for known public endpoints to reduce console noise.
 */
api.interceptors.request.use(async (config) => {
  try {
    const token = await getToken();
    const isPublicRoute =
      config.url?.includes("/auth/login") ||
      config.url?.includes("/auth/register");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      // Only log token injection in Dev mode for non-public routes
      if (__DEV__ && !isPublicRoute)
        console.log("🔑 AUTH_GATE: TOKEN_INJECTED");
    } else {
      // Only log "No Token" if we are trying to hit a protected resource
      if (__DEV__ && !isPublicRoute) {
        console.log("🚶 PUBLIC_ACCESS: No token present for this request.");
      }
    }
  } catch (e) {
    console.error("🔴 TOKEN_RETRIEVAL_ERROR", e);
  }
  return config;
});

/**
 * ⬇️ RESPONSE INTERCEPTOR
 * Logic: Handle 401s gracefully. If a session is dead, we wipe the local token
 * but stop the "Warn/Error" loop once the user is unauthenticated.
 */
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 1. Handle Network/Timeout Errors
    if (!error.response) {
      console.error("📡 UPLINK_LOST: SERVER_UNREACHABLE");
      return Promise.reject(error);
    }

    // 2. Handle 401 Unauthorized (Expired/Invalid Token)
    if (error.response.status === 401) {
      const isPublicRoute =
        originalRequest.url?.includes("/auth/login") ||
        originalRequest.url?.includes("/auth/register");

      // Only warn and trigger redirect logic if it's NOT a login attempt failing
      if (!isPublicRoute) {
        console.warn("🛡️ SESSION_INVALID: TERMINATING_UPLINK");
        await removeToken(); // Ensure local storage is wiped

        // Here you could trigger a global event for navigation if needed
      } else {
        // Log specific login failures quietly
        console.log("🔐 AUTH_DENIED: Credentials invalid.");
      }
    }

    // 3. Suppress redundant Axios logs for expected 401s
    return Promise.reject(error);
  },
);

export default api;
