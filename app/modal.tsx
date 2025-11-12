import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type ExpenseType = 'one-time' | 'recurring';

const payFromOptions = [
  { label: 'Needs', detail: 'Available: $2500', color: '#22B15C' },
  { label: 'Wants', detail: 'Available: $1410', color: '#3383FF' },
  { label: 'Savings', detail: 'Available: $1000', color: '#9B51E0' },
];

const categories = [
  { label: 'Food', icon: '🍔' },
  { label: 'Transport', icon: '🚗' },
  { label: 'Housing', icon: '🏡' },
  { label: 'Utilities', icon: '💡' },
  { label: 'Entertainment', icon: '🎮' },
  { label: 'Shopping', icon: '🛍️' },
  { label: 'Healthcare', icon: '💊' },
  { label: 'Education', icon: '📚' },
  { label: 'Gifts', icon: '🎁' },
  { label: 'Travel', icon: '✈️' },
];

export default function ModalScreen() {
  const router = useRouter();
  const [expenseType, setExpenseType] = useState<ExpenseType>('one-time');
  const [selectedAccount, setSelectedAccount] = useState('Needs');
  const [category, setCategory] = useState('Food');

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.closeButton}>
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
          <Text style={styles.title}>Add Expense</Text>
        </View>

        <Text style={styles.description}>
          Record a one-time or recurring expense
        </Text>

        <View style={styles.segment}>
          <Pressable
            style={[
              styles.segmentOption,
              expenseType === 'one-time' && styles.segmentOptionActive,
            ]}
            onPress={() => setExpenseType('one-time')}
          >
            <Text
              style={[
                styles.segmentLabel,
                expenseType === 'one-time' && styles.segmentLabelActive,
              ]}
            >
              One-Time
            </Text>
            <Text style={styles.segmentCaption}>Single payment</Text>
          </Pressable>
          <Pressable
            style={[
              styles.segmentOption,
              expenseType === 'recurring' && styles.segmentOptionActive,
            ]}
            onPress={() => setExpenseType('recurring')}
          >
            <Text
              style={[
                styles.segmentLabel,
                expenseType === 'recurring' && styles.segmentLabelActive,
              ]}
            >
              Recurring
            </Text>
            <Text style={styles.segmentCaption}>Regular payment</Text>
          </Pressable>
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Expense Name</Text>
          <TextInput
            placeholder="e.g., Lunch, Electric Bill"
            placeholderTextColor="#99A7BC"
            style={styles.input}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Amount ($)</Text>
          <TextInput
            placeholder="0.00"
            placeholderTextColor="#99A7BC"
            keyboardType="decimal-pad"
            style={styles.input}
          />
        </View>

        <View style={styles.field}>
          <View style={styles.fieldHeader}>
            <Text style={styles.fieldLabel}>Pay From</Text>
            <Pressable>
              <Text style={styles.switchLink}>Switch to Note</Text>
            </Pressable>
          </View>

          <View style={styles.accountList}>
            {payFromOptions.map((option) => {
              const isActive = option.label === selectedAccount;
              return (
                <Pressable
                  key={option.label}
                  style={[
                    styles.accountCard,
                    isActive && styles.accountCardActive,
                  ]}
                  onPress={() => setSelectedAccount(option.label)}
                >
                  <View style={styles.accountHeader}>
                    <View
                      style={[
                        styles.accountDot,
                        { backgroundColor: option.color },
                      ]}
                    />
                    <Text style={styles.accountLabel}>{option.label}</Text>
                  </View>
                  <Text style={styles.accountDetail}>{option.detail}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Category</Text>
          <View style={styles.categoryGrid}>
            {categories.map((item) => {
              const isActive = item.label === category;
              return (
                <Pressable
                  key={item.label}
                  style={[
                    styles.categoryItem,
                    isActive && styles.categoryItemActive,
                  ]}
                  onPress={() => setCategory(item.label)}
                >
                  <Text style={styles.categoryIcon}>{item.icon}</Text>
                  <Text
                    style={[
                      styles.categoryLabel,
                      isActive && styles.categoryLabelActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Pressable style={styles.submitButton}>
          <Text style={styles.submitText}>
            Add Expense ({expenseType === 'one-time' ? 'One-Time' : 'Recurring'})
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F9FF',
  },
  content: {
    padding: 20,
    gap: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#d5e6ff',
    shadowOpacity: 0.5,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  closeText: {
    fontSize: 18,
    color: '#6E7A90',
  },
  title: {
    flex: 1,
    marginLeft: 12,
    fontSize: 24,
    fontWeight: '700',
    color: '#1C2533',
  },
  description: {
    fontSize: 14,
    color: '#6E7A90',
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: '#E8F1FF',
    borderRadius: 20,
    padding: 4,
    gap: 4,
  },
  segmentOption: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  segmentOptionActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#AFC7FF',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  segmentLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6E7A90',
  },
  segmentLabelActive: {
    color: '#1C2533',
  },
  segmentCaption: {
    fontSize: 12,
    color: '#8C9BB1',
    marginTop: 4,
  },
  field: {
    gap: 12,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C2533',
  },
  switchLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#22B15C',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 16,
    color: '#1C2533',
    borderWidth: 1,
    borderColor: '#D3DFF4',
  },
  accountList: {
    gap: 12,
  },
  accountCard: {
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderWidth: 1,
    borderColor: '#D3DFF4',
    gap: 8,
  },
  accountCardActive: {
    borderColor: '#22B15C',
    shadowColor: '#C6F0D8',
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  accountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  accountDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  accountLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C2533',
  },
  accountDetail: {
    fontSize: 14,
    color: '#6E7A90',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryItem: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#D3DFF4',
  },
  categoryItemActive: {
    borderColor: '#22B15C',
    shadowColor: '#C6F0D8',
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  categoryIcon: {
    fontSize: 28,
  },
  categoryLabel: {
    fontSize: 14,
    color: '#6E7A90',
    fontWeight: '600',
  },
  categoryLabelActive: {
    color: '#1C2533',
  },
  submitButton: {
    marginTop: 16,
    backgroundColor: '#22B15C',
    borderRadius: 20,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#22B15C',
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  submitText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
