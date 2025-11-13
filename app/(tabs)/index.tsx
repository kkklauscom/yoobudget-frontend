import { Link, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/AuthContext";
import * as IncomeService from "@/services/income";
import * as SpendingService from "@/services/spending";
import type { Income, ViewCycleResponse } from "@/services/income";
import type { Spending } from "@/services/spending";

type Allocation = {
  name: string;
  percentage: number;
  budget: number;
  spent: number;
  color: string;
  accent: string;
};

// Recurring expense type (from API)
type RecurringExpense = Spending & {
  expenseType: 'recurring';
};

// Color constants for allocations
const ALLOCATION_COLORS = {
  needs: { color: "#E9F8EF", accent: "#21C17A" },
  wants: { color: "#E6F0FF", accent: "#3383FF" },
  savings: { color: "#F1E7FF", accent: "#9B51E0" },
};

export default function HomeScreen() {
  const { user } = useAuth();
  
  // State for data that will come from API
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);
  const [allExpenses, setAllExpenses] = useState<Spending[]>([]); // All expenses for calculating spent
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);
  const [cycleLoading, setCycleLoading] = useState(true);
  const [expensesLoading, setExpensesLoading] = useState(true);
  const [totalRecurringExpenses, setTotalRecurringExpenses] = useState<number>(0);
  const [viewCycle, setViewCycle] = useState<ViewCycleResponse | null>(null);
  
  // Format current date
  const currentDate = useMemo(() => {
    const date = new Date();
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, []);

  // Get pay cycle label
  const getPayCycleLabel = (payCycle: string): string => {
    switch (payCycle) {
      case 'weekly':
        return 'weekly';
      case 'biweekly':
        return 'biweekly';
      case 'monthly':
        return 'monthly';
      case 'one-time':
        return 'one-time';
      default:
        return 'monthly';
    }
  };

  // Format date range for display
  const formatDateRange = (start: string, end: string): string => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const startStr = startDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    const endStr = endDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    return `${startStr} → ${endStr}`;
  };

  const fetchIncomes = useCallback(async () => {
    try {
      setLoading(true);
      const data = await IncomeService.getAllIncomes();
      setIncomes(Array.isArray(data) ? [...data] : []);
    } catch (error) {
      console.error('Failed to fetch incomes:', error);
      setIncomes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchViewCycle = useCallback(async () => {
    try {
      setCycleLoading(true);
      const cycleData = await IncomeService.getViewCycle();
      // Check if cycle data has error (NO_MAIN_INCOME)
      if (cycleData.error) {
        setViewCycle(null);
      } else {
        setViewCycle(cycleData);
      }
    } catch (error: any) {
      console.error('Failed to fetch view cycle:', error);
      // Set viewCycle to null to show empty state
      setViewCycle(null);
    } finally {
      setCycleLoading(false);
    }
  }, []);

  const fetchRecurringExpenses = useCallback(async () => {
    try {
      setExpensesLoading(true);
      // Fetch current cycle expenses (includes recurring expenses)
      const cycleData = await SpendingService.getCurrentCycleExpenses();
      
      if (cycleData.error || !cycleData.expenses) {
        // No main income set or error
        setRecurringExpenses([]);
        setAllExpenses([]);
        setTotalRecurringExpenses(0);
        return;
      }

      // Store all expenses for calculating spent amounts
      setAllExpenses(cycleData.expenses);

      // Filter recurring expenses
      const recurring = cycleData.expenses.filter(
        (expense) => expense.expenseType === 'recurring'
      ) as RecurringExpense[];

      setRecurringExpenses(recurring);
      
      // Calculate total
      const total = recurring.reduce((sum, expense) => sum + expense.amount, 0);
      setTotalRecurringExpenses(total);
    } catch (error) {
      console.error('Failed to fetch recurring expenses:', error);
      setRecurringExpenses([]);
      setAllExpenses([]);
      setTotalRecurringExpenses(0);
    } finally {
      setExpensesLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchIncomes();
      fetchViewCycle();
      fetchRecurringExpenses();
    }, [fetchIncomes, fetchViewCycle, fetchRecurringExpenses])
  );
  
  const summary = useMemo(
    () => ({
      income: viewCycle?.totalIncome ?? 0,
      recurringExpenses: totalRecurringExpenses,
      date: currentDate,
      currentSavings: user?.currentSavings ?? 0,
      payCycle: viewCycle?.payCycle || 'monthly',
      cycleStart: viewCycle?.cycleStart,
      cycleEnd: viewCycle?.cycleEnd,
      remainingDays: viewCycle?.remainingDays ?? 0,
      hasMainIncome: viewCycle !== null && !viewCycle.error,
    }),
    [viewCycle, totalRecurringExpenses, currentDate, user?.currentSavings]
  );

  // Calculate spent amounts by category (needs, wants, savings)
  const spentByCategory = useMemo(() => {
    const spent = {
      needs: 0,
      wants: 0,
      savings: 0,
    };

    // Calculate spent from all expenses based on spendFrom field
    allExpenses.forEach((expense) => {
      // spendFrom is already 'needs' | 'wants' | 'savings'
      const category = expense.spendFrom;
      if (category === 'needs' || category === 'wants' || category === 'savings') {
        spent[category] += expense.amount;
      }
    });

    return spent;
  }, [allExpenses]);

  // Generate allocations from user budget ratio if available
  const displayAllocations = useMemo(() => {
    if (allocations.length > 0) {
      // If allocations come from API, update spent amounts from expenses
      return allocations.map((allocation) => {
        const categoryKey = allocation.name.toLowerCase() as keyof typeof spentByCategory;
        return {
          ...allocation,
          spent: spentByCategory[categoryKey] || allocation.spent,
        };
      });
    }
    
    // If no allocations from API, create from user budget ratio
    if (user?.budgetRatio && summary.income > 0) {
      return [
        {
          name: "Needs",
          percentage: user.budgetRatio.needs,
          budget: Math.round((summary.income * user.budgetRatio.needs) / 100),
          spent: spentByCategory.needs,
          color: ALLOCATION_COLORS.needs.color,
          accent: ALLOCATION_COLORS.needs.accent,
        },
        {
          name: "Wants",
          percentage: user.budgetRatio.wants,
          budget: Math.round((summary.income * user.budgetRatio.wants) / 100),
          spent: spentByCategory.wants,
          color: ALLOCATION_COLORS.wants.color,
          accent: ALLOCATION_COLORS.wants.accent,
        },
        {
          name: "Savings",
          percentage: user.budgetRatio.savings,
          budget: Math.round((summary.income * user.budgetRatio.savings) / 100),
          spent: spentByCategory.savings,
          color: ALLOCATION_COLORS.savings.color,
          accent: ALLOCATION_COLORS.savings.accent,
        },
      ];
    }
    
    return [];
  }, [allocations, user?.budgetRatio, summary.income, spentByCategory]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>YooBudget</Text>
            <Text style={styles.headerDate}>{summary.date}</Text>
          </View>
          <Link href="/modal" asChild>
            <Pressable style={styles.headerButton}>
              <Text style={styles.headerButtonText}>+</Text>
            </Pressable>
          </Link>
        </View>

        {/* Cycle Information Card */}
        {cycleLoading ? (
          <View style={styles.cycleCard}>
            <ActivityIndicator size="small" color="#FFFFFF" />
            <Text style={styles.cycleLoadingText}>Loading cycle information...</Text>
          </View>
        ) : summary.hasMainIncome ? (
          <View style={styles.cycleCard}>
            <View style={styles.cycleHeader}>
              <Text style={styles.cycleTitle}>Current Cycle</Text>
              <Text style={styles.cycleType}>
                {getPayCycleLabel(summary.payCycle)}
              </Text>
            </View>
            {summary.cycleStart && summary.cycleEnd && (
              <Text style={styles.cycleDateRange}>
                {formatDateRange(summary.cycleStart, summary.cycleEnd)}
              </Text>
            )}
            <View style={styles.cycleFooter}>
              <Text style={styles.cycleIncome}>
                +${summary.income.toLocaleString()}
              </Text>
              <Text style={styles.cycleRemainingDays}>
                {summary.remainingDays} days remaining
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.emptyCycleCard}>
            <Text style={styles.emptyCycleTitle}>
              No Main Income Set
            </Text>
            <Text style={styles.emptyCycleText}>
              Please add an income and mark it as your main income to begin tracking your budget cycle.
            </Text>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Incomes</Text>
            <Link href="/modal" asChild>
              <Pressable style={styles.sectionAction}>
                <Text style={styles.sectionActionText}>+</Text>
              </Pressable>
            </Link>
          </View>
          <View style={styles.sectionCard}>
            {loading ? (
              <View style={styles.emptyState}>
                <ActivityIndicator size="small" color="#12B76A" />
                <Text style={styles.emptyStateText}>Loading incomes...</Text>
              </View>
            ) : incomes.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  No incomes yet
                </Text>
                <Text style={styles.emptyStateSubtext}>
                  Add your first income to get started
                </Text>
              </View>
            ) : (
              incomes.map((income, index) => {
                const incomeName = income.name || 'Unnamed Income';
                const payCycleLabel = getPayCycleLabel(income.payCycle);
                const incomeDate = new Date(income.nextPayDate);
                const incomeDetails = income.payCycle === 'one-time' 
                  ? `One-time • ${incomeDate.toLocaleDateString()}`
                  : `${payCycleLabel.charAt(0).toUpperCase() + payCycleLabel.slice(1)} • Next: ${incomeDate.toLocaleDateString()}`;
                
                return (
                  <View 
                    key={income._id} 
                    style={[
                      styles.incomeRow,
                      index === incomes.length - 1 && styles.incomeRowLast
                    ]}
                  >
                    <View style={styles.incomeInfo}>
                      <View style={styles.incomeIcon}>
                        <Text style={styles.incomeIconText}>💰</Text>
                      </View>
                      <View style={styles.incomeDetails}>
                        <View style={styles.incomeTitleRow}>
                          <Text style={styles.incomeTitle}>{incomeName}</Text>
                          {income.isMain && (
                            <View style={styles.mainBadge}>
                              <Text style={styles.mainBadgeText}>MAIN INCOME</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.incomeSubtitle}>{incomeDetails}</Text>
                      </View>
                    </View>
                    <View style={styles.incomeRight}>
                      <Text style={styles.incomeAmount}>
                        +${income.amount.toLocaleString()}
                      </Text>
                      {!income.isMain && income.payCycle !== 'one-time' && (
                        <Pressable
                          style={styles.setMainButton}
                          onPress={async () => {
                            try {
                              await IncomeService.setMainIncome(income._id);
                              // Refresh incomes and cycle
                              await fetchIncomes();
                              await fetchViewCycle();
                            } catch (error) {
                              console.error('Failed to set main income:', error);
                            }
                          }}
                        >
                          <Text style={styles.setMainButtonText}>Set as main</Text>
                        </Pressable>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Budget Allocation</Text>
            <Pressable style={styles.sectionAction}>
              <Text style={styles.sectionActionText}>Edit</Text>
            </Pressable>
          </View>

          <View style={styles.sectionCard}>
            {displayAllocations.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  No budget allocation data available
                </Text>
                <Text style={styles.emptyStateSubtext}>
                  Set your income to see budget allocations
                </Text>
              </View>
            ) : (
              displayAllocations.map((allocation) => {
              const savings = allocation.budget - allocation.spent;
              const progress =
                allocation.budget === 0
                  ? 0
                  : Math.min(
                      100,
                      Math.round((allocation.spent / allocation.budget) * 100)
                    );

              return (
                <View
                  key={allocation.name}
                  style={[
                    styles.allocationRow,
                    { backgroundColor: allocation.color },
                  ]}
                >
                  <View style={styles.allocationHeader}>
                    <View
                      style={[
                        styles.dot,
                        { backgroundColor: allocation.accent },
                      ]}
                    />
                    <Text style={styles.allocationTitle}>
                      {allocation.name}{" "}
                      <Text style={styles.allocationPercentage}>
                        ({allocation.percentage}%)
                      </Text>
                    </Text>
                    <Text
                      style={[
                        styles.allocationSavings,
                        { color: allocation.accent },
                      ]}
                    >
                      ${savings.toLocaleString()}
                    </Text>
                  </View>
                  <Text style={styles.allocationSecondary}>
                    Budget: ${allocation.budget.toLocaleString()} | Spent: $
                    {allocation.spent.toLocaleString()}
                  </Text>
                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          backgroundColor: allocation.accent,
                          width: `${progress}%`,
                        },
                      ]}
                    />
                  </View>
                </View>
              );
            })
            )}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>RECURRING</Text>
            <Link href="/modal?type=expense" asChild>
              <Pressable style={styles.sectionAction}>
                <Text style={styles.sectionActionText}>+</Text>
              </Pressable>
            </Link>
          </View>
          <View style={styles.sectionCard}>
            {expensesLoading ? (
              <View style={styles.emptyState}>
                <ActivityIndicator size="small" color="#FF4D67" />
                <Text style={styles.emptyStateText}>Loading recurring expenses...</Text>
              </View>
            ) : recurringExpenses.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  No recurring expenses yet
                </Text>
                <Text style={styles.emptyStateSubtext}>
                  Add your first recurring expense to get started
                </Text>
              </View>
            ) : (
              recurringExpenses.map((expense, index) => (
              <View 
                key={expense._id} 
                style={[
                  styles.expenseRow,
                  index === recurringExpenses.length - 1 && styles.expenseRowLast
                ]}
              >
                <View style={styles.expenseInfo}>
                  <View style={styles.expenseIcon}>
                    <Text style={styles.expenseIconText}>🔄</Text>
                  </View>
                  <View style={styles.expenseDetails}>
                    <Text style={styles.expenseTitle}>{expense.name}</Text>
                    <View style={styles.expenseMeta}>
                      <Text style={styles.expenseCategory}>{expense.category}</Text>
                      {expense.payCycle && (
                        <Text style={styles.expensePayCycle}>
                          • {expense.payCycle.charAt(0).toUpperCase() + expense.payCycle.slice(1)}
                        </Text>
                      )}
                      {expense.nextPaymentDate && (
                        <Text style={styles.expenseDate}>
                          • Next: {new Date(expense.nextPaymentDate).toLocaleDateString()}
                        </Text>
                      )}
                    </View>
                    {expense.note && (
                      <Text style={styles.expenseNote}>{expense.note}</Text>
                    )}
                  </View>
                </View>
                <Text style={styles.expenseAmount}>
                  -${expense.amount.toLocaleString()}
                </Text>
              </View>
            ))
            )}
          </View>
        </View>

        <View style={styles.disposableCard}>
          <Text style={styles.cardLabel}>Current Savings</Text>
          <Text style={styles.disposableValue}>
            ${summary.currentSavings.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Text>
          <Text style={styles.cardSubLabel}>Your current savings balance</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F1F5FF",
  },
  content: {
    padding: 20,
    gap: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1B1B33",
  },
  headerDate: {
    marginTop: 4,
    fontSize: 14,
    color: "#6F7C8E",
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#0FB364",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0FB364",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  headerButtonText: {
    fontSize: 28,
    lineHeight: 28,
    color: "#FFFFFF",
    fontWeight: "700",
  },
  cycleCard: {
    borderRadius: 24,
    padding: 24,
    gap: 16,
    backgroundColor: "#3383FF",
    shadowColor: "#3383FF",
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  cycleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cycleTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  cycleType: {
    fontSize: 14,
    fontWeight: "600",
    color: "#E6F0FF",
    textTransform: "capitalize",
  },
  cycleDateRange: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
  },
  cycleFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  cycleIncome: {
    fontSize: 32,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  cycleRemainingDays: {
    fontSize: 14,
    fontWeight: "600",
    color: "#E6F0FF",
  },
  cycleLoadingText: {
    fontSize: 14,
    color: "#E6F0FF",
    textAlign: "center",
    marginTop: 8,
  },
  emptyCycleCard: {
    borderRadius: 24,
    padding: 24,
    gap: 12,
    backgroundColor: "#FFF4E6",
    borderWidth: 2,
    borderColor: "#FFD89C",
    shadowColor: "#FFD89C",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  emptyCycleTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#B8860B",
    textAlign: "center",
  },
  emptyCycleText: {
    fontSize: 14,
    color: "#8B6914",
    textAlign: "center",
    lineHeight: 20,
  },
  incomeCard: {
    borderRadius: 24,
    padding: 24,
    gap: 12,
    backgroundColor: "#12B76A",
    shadowColor: "#0FB364",
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  cardLabel: {
    color: "#E6FFF5",
    fontSize: 14,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  incomeValue: {
    fontSize: 40,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  cardSubLabel: {
    fontSize: 16,
    color: "#E6FFF5",
    fontWeight: "500",
  },
  section: {
    gap: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1B1B33",
  },
  sectionAction: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#EAF1FF",
  },
  sectionActionText: {
    color: "#3383FF",
    fontSize: 14,
    fontWeight: "600",
  },
  sectionCard: {
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    padding: 16,
    gap: 12,
    shadowColor: "#c3d4ff",
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },
  allocationRow: {
    borderRadius: 20,
    padding: 16,
    gap: 10,
  },
  allocationHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  allocationTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: "#1B1B33",
  },
  allocationPercentage: {
    fontWeight: "500",
    color: "#7A889C",
  },
  allocationSavings: {
    fontSize: 16,
    fontWeight: "700",
  },
  allocationSecondary: {
    fontSize: 14,
    color: "#7A889C",
  },
  progressTrack: {
    height: 8,
    borderRadius: 6,
    backgroundColor: "#DFE6F2",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 6,
  },
  expenseRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F4F8",
  },
  expenseRowLast: {
    borderBottomWidth: 0,
  },
  expenseInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    flex: 1,
  },
  expenseIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFE6E9",
    alignItems: "center",
    justifyContent: "center",
  },
  expenseIconText: {
    fontSize: 18,
  },
  expenseDetails: {
    flex: 1,
    gap: 4,
  },
  expenseTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1B1B33",
  },
  expenseMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexWrap: "wrap",
  },
  expenseCategory: {
    fontSize: 12,
    color: "#7A889C",
    fontWeight: "500",
  },
  expensePayCycle: {
    fontSize: 12,
    color: "#7A889C",
  },
  expenseDate: {
    fontSize: 12,
    color: "#7A889C",
  },
  expenseNote: {
    fontSize: 12,
    color: "#99A7BC",
    fontStyle: "italic",
  },
  expenseType: {
    fontSize: 12,
    color: "#7A889C",
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FF4D67",
  },
  incomeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F4F8",
  },
  incomeRowLast: {
    borderBottomWidth: 0,
  },
  incomeInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  incomeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E8F5E9",
    alignItems: "center",
    justifyContent: "center",
  },
  incomeIconText: {
    fontSize: 20,
  },
  incomeDetails: {
    flex: 1,
    gap: 4,
  },
  incomeTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  incomeTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1B1B33",
  },
  mainBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: "#12B76A",
  },
  mainBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  incomeSubtitle: {
    fontSize: 12,
    color: "#6F7C8E",
  },
  incomeAmount: {
    fontSize: 16,
    fontWeight: "700",
    color: "#12B76A",
  },
  incomeRight: {
    alignItems: "flex-end",
    gap: 8,
  },
  setMainButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "#E8F1FF",
    borderWidth: 1,
    borderColor: "#3383FF",
  },
  setMainButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#3383FF",
  },
  disposableCard: {
    borderRadius: 24,
    padding: 24,
    gap: 12,
    backgroundColor: "#8B5CF6",
    shadowColor: "#8B5CF6",
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  disposableValue: {
    fontSize: 36,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  emptyState: {
    padding: 24,
    alignItems: "center",
    gap: 8,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1B1B33",
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#6F7C8E",
    textAlign: "center",
  },
});
