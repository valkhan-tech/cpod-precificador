import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import CpodLogo from '../components/CpodLogo';
import { useAuth } from '../context/AuthContext';
import { Colors, Radius, Shadow, Spacing, Typography } from '../constants/theme';
import { MainTabParamList, RootStackParamList } from '../navigation/types';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

interface ToolCard {
  id: string;
  icon: string;
  title: string;
  description: string;
  accentColor: string;
  tab: keyof MainTabParamList;
}

const TOOLS: ToolCard[] = [
  {
    id: 'precificador',
    icon: '🏷️',
    title: 'Precificador',
    description: 'Calcule o preço ideal considerando custos, taxas, impostos e margem.',
    accentColor: Colors.purple,
    tab: 'Precificador',
  },
  {
    id: 'hora-homem',
    icon: '⏱️',
    title: 'Hora-Homem',
    description: 'Calcule o custo hora-homem com múltiplos colaboradores.',
    accentColor: Colors.cyan,
    tab: 'HoraHomem',
  },
  {
    id: 'lote',
    icon: '📦',
    title: 'Simulador em Lote',
    description: 'Simule múltiplos produtos de uma só vez e compare resultados.',
    accentColor: Colors.mint,
    tab: 'Lote',
  },
];

export default function HomeScreen() {
  const navigation = useNavigation<NavProp>();
  const tabNavigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const { user, isAuthenticated } = useAuth();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient
          colors={[Colors.teal900, Colors.teal700]}
          style={styles.hero}
        >
          <CpodLogo size={140} variant="full" />
          <Text style={styles.heroTitle}>Precificador</Text>
          <Text style={styles.heroSub}>
            Ferramenta gratuita para empreendedores precificarem melhor seus produtos e serviços.
          </Text>

          {isAuthenticated ? (
            <View style={styles.userBadge}>
              <Text style={styles.userBadgeText}>👋 Olá, {user?.name?.split(' ')[0]}</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.loginBanner}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.loginBannerText}>
                💾 <Text style={styles.loginBannerBold}>Crie uma conta</Text> e salve até 10 simulações
              </Text>
            </TouchableOpacity>
          )}
        </LinearGradient>

        {/* Tools */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Calculadoras</Text>
          {TOOLS.map((tool) => (
            <TouchableOpacity
              key={tool.id}
              style={styles.toolCard}
              onPress={() => tabNavigation.navigate(tool.tab as any)}
              activeOpacity={0.85}
            >
              <View style={[styles.toolIconBox, { backgroundColor: tool.accentColor + '22' }]}>
                <Text style={styles.toolIcon}>{tool.icon}</Text>
              </View>
              <View style={styles.toolInfo}>
                <Text style={styles.toolTitle}>{tool.title}</Text>
                <Text style={styles.toolDesc}>{tool.description}</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Info box */}
        <View style={styles.infoBox}>
          <Text style={styles.infoIcon}>ℹ️</Text>
          <Text style={styles.infoText}>
            Os cálculos são feitos localmente no seu dispositivo. 
            {isAuthenticated
              ? ' Salve as simulações no histórico para reutilizar depois.'
              : ' Crie uma conta para salvar e acessar seu histórico.'}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flexGrow: 1, paddingBottom: Spacing.xl },
  hero: {
    alignItems: 'center',
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  heroTitle: {
    marginTop: Spacing.sm,
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    color: Colors.white,
    letterSpacing: 0.5,
  },
  heroSub: {
    marginTop: Spacing.sm,
    fontSize: Typography.sm,
    color: Colors.teal100,
    textAlign: 'center',
    lineHeight: 20,
  },
  userBadge: {
    marginTop: Spacing.md,
    backgroundColor: Colors.teal600,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  userBadgeText: {
    color: Colors.white,
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
  },
  loginBanner: {
    marginTop: Spacing.md,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  loginBannerText: {
    color: Colors.teal100,
    fontSize: Typography.sm,
  },
  loginBannerBold: {
    color: Colors.mint,
    fontWeight: Typography.bold,
  },
  section: {
    padding: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.md,
    fontWeight: Typography.bold,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  toolCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadow.card,
  },
  toolIconBox: {
    width: 52,
    height: 52,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  toolIcon: { fontSize: 26 },
  toolInfo: { flex: 1 },
  toolTitle: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
    color: Colors.text,
    marginBottom: 2,
  },
  toolDesc: {
    fontSize: Typography.xs,
    color: Colors.muted,
    lineHeight: 17,
  },
  chevron: {
    fontSize: Typography.xl,
    color: Colors.subtle,
    marginLeft: Spacing.sm,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.teal50,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  infoIcon: { fontSize: 16 },
  infoText: {
    flex: 1,
    fontSize: Typography.xs,
    color: Colors.muted,
    lineHeight: 18,
  },
});
