import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Radius, Shadow, Spacing, Typography } from '../constants/theme';

interface ResultRowProps {
  label: string;
  value: string;
  valueAlt?: string;
  accent?: 'success' | 'warning' | 'danger' | 'info' | 'default';
}

interface ResultCardProps {
  title?: string;
  rows: ResultRowProps[];
  headers?: [string, string, string];
  style?: ViewStyle;
}

const accentColor: Record<string, string> = {
  success: Colors.success,
  warning: Colors.warning,
  danger: Colors.danger,
  info: Colors.info,
  default: Colors.text,
};

const hasThreeColumns = (rows: ResultRowProps[]) => rows.some((r) => r.valueAlt !== undefined);

export default function ResultCard({ title, rows, headers, style }: ResultCardProps) {
  const threeCol = hasThreeColumns(rows);
  return (
    <View style={[styles.card, style]}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {threeCol && headers && (
        <View style={[styles.row, styles.headerRow]}>
          <Text style={[styles.colLabel, styles.headerText]}>{headers[0]}</Text>
          <Text style={[styles.colValue, styles.headerText]}>{headers[1]}</Text>
          <Text style={[styles.colValue, styles.headerText]}>{headers[2]}</Text>
        </View>
      )}
      {rows.map((row, i) => (
        <View key={i} style={[styles.row, i < rows.length - 1 && styles.rowBorder]}>
          <Text style={threeCol ? styles.colLabel : styles.label}>{row.label}</Text>
          {threeCol ? (
            <>
              <Text style={[styles.colValue, { color: accentColor[row.accent ?? 'default'] }]}>
                {row.value}
              </Text>
              <Text style={[styles.colValue, styles.colTotal, { color: accentColor[row.accent ?? 'default'] }]}>
                {row.valueAlt ?? '—'}
              </Text>
            </>
          ) : (
            <Text style={[styles.value, { color: accentColor[row.accent ?? 'default'] }]}>
              {row.value}
            </Text>
          )}
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
  headerRow: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingBottom: Spacing.xs,
    marginBottom: 2,
  },
  headerText: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    color: Colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  // 2-column (original)
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
  // 3-column
  colLabel: {
    flex: 2,
    fontSize: Typography.sm,
    color: Colors.muted,
  },
  colValue: {
    flex: 1.4,
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    textAlign: 'right',
  },
  colTotal: {
    color: Colors.text,
  },
});
