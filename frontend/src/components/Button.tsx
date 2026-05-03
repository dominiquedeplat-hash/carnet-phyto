import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  GestureResponderEvent,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors, radius, sizes, typography } from '../theme';

interface Props {
  title: string;
  onPress: (e: GestureResponderEvent) => void;
  variant?: 'primary' | 'secondary' | 'destructive';
  icon?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  testID?: string;
  compact?: boolean;
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  loading = false,
  disabled = false,
  style,
  textStyle,
  testID,
  compact = false,
}: Props) {
  const bg =
    variant === 'primary'
      ? colors.primary
      : variant === 'destructive'
      ? colors.destructive
      : colors.bgSubtle;
  const fg =
    variant === 'secondary' ? colors.textPrimary : colors.textInverse;

  return (
    <TouchableOpacity
      testID={testID}
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.btn,
        { backgroundColor: bg, minHeight: compact ? 44 : sizes.touch },
        variant === 'secondary' && styles.secondaryBorder,
        (disabled || loading) && { opacity: 0.6 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {icon ? <View style={styles.iconWrap}>{icon}</View> : null}
          <Text style={[styles.text, { color: fg }, textStyle]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    borderRadius: radius.lg,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBorder: {
    borderWidth: 2,
    borderColor: colors.borderLight,
  },
  text: {
    ...typography.bodyBold,
    fontSize: 16,
  },
  iconWrap: {
    marginRight: 8,
  },
});
