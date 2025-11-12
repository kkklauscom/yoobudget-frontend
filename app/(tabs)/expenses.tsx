import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const summary = {
  totalSpent: 0,
  totalCount: 0,
};

export default function ExpensesScreen() {
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
            {summary.totalCount} expenses recorded
          </Text>
        </View>

        <View style={styles.emptyCard}>
          <View style={styles.emptyIcon}>
            <Text style={styles.plusLarge}>＋</Text>
          </View>
          <Text style={styles.emptyTitle}>No expenses yet</Text>
          <Text style={styles.emptySubtitle}>
            Start tracking your expenses by adding your first one
          </Text>
          <Link href="/modal" asChild>
            <Pressable style={styles.addButton}>
              <Text style={styles.addButtonText}>+ Add Expense</Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>

      <Link href="/modal" asChild>
        <Pressable style={styles.fab}>
          <Text style={styles.fabText}>+</Text>
        </Pressable>
      </Link>
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
});

