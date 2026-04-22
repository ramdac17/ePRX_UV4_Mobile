import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "eprx_auth_token";

export const storeToken = async (token: string) => {
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    console.log("📡 AUTH_STORAGE_SAVE: SUCCESS");
  } catch (e) {
    console.error("🔴 AUTH_STORAGE_SAVE: FAILED", e);
  }
};

/**
 * Stores the token securely.
 */
export const getToken = async () => {
  try {
    const res = await SecureStore.getItemAsync(TOKEN_KEY);
    return res; // Should be the string or null
  } catch (e) {
    return null;
  }
};

/**
 * Wipes the token (Logout).
 */
export const removeToken = async () => {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  console.log("📡 AUTH_STORAGE_REMOVE: SUCCESS");
};
