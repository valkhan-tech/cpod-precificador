import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { initiateCheckout } from '../services/api';
import { Colors, Radius, Shadow, Spacing, Typography } from '../constants/theme';
import { PlanoAssinatura } from '../types/api.types';
import { PLANOS } from '../constants/api';
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

function fmt(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}

export default function PremiumScreen() {
  const navigation = useNavigation<NavProp>();
  const { hasPremium, isAuthenticated, activatePremiumSession } = useAuth();
  const [planoSelecionado, setPlanoSelecionado] = useState<PlanoAssinatura>('anual');
  const [loading, setLoading] = useState(false);

  async function handleAssinar() {
    if (!isAuthenticated) {
      Alert.alert(
        'Conta necessária',
        'Crie uma conta gratuita para assinar o plano premium.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Criar conta', onPress: () => navigation.navigate('Register') },
        ]
      );
      return;
    }

    setLoading(true);
    try {
      const { checkoutUrl } = await initiateCheckout(planoSelecionado);
      // TODO: abrir checkoutUrl em um WebView ou browser externo (expo-web-browser)
      Alert.alert(
        'Redirecionando para o pagamento',
        `URL do checkout: ${checkoutUrl}\n\n(Integração com gateway de pagamento em desenvolvimento.)`,
        [{ text: 'OK' }]
      );
    } catch (e: unknown) {
      Alert.alert('Erro', e instanceof Error ? e.message : 'Não foi possível iniciar o checkout.');
    } finally {
      setLoading(false);
    }
  }

  function handleAtivarTeste() {
    Alert.alert(
      '🧪 Modo de Teste',
      'O acesso premium será ativado apenas nesta sessão.\nAo reiniciar o app, voltará ao modo gratuito.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Ativar',
          onPress: () => {
            activatePremiumSession();
            navigation.goBack();
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
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

          {hasPremium && (
            <View style={styles.ativoBadge}>
              <Text style={styles.ativoBadgeText}>✅ Premium ativo nesta sessão</Text>
            </View>
          )}
        </LinearGradient>

        {/* Benefícios */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>O que você ganha</Text>
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

        {/* Planos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Escolha seu plano</Text>

          {(['anual', 'mensal'] as PlanoAssinatura[]).map((plano) => {
            const p = PLANOS[plano];
            const selecionado = planoSelecionado === plano;
            return (
              <TouchableOpacity
                key={plano}
                style={[styles.planoCard, selecionado && styles.planoCardSelecionado]}
                onPress={() => setPlanoSelecionado(plano)}
                activeOpacity={0.85}
              >
                <View style={styles.planoRadio}>
                  <View style={[styles.radioCircle, selecionado && styles.radioCircleActive]}>
                    {selecionado && <View style={styles.radioDot} />}
                  </View>
                </View>
                <View style={styles.planoInfo}>
                  <View style={styles.planoTitleRow}>
                    <Text style={[styles.planoLabel, selecionado && styles.planoLabelActive]}>
                      {p.label}
                    </Text>
                    {'economia' in p && (
                      <View style={styles.economiaBadge}>
                        <Text style={styles.economiaBadgeText}>{p.economia}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.planoValor}>
                    <Text style={styles.planoValorNum}>{fmt(p.valor)}</Text>
                    <Text style={styles.planoPeriodo}> {p.periodo}</Text>
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity
            style={[styles.assinarBtn, loading && styles.assinarBtnLoading]}
            onPress={handleAssinar}
            disabled={loading}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[Colors.teal500, Colors.teal700]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.assinarBtnGradient}
            >
              <Text style={styles.assinarBtnText}>
                {loading ? 'Aguarde...' : `Assinar plano ${PLANOS[planoSelecionado].label}`}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.cancelInfo}>
            Cancele quando quiser. Sem fidelidade.
          </Text>
        </View>

        {/* Divisor */}
        <View style={styles.divisor} />

        {/* Modo Teste */}
        <View style={styles.section}>
          <View style={styles.testeCard}>
            <Text style={styles.testeIcon}>🧪</Text>
            <View style={styles.testeInfo}>
              <Text style={styles.testeTitulo}>Modo de Teste</Text>
              <Text style={styles.testeDesc}>
                Ativa o acesso premium apenas nesta sessão.{'\n'}
                Ao reiniciar o app, o acesso é desativado automaticamente.
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.testeBtn, hasPremium && styles.testeBtnAtivo]}
            onPress={hasPremium ? undefined : handleAtivarTeste}
            disabled={hasPremium}
            activeOpacity={0.85}
          >
            <Text style={styles.testeBtnText}>
              {hasPremium ? '✅ Modo de teste ativo' : 'Ativar modo de teste'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.teal900 },
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
  ativoBadge: {
    marginTop: Spacing.md,
    backgroundColor: Colors.success + '33',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.success + '66',
  },
  ativoBadgeText: {
    color: Colors.success,
    fontSize: Typography.xs,
    fontWeight: Typography.semibold,
  },

  section: { padding: Spacing.lg },
  sectionTitle: {
    fontSize: Typography.md,
    fontWeight: Typography.bold,
    color: Colors.text,
    marginBottom: Spacing.md,
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

  planoCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    ...Shadow.card,
  },
  planoCardSelecionado: {
    borderColor: Colors.teal600,
    backgroundColor: Colors.teal50,
  },
  planoRadio: { marginRight: Spacing.md },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleActive: { borderColor: Colors.teal600 },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.teal600,
  },
  planoInfo: { flex: 1 },
  planoTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 2 },
  planoLabel: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
    color: Colors.muted,
  },
  planoLabelActive: { color: Colors.teal700 },
  economiaBadge: {
    backgroundColor: Colors.success + '22',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  economiaBadgeText: {
    fontSize: 10,
    color: Colors.success,
    fontWeight: Typography.bold,
  },
  planoValor: { marginTop: 2 },
  planoValorNum: {
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    color: Colors.text,
  },
  planoPeriodo: {
    fontSize: Typography.sm,
    color: Colors.muted,
    fontWeight: Typography.regular,
  },

  assinarBtn: { borderRadius: Radius.lg, overflow: 'hidden', marginTop: Spacing.md },
  assinarBtnLoading: { opacity: 0.7 },
  assinarBtnGradient: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  assinarBtnText: {
    color: Colors.white,
    fontSize: Typography.base,
    fontWeight: Typography.bold,
  },
  cancelInfo: {
    fontSize: Typography.xs,
    color: Colors.muted,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },

  divisor: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.lg,
  },

  testeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    gap: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadow.card,
  },
  testeIcon: { fontSize: 28 },
  testeInfo: { flex: 1 },
  testeTitulo: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
    color: Colors.text,
    marginBottom: 4,
  },
  testeDesc: {
    fontSize: Typography.xs,
    color: Colors.muted,
    lineHeight: 17,
  },
  testeBtn: {
    height: 48,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.teal600,
    alignItems: 'center',
    justifyContent: 'center',
  },
  testeBtnAtivo: {
    borderColor: Colors.success,
    backgroundColor: Colors.success + '11',
  },
  testeBtnText: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
    color: Colors.teal700,
  },
});
