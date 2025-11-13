/**
 * API Configuration
 * Reads API base URL from .env file via expo-constants
 *
 * The API_BASE_URL is loaded from:
 * 1. Constants.expoConfig?.extra?.apiBaseUrl (from app.config.js, which reads .env file)
 * 2. Constants.manifest?.extra?.apiBaseUrl (legacy format, for older Expo versions)
 *
 * IMPORTANT: All API calls MUST use API_CONFIG endpoints, which are automatically
 * constructed from the API_BASE_URL loaded from .env file.
 *
 * To configure:
 * 1. Create/update .env file in the root directory
 * 2. Add: API_BASE_URL=http://localhost:8000/api
 * 3. Restart the Expo server (app.config.js is only read at startup)
 */

import Constants from "expo-constants";

// Get API base URL from environment variable (loaded via app.config.js from .env file)
const getApiBaseUrl = (): string => {
  let apiBaseUrl: string | undefined;

  // 1. Try expo-constants (preferred method for Expo apps)
  // This reads from app.config.js -> extra.apiBaseUrl -> process.env.API_BASE_URL -> .env file
  apiBaseUrl = Constants.expoConfig?.extra?.apiBaseUrl;

  // 2. Try legacy manifest format (for older Expo versions)
  if (!apiBaseUrl && Constants.manifest?.extra?.apiBaseUrl) {
    apiBaseUrl = Constants.manifest.extra.apiBaseUrl;
  }

  // 3. Validate that we have a valid URL
  if (!apiBaseUrl || apiBaseUrl.trim() === "") {
    const errorMessage =
      "❌ ERROR: API_BASE_URL is not configured!\n\n" +
      "The API_BASE_URL must be set in your .env file.\n\n" +
      "Steps to fix:\n" +
      "1. Ensure .env file exists in the root directory\n" +
      "2. Add the following line to .env:\n" +
      "   API_BASE_URL=http://localhost:8000/api\n" +
      "3. Stop the Expo server (Ctrl+C)\n" +
      "4. Restart the Expo server: npm start\n\n" +
      "Note: The app.config.js file is only read when the server starts.\n" +
      "You MUST restart the server after modifying .env file.";

    console.error(errorMessage);

    // In development, throw error to make it obvious
    if (__DEV__) {
      throw new Error(
        "API_BASE_URL is not configured. Please set it in your .env file and restart the Expo server."
      );
    }

    // In production, return empty string (will cause API calls to fail, but app won't crash)
    return "";
  }

  // Log successful load (only in development)
  if (__DEV__) {
    console.log("✅ API_BASE_URL loaded from .env:", apiBaseUrl);
    console.log("   Source: Constants.expoConfig?.extra?.apiBaseUrl");
  }

  return apiBaseUrl;
};

// Get API base URL from .env file (throws error in development if not configured)
export const API_BASE_URL = getApiBaseUrl();

export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  AUTH: {
    REGISTER: `${API_BASE_URL}/auth/register`,
    LOGIN: `${API_BASE_URL}/auth/login`,
  },
  USERS: {
    ME: `${API_BASE_URL}/users/me`,
  },
  INCOME: {
    BASE: `${API_BASE_URL}/income`,
    ADD: `${API_BASE_URL}/income`,
    VIEW_CYCLE: `${API_BASE_URL}/income/view-cycle`,
    SET_MAIN: (id: string) => `${API_BASE_URL}/income/set-main/${id}`,
    BY_ID: (id: string) => `${API_BASE_URL}/income/${id}`,
  },
  EXPENSE: {
    BASE: `${API_BASE_URL}/expense`,
    ADD: `${API_BASE_URL}/expense/add`,
    CURRENT_CYCLE: `${API_BASE_URL}/expense/current-cycle`,
    ALL: `${API_BASE_URL}/expense/all`,
    CATEGORIES: `${API_BASE_URL}/expense/categories`,
    UPDATE: (id: string) => `${API_BASE_URL}/expense/${id}/update`,
    DELETE: (id: string) => `${API_BASE_URL}/expense/${id}`,
  },
};

export default API_CONFIG;
