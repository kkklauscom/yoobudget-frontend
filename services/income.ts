import { API_CONFIG } from '@/config/api';
import { getToken } from './auth';

export type PayCycle = 'weekly' | 'biweekly' | 'monthly' | 'one-time';

export interface Income {
  _id: string;
  name?: string;
  amount: number;
  payCycle: PayCycle;
  nextPayDate: string;
  isMain: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateIncomeData {
  name?: string;
  amount: number;
  payCycle: PayCycle;
  nextPayDate: string;
  isMain: boolean;
}

export interface UpdateIncomeData {
  name?: string;
  amount?: number;
  payCycle?: PayCycle;
  nextPayDate?: string;
  isMain?: boolean;
}

export interface ViewCycleResponse {
  cycleStart: string;
  cycleEnd: string;
  payCycle: PayCycle;
  remainingDays: number;
  totalIncome: number;
  error?: string;
}

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
 * Get view cycle information
 * According to API docs: GET /api/income/view-cycle
 * Requires: Authorization: Bearer TOKEN
 */
export async function getViewCycle(): Promise<ViewCycleResponse> {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('No token available');
    }

    const response = await fetch(API_CONFIG.INCOME.VIEW_CYCLE, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    let result: ViewCycleResponse & IncomeError;
    try {
      result = await response.json();
    } catch (jsonError) {
      throw new Error('Failed to connect to server. Please check your connection.');
    }

    if (!response.ok) {
      const errorMessage = result.error || 'Failed to get view cycle';
      throw new Error(errorMessage);
    }

    return result;
  } catch (error: any) {
    console.error('Get view cycle error:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to get view cycle.');
  }
}

/**
 * Set income as main
 * According to API docs: POST /api/income/set-main/:id
 * Requires: Authorization: Bearer TOKEN
 */
export async function setMainIncome(id: string): Promise<void> {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('No token available');
    }

    const response = await fetch(API_CONFIG.INCOME.SET_MAIN(id), {
      method: 'POST',
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
      const errorMessage = result.error || 'Failed to set main income';
      throw new Error(errorMessage);
    }
  } catch (error: any) {
    console.error('Set main income error:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to set main income.');
  }
}

/**
 * Create income
 * According to API docs: POST /api/income/add
 * Requires: Authorization: Bearer TOKEN
 */
export async function createIncome(data: CreateIncomeData): Promise<Income> {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('No token available');
    }

    const response = await fetch(API_CONFIG.INCOME.ADD, {
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

