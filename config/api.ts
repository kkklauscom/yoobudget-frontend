/**
 * API Configuration
 * Reads API base URL from expo-constants or uses default
 */

import Constants from 'expo-constants';

const API_BASE_URL =
  Constants.expoConfig?.extra?.apiBaseUrl || 'http://localhost:8000/api';

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
    BY_ID: (id: string) => `${API_BASE_URL}/income/${id}`,
  },
};

export default API_CONFIG;

