import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '@/config/api';

export interface BudgetRatio {
  needs: number;
  wants: number;
  savings: number;
}

export interface User {
  _id: string;
  email: string;
  name: string;
  budgetRatio: BudgetRatio;
  currentSavings: number;
  viewCycle: string;
  createdAt: string;
  updatedAt: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  budgetRatio: BudgetRatio;
  viewCycle: string;
  currentSavings?: number;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface AuthError {
  error?: string;
}

const TOKEN_KEY = '@auth_token';
const USER_KEY = '@user_data';

/**
 * Register a new user
 * According to API docs: POST /api/auth/register
 * Success: { "token": "...", "user": { ... } }
 * Error: { "error": "error message" }
 */
export async function register(data: RegisterData): Promise<AuthResponse> {
  try {
    const response = await fetch(API_CONFIG.AUTH.REGISTER, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: data.email,
        password: data.password,
        name: data.name,
        budgetRatio: data.budgetRatio,
        viewCycle: data.viewCycle,
        ...(data.currentSavings !== undefined && { currentSavings: data.currentSavings }),
      }),
    });

    let result: AuthResponse & AuthError;
    try {
      result = await response.json();
    } catch (jsonError) {
      // If JSON parsing fails, it might be a network error or server error
      throw new Error('Failed to connect to server. Please check your connection.');
    }

    if (!response.ok) {
      // Handle error response
      // API returns: { "error": "error message" }
      const errorMessage = result.error || 'Registration failed';
      console.log('Registration error response:', result); // Debug log
      throw new Error(errorMessage);
    }

    // Registration successful
    // API returns: { "token": "...", "user": { ... } }
    const token = result.token;
    const user = result.user;

    if (!token || !user) {
      throw new Error('Invalid response from server');
    }

    // Store token and user data
    await AsyncStorage.setItem(TOKEN_KEY, token);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));

    return { token, user };
  } catch (error: any) {
    console.error('Registration error:', error);
    // If it's already an Error with a message, re-throw it
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Registration failed. Please check your connection and try again.');
  }
}

/**
 * Login user
 * According to API docs: POST /api/auth/login
 * Success: { "token": "...", "user": { ... } }
 * Error: { "error": "error message" }
 */
export async function login(data: LoginData): Promise<AuthResponse> {
  try {
    const response = await fetch(API_CONFIG.AUTH.LOGIN, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: data.email,
        password: data.password,
      }),
    });

    let result: AuthResponse & AuthError;
    try {
      result = await response.json();
    } catch (jsonError) {
      // If JSON parsing fails, it might be a network error or server error
      throw new Error('Failed to connect to server. Please check your connection.');
    }

    if (!response.ok) {
      // Handle error response
      // API returns: { "error": "error message" }
      const errorMessage = result.error || 'Login failed';
      console.log('Login error response:', result); // Debug log
      throw new Error(errorMessage);
    }

    // Login successful
    // API returns: { "token": "...", "user": { ... } }
    const token = result.token;
    const user = result.user;

    if (!token || !user) {
      throw new Error('Invalid response from server');
    }

    // Store token and user data
    await AsyncStorage.setItem(TOKEN_KEY, token);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));

    return { token, user };
  } catch (error: any) {
    console.error('Login error:', error);
    // If it's already an Error with a message, re-throw it
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Login failed. Please check your connection and credentials.');
  }
}

/**
 * Logout user
 */
export async function logout(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
}

/**
 * Get stored token
 */
export async function getToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch (error) {
    console.error('Get token error:', error);
    return null;
  }
}

/**
 * Get stored user data
 */
export async function getUser(): Promise<User | null> {
  try {
    const userData = await AsyncStorage.getItem(USER_KEY);
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Get user error:', error);
    return null;
  }
}

/**
 * Get current user from API
 * According to API docs: GET /api/users/me
 * Requires: Authorization: Bearer TOKEN
 */
export async function getCurrentUser(): Promise<User> {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('No token available');
    }

    const response = await fetch(API_CONFIG.USERS.ME, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    let result: User & AuthError;
    try {
      result = await response.json();
    } catch (jsonError) {
      throw new Error('Failed to connect to server. Please check your connection.');
    }

    if (!response.ok) {
      // Handle error response
      const errorMessage = result.error || 'Failed to get user information';
      throw new Error(errorMessage);
    }

    // Update stored user data
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(result));

    return result;
  } catch (error: any) {
    console.error('Get current user error:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to get user information.');
  }
}

/**
 * Update user settings
 * According to API docs: PATCH /api/users/me
 * Requires: Authorization: Bearer TOKEN
 */
export async function updateUser(data: {
  name?: string;
  budgetRatio?: BudgetRatio;
  viewCycle?: string;
}): Promise<User> {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('No token available');
    }

    const response = await fetch(API_CONFIG.USERS.ME, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    let result: User & AuthError;
    try {
      result = await response.json();
    } catch (jsonError) {
      throw new Error('Failed to connect to server. Please check your connection.');
    }

    if (!response.ok) {
      // Handle error response
      const errorMessage = result.error || 'Failed to update user information';
      throw new Error(errorMessage);
    }

    // Update stored user data
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(result));

    return result;
  } catch (error: any) {
    console.error('Update user error:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to update user information.');
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const token = await getToken();
  return !!token;
}

