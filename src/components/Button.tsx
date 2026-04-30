import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Radius, Spacing, Typography } from '../constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost' | 'neutral';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export default function Button({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  style,
  textStyle,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.85}
        style={[styles.base, isDisabled && styles.disabled, style]}
      >
        <LinearGradient
          colors={[Colors.teal500, Colors.teal700]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          {loading ? (
            <ActivityIndicator color={Colors.white} size="small" />
          ) : (
            <Text style={[styles.textPrimary, textStyle]}>{title}</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  if (variant === 'secondary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.8}
        style={[styles.base, styles.secondary, isDisabled && styles.disabled, style]}
      >
        {loading ? (
          <ActivityIndicator color={Colors.teal700} size="small" />
        ) : (
          <Text style={[styles.textSecondary, textStyle]}>{title}</Text>
        )}
      </TouchableOpacity>
    );
  }

  // ghost
  if (variant === 'ghost') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.7}
        style={[styles.ghost, isDisabled && styles.disabled, style]}
      >
        <Text style={[styles.textGhost, textStyle]}>{title}</Text>
      </TouchableOpacity>
    );
  }

  // neutral
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      style={[styles.base, styles.neutral, isDisabled && styles.disabled, style]}
    >
      <Text style={[styles.textNeutral, textStyle]}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  gradient: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  secondary: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.teal50,
    borderWidth: 1.5,
    borderColor: Colors.teal300,
  },
  ghost: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
  },
  disabled: {
    opacity: 0.5,
  },
  textPrimary: {
    color: Colors.white,
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
    letterSpacing: 0.3,
  },
  textSecondary: {
    color: Colors.teal700,
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
  },
  textGhost: {
    color: Colors.teal600,
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
  },
  neutral: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
  },
  textNeutral: {
    color: Colors.muted,
    fontSize: Typography.base,
    fontWeight: Typography.medium,
  },
});
