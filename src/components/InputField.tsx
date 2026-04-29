import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Colors, Radius, Spacing, Typography } from '../constants/theme';

interface InputFieldProps extends TextInputProps {
  label: string;
  hint?: string;
  prefix?: string;
  suffix?: string;
  error?: string;
}

export default function InputField({
  label,
  hint,
  prefix,
  suffix,
  error,
  style,
  ...props
}: InputFieldProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}

      <View
        style={[
          styles.row,
          focused && styles.rowFocused,
          error ? styles.rowError : null,
        ]}
      >
        {prefix ? <Text style={styles.adornment}>{prefix}</Text> : null}
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={Colors.subtle}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />
        {suffix ? <Text style={styles.adornment}>{suffix}</Text> : null}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  hint: {
    fontSize: Typography.xs,
    color: Colors.muted,
    marginBottom: Spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    height: 48,
  },
  rowFocused: {
    borderColor: Colors.teal500,
  },
  rowError: {
    borderColor: Colors.danger,
  },
  input: {
    flex: 1,
    fontSize: Typography.base,
    color: Colors.text,
    paddingVertical: 0,
  },
  adornment: {
    fontSize: Typography.base,
    color: Colors.muted,
    marginHorizontal: Spacing.xs,
  },
  error: {
    fontSize: Typography.xs,
    color: Colors.danger,
    marginTop: Spacing.xs,
  },
});
