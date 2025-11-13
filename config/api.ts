/**
 * API Configuration
 * Reads API base URL from .env file via expo-constants
 *
 * The API_BASE_URL is loaded from:
 * 1. Constants.expoConfig?.extra?.apiBaseUrl (from app.config.js, which reads .env file)
 * 2. Constants.manifest?.extra?.apiBaseUrl (legacy format, for older Expo versions)
 * 3. Default fallback: "http://localhost:8000/api" (for local development)
 *
 * IMPORTANT: All API calls MUST use API_CONFIG endpoints, which are automatically
 * constructed from the API_BASE_URL.
 *
 * To configure:
 * 1. Create/update .env file in the root directory
 * 2. Add: API_BASE_URL=http://localhost:8000/api
 * 3. Restart the Expo server (app.config.js is only read at startup)
 *
 * For production (Vercel):
 * - Set API_BASE_URL in Vercel Environment Variables
 * - The app will use the environment variable if available
 * - Otherwise, it will use the default value (for development)
 */

import Constants from "expo-constants";

// Default API base URL (used when .env file is not configured)
// Change this to your production API URL if needed
const DEFAULT_API_BASE_URL = "http://localhost:8000/api";

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

  // 3. Try process.env directly (fallback for some environments)
  if (
    !apiBaseUrl &&
    typeof process !== "undefined" &&
    process.env?.API_BASE_URL
  ) {
    apiBaseUrl = process.env.API_BASE_URL;
  }

  // 4. If still not found, use default and warn
  if (!apiBaseUrl || apiBaseUrl.trim() === "") {
    if (__DEV__) {
      console.warn(
        "⚠️  WARNING: API_BASE_URL is not configured in .env file.\n" +
          "Using default fallback: " +
          DEFAULT_API_BASE_URL +
          "\n\n" +
          "To configure:\n" +
          "1. Ensure .env file exists in the root directory\n" +
          "2. Add: API_BASE_URL=http://localhost:8000/api\n" +
          "3. Restart the Expo server (stop with Ctrl+C, then run: npm start)\n" +
          "4. The app.config.js file is only read when the server starts\n\n" +
          "For production (Vercel):\n" +
          "- Set API_BASE_URL in Vercel Environment Variables\n" +
          "- The app will use the environment variable if available"
      );
    }
    return DEFAULT_API_BASE_URL;
  }

  // Log successful load (only in development)
  if (__DEV__) {
    console.log("✅ API_BASE_URL loaded:", apiBaseUrl);
    console.log("   Source: Constants.expoConfig?.extra?.apiBaseUrl");
  }

  return apiBaseUrl;
};

// Get API base URL (uses default value if not configured)
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
