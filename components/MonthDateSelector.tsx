import React, { useState, useEffect } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

interface MonthDateSelectorProps {
  value: number | null;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export function MonthDateSelector({ value, onChange, disabled = false }: MonthDateSelectorProps) {
  const [inputValue, setInputValue] = useState(value?.toString() || '');

  const handleChange = (text: string) => {
    // Only allow numbers
    const numericValue = text.replace(/[^0-9]/g, '');
    setInputValue(numericValue);
    
    if (numericValue) {
      const num = parseInt(numericValue, 10);
      if (num >= 1 && num <= 28) {
        onChange(num);
      } else if (num > 28) {
        // If exceeds 28, set to 28
        setInputValue('28');
        onChange(28);
      } else if (num === 0) {
        // If 0, clear
        setInputValue('');
      }
    } else {
      // Allow empty input temporarily, but don't call onChange with null
      // onChange will be called on blur if invalid
    }
  };

  const handleBlur = () => {
    // Validate on blur
    if (inputValue) {
      const num = parseInt(inputValue, 10);
      if (num >= 1 && num <= 28) {
        setInputValue(num.toString());
        onChange(num);
      } else if (num > 28) {
        setInputValue('28');
        onChange(28);
      } else {
        // Invalid, reset to previous value or empty
        setInputValue(value?.toString() || '');
      }
    } else {
      // If empty on blur and value exists, restore it
      if (value !== null && value !== undefined) {
        setInputValue(value.toString());
      }
    }
  };

  // Sync inputValue with value prop when it changes externally
  useEffect(() => {
    if (value !== null && value !== undefined) {
      setInputValue(value.toString());
    } else {
      setInputValue('');
    }
  }, [value]);

  // Quick selection buttons for common dates
  const quickDates = [1, 5, 10, 15, 20, 28];

  return (
    <View style={styles.container}>
      <TextInput
        style={[
          styles.input,
          !value && styles.inputEmpty,
          disabled && styles.inputDisabled,
        ]}
        placeholder="Select date (1-28)"
        placeholderTextColor="#99A7BC"
        value={inputValue}
        onChangeText={handleChange}
        onBlur={handleBlur}
        keyboardType="number-pad"
        maxLength={2}
        editable={!disabled}
      />
      <View style={styles.quickSelect}>
        <Text style={styles.quickSelectLabel}>Quick select:</Text>
        <View style={styles.quickSelectButtons}>
          {quickDates.map((date) => {
            const isSelected = value === date;
            return (
              <Pressable
                key={date}
                style={[
                  styles.quickButton,
                  isSelected && styles.quickButtonSelected,
                  disabled && styles.quickButtonDisabled,
                ]}
                onPress={() => !disabled && onChange(date)}
                disabled={disabled}
              >
                <Text
                  style={[
                    styles.quickButtonText,
                    isSelected && styles.quickButtonTextSelected,
                  ]}
                >
                  {date}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      {value && (
        <Text style={styles.hint}>
          Selected: {value} of each month
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    gap: 12,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 16,
    color: '#1B1B33',
    borderWidth: 2,
    borderColor: '#D3DFF4',
    textAlign: 'center',
  },
  inputEmpty: {
    borderColor: '#D3DFF4',
  },
  inputDisabled: {
    opacity: 0.5,
    backgroundColor: '#F5F7FA',
  },
  quickSelect: {
    gap: 8,
  },
  quickSelectLabel: {
    fontSize: 12,
    color: '#6F7C8E',
    fontWeight: '500',
  },
  quickSelectButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D3DFF4',
    backgroundColor: '#FFFFFF',
  },
  quickButtonSelected: {
    borderColor: '#12B76A',
    backgroundColor: '#ECFDF5',
  },
  quickButtonDisabled: {
    opacity: 0.5,
  },
  quickButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6F7C8E',
  },
  quickButtonTextSelected: {
    color: '#12B76A',
    fontWeight: '600',
  },
  hint: {
    fontSize: 12,
    color: '#12B76A',
    textAlign: 'center',
    fontWeight: '500',
  },
});

