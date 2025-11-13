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
  const [hasMainIncome, setHasMainIncome] = useState(true);

  // Fetch spending for current cycle
  const fetchSpending = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch current cycle expenses (API handles cycle calculation)
      const cycleData = await SpendingService.getCurrentCycleExpenses();
      
      if (cycleData.error) {
        // No main income set or error
        setHasMainIncome(false);
        setExpenses([]);
        setTotalSpent(0);
        setTotalCount(0);
        setViewCycle(null);
        return;
      }

      // Has main income
      setHasMainIncome(true);

      // Update expenses
      setExpenses(cycleData.expenses || []);
      
      // Calculate totals
      const spent = (cycleData.expenses || []).reduce((sum, expense) => sum + expense.amount, 0);
      setTotalSpent(spent);
      setTotalCount(cycleData.expenses?.length || 0);

      // Set view cycle info if available (for display purposes)
      // Try to get payCycle from income view-cycle
      try {
        const incomeCycle = await IncomeService.getViewCycle();
        if (!incomeCycle.error && incomeCycle.payCycle) {
          setViewCycle({
            cycleStart: cycleData.cycleStart,
            cycleEnd: cycleData.cycleEnd,
            payCycle: incomeCycle.payCycle,
            remainingDays: incomeCycle.remainingDays,
            totalIncome: incomeCycle.totalIncome,
          });
        } else {
          setViewCycle({
            cycleStart: cycleData.cycleStart,
            cycleEnd: cycleData.cycleEnd,
            payCycle: 'monthly',
            remainingDays: 0,
            totalIncome: 0,
          });
        }
      } catch {
        // If we can't get income cycle, just use expense cycle data
        setViewCycle({
          cycleStart: cycleData.cycleStart,
          cycleEnd: cycleData.cycleEnd,
          payCycle: 'monthly',
          remainingDays: 0,
          totalIncome: 0,
        });
      }
    } catch (error) {
      console.error('Failed to fetch spending:', error);
      setExpenses([]);
      setTotalSpent(0);
      setTotalCount(0);
      setViewCycle(null);
    } finally {
      setLoading(false);
    }
  }, []);

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
            -${summary.totalSpent.toLocaleString()}
          </Text>
          <Text style={styles.summaryCaption}>
            {summary.totalCount} {summary.totalCount === 1 ? 'expense' : 'expenses'} recorded
            {hasMainIncome && viewCycle && (
              <> • Current cycle</>
            )}
          </Text>
        </View>

        {loading ? (
          <View style={styles.emptyCard}>
            <ActivityIndicator size="large" color="#29B461" />
            <Text style={styles.emptyTitle}>Loading expenses...</Text>
          </View>
        ) : !hasMainIncome ? (
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
                  <View style={styles.expenseHeader}>
                    <Text style={styles.expenseName}>{expense.name}</Text>
                    {expense.expenseType === 'recurring' && (
                      <View style={styles.recurringBadge}>
                        <Text style={styles.recurringBadgeText}>RECURRING</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.expenseCategory}>{expense.category}</Text>
                  {expense.note && (
                    <Text style={styles.expenseNote}>{expense.note}</Text>
                  )}
                  <View style={styles.expenseMeta}>
                    <Text style={styles.expenseDate}>
                      {expense.expenseType === 'one-time' && expense.createdAt
                        ? new Date(expense.createdAt).toLocaleDateString()
                        : expense.expenseType === 'recurring' && expense.nextPaymentDate
                        ? `Next: ${new Date(expense.nextPaymentDate).toLocaleDateString()}`
                        : expense.created
                        ? new Date(expense.created).toLocaleDateString()
                        : new Date().toLocaleDateString()}
                    </Text>
                    <Text style={styles.expenseSpendFrom}>
                      • {expense.spendFrom.charAt(0).toUpperCase() + expense.spendFrom.slice(1)}
                    </Text>
                  </View>
                </View>
                <Text style={styles.expenseAmount}>
                  -${expense.amount.toLocaleString()}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {hasMainIncome && (
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
  expenseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  expenseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C2533',
  },
  recurringBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#E8F1FF',
    borderWidth: 1,
    borderColor: '#3383FF',
  },
  recurringBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#3383FF',
    letterSpacing: 0.5,
  },
  expenseCategory: {
    fontSize: 14,
    color: '#6E7C91',
    fontWeight: '500',
  },
  expenseNote: {
    fontSize: 12,
    color: '#99A7BC',
    fontStyle: 'italic',
  },
  expenseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
  },
  expenseDate: {
    fontSize: 12,
    color: '#99A7BC',
  },
  expenseSpendFrom: {
    fontSize: 12,
    color: '#99A7BC',
    fontWeight: '500',
  },
  expenseAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF4D67',
  },
});

