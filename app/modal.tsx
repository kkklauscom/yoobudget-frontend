import { useRouter } from 'expo-router';
import React, { useState, useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import * as IncomeService from '@/services/income';
import type { IncomeType, Frequency } from '@/services/income';

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

  // For Web, use TextInput and modify it to be a date input
  if (Platform.OS === 'web') {
    useEffect(() => {
      if (inputRef.current && typeof document !== 'undefined') {
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
          } catch (e) {
            // Fallback if setNativeProps doesn't work
            console.log('setNativeProps not supported');
          }
        }
      }
    }, [value, minimumDate, maximumDate, disabled]);

    // Use TextInput - on Web it renders as HTML input
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
        type={Platform.OS === 'web' ? 'date' : undefined}
        min={Platform.OS === 'web' ? formatMinDate(minimumDate) : undefined}
        max={Platform.OS === 'web' ? formatMaxDate(maximumDate) : undefined}
      />
    );
  }

  return null;
};

const FREQUENCY_OPTIONS: { label: string; value: Frequency }[] = [
  { label: 'Weekly', value: 'weekly' },
  { label: 'Fortnightly', value: 'fortnightly' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Yearly', value: 'yearly' },
];

export default function ModalScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  // Get today's date at midnight to ensure we can select today
  const getToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  };
  
  const [incomeType, setIncomeType] = useState<IncomeType>('recurring');
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<Frequency>('monthly');
  const [isFirstPayDay, setIsFirstPayDay] = useState(true);
  const [nextPayDate, setNextPayDate] = useState(getToday());
  const [lastPayDate, setLastPayDate] = useState<Date | null>(null);
  const [oneTimeDate, setOneTimeDate] = useState(getToday());
  
  // Date picker states
  const [showNextPayDatePicker, setShowNextPayDatePicker] = useState(false);
  const [showLastPayDatePicker, setShowLastPayDatePicker] = useState(false);
  const [showOneTimeDatePicker, setShowOneTimeDatePicker] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

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
    if (!amount || parseFloat(amount) <= 0) {
      showAlert('Error', 'Please enter a valid amount');
      return;
    }

    // Validate next pay date is not in the past
    const today = getToday();
    if (incomeType === 'recurring') {
      const nextPayDateOnly = new Date(nextPayDate);
      nextPayDateOnly.setHours(0, 0, 0, 0);
      if (nextPayDateOnly < today) {
        showAlert('Error', 'Next pay date cannot be in the past');
        return;
      }
    }

    if (incomeType === 'recurring' && !isFirstPayDay && !lastPayDate) {
      showAlert('Error', 'Please select last pay date');
      return;
    }

    if (incomeType === 'recurring' && !isFirstPayDay && lastPayDate && nextPayDate <= lastPayDate) {
      showAlert('Error', 'Next pay date must be later than last pay date');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      if (incomeType === 'recurring') {
        const data: IncomeService.CreateRecurringIncomeData = {
          type: 'recurring',
          name: name || undefined,
          amount: parseFloat(amount),
          frequency,
          isFirstPayDay,
          nextPayDate: formatDate(nextPayDate),
          lastPayDate: isFirstPayDay ? null : (lastPayDate ? formatDate(lastPayDate) : null),
        };
        await IncomeService.createIncome(data);
      } else {
        const data: IncomeService.CreateOneTimeIncomeData = {
          type: 'one-time',
          name: name || undefined,
          amount: parseFloat(amount),
          oneTimeDate: formatDate(oneTimeDate),
        };
        await IncomeService.createIncome(data);
      }

      // Success - go back to home
      router.back();
    } catch (error: any) {
      const errorMsg = error?.message || 'Failed to create income';
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
          <Text style={styles.title}>Add Income</Text>
        </View>

        <Text style={styles.description}>
          Record a one-time or recurring income
        </Text>

        {errorMessage ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        <View style={styles.segment}>
          <Pressable
            style={[
              styles.segmentOption,
              incomeType === 'recurring' && styles.segmentOptionActive,
            ]}
            onPress={() => {
              setIncomeType('recurring');
              setErrorMessage('');
            }}
          >
            <Text
              style={[
                styles.segmentLabel,
                incomeType === 'recurring' && styles.segmentLabelActive,
              ]}
            >
              Recurring
            </Text>
            <Text style={styles.segmentCaption}>Regular income</Text>
          </Pressable>
          <Pressable
            style={[
              styles.segmentOption,
              incomeType === 'one-time' && styles.segmentOptionActive,
            ]}
            onPress={() => {
              setIncomeType('one-time');
              setErrorMessage('');
            }}
          >
            <Text
              style={[
                styles.segmentLabel,
                incomeType === 'one-time' && styles.segmentLabelActive,
              ]}
            >
              One-Time
            </Text>
            <Text style={styles.segmentCaption}>Single income</Text>
          </Pressable>
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Income Name (Optional)</Text>
          <TextInput
            placeholder="e.g., Main Job, Gift Money"
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

        {incomeType === 'recurring' ? (
          <>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Frequency</Text>
              <View style={styles.frequencyGrid}>
                {FREQUENCY_OPTIONS.map((option) => {
                  const isActive = frequency === option.value;
                  return (
                    <Pressable
                      key={option.value}
                      style={[
                        styles.frequencyOption,
                        isActive && styles.frequencyOptionActive,
                      ]}
                      onPress={() => {
                        setFrequency(option.value);
                        setErrorMessage('');
                      }}
                      disabled={loading}
                    >
                      <Text
                        style={[
                          styles.frequencyText,
                          isActive && styles.frequencyTextActive,
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
              <View style={styles.checkboxContainer}>
                <Pressable
                  style={styles.checkbox}
                  onPress={() => {
                    setIsFirstPayDay(!isFirstPayDay);
                    if (!isFirstPayDay) {
                      setLastPayDate(null);
                    }
                    setErrorMessage('');
                  }}
                  disabled={loading}
                >
                  <View
                    style={[
                      styles.checkboxBox,
                      isFirstPayDay && styles.checkboxBoxChecked,
                    ]}
                  >
                    {isFirstPayDay && (
                      <Text style={styles.checkboxCheckmark}>✓</Text>
                    )}
                  </View>
                  <Text style={styles.checkboxLabel}>
                    This is the first payday
                  </Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Next Pay Date</Text>
              {Platform.OS === 'web' ? (
                <WebDateInput
                  value={nextPayDate}
                  onChange={(date) => {
                    // Ensure date is not in the past
                    const today = getToday();
                    const selectedDate = new Date(date);
                    selectedDate.setHours(0, 0, 0, 0);
                    if (selectedDate >= today) {
                      setNextPayDate(date);
                      setErrorMessage('');
                    } else {
                      setErrorMessage('Next pay date cannot be in the past');
                    }
                  }}
                  minimumDate={getToday()}
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
                        minimumDate={getToday()}
                        onChange={(event, selectedDate) => {
                          if (Platform.OS === 'android') {
                            setShowNextPayDatePicker(false);
                          }
                          if (event.type === 'set' && selectedDate) {
                            // Ensure date is not in the past
                            const today = getToday();
                            const selectedDateOnly = new Date(selectedDate);
                            selectedDateOnly.setHours(0, 0, 0, 0);
                            if (selectedDateOnly >= today) {
                              setNextPayDate(selectedDate);
                              setErrorMessage('');
                            } else {
                              setErrorMessage('Next pay date cannot be in the past');
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

            {!isFirstPayDay && (
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Last Pay Date</Text>
                {Platform.OS === 'web' ? (
                  <WebDateInput
                    value={lastPayDate || new Date()}
                    onChange={(date) => {
                      setLastPayDate(date);
                      setErrorMessage('');
                    }}
                    maximumDate={nextPayDate}
                    disabled={loading}
                  />
                ) : (
                  <>
                    <Pressable
                      style={styles.dateButton}
                      onPress={() => setShowLastPayDatePicker(true)}
                      disabled={loading}
                    >
                      <Text style={styles.dateButtonText}>
                        {lastPayDate
                          ? lastPayDate.toLocaleDateString()
                          : 'Select last pay date'}
                      </Text>
                      <Text style={styles.dateButtonIcon}>📅</Text>
                    </Pressable>
                    {showLastPayDatePicker && (
                      <View>
                        {Platform.OS === 'ios' && (
                          <View style={styles.datePickerActions}>
                            <Pressable
                              style={styles.datePickerButton}
                              onPress={() => setShowLastPayDatePicker(false)}
                            >
                              <Text style={styles.datePickerButtonText}>Done</Text>
                            </Pressable>
                          </View>
                        )}
                        <DateTimePicker
                          value={lastPayDate || new Date()}
                          mode="date"
                          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                          onChange={(event, selectedDate) => {
                            if (Platform.OS === 'android') {
                              setShowLastPayDatePicker(false);
                            }
                            if (event.type === 'set' && selectedDate) {
                              setLastPayDate(selectedDate);
                              setErrorMessage('');
                            } else if (Platform.OS === 'android' && event.type === 'dismissed') {
                              setShowLastPayDatePicker(false);
                            }
                          }}
                          maximumDate={nextPayDate}
                        />
                      </View>
                    )}
                  </>
                )}
              </View>
            )}
          </>
        ) : (
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Income Date</Text>
            {Platform.OS === 'web' ? (
              <WebDateInput
                value={oneTimeDate}
                onChange={(date) => {
                  setOneTimeDate(date);
                  setErrorMessage('');
                }}
                disabled={loading}
              />
            ) : (
              <>
                <Pressable
                  style={styles.dateButton}
                  onPress={() => setShowOneTimeDatePicker(true)}
                  disabled={loading}
                >
                  <Text style={styles.dateButtonText}>
                    {oneTimeDate.toLocaleDateString()}
                  </Text>
                  <Text style={styles.dateButtonIcon}>📅</Text>
                </Pressable>
                {showOneTimeDatePicker && (
                  <View>
                    {Platform.OS === 'ios' && (
                      <View style={styles.datePickerActions}>
                        <Pressable
                          style={styles.datePickerButton}
                          onPress={() => setShowOneTimeDatePicker(false)}
                        >
                          <Text style={styles.datePickerButtonText}>Done</Text>
                        </Pressable>
                      </View>
                    )}
                    <DateTimePicker
                      value={oneTimeDate}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={(event, selectedDate) => {
                        if (Platform.OS === 'android') {
                          setShowOneTimeDatePicker(false);
                        }
                        if (event.type === 'set' && selectedDate) {
                          setOneTimeDate(selectedDate);
                          setErrorMessage('');
                        } else if (Platform.OS === 'android' && event.type === 'dismissed') {
                          setShowOneTimeDatePicker(false);
                        }
                      }}
                    />
                  </View>
                )}
              </>
            )}
          </View>
        )}

        <Pressable
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitText}>
              Add Income ({incomeType === 'one-time' ? 'One-Time' : 'Recurring'})
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
  frequencyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  frequencyOption: {
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
  frequencyOptionActive: {
    borderColor: '#22B15C',
    backgroundColor: '#ECFDF5',
  },
  frequencyText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6E7A90',
  },
  frequencyTextActive: {
    color: '#22B15C',
    fontWeight: '600',
  },
  checkboxContainer: {
    marginTop: 8,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkboxBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D3DFF4',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxBoxChecked: {
    borderColor: '#22B15C',
    backgroundColor: '#22B15C',
  },
  checkboxCheckmark: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  checkboxLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1C2533',
    flex: 1,
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
