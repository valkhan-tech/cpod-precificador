import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import InputField from '../components/InputField';
import { joinWaitlist } from '../services/api';
import { Colors, Radius, Shadow, Spacing, Typography } from '../constants/theme';
import { RootStackParamList } from '../navigation/types';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

const BENEFICIOS = [
  { icon: '🛍️', titulo: 'Grupo de Compra', desc: 'Rateie frete entre produtos e calcule rentabilidade da compra.' },
  { icon: '⚡', titulo: 'Equipes Salvas', desc: 'Salve e carregue equipes na calculadora de Serviços.' },
  { icon: '⚙️', titulo: 'Valores Padrão', desc: 'Configure os valores iniciais de cada calculadora.' },
  { icon: '💾', titulo: 'Histórico Ilimitado', desc: 'Salve quantas simulações quiser na nuvem.' },
  { icon: '📊', titulo: 'Relatórios', desc: 'Exporte e compare simulações (em breve).' },
  { icon: '🔄', titulo: 'Sincronização', desc: 'Acesse seus dados em qualquer dispositivo.' },
];

const PRECOS = [9.9, 19.9, 29.9];

function fmt(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}

export default function PremiumScreen() {
  const navigation = useNavigation<NavProp>();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [precoSelecionado, setPrecoSelecionado] = useState<number>(PRECOS[1]);
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);

  function validar(): string | null {
    if (!nome.trim()) return 'Informe seu nome.';
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return 'Informe um e-mail válido.';
    return null;
  }

  async function handleEnviar() {
    const erro = validar();
    if (erro) {
      Alert.alert('Verifique os dados', erro);
      return;
    }

    setLoading(true);
    try {
      await joinWaitlist({ name: nome.trim(), email: email.trim(), price: precoSelecionado });
      setEnviado(true);
    } catch (e: unknown) {
      Alert.alert('Erro', 'Não foi possível enviar seu cadastro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.fill}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <LinearGradient colors={[Colors.teal900, Colors.teal700]} style={styles.hero}>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <Text style={styles.backBtnText}>← Voltar</Text>
            </TouchableOpacity>

            <Text style={styles.crownEmoji}>👑</Text>
            <Text style={styles.heroTitle}>cPod Premium</Text>
            <Text style={styles.heroSub}>
              Acesso completo a todas as ferramentas para precificar com mais precisão e eficiência.
            </Text>
          </LinearGradient>

          {/* Benefícios */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>O que você vai ganhar</Text>
            <View style={styles.beneficiosGrid}>
              {BENEFICIOS.map((b) => (
                <View key={b.titulo} style={styles.beneficioCard}>
                  <Text style={styles.beneficioIcon}>{b.icon}</Text>
                  <Text style={styles.beneficioTitulo}>{b.titulo}</Text>
                  <Text style={styles.beneficioDesc}>{b.desc}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Divisor */}
          <View style={styles.divisor} />

          {/* Lista de espera */}
          <View style={styles.section}>
            {enviado ? (
              <View style={styles.sucessoCard}>
                <Text style={styles.sucessoIcon}>🎉</Text>
                <Text style={styles.sucessoTitulo}>Você entrou na lista!</Text>
                <Text style={styles.sucessoDesc}>
                  Assim que o cPod Premium estiver disponível, avisaremos você em primeira mão por e-mail.
                </Text>
              </View>
            ) : (
              <>
                <Text style={styles.sectionTitle}>Quero entrar na lista de espera</Text>
                <Text style={styles.sectionDesc}>
                  O cPod Premium ainda está em desenvolvimento. Deixe seus dados e nos conte
                  quanto você pagaria por mês para usar esses benefícios.
                </Text>

                <InputField
                  label="Nome"
                  placeholder="Seu nome"
                  value={nome}
                  onChangeText={setNome}
                  autoCapitalize="words"
                />
                <InputField
                  label="E-mail"
                  placeholder="voce@email.com"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />

                <Text style={styles.precoLabel}>Quanto você pagaria por mês?</Text>
                <View style={styles.precoOpcoes}>
                  {PRECOS.map((preco) => {
                    const selecionado = precoSelecionado === preco;
                    return (
                      <TouchableOpacity
                        key={preco}
                        style={[styles.precoCard, selecionado && styles.precoCardSelecionado]}
                        onPress={() => setPrecoSelecionado(preco)}
                        activeOpacity={0.85}
                      >
                        <Text style={[styles.precoValor, selecionado && styles.precoValorSelecionado]}>
                          {fmt(preco)}
                        </Text>
                        <Text style={[styles.precoPeriodo, selecionado && styles.precoPeriodoSelecionado]}>
                          /mês
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <TouchableOpacity
                  style={[styles.enviarBtn, loading && styles.enviarBtnLoading]}
                  onPress={handleEnviar}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={[Colors.teal500, Colors.teal700]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.enviarBtnGradient}
                  >
                    <Text style={styles.enviarBtnText}>
                      {loading ? 'Enviando...' : 'Quero entrar na lista de espera'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.teal900 },
  fill: { flex: 1 },
  scroll: { flexGrow: 1, backgroundColor: Colors.bg, paddingBottom: Spacing.xxl },

  hero: {
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
  },
  backBtn: { alignSelf: 'flex-start', marginBottom: Spacing.lg },
  backBtnText: { color: Colors.teal100, fontSize: Typography.sm },
  crownEmoji: { fontSize: 56, marginBottom: Spacing.sm },
  heroTitle: {
    fontSize: Typography.xxl,
    fontWeight: Typography.bold,
    color: Colors.white,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  heroSub: {
    fontSize: Typography.sm,
    color: Colors.teal100,
    textAlign: 'center',
    lineHeight: 20,
  },

  section: { padding: Spacing.lg },
  sectionTitle: {
    fontSize: Typography.md,
    fontWeight: Typography.bold,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  sectionDesc: {
    fontSize: Typography.sm,
    color: Colors.muted,
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },

  beneficiosGrid: { gap: Spacing.sm },
  beneficioCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    ...Shadow.card,
  },
  beneficioIcon: { fontSize: 26, marginTop: 2 },
  beneficioTitulo: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
    color: Colors.text,
    marginBottom: 2,
    flex: 1,
  },
  beneficioDesc: { fontSize: Typography.xs, color: Colors.muted, lineHeight: 17, flex: 1 },

  divisor: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.lg,
  },

  precoLabel: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
    color: Colors.text,
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  precoOpcoes: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  precoCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    ...Shadow.card,
  },
  precoCardSelecionado: {
    borderColor: Colors.teal600,
    backgroundColor: Colors.teal50,
  },
  precoValor: {
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    color: Colors.muted,
  },
  precoValorSelecionado: { color: Colors.teal700 },
  precoPeriodo: {
    fontSize: Typography.xs,
    color: Colors.subtle,
    marginTop: 2,
  },
  precoPeriodoSelecionado: { color: Colors.teal600 },

  enviarBtn: { borderRadius: Radius.lg, overflow: 'hidden', marginTop: Spacing.sm },
  enviarBtnLoading: { opacity: 0.7 },
  enviarBtnGradient: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  enviarBtnText: {
    color: Colors.white,
    fontSize: Typography.base,
    fontWeight: Typography.bold,
  },

  sucessoCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    ...Shadow.card,
  },
  sucessoIcon: { fontSize: 48, marginBottom: Spacing.md },
  sucessoTitulo: {
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    color: Colors.text,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  sucessoDesc: {
    fontSize: Typography.sm,
    color: Colors.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
});
