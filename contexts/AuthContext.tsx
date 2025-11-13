import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as AuthService from '@/services/auth';
import type { User, BudgetRatio } from '@/services/auth';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, budgetRatio: BudgetRatio, currentSavings?: number) => Promise<void>;
  updateUserSettings: (data: { name?: string; budgetRatio?: BudgetRatio }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const userData = await AuthService.getUser();
      if (userData) {
        setUser(userData);
      }
    } catch (error) {
      console.error('Check auth error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await AuthService.login({ email, password });
      // Login now returns token and user data
      setUser(response.user);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (email: string, password: string, name: string, budgetRatio: BudgetRatio, currentSavings?: number) => {
    try {
      const response = await AuthService.register({
        email,
        password,
        name,
        budgetRatio,
        currentSavings,
      });
      // Registration now returns token and user data
      setUser(response.user);
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  };

  const updateUserSettings = async (data: { name?: string; budgetRatio?: BudgetRatio }) => {
    try {
      const updatedUser = await AuthService.updateUser(data);
      setUser(updatedUser);
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await AuthService.logout();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        updateUserSettings,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

