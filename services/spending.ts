/**
 * Spending Service
 * Handles all spending-related API calls
 */

import { API_CONFIG } from '@/config/api';
import { getToken } from './auth';

export type ExpenseType = 'one-time' | 'recurring';
export type SpendFrom = 'needs' | 'wants' | 'savings';
export type ExpensePayCycle = 'weekly' | 'biweekly' | 'monthly';

export interface Spending {
  _id: string;
  userId?: string;
  name: string;
  amount: number;
  category: string;
  note?: string;
  spendFrom: SpendFrom;
  expenseType: ExpenseType;
  payCycle?: ExpensePayCycle;
  nextPaymentDate?: string;
  createdAt?: string; // For one-time expenses
  created?: string; // System field (creation timestamp)
  updated?: string; // System field (update timestamp)
}

export interface SpendingError {
  error?: string;
  message?: string;
}

export interface CreateSpendingData {
  name: string;
  amount: number;
  category: string; // Required according to API
  note?: string;
  spendFrom: SpendFrom;
  expenseType: ExpenseType;
  payCycle?: ExpensePayCycle; // Required for recurring
  nextPaymentDate?: string; // Required for recurring
  createdAt?: string; // Required for one-time (defaults to current date if not provided)
}

export interface UpdateSpendingData {
  name?: string;
  amount?: number;
  category?: string;
  note?: string;
  spendFrom?: SpendFrom;
  expenseType?: ExpenseType;
  payCycle?: ExpensePayCycle;
  nextPaymentDate?: string;
  createdAt?: string;
}

export interface CurrentCycleResponse {
  cycleStart: string;
  cycleEnd: string;
  expenses: Spending[];
  error?: string;
}

/**
 * Get current cycle expenses
 * GET /api/expense/current-cycle
 * Returns: CurrentCycleResponse with cycleStart, cycleEnd, and expenses
 * Requires: Authorization: Bearer TOKEN
 */
export async function getCurrentCycleExpenses(): Promise<CurrentCycleResponse> {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('No token available');
    }

    const response = await fetch(API_CONFIG.EXPENSE.CURRENT_CYCLE, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    let result: CurrentCycleResponse | SpendingError;
    try {
      result = await response.json();
    } catch (jsonError) {
      throw new Error('Failed to connect to server. Please check your connection.');
    }

    if (!response.ok) {
      const errorMessage = (result as SpendingError).error || (result as SpendingError).message || 'Failed to get current cycle expenses';
      // Check for NO_MAIN_INCOME error
      if (errorMessage.includes('NO_MAIN_INCOME') || errorMessage.includes('main income')) {
        return {
          cycleStart: '',
          cycleEnd: '',
          expenses: [],
          error: 'NO_MAIN_INCOME',
        };
      }
      throw new Error(errorMessage);
    }

    // API returns CurrentCycleResponse directly
    return result as CurrentCycleResponse;
  } catch (error: any) {
    console.error('Get current cycle expenses error:', error);
    if (error instanceof Error) {
      // If error message indicates no main income, return error object
      if (error.message.includes('NO_MAIN_INCOME') || error.message.includes('main income')) {
        return {
          cycleStart: '',
          cycleEnd: '',
          expenses: [],
          error: 'NO_MAIN_INCOME',
        };
      }
      throw error;
    }
    throw new Error('Failed to get current cycle expenses.');
  }
}

/**
 * Get all expenses
 * GET /api/expense/all
 * Returns: Array of Spending objects
 * Requires: Authorization: Bearer TOKEN
 */
export async function getAllExpenses(): Promise<Spending[]> {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('No token available');
    }

    const response = await fetch(API_CONFIG.EXPENSE.ALL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    let result: Spending[] | SpendingError;
    try {
      result = await response.json();
    } catch (jsonError) {
      throw new Error('Failed to connect to server. Please check your connection.');
    }

    if (!response.ok) {
      const errorMessage = (result as SpendingError).error || (result as SpendingError).message || 'Failed to get all expenses';
      throw new Error(errorMessage);
    }

    // API returns array directly
    if (Array.isArray(result)) {
      return result;
    }

    // Fallback: check if it's an error object
    if ((result as SpendingError).error) {
      throw new Error((result as SpendingError).error!);
    }

    return [];
  } catch (error: any) {
    console.error('Get all expenses error:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to get all expenses.');
  }
}

/**
 * Get expense categories
 * GET /api/expense/categories
 * Returns: Array of category strings
 * Requires: Authorization: Bearer TOKEN
 */
export async function getCategories(): Promise<string[]> {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('No token available');
    }

    const response = await fetch(API_CONFIG.EXPENSE.CATEGORIES, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    let result: string[] | SpendingError;
    try {
      result = await response.json();
    } catch (jsonError) {
      throw new Error('Failed to connect to server. Please check your connection.');
    }

    if (!response.ok) {
      const errorMessage = (result as SpendingError).error || (result as SpendingError).message || 'Failed to get categories';
      throw new Error(errorMessage);
    }

    // API returns array of strings directly
    if (Array.isArray(result)) {
      return result;
    }

    return [];
  } catch (error: any) {
    console.error('Get categories error:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to get categories.');
  }
}

/**
 * Create spending/expense
 * POST /api/expense/add
 * Returns: Created Spending object wrapped in { success: true, expense: {...} }
 * Requires: Authorization: Bearer TOKEN
 */
export async function createSpending(data: CreateSpendingData): Promise<Spending> {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('No token available');
    }

    // Build payload according to API requirements
    const payload: any = {
      name: data.name,
      amount: data.amount,
      category: data.category, // Required
      spendFrom: data.spendFrom,
      expenseType: data.expenseType,
    };

    // Add optional note field
    if (data.note !== undefined) {
      payload.note = data.note || '';
    }

    // Add fields based on expense type
    if (data.expenseType === 'one-time') {
      // For one-time expenses, add createdAt (defaults to current date if not provided)
      if (data.createdAt) {
        payload.createdAt = data.createdAt;
      }
    } else if (data.expenseType === 'recurring') {
      // For recurring expenses, add payCycle and nextPaymentDate
      if (data.payCycle) {
        payload.payCycle = data.payCycle;
      }
      if (data.nextPaymentDate) {
        payload.nextPaymentDate = data.nextPaymentDate;
      }
    }

    const response = await fetch(API_CONFIG.EXPENSE.ADD, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    let result: { success: boolean; expense: Spending } | SpendingError;
    try {
      result = await response.json();
    } catch (jsonError) {
      throw new Error('Failed to connect to server. Please check your connection.');
    }

    if (!response.ok) {
      const errorMessage = (result as SpendingError).error || (result as SpendingError).message || 'Failed to create expense';
      throw new Error(errorMessage);
    }

    // API returns { success: true, expense: {...} }
    if ((result as { success: boolean; expense: Spending }).success) {
      return (result as { success: boolean; expense: Spending }).expense;
    }

    throw new Error('Invalid response format');
  } catch (error: any) {
    console.error('Create spending error:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to create spending.');
  }
}

/**
 * Update expense
 * PUT /api/expense/:id/update
 * Returns: Updated Spending object wrapped in { success: true, expense: {...} }
 * Requires: Authorization: Bearer TOKEN
 */
export async function updateExpense(id: string, data: UpdateSpendingData): Promise<Spending> {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('No token available');
    }

    const response = await fetch(API_CONFIG.EXPENSE.UPDATE(id), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    let result: { success: boolean; expense: Spending } | SpendingError;
    try {
      result = await response.json();
    } catch (jsonError) {
      throw new Error('Failed to connect to server. Please check your connection.');
    }

    if (!response.ok) {
      const errorMessage = (result as SpendingError).error || (result as SpendingError).message || 'Failed to update expense';
      throw new Error(errorMessage);
    }

    // API returns { success: true, expense: {...} }
    if ((result as { success: boolean; expense: Spending }).success) {
      return (result as { success: boolean; expense: Spending }).expense;
    }

    throw new Error('Invalid response format');
  } catch (error: any) {
    console.error('Update expense error:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to update expense.');
  }
}

/**
 * Delete expense
 * DELETE /api/expense/:id
 * Returns: { success: true, message: "Expense deleted" }
 * Requires: Authorization: Bearer TOKEN
 */
export async function deleteExpense(id: string): Promise<void> {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('No token available');
    }

    const response = await fetch(API_CONFIG.EXPENSE.DELETE(id), {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    let result: { success: boolean; message?: string } | SpendingError;
    try {
      result = await response.json();
    } catch (jsonError) {
      throw new Error('Failed to connect to server. Please check your connection.');
    }

    if (!response.ok) {
      const errorMessage = (result as SpendingError).error || (result as SpendingError).message || 'Failed to delete expense';
      throw new Error(errorMessage);
    }

    // API returns { success: true, message: "Expense deleted" }
    // No need to return anything
  } catch (error: any) {
    console.error('Delete expense error:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to delete expense.');
  }
}

