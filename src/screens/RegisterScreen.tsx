import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
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

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

export default function RegisterScreen({ navigation }: Props) {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!name.trim() || !email.trim() || !password || !confirm) {
      Alert.alert('Campos obrigatórios', 'Preencha todos os campos.');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Senhas diferentes', 'As senhas não coincidem.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Senha fraca', 'A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    setLoading(true);
    try {
      await register({ name: name.trim(), email: email.trim().toLowerCase(), password });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Erro inesperado.';
      Alert.alert('Erro ao criar conta', message);
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
          <View style={styles.logoArea}>
            <CpodLogo size={100} variant="full" />
            <Text style={styles.subtitle}>Criar conta gratuita</Text>
          </View>

          <View style={styles.card}>
            <InputField
              label="Nome"
              placeholder="Seu nome"
              autoComplete="name"
              textContentType="name"
              value={name}
              onChangeText={setName}
            />
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
              placeholder="Mínimo 6 caracteres"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            <InputField
              label="Confirmar senha"
              placeholder="Repita a senha"
              secureTextEntry
              value={confirm}
              onChangeText={setConfirm}
            />
            <Button title="Criar conta" onPress={handleRegister} loading={loading} />
          </View>

          <View style={styles.benefitBox}>
            <Text style={styles.benefitTitle}>O que você ganha criando conta:</Text>
            {['Salve até 10 simulações no histórico', 'Acesse de qualquer dispositivo', 'Funcionalidades exclusivas em breve'].map((b) => (
              <Text key={b} style={styles.benefitItem}>✓  {b}</Text>
            ))}
          </View>

          <Button
            title="Já tenho conta — Entrar"
            variant="ghost"
            onPress={() => navigation.navigate('Login')}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl,
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
  benefitBox: {
    backgroundColor: Colors.teal50,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  benefitTitle: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    color: Colors.teal700,
    marginBottom: Spacing.sm,
  },
  benefitItem: {
    fontSize: Typography.sm,
    color: Colors.teal600,
    lineHeight: 22,
  },
});
