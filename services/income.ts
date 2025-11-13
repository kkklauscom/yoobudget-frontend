import { API_CONFIG } from '@/config/api';
import { getToken } from './auth';

export type IncomeType = 'recurring' | 'one-time';
export type Frequency = 'weekly' | 'fortnightly' | 'monthly' | 'yearly';

export interface RecurringIncome {
  _id: string;
  type: 'recurring';
  name?: string;
  amount: number;
  frequency: Frequency;
  isFirstPayDay: boolean;
  nextPayDate: string;
  lastPayDate: string | null;
}

export interface OneTimeIncome {
  _id: string;
  type: 'one-time';
  name?: string;
  amount: number;
  oneTimeDate: string;
}

export type Income = RecurringIncome | OneTimeIncome;

export interface CreateRecurringIncomeData {
  type: 'recurring';
  name?: string;
  amount: number;
  frequency: Frequency;
  isFirstPayDay: boolean;
  nextPayDate: string;
  lastPayDate?: string | null;
}

export interface CreateOneTimeIncomeData {
  type: 'one-time';
  name?: string;
  amount: number;
  oneTimeDate: string;
}

export type CreateIncomeData = CreateRecurringIncomeData | CreateOneTimeIncomeData;

export interface UpdateRecurringIncomeData {
  name?: string;
  amount?: number;
  frequency?: Frequency;
  isFirstPayDay?: boolean;
  nextPayDate?: string;
  lastPayDate?: string | null;
}

export interface UpdateOneTimeIncomeData {
  name?: string;
  amount?: number;
  oneTimeDate?: string;
}

export type UpdateIncomeData = UpdateRecurringIncomeData | UpdateOneTimeIncomeData;

export interface IncomeError {
  error?: string;
}

/**
 * Get all incomes
 * According to API docs: GET /api/income
 * Requires: Authorization: Bearer TOKEN
 */
export async function getAllIncomes(): Promise<Income[]> {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('No token available');
    }

    const response = await fetch(API_CONFIG.INCOME.BASE, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    let result: { incomes: Income[] } & IncomeError;
    try {
      result = await response.json();
    } catch (jsonError) {
      throw new Error('Failed to connect to server. Please check your connection.');
    }

    if (!response.ok) {
      const errorMessage = result.error || 'Failed to get incomes';
      throw new Error(errorMessage);
    }

    return result.incomes || [];
  } catch (error: any) {
    console.error('Get incomes error:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to get incomes.');
  }
}

/**
 * Create income
 * According to API docs: POST /api/income
 * Requires: Authorization: Bearer TOKEN
 */
export async function createIncome(data: CreateIncomeData): Promise<Income> {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('No token available');
    }

    const response = await fetch(API_CONFIG.INCOME.BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    let result: { income: Income } & IncomeError;
    try {
      result = await response.json();
    } catch (jsonError) {
      throw new Error('Failed to connect to server. Please check your connection.');
    }

    if (!response.ok) {
      const errorMessage = result.error || 'Failed to create income';
      throw new Error(errorMessage);
    }

    return result.income;
  } catch (error: any) {
    console.error('Create income error:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to create income.');
  }
}

/**
 * Update income
 * According to API docs: PUT /api/income/:id
 * Requires: Authorization: Bearer TOKEN
 */
export async function updateIncome(id: string, data: UpdateIncomeData): Promise<Income> {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('No token available');
    }

    const response = await fetch(API_CONFIG.INCOME.BY_ID(id), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    let result: { income: Income } & IncomeError;
    try {
      result = await response.json();
    } catch (jsonError) {
      throw new Error('Failed to connect to server. Please check your connection.');
    }

    if (!response.ok) {
      const errorMessage = result.error || 'Failed to update income';
      throw new Error(errorMessage);
    }

    return result.income;
  } catch (error: any) {
    console.error('Update income error:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to update income.');
  }
}

/**
 * Delete income
 * According to API docs: DELETE /api/income/:id
 * Requires: Authorization: Bearer TOKEN
 */
export async function deleteIncome(id: string): Promise<void> {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('No token available');
    }

    const response = await fetch(API_CONFIG.INCOME.BY_ID(id), {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    let result: { message?: string } & IncomeError;
    try {
      result = await response.json();
    } catch (jsonError) {
      throw new Error('Failed to connect to server. Please check your connection.');
    }

    if (!response.ok) {
      const errorMessage = result.error || 'Failed to delete income';
      throw new Error(errorMessage);
    }
  } catch (error: any) {
    console.error('Delete income error:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to delete income.');
  }
}

