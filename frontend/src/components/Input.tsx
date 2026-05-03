import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { colors, radius, sizes, typography } from '../theme';

interface Props extends TextInputProps {
  label?: string;
  error?: string;
  suffix?: string;
  testID?: string;
}

export default function Input({ label, error, suffix, style, testID, ...rest }: Props) {
  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.inputWrap, !!error && styles.error]}>
        <TextInput
          testID={testID}
          placeholderTextColor={colors.textMuted}
          style={[styles.input, style]}
          {...rest}
        />
        {suffix ? <Text style={styles.suffix}>{suffix}</Text> : null}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
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
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.lg,
    minHeight: sizes.touch,
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    ...typography.bodyBold,
    color: colors.textPrimary,
    paddingVertical: 12,
  },
  suffix: {
    ...typography.bodyBold,
    color: colors.textMuted,
    marginLeft: 6,
  },
  error: { borderColor: colors.destructive },
  errorText: {
    ...typography.small,
    color: colors.destructive,
    marginTop: 4,
  },
});
