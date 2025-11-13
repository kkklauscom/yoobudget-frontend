import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import * as IncomeService from '@/services/income';
import * as SpendingService from '@/services/spending';
import type { PayCycle } from '@/services/income';

// Web date input component - uses native HTML input element via TextInput
const WebDateInput = ({
  value,
  onChange,
  minimumDate,
  maximumDate,
  disabled,
}: {
  value: Date;
  onChange: (date: Date) => void;
  minimumDate?: Date;
  maximumDate?: Date;
  disabled?: boolean;
}) => {
  const inputRef = useRef<any>(null);
  
  const formatDateForInput = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatMinDate = (date?: Date): string | undefined => {
    if (!date) return undefined;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatMaxDate = (date?: Date): string | undefined => {
    if (!date) return undefined;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Always call useEffect (React Hook rules)
  useEffect(() => {
    // Only run on Web platform
    if (Platform.OS === 'web' && inputRef.current && typeof document !== 'undefined') {
      // Get the underlying DOM element
      const element = inputRef.current;
      // Try different ways to access the DOM node
      const domNode = 
        element?._nativeNode ||
        element?._node ||
        (element?.getNativeRef?.()) ||
        (typeof element === 'object' && 'setNativeProps' in element ? null : element);
      
      // If we can access the DOM directly, set type="date"
      if (domNode && typeof domNode.setAttribute === 'function') {
        domNode.setAttribute('type', 'date');
        if (minimumDate) {
          domNode.setAttribute('min', formatMinDate(minimumDate)!);
        }
        if (maximumDate) {
          domNode.setAttribute('max', formatMaxDate(maximumDate)!);
        }
        if (disabled) {
          domNode.setAttribute('disabled', 'true');
        } else {
          domNode.removeAttribute('disabled');
        }
      } else if (element && typeof element.setNativeProps === 'function') {
        // Try using setNativeProps (react-native-web might support this)
        try {
          element.setNativeProps({
            type: 'date',
            min: formatMinDate(minimumDate),
            max: formatMaxDate(maximumDate),
            disabled: disabled,
          } as any);
        } catch {
          // Fallback if setNativeProps doesn't work
          // Silently fail
        }
      }
    }
  }, [value, minimumDate, maximumDate, disabled]);

  // For Web, use TextInput - on Web it renders as HTML input
  if (Platform.OS === 'web') {
    return (
      <TextInput
        ref={inputRef}
        value={formatDateForInput(value)}
        editable={!disabled}
        onChangeText={(text) => {
          if (text) {
            onChange(new Date(text));
          }
        }}
        style={[styles.input, disabled && styles.inputDisabled]}
        // @ts-ignore - Web specific props that react-native-web might support
        type="date"
        min={formatMinDate(minimumDate)}
        max={formatMaxDate(maximumDate)}
      />
    );
  }

  // For non-web platforms, return null (will use DateTimePicker instead)
  return null;
};

const PAY_CYCLE_OPTIONS: { label: string; value: PayCycle }[] = [
  { label: 'Weekly', value: 'weekly' },
  { label: 'Biweekly', value: 'biweekly' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'One-Time', value: 'one-time' },
];

// Expense categories (matching backend schema - must match API response)
// Note: Category names should match backend (capitalized first letter)
const EXPENSE_CATEGORIES = [
  { label: 'Food', value: 'Food', icon: '🍔' },
  { label: 'Transport', value: 'Transport', icon: '🚗' },
  { label: 'Housing', value: 'Housing', icon: '🏠' },
  { label: 'Utilities', value: 'Utilities', icon: '💡' },
  { label: 'Entertainment', value: 'Entertainment', icon: '🎬' },
  { label: 'Shopping', value: 'Shopping', icon: '🛍️' },
  { label: 'Healthcare', value: 'Healthcare', icon: '🏥' },
  { label: 'Education', value: 'Education', icon: '📚' },
  { label: 'Gifts', value: 'Gifts', icon: '🎁' },
  { label: 'Travel', value: 'Travel', icon: '✈️' },
];

// Expense type options
const EXPENSE_TYPE_OPTIONS = [
  { label: 'One-Time', value: 'one-time' },
  { label: 'Recurring', value: 'recurring' },
];

// Pay From options
const PAY_FROM_OPTIONS = [
  { label: 'Needs', value: 'needs', color: '#21C17A' },
  { label: 'Wants', value: 'wants', color: '#3383FF' },
  { label: 'Savings', value: 'savings', color: '#9B51E0' },
];

// Expense pay cycle options (for recurring expenses)
const EXPENSE_PAY_CYCLE_OPTIONS: { label: string; value: SpendingService.ExpensePayCycle }[] = [
  { label: 'Weekly', value: 'weekly' },
  { label: 'Biweekly', value: 'biweekly' },
  { label: 'Monthly', value: 'monthly' },
];

export default function ModalScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ type?: string }>();
  const { user } = useAuth();
  
  // Determine if this is for income or expense
  const modalType = params.type === 'expense' ? 'expense' : 'income';
  
  // Get today's date at midnight to ensure we can select today
  const getToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  };
  
  // Common states
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Income-specific states
  const [payCycle, setPayCycle] = useState<PayCycle>('monthly');
  const [nextPayDate, setNextPayDate] = useState(getToday());
  const [isMain, setIsMain] = useState(false);
  const [showNextPayDatePicker, setShowNextPayDatePicker] = useState(false);
  
  // Expense-specific states
  const [expenseType, setExpenseType] = useState<SpendingService.ExpenseType>('one-time');
  const [spendFrom, setSpendFrom] = useState<SpendingService.SpendFrom>('needs');
  const [category, setCategory] = useState<string>('Food'); // Default to first category
  const [note, setNote] = useState<string>('');
  const [expensePayCycle, setExpensePayCycle] = useState<SpendingService.ExpensePayCycle>('monthly');
  const [nextPaymentDate, setNextPaymentDate] = useState(getToday());
  const [showNextPaymentDatePicker, setShowNextPaymentDatePicker] = useState(false);
  const [expenseCreatedAt, setExpenseCreatedAt] = useState(getToday()); // For one-time expenses
  const [showExpenseCreatedAtPicker, setShowExpenseCreatedAtPicker] = useState(false);

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleSubmit = async () => {
    // Validation
    if (!name || name.trim() === '') {
      showAlert('Error', `Please enter a ${modalType === 'expense' ? 'expense' : 'income'} name`);
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      showAlert('Error', 'Please enter a valid amount');
      return;
    }

    // Expense-specific validation
    if (modalType === 'expense') {
      if (!spendFrom) {
        showAlert('Error', 'Please select a payment source');
        return;
      }

      // Category is required according to API
      if (!category) {
        showAlert('Error', 'Please select a category');
        return;
      }

      // Validate recurring fields
      if (expenseType === 'recurring') {
        if (!expensePayCycle) {
          showAlert('Error', 'Please select a pay cycle for recurring expenses');
          return;
        }
        if (!nextPaymentDate) {
          showAlert('Error', 'Please select next payment date for recurring expenses');
          return;
        }
        const today = getToday();
        const nextPaymentDateOnly = new Date(nextPaymentDate);
        nextPaymentDateOnly.setHours(0, 0, 0, 0);
        if (nextPaymentDateOnly < today) {
          showAlert('Error', 'Next payment date cannot be in the past');
          return;
        }
      }
    }

    setLoading(true);
    setErrorMessage('');

    try {
      if (modalType === 'expense') {
        // Create expense
        const data: SpendingService.CreateSpendingData = {
          name: name.trim(),
          amount: parseFloat(amount),
          category: category, // Required
          spendFrom,
          expenseType,
          note: note.trim() || undefined, // Optional, can be empty string
          // Add fields based on expense type
          ...(expenseType === 'one-time' 
            ? { createdAt: formatDate(expenseCreatedAt) } // For one-time, add createdAt
            : { 
                payCycle: expensePayCycle, // Required for recurring
                nextPaymentDate: formatDate(nextPaymentDate), // Required for recurring
              }
          ),
        };
        await SpendingService.createSpending(data);
      } else {
        // Create income
        // Validate next pay date is not in the past (only for non-one-time)
        const today = getToday();
        if (payCycle !== 'one-time') {
          const nextPayDateOnly = new Date(nextPayDate);
          nextPayDateOnly.setHours(0, 0, 0, 0);
          if (nextPayDateOnly < today) {
            showAlert('Error', 'Next pay date cannot be in the past');
            setLoading(false);
            return;
          }
        }

        // One-time income cannot be main
        if (payCycle === 'one-time' && isMain) {
          showAlert('Error', 'One-time income cannot be set as main income');
          setLoading(false);
          return;
        }

        const data: IncomeService.CreateIncomeData = {
          name: name.trim() || undefined,
          amount: parseFloat(amount),
          payCycle,
          nextPayDate: formatDate(nextPayDate),
          isMain: payCycle === 'one-time' ? false : isMain, // One-time cannot be main
        };
        await IncomeService.createIncome(data);
      }

      // Success - go back
      // The expenses page will automatically refresh on focus
      router.back();
    } catch (error: any) {
      const errorMsg = error?.message || `Failed to create ${modalType}`;
      setErrorMessage(errorMsg);
      showAlert('Error', errorMsg);
    } finally {
      setLoading(false);
    }
  };

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
          <Text style={styles.title}>
            {modalType === 'expense' ? 'Add Expense' : 'Add Income'}
          </Text>
        </View>

        <Text style={styles.description}>
          {modalType === 'expense' 
            ? 'Add a new expense'
            : 'Add a new income source'}
        </Text>

        {errorMessage ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>
            {modalType === 'expense' ? 'Expense Name' : 'Income Name (Optional)'}
          </Text>
          <TextInput
            placeholder={modalType === 'expense' 
              ? "e.g., Lunch, Electric Bill"
              : "e.g., Main Job, Gift Money"}
            placeholderTextColor="#99A7BC"
            value={name}
            onChangeText={(text) => {
              setName(text);
              setErrorMessage('');
            }}
            style={styles.input}
            editable={!loading}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Amount ($)</Text>
          <TextInput
            placeholder="0.00"
            placeholderTextColor="#99A7BC"
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={(text) => {
              setAmount(text);
              setErrorMessage('');
            }}
            style={styles.input}
            editable={!loading}
          />
        </View>

        {modalType === 'expense' ? (
          <>
            {/* Expense Type Selection */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Expense Type</Text>
              <View style={styles.segment}>
                {EXPENSE_TYPE_OPTIONS.map((option) => {
                  const isActive = expenseType === option.value;
                  return (
                    <Pressable
                      key={option.value}
                      style={[
                        styles.segmentOption,
                        isActive && styles.segmentOptionActive,
                      ]}
                      onPress={() => {
                        setExpenseType(option.value as SpendingService.ExpenseType);
                        setErrorMessage('');
                      }}
                      disabled={loading}
                    >
                      <Text
                        style={[
                          styles.segmentLabel,
                          isActive && styles.segmentLabelActive,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Pay From Selection */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Pay From</Text>
              <View style={styles.payFromGrid}>
                {PAY_FROM_OPTIONS.map((option) => {
                  const isActive = spendFrom === option.value;
                  return (
                    <Pressable
                      key={option.value}
                      style={[
                        styles.payFromOption,
                        isActive && styles.payFromOptionActive,
                        isActive && { borderColor: option.color },
                      ]}
                      onPress={() => {
                        setSpendFrom(option.value as SpendingService.SpendFrom);
                        setErrorMessage('');
                      }}
                      disabled={loading}
                    >
                      <Text
                        style={[
                          styles.payFromText,
                          isActive && styles.payFromTextActive,
                          isActive && { color: option.color },
                        ]}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Category Selection */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Category</Text>
              <View style={styles.categoryGrid}>
                {EXPENSE_CATEGORIES.map((cat) => {
                  const isActive = category === cat.value;
                  return (
                    <Pressable
                      key={cat.value}
                      style={[
                        styles.categoryItem,
                        isActive && styles.categoryItemActive,
                      ]}
                      onPress={() => {
                        setCategory(cat.value);
                        setErrorMessage('');
                      }}
                      disabled={loading}
                    >
                      <Text style={styles.categoryIcon}>{cat.icon}</Text>
                      <Text
                        style={[
                          styles.categoryLabel,
                          isActive && styles.categoryLabelActive,
                        ]}
                      >
                        {cat.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Note Input (Optional) */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Note (Optional)</Text>
              <TextInput
                placeholder="Add a note about this expense..."
                placeholderTextColor="#99A7BC"
                value={note}
                onChangeText={(text) => {
                  setNote(text);
                  setErrorMessage('');
                }}
                style={[styles.input, styles.textArea]}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                editable={!loading}
              />
            </View>

            {/* Created Date for One-Time Expenses */}
            {expenseType === 'one-time' && (
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Date</Text>
                {Platform.OS === 'web' ? (
                  <WebDateInput
                    value={expenseCreatedAt}
                    onChange={(date) => {
                      setExpenseCreatedAt(date);
                      setErrorMessage('');
                    }}
                    disabled={loading}
                  />
                ) : (
                  <>
                    <Pressable
                      style={styles.dateButton}
                      onPress={() => setShowExpenseCreatedAtPicker(true)}
                      disabled={loading}
                    >
                      <Text style={styles.dateButtonText}>
                        {expenseCreatedAt.toLocaleDateString()}
                      </Text>
                      <Text style={styles.dateButtonIcon}>📅</Text>
                    </Pressable>
                    {showExpenseCreatedAtPicker && (
                      <View>
                        {Platform.OS === 'ios' && (
                          <View style={styles.datePickerActions}>
                            <Pressable
                              style={styles.datePickerButton}
                              onPress={() => setShowExpenseCreatedAtPicker(false)}
                            >
                              <Text style={styles.datePickerButtonText}>Done</Text>
                            </Pressable>
                          </View>
                        )}
                        <DateTimePicker
                          value={expenseCreatedAt}
                          mode="date"
                          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                          onChange={(event, selectedDate) => {
                            if (Platform.OS === 'android') {
                              setShowExpenseCreatedAtPicker(false);
                            }
                            if (event.type === 'set' && selectedDate) {
                              setExpenseCreatedAt(selectedDate);
                              setErrorMessage('');
                            } else if (Platform.OS === 'android' && event.type === 'dismissed') {
                              setShowExpenseCreatedAtPicker(false);
                            }
                          }}
                        />
                      </View>
                    )}
                  </>
                )}
              </View>
            )}

            {/* Recurring Fields */}
            {expenseType === 'recurring' && (
              <>
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Pay Cycle</Text>
                  <View style={styles.payCycleGrid}>
                    {EXPENSE_PAY_CYCLE_OPTIONS.map((option) => {
                      const isActive = expensePayCycle === option.value;
                      return (
                        <Pressable
                          key={option.value}
                          style={[
                            styles.payCycleOption,
                            isActive && styles.payCycleOptionActive,
                          ]}
                          onPress={() => {
                            setExpensePayCycle(option.value);
                            setErrorMessage('');
                          }}
                          disabled={loading}
                        >
                          <Text
                            style={[
                              styles.payCycleText,
                              isActive && styles.payCycleTextActive,
                            ]}
                          >
                            {option.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Next Payment Date</Text>
                  {Platform.OS === 'web' ? (
                    <WebDateInput
                      value={nextPaymentDate}
                      onChange={(date) => {
                        const today = getToday();
                        const selectedDate = new Date(date);
                        selectedDate.setHours(0, 0, 0, 0);
                        if (selectedDate >= today) {
                          setNextPaymentDate(date);
                          setErrorMessage('');
                        } else {
                          setErrorMessage('Next payment date cannot be in the past');
                        }
                      }}
                      minimumDate={getToday()}
                      disabled={loading}
                    />
                  ) : (
                    <>
                      <Pressable
                        style={styles.dateButton}
                        onPress={() => setShowNextPaymentDatePicker(true)}
                        disabled={loading}
                      >
                        <Text style={styles.dateButtonText}>
                          {nextPaymentDate.toLocaleDateString()}
                        </Text>
                        <Text style={styles.dateButtonIcon}>📅</Text>
                      </Pressable>
                      {showNextPaymentDatePicker && (
                        <View>
                          {Platform.OS === 'ios' && (
                            <View style={styles.datePickerActions}>
                              <Pressable
                                style={styles.datePickerButton}
                                onPress={() => setShowNextPaymentDatePicker(false)}
                              >
                                <Text style={styles.datePickerButtonText}>Done</Text>
                              </Pressable>
                            </View>
                          )}
                          <DateTimePicker
                            value={nextPaymentDate}
                            mode="date"
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            minimumDate={getToday()}
                            onChange={(event, selectedDate) => {
                              if (Platform.OS === 'android') {
                                setShowNextPaymentDatePicker(false);
                              }
                              if (event.type === 'set' && selectedDate) {
                                const today = getToday();
                                const selectedDateOnly = new Date(selectedDate);
                                selectedDateOnly.setHours(0, 0, 0, 0);
                                if (selectedDateOnly >= today) {
                                  setNextPaymentDate(selectedDate);
                                  setErrorMessage('');
                                } else {
                                  setErrorMessage('Next payment date cannot be in the past');
                                }
                              } else if (Platform.OS === 'android' && event.type === 'dismissed') {
                                setShowNextPaymentDatePicker(false);
                              }
                            }}
                          />
                        </View>
                      )}
                    </>
                  )}
                </View>
              </>
            )}
          </>
        ) : (
          <>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Pay Cycle</Text>
              <View style={styles.payCycleGrid}>
                {PAY_CYCLE_OPTIONS.map((option) => {
                  const isActive = payCycle === option.value;
                  return (
                    <Pressable
                      key={option.value}
                      style={[
                        styles.payCycleOption,
                        isActive && styles.payCycleOptionActive,
                      ]}
                      onPress={() => {
                        setPayCycle(option.value);
                        // If one-time is selected, disable isMain
                        if (option.value === 'one-time') {
                          setIsMain(false);
                        }
                        setErrorMessage('');
                      }}
                      disabled={loading}
                    >
                      <Text
                        style={[
                          styles.payCycleText,
                          isActive && styles.payCycleTextActive,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Next Pay Date</Text>
              {Platform.OS === 'web' ? (
                <WebDateInput
                  value={nextPayDate}
                  onChange={(date) => {
                    // Ensure date is not in the past (only for non-one-time)
                    if (payCycle !== 'one-time') {
                      const today = getToday();
                      const selectedDate = new Date(date);
                      selectedDate.setHours(0, 0, 0, 0);
                      if (selectedDate >= today) {
                        setNextPayDate(date);
                        setErrorMessage('');
                      } else {
                        setErrorMessage('Next pay date cannot be in the past');
                      }
                    } else {
                      setNextPayDate(date);
                      setErrorMessage('');
                    }
                  }}
                  minimumDate={payCycle !== 'one-time' ? getToday() : undefined}
                  disabled={loading}
                />
              ) : (
                <>
                  <Pressable
                    style={styles.dateButton}
                    onPress={() => setShowNextPayDatePicker(true)}
                    disabled={loading}
                  >
                    <Text style={styles.dateButtonText}>
                      {nextPayDate.toLocaleDateString()}
                    </Text>
                    <Text style={styles.dateButtonIcon}>📅</Text>
                  </Pressable>
                  {showNextPayDatePicker && (
                    <View>
                      {Platform.OS === 'ios' && (
                        <View style={styles.datePickerActions}>
                          <Pressable
                            style={styles.datePickerButton}
                            onPress={() => setShowNextPayDatePicker(false)}
                          >
                            <Text style={styles.datePickerButtonText}>Done</Text>
                          </Pressable>
                        </View>
                      )}
                      <DateTimePicker
                        value={nextPayDate}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        minimumDate={payCycle !== 'one-time' ? getToday() : undefined}
                        onChange={(event, selectedDate) => {
                          if (Platform.OS === 'android') {
                            setShowNextPayDatePicker(false);
                          }
                          if (event.type === 'set' && selectedDate) {
                            // Ensure date is not in the past (only for non-one-time)
                            if (payCycle !== 'one-time') {
                              const today = getToday();
                              const selectedDateOnly = new Date(selectedDate);
                              selectedDateOnly.setHours(0, 0, 0, 0);
                              if (selectedDateOnly >= today) {
                                setNextPayDate(selectedDate);
                                setErrorMessage('');
                              } else {
                                setErrorMessage('Next pay date cannot be in the past');
                              }
                            } else {
                              setNextPayDate(selectedDate);
                              setErrorMessage('');
                            }
                          } else if (Platform.OS === 'android' && event.type === 'dismissed') {
                            setShowNextPayDatePicker(false);
                          }
                        }}
                      />
                    </View>
                  )}
                </>
              )}
            </View>

            {payCycle !== 'one-time' && (
              <View style={styles.field}>
                <View style={styles.switchContainer}>
                  <View style={styles.switchLabelContainer}>
                    <Text style={styles.switchLabel}>Set as my main income</Text>
                    <Text style={styles.switchHint}>
                      Your main income determines your budgeting cycle
                    </Text>
                  </View>
                  <Switch
                    value={isMain}
                    onValueChange={(value) => {
                      setIsMain(value);
                      setErrorMessage('');
                    }}
                    disabled={loading}
                    trackColor={{ false: '#D3DFF4', true: '#12B76A' }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              </View>
            )}

            {payCycle === 'one-time' && (
              <View style={styles.infoBox}>
                <Text style={styles.infoText}>
                  ℹ️ One-time income cannot be set as main income
                </Text>
              </View>
            )}
          </>
        )}

        <Pressable
          style={[
            styles.submitButton,
            (loading || (!name.trim() || !amount || parseFloat(amount) <= 0 || 
              (modalType === 'expense' && (
                !spendFrom || 
                !category ||
                (expenseType === 'recurring' && (!expensePayCycle || !nextPaymentDate))
              )))) &&
            styles.submitButtonDisabled
          ]}
          onPress={handleSubmit}
          disabled={
            loading ||
            !name.trim() ||
            !amount ||
            parseFloat(amount) <= 0 ||
            (modalType === 'expense' && (
              !spendFrom || 
              !category ||
              (expenseType === 'recurring' && (!expensePayCycle || !nextPaymentDate))
            ))
          }
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitText}>
              {modalType === 'expense' ? 'Add Expense' : 'Add Income'}
            </Text>
          )}
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
    minWidth: 100,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderWidth: 2,
    borderColor: '#D3DFF4',
  },
  categoryItemActive: {
    borderColor: '#22B15C',
    backgroundColor: '#ECFDF5',
    shadowColor: '#C6F0D8',
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  categoryIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  categoryLabel: {
    fontSize: 13,
    color: '#6E7A90',
    fontWeight: '600',
    textAlign: 'center',
  },
  categoryLabelActive: {
    color: '#22B15C',
    fontWeight: '700',
  },
  payFromGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  payFromOption: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#D3DFF4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  payFromOptionActive: {
    backgroundColor: '#F8F9FF',
    shadowColor: '#AFC7FF',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  payFromText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6E7A90',
  },
  payFromTextActive: {
    fontWeight: '700',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#E8F1FF',
    borderRadius: 20,
    padding: 4,
    gap: 4,
  },
  toggleButton: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  toggleButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#AFC7FF',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6E7A90',
  },
  toggleButtonTextActive: {
    color: '#1C2533',
    fontWeight: '700',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 16,
    paddingBottom: 16,
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
  submitButtonDisabled: {
    opacity: 0.6,
  },
  errorContainer: {
    backgroundColor: '#FFE6E9',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#FFB3BA',
  },
  errorText: {
    color: '#D63A4A',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  payCycleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  payCycleOption: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D3DFF4',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  payCycleOptionActive: {
    borderColor: '#22B15C',
    backgroundColor: '#ECFDF5',
  },
  payCycleText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6E7A90',
  },
  payCycleTextActive: {
    color: '#22B15C',
    fontWeight: '600',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D3DFF4',
  },
  switchLabelContainer: {
    flex: 1,
    gap: 4,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C2533',
  },
  switchHint: {
    fontSize: 12,
    color: '#6E7A90',
  },
  infoBox: {
    backgroundColor: '#E8F1FF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#D3DFF4',
  },
  infoText: {
    fontSize: 12,
    color: '#6E7A90',
    textAlign: 'center',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#D3DFF4',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#1C2533',
    fontWeight: '500',
  },
  dateButtonIcon: {
    fontSize: 20,
  },
  datePickerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  datePickerButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#22B15C',
  },
  datePickerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  webDateInputContainer: {
    minHeight: 52,
    width: '100%',
  },
  inputDisabled: {
    opacity: 0.6,
    backgroundColor: '#F5F5F5',
  },
});
