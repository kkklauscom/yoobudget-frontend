import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface WeekdaySelectorProps {
  value: number | null;
  onChange: (value: number) => void;
  disabled?: boolean;
}

const WEEKDAYS = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

export function WeekdaySelector({ value, onChange, disabled = false }: WeekdaySelectorProps) {
  return (
    <View style={styles.container}>
      {WEEKDAYS.map((day) => {
        const isSelected = value === day.value;
        return (
          <Pressable
            key={day.value}
            style={[
              styles.option,
              isSelected && styles.optionSelected,
              disabled && styles.optionDisabled,
            ]}
            onPress={() => !disabled && onChange(day.value)}
            disabled={disabled}
          >
            <Text
              style={[
                styles.optionText,
                isSelected && styles.optionTextSelected,
              ]}
            >
              {day.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  option: {
    flex: 1,
    minWidth: '30%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D3DFF4',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionSelected: {
    borderColor: '#12B76A',
    backgroundColor: '#ECFDF5',
  },
  optionDisabled: {
    opacity: 0.5,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6F7C8E',
  },
  optionTextSelected: {
    color: '#12B76A',
    fontWeight: '600',
  },
});

