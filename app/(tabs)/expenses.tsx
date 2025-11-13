import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as IncomeService from '@/services/income';
import * as SpendingService from '@/services/spending';
import type { ViewCycleResponse } from '@/services/income';
import type { Spending } from '@/services/spending';

export default function ExpensesScreen() {
  // State for data that will come from API
  const [totalSpent, setTotalSpent] = useState<number>(0);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [expenses, setExpenses] = useState<Spending[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewCycle, setViewCycle] = useState<ViewCycleResponse | null>(null);

  // Fetch view cycle to get cycle dates
  const fetchViewCycle = useCallback(async () => {
    try {
      const cycle = await IncomeService.getViewCycle();
      setViewCycle(cycle);
      return cycle;
    } catch (error) {
      console.error('Failed to fetch view cycle:', error);
      setViewCycle(null);
      return null;
    }
  }, []);

  // Fetch spending based on cycle dates
  const fetchSpending = useCallback(async () => {
    try {
      setLoading(true);
      
      // First get the cycle information
      const cycle = await fetchViewCycle();
      
      if (!cycle || cycle.error) {
        // No main income set, show empty state
        setExpenses([]);
        setTotalSpent(0);
        setTotalCount(0);
        return;
      }

      // Fetch spending for the current cycle
      const spending = await SpendingService.getSpending({
        start: cycle.cycleStart,
        end: cycle.cycleEnd,
      });

      setExpenses(spending);
      
      // Calculate totals
      const spent = spending.reduce((sum, expense) => sum + expense.amount, 0);
      setTotalSpent(spent);
      setTotalCount(spending.length);
    } catch (error) {
      console.error('Failed to fetch spending:', error);
      setExpenses([]);
      setTotalSpent(0);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [fetchViewCycle]);

  // Fetch data when screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchSpending();
    }, [fetchSpending])
  );

  const summary = {
    totalSpent,
    totalCount,
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Expense History</Text>
          <Text style={styles.headerSubtitle}>
            Track all your one-time expenses
          </Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Spent</Text>
          <Text style={styles.summaryValue}>
            ${summary.totalSpent.toLocaleString()}
          </Text>
          <Text style={styles.summaryCaption}>
            {summary.totalCount} {summary.totalCount === 1 ? 'expense' : 'expenses'} recorded
            {viewCycle && !viewCycle.error && (
              <> • Current cycle</>
            )}
          </Text>
        </View>

        {loading ? (
          <View style={styles.emptyCard}>
            <ActivityIndicator size="large" color="#29B461" />
            <Text style={styles.emptyTitle}>Loading expenses...</Text>
          </View>
        ) : !viewCycle || viewCycle.error ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Text style={styles.plusLarge}>ℹ️</Text>
            </View>
            <Text style={styles.emptyTitle}>No Main Income Set</Text>
            <Text style={styles.emptySubtitle}>
              Please add an income and mark it as your main income to begin tracking your expenses.
            </Text>
          </View>
        ) : expenses.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Text style={styles.plusLarge}>＋</Text>
            </View>
            <Text style={styles.emptyTitle}>No expenses yet</Text>
            <Text style={styles.emptySubtitle}>
              Start tracking your expenses by adding your first one
            </Text>
            <Link href="/modal?type=expense" asChild>
              <Pressable style={styles.addButton}>
                <Text style={styles.addButtonText}>+ Add Expense</Text>
              </Pressable>
            </Link>
          </View>
        ) : (
          <View style={styles.expensesList}>
            {expenses.map((expense, index) => (
              <View
                key={expense._id}
                style={[
                  styles.expenseItem,
                  index === expenses.length - 1 && styles.expenseItemLast,
                ]}
              >
                <View style={styles.expenseInfo}>
                  <Text style={styles.expenseName}>{expense.name}</Text>
                  <Text style={styles.expenseCategory}>{expense.category}</Text>
                  <Text style={styles.expenseDate}>
                    {new Date(expense.spendingDate).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={styles.expenseAmount}>
                  ${expense.amount.toLocaleString()}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {viewCycle && !viewCycle.error && (
        <Link href="/modal?type=expense" asChild>
          <Pressable style={styles.fab}>
            <Text style={styles.fabText}>+</Text>
          </Pressable>
        </Link>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F1F7FF',
  },
  content: {
    padding: 20,
    paddingBottom: 120,
    gap: 24,
  },
  header: {
    gap: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C2533',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6E7C91',
  },
  summaryCard: {
    borderRadius: 24,
    padding: 24,
    gap: 8,
    backgroundColor: '#FF4D67',
    shadowColor: '#FF4D67',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFE4EA',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  summaryValue: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  summaryCaption: {
    fontSize: 16,
    color: '#FFE4EA',
    fontWeight: '500',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    gap: 16,
    shadowColor: '#c3d4ff',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: '#35C667',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusLarge: {
    fontSize: 40,
    color: '#35C667',
    lineHeight: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C2533',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6E7C91',
    textAlign: 'center',
  },
  addButton: {
    marginTop: 8,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 20,
    backgroundColor: '#29B461',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 40,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#22B15C',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#22B15C',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  fabText: {
    fontSize: 36,
    color: '#FFFFFF',
    fontWeight: '700',
    lineHeight: 36,
  },
  expensesList: {
    gap: 12,
  },
  expenseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4F8',
  },
  expenseItemLast: {
    borderBottomWidth: 0,
  },
  expenseInfo: {
    flex: 1,
    gap: 4,
  },
  expenseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C2533',
  },
  expenseCategory: {
    fontSize: 14,
    color: '#6E7C91',
    fontWeight: '500',
  },
  expenseDate: {
    fontSize: 12,
    color: '#99A7BC',
  },
  expenseAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF4D67',
  },
});

