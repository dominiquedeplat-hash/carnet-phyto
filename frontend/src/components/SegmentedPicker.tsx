import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { colors, radius, sizes, typography } from '../theme';

interface Option<T extends string> {
  value: T;
  label: string;
  color?: string;
}

interface Props<T extends string> {
  label?: string;
  value: T;
  onChange: (v: T) => void;
  options: Option<T>[];
  testID?: string;
}

export default function SegmentedPicker<T extends string>({
  label,
  value,
  onChange,
  options,
  testID,
}: Props<T>) {
  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
        testID={testID}
      >
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <TouchableOpacity
              key={opt.value}
              testID={`${testID}-${opt.value}`}
              onPress={() => onChange(opt.value)}
              activeOpacity={0.8}
              style={[
                styles.pill,
                active && {
                  backgroundColor: opt.color ?? colors.primary,
                  borderColor: opt.color ?? colors.primary,
                },
              ]}
            >
              <Text
                style={[
                  styles.pillText,
                  active && { color: colors.textInverse },
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 14 },
  label: {
    ...typography.small,
    color: colors.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: { gap: 8, paddingVertical: 2 },
  pill: {
    minHeight: 48,
    paddingHorizontal: 18,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  pillText: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
});
