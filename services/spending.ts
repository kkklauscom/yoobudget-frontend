/**
 * Spending Service
 * Handles all spending-related API calls
 */

import { API_CONFIG } from '@/config/api';
import { getToken } from './auth';

export interface Spending {
  _id: string;
  name: string;
  amount: number;
  category: string;
  spendingDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface SpendingError {
  error?: string;
  message?: string;
}

export interface CreateSpendingData {
  name: string;
  amount: number;
  category: string;
  spendingDate: string;
}

export interface GetSpendingParams {
  start: string; // ISO date string
  end: string; // ISO date string
}

/**
 * Get all spending for the current user within a date range
 * GET /api/spending?start=cycleStart&end=cycleEnd
 * Requires: Authorization: Bearer TOKEN
 */
export async function getSpending(params: GetSpendingParams): Promise<Spending[]> {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('No token available');
    }

    const queryParams = new URLSearchParams({
      start: params.start,
      end: params.end,
    });

    const response = await fetch(`${API_CONFIG.SPENDING.BASE}?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    let result: { spendings?: Spending[]; spending?: Spending[] } & SpendingError;
    try {
      result = await response.json();
    } catch (jsonError) {
      throw new Error('Failed to connect to server. Please check your connection.');
    }

    if (!response.ok) {
      const errorMessage = result.error || result.message || 'Failed to get spending';
      throw new Error(errorMessage);
    }

    // Handle both possible response formats
    return result.spendings || result.spending || [];
  } catch (error: any) {
    console.error('Get spending error:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to get spending.');
  }
}

/**
 * Create spending
 * POST /api/spending/add
 * Requires: Authorization: Bearer TOKEN
 */
export async function createSpending(data: CreateSpendingData): Promise<Spending> {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('No token available');
    }

    const response = await fetch(API_CONFIG.SPENDING.ADD, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    let result: { spending: Spending } & SpendingError;
    try {
      result = await response.json();
    } catch (jsonError) {
      throw new Error('Failed to connect to server. Please check your connection.');
    }

    if (!response.ok) {
      const errorMessage = result.error || result.message || 'Failed to create spending';
      throw new Error(errorMessage);
    }

    return result.spending;
  } catch (error: any) {
    console.error('Create spending error:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to create spending.');
  }
}

