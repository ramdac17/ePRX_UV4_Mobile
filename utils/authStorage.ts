// apps/mobile/utils/authStorage.ts
import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "eprx_auth_token";

/**
 * Retrieves the encrypted token from SecureStore.
 * Returns null if no token is found.
 */
export const getToken = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch (error) {
    console.error("📡 AUTH_STORAGE_GET_ERROR:", error);
    return null;
  }
};

/**
 * Stores the token securely.
 */
export const storeToken = async (token: string): Promise<void> => {
  try {
    if (!token || typeof token !== "string") {
      throw new Error("INVALID_TOKEN_FORMAT");
    }
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    console.log("📡 AUTH_STORAGE_SAVE: SUCCESS");
  } catch (error) {
    console.error("📡 AUTH_STORAGE_STORE_ERROR:", error);
  }
};

/**
 * Wipes the token (Logout).
 */
export const removeToken = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    console.log("📡 AUTH_STORAGE_REMOVE: SUCCESS");
  } catch (error) {
    console.error("📡 AUTH_STORAGE_DELETE_ERROR:", error);
  }
};
