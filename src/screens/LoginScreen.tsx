import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import CpodLogo from '../components/CpodLogo';
import InputField from '../components/InputField';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { Colors, Radius, Shadow, Spacing, Typography } from '../constants/theme';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password) {
      Alert.alert('Campos obrigatórios', 'Preencha e-mail e senha.');
      return;
    }
    setLoading(true);
    try {
      await login({ email: email.trim().toLowerCase(), password });
      // Navegação é tratada pelo Navigator após isAuthenticated mudar
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Erro inesperado.';
      Alert.alert('Erro ao entrar', message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <View style={styles.logoArea}>
            <CpodLogo size={120} variant="full" />
            <Text style={styles.subtitle}>Acesse sua conta</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <InputField
              label="E-mail"
              placeholder="seu@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              value={email}
              onChangeText={setEmail}
            />
            <InputField
              label="Senha"
              placeholder="••••••••"
              secureTextEntry
              autoComplete="password"
              textContentType="password"
              value={password}
              onChangeText={setPassword}
            />
            <Button title="Entrar" onPress={handleLogin} loading={loading} />

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>ou</Text>
              <View style={styles.dividerLine} />
            </View>

            <Button
              title="Criar conta gratuita"
              variant="secondary"
              onPress={() => navigation.navigate('Register')}
            />
          </View>

          {/* Demo hint */}
          <View style={styles.hint}>
            <Text style={styles.hintText}>
              Conta demo: <Text style={styles.hintCode}>demo@cpod.com.br</Text> / <Text style={styles.hintCode}>demo1234</Text>
            </Text>
          </View>

          <Button
            title="Continuar sem conta"
            variant="ghost"
            onPress={() => navigation.navigate('Main')}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.teal900 },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl,
    backgroundColor: Colors.bg,
  },
  logoArea: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  subtitle: {
    marginTop: Spacing.md,
    fontSize: Typography.lg,
    fontWeight: Typography.semibold,
    color: Colors.text,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadow.card,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.md,
    gap: Spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    fontSize: Typography.sm,
    color: Colors.muted,
  },
  hint: {
    backgroundColor: Colors.teal50,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    alignItems: 'center',
  },
  hintText: {
    fontSize: Typography.xs,
    color: Colors.muted,
  },
  hintCode: {
    fontWeight: Typography.semibold,
    color: Colors.teal700,
  },
});
