import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Radius, Shadow, Spacing, Typography } from '../constants/theme';

interface ResultRowProps {
  label: string;
  value: string;
  accent?: 'success' | 'warning' | 'danger' | 'info' | 'default';
}

interface ResultCardProps {
  title?: string;
  rows: ResultRowProps[];
  style?: ViewStyle;
}

const accentColor: Record<string, string> = {
  success: Colors.success,
  warning: Colors.warning,
  danger: Colors.danger,
  info: Colors.info,
  default: Colors.text,
};

export default function ResultCard({ title, rows, style }: ResultCardProps) {
  return (
    <View style={[styles.card, style]}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {rows.map((row, i) => (
        <View key={i} style={[styles.row, i < rows.length - 1 && styles.rowBorder]}>
          <Text style={styles.label}>{row.label}</Text>
          <Text
            style={[
              styles.value,
              { color: accentColor[row.accent ?? 'default'] },
            ]}
          >
            {row.value}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    ...Shadow.card,
  },
  title: {
    fontSize: Typography.md,
    fontWeight: Typography.semibold,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  label: {
    fontSize: Typography.sm,
    color: Colors.muted,
    flex: 1,
  },
  value: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
    textAlign: 'right',
  },
});
