import { Link, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/AuthContext";
import * as IncomeService from "@/services/income";
import type { Income } from "@/services/income";

type Allocation = {
  name: string;
  percentage: number;
  budget: number;
  spent: number;
  color: string;
  accent: string;
};

type Expense = {
  title: string;
  amount: number;
  type: "Need" | "Want";
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
  const [fixedExpenses, setFixedExpenses] = useState<Expense[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalFixedExpenses, setTotalFixedExpenses] = useState<number>(0);
  
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

  // Calculate monthly income from all incomes
  const monthlyIncome = useMemo(() => {
    let total = 0;
    const currentDate = new Date();
    
    incomes.forEach((income) => {
      if (income.type === 'one-time') {
        // One-time income: check if it's in the current month
        const incomeDate = new Date(income.oneTimeDate);
        if (
          incomeDate.getMonth() === currentDate.getMonth() &&
          incomeDate.getFullYear() === currentDate.getFullYear()
        ) {
          total += income.amount;
        }
      } else if (income.type === 'recurring') {
        // Recurring income: calculate monthly amount based on frequency
        const frequency = income.frequency;
        let monthlyAmount = income.amount;
        
        switch (frequency) {
          case 'weekly':
            monthlyAmount = income.amount * 4.33; // Average weeks per month
            break;
          case 'fortnightly':
            monthlyAmount = income.amount * 2.17; // Average fortnights per month
            break;
          case 'monthly':
            monthlyAmount = income.amount;
            break;
          case 'yearly':
            monthlyAmount = income.amount / 12;
            break;
        }
        
        total += monthlyAmount;
      }
    });
    
    return Math.round(total);
  }, [incomes]);

  // Fetch incomes from API
  const fetchIncomes = useCallback(async () => {
    try {
      setLoading(true);
      const data = await IncomeService.getAllIncomes();
      setIncomes(data);
    } catch (error) {
      console.error('Failed to fetch incomes:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch incomes when screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchIncomes();
    }, [fetchIncomes])
  );
  
  const summary = useMemo(
    () => ({
      income: monthlyIncome,
      fixedExpenses: totalFixedExpenses,
      date: currentDate,
      currentSavings: user?.currentSavings ?? 0,
    }),
    [monthlyIncome, totalFixedExpenses, currentDate, user?.currentSavings]
  );

  // Generate allocations from user budget ratio if available
  const displayAllocations = useMemo(() => {
    if (allocations.length > 0) {
      return allocations;
    }
    
    // If no allocations from API, create from user budget ratio
    if (user?.budgetRatio && monthlyIncome > 0) {
      return [
        {
          name: "Needs",
          percentage: user.budgetRatio.needs,
          budget: Math.round((monthlyIncome * user.budgetRatio.needs) / 100),
          spent: 0, // Will come from API
          color: ALLOCATION_COLORS.needs.color,
          accent: ALLOCATION_COLORS.needs.accent,
        },
        {
          name: "Wants",
          percentage: user.budgetRatio.wants,
          budget: Math.round((monthlyIncome * user.budgetRatio.wants) / 100),
          spent: 0, // Will come from API
          color: ALLOCATION_COLORS.wants.color,
          accent: ALLOCATION_COLORS.wants.accent,
        },
        {
          name: "Savings",
          percentage: user.budgetRatio.savings,
          budget: Math.round((monthlyIncome * user.budgetRatio.savings) / 100),
          spent: 0, // Will come from API
          color: ALLOCATION_COLORS.savings.color,
          accent: ALLOCATION_COLORS.savings.accent,
        },
      ];
    }
    
    return [];
  }, [allocations, user?.budgetRatio, monthlyIncome]);

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

        <View style={styles.incomeCard}>
          <Text style={styles.cardLabel}>Total monthly income</Text>
          <Text style={styles.incomeValue}>
            ${summary.income.toLocaleString()}
          </Text>
          <Text style={styles.cardSubLabel}>
            Fixed expenses: ${summary.fixedExpenses.toLocaleString()}
          </Text>
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
            <Text style={styles.sectionTitle}>Fixed Expenses</Text>
            <Link href="/modal" asChild>
              <Pressable style={styles.sectionAction}>
                <Text style={styles.sectionActionText}>+</Text>
              </Pressable>
            </Link>
          </View>
          <View style={styles.sectionCard}>
            {fixedExpenses.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  No fixed expenses yet
                </Text>
                <Text style={styles.emptyStateSubtext}>
                  Add your first fixed expense to get started
                </Text>
              </View>
            ) : (
              fixedExpenses.map((expense) => (
              <View key={expense.title} style={styles.expenseRow}>
                <View style={styles.expenseInfo}>
                  <View style={styles.expenseIcon}>
                    <Text style={styles.expenseIconText}>↗</Text>
                  </View>
                  <View>
                    <Text style={styles.expenseTitle}>{expense.title}</Text>
                    <Text style={styles.expenseType}>{expense.type}</Text>
                  </View>
                </View>
                <Text style={styles.expenseAmount}>
                  ${expense.amount.toLocaleString()}
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
  },
  expenseInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  expenseIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#EAF7EF",
    alignItems: "center",
    justifyContent: "center",
  },
  expenseIconText: {
    fontSize: 18,
    color: "#21C17A",
  },
  expenseTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1B1B33",
  },
  expenseType: {
    fontSize: 12,
    color: "#7A889C",
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1B1B33",
  },
  moreButton: {
    marginTop: 4,
  },
  moreButtonText: {
    fontSize: 14,
    color: "#3383FF",
    fontWeight: "600",
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
