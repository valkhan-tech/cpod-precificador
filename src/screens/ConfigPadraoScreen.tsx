import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import InputField from '../components/InputField';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { updateDefaultsProdutos, updateDefaultsHoraHomem } from '../services/api';
import {
  getDefaultsProdutos,
  getDefaultsHoraHomem,
  DefaultsProdutos,
  DefaultsHoraHomem,
  DEFAULT_PRODUTOS,
  DEFAULT_HORA_HOMEM,
} from '../services/storage';
import { Colors, Radius, Shadow, Spacing, Typography } from '../constants/theme';
import { RootStackParamList } from '../navigation/types';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

export default function ConfigPadraoScreen() {
  const navigation = useNavigation<NavProp>();
  const { hasPremium } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ─── Defaults Produtos ──────────────────────────────────────────────────────
  const [dpCusto, setDpCusto] = useState('');
  const [dpEmbalagem, setDpEmbalagem] = useState('');
  const [dpTaxa, setDpTaxa] = useState('');
  const [dpImposto, setDpImposto] = useState('');
  const [dpMargem, setDpMargem] = useState('');
  const [dpQuantidade, setDpQuantidade] = useState('1');

  // ─── Defaults Hora Homem ───────────────────────────────────────────────────
  const [dhCustoFixo, setDhCustoFixo] = useState('3000');
  const [dhMargem, setDhMargem] = useState('35');
  const [dhImpostos, setDhImpostos] = useState('16');
  const [dhEncargos, setDhEncargos] = useState('68');
  const [dhHorasMes, setDhHorasMes] = useState('176');

  useEffect(() => {
    (async () => {
      const [dp, dh] = await Promise.all([getDefaultsProdutos(), getDefaultsHoraHomem()]);
      setDpCusto(dp.custo);
      setDpEmbalagem(dp.embalagem);
      setDpTaxa(dp.taxa);
      setDpImposto(dp.imposto);
      setDpMargem(dp.margem);
      setDpQuantidade(dp.quantidade);
      setDhCustoFixo(dh.custoFixo);
      setDhMargem(dh.margem);
      setDhImpostos(dh.impostos);
      setDhEncargos(dh.encargosDefault);
      setDhHorasMes(dh.horasMesDefault);
      setLoading(false);
    })();
  }, []);

  async function handleSalvar() {
    setSaving(true);
    try {
      const dp: DefaultsProdutos = {
        custo: dpCusto,
        embalagem: dpEmbalagem,
        taxa: dpTaxa,
        imposto: dpImposto,
        margem: dpMargem,
        quantidade: dpQuantidade,
      };
      const dh: DefaultsHoraHomem = {
        custoFixo: dhCustoFixo,
        margem: dhMargem,
        impostos: dhImpostos,
        encargosDefault: dhEncargos,
        horasMesDefault: dhHorasMes,
      };
      await Promise.all([updateDefaultsProdutos(dp), updateDefaultsHoraHomem(dh)]);
      Alert.alert('Padrões salvos!', 'Os valores serão carregados ao abrir cada calculadora.');
    } catch (e: unknown) {
      Alert.alert('Erro', e instanceof Error ? e.message : 'Não foi possível salvar.');
    } finally {
      setSaving(false);
    }
  }

  function handleLimpar() {
    Alert.alert(
      'Limpar padrões',
      'Restaurar todos os valores para o padrão original?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpar',
          style: 'destructive',
          onPress: () => {
            setDpCusto(DEFAULT_PRODUTOS.custo);
            setDpEmbalagem(DEFAULT_PRODUTOS.embalagem);
            setDpTaxa(DEFAULT_PRODUTOS.taxa);
            setDpImposto(DEFAULT_PRODUTOS.imposto);
            setDpMargem(DEFAULT_PRODUTOS.margem);
            setDpQuantidade(DEFAULT_PRODUTOS.quantidade);
            setDhCustoFixo(DEFAULT_HORA_HOMEM.custoFixo);
            setDhMargem(DEFAULT_HORA_HOMEM.margem);
            setDhImpostos(DEFAULT_HORA_HOMEM.impostos);
            setDhEncargos(DEFAULT_HORA_HOMEM.encargosDefault);
            setDhHorasMes(DEFAULT_HORA_HOMEM.horasMesDefault);
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>⚙️ Valores Padrão</Text>
        <View style={styles.headerRight} />
      </View>

      {!hasPremium ? (
        <View style={styles.gateContainer}>
          <Text style={styles.gateIcon}>🔒</Text>
          <Text style={styles.gateTitle}>Recurso Premium</Text>
          <Text style={styles.gateDesc}>
            Configure os valores iniciais de cada calculadora para agilizar suas simulações.
          </Text>
          <TouchableOpacity
            style={styles.gateBtn}
            onPress={() => navigation.navigate('Premium')}
          >
            <Text style={styles.gateBtnText}>Ver benefícios Premium →</Text>
          </TouchableOpacity>
        </View>
      ) : loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={Colors.teal600} size="large" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.infoText}>
            Os valores configurados aqui serão carregados automaticamente ao abrir cada calculadora.
            Deixe em branco para não aplicar nenhum padrão.
          </Text>

          {/* ── Calculadora de Produtos ──────────────────── */}
          <View style={styles.card}>
            <Text style={styles.cardSection}>🏷️ Calculadora de Produtos</Text>
            <View style={styles.row2}>
              <View style={styles.halfField}>
                <InputField
                  label="Custo (R$)"
                  placeholder="0,00"
                  keyboardType="decimal-pad"
                  prefix="R$"
                  value={dpCusto}
                  onChangeText={setDpCusto}
                />
              </View>
              <View style={styles.halfField}>
                <InputField
                  label="Embalagem (R$)"
                  placeholder="0,00"
                  keyboardType="decimal-pad"
                  prefix="R$"
                  value={dpEmbalagem}
                  onChangeText={setDpEmbalagem}
                />
              </View>
            </View>
            <View style={styles.row2}>
              <View style={styles.halfField}>
                <InputField
                  label="Taxa (%)"
                  placeholder="0"
                  keyboardType="decimal-pad"
                  suffix="%"
                  value={dpTaxa}
                  onChangeText={setDpTaxa}
                />
              </View>
              <View style={styles.halfField}>
                <InputField
                  label="Imposto (%)"
                  placeholder="0"
                  keyboardType="decimal-pad"
                  suffix="%"
                  value={dpImposto}
                  onChangeText={setDpImposto}
                />
              </View>
            </View>
            <View style={styles.row2}>
              <View style={styles.halfField}>
                <InputField
                  label="Margem (%)"
                  placeholder="0"
                  keyboardType="decimal-pad"
                  suffix="%"
                  value={dpMargem}
                  onChangeText={setDpMargem}
                />
              </View>
              <View style={styles.halfField}>
                <InputField
                  label="Quantidade"
                  placeholder="1"
                  keyboardType="decimal-pad"
                  value={dpQuantidade}
                  onChangeText={setDpQuantidade}
                />
              </View>
            </View>
          </View>

          {/* ── Custo de Serviços ────────────────────────── */}
          <View style={styles.card}>
            <Text style={styles.cardSection}>⏱️ Custo de Serviços</Text>
            <View style={styles.row2}>
              <View style={styles.halfField}>
                <InputField
                  label="Custo Fixo (R$)"
                  placeholder="3000"
                  keyboardType="decimal-pad"
                  prefix="R$"
                  value={dhCustoFixo}
                  onChangeText={setDhCustoFixo}
                />
              </View>
              <View style={styles.halfField}>
                <InputField
                  label="Margem (%)"
                  placeholder="35"
                  keyboardType="decimal-pad"
                  suffix="%"
                  value={dhMargem}
                  onChangeText={setDhMargem}
                />
              </View>
            </View>
            <View style={styles.row2}>
              <View style={styles.halfField}>
                <InputField
                  label="Impostos (%)"
                  placeholder="16"
                  keyboardType="decimal-pad"
                  suffix="%"
                  value={dhImpostos}
                  onChangeText={setDhImpostos}
                />
              </View>
              <View style={styles.halfField}>
                <InputField
                  label="Encargos (%)"
                  hint="Padrão para novos colaboradores"
                  placeholder="68"
                  keyboardType="decimal-pad"
                  suffix="%"
                  value={dhEncargos}
                  onChangeText={setDhEncargos}
                />
              </View>
            </View>
            <InputField
              label="Horas/Mês"
              hint="Padrão para novos colaboradores"
              placeholder="176"
              keyboardType="decimal-pad"
              suffix="h"
              value={dhHorasMes}
              onChangeText={setDhHorasMes}
            />
          </View>

          <View style={styles.actionRow}>
            <Button
              title="💾 Salvar padrões"
              onPress={handleSalvar}
              loading={saving}
              style={styles.actionBtnSave}
            />
            <Button
              title="Limpar"
              variant="neutral"
              onPress={handleLimpar}
              style={styles.actionBtnClear}
            />
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.teal900 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.teal900,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backBtn: {},
  backBtnText: { color: Colors.teal100, fontSize: Typography.sm },
  headerTitle: {
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    color: Colors.white,
  },
  headerRight: { width: 60 },

  scroll: {
    flexGrow: 1,
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
    backgroundColor: Colors.bg,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },

  infoText: {
    fontSize: Typography.xs,
    color: Colors.muted,
    lineHeight: 18,
    marginBottom: Spacing.md,
    backgroundColor: Colors.teal50,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadow.card,
  },
  cardSection: {
    fontSize: Typography.sm,
    fontWeight: Typography.bold,
    color: Colors.teal700,
    marginBottom: Spacing.md,
  },
  row2: { flexDirection: 'row', gap: Spacing.sm },
  halfField: { flex: 1 },

  actionRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  actionBtnSave: { flex: 65 },
  actionBtnClear: { flex: 25 },

  gateContainer: {
    flex: 1,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  gateIcon: { fontSize: 56, marginBottom: Spacing.md },
  gateTitle: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    color: Colors.text,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  gateDesc: {
    fontSize: Typography.sm,
    color: Colors.muted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  gateBtn: {
    height: 48,
    paddingHorizontal: Spacing.xl,
    backgroundColor: Colors.teal700,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gateBtnText: { color: Colors.white, fontWeight: Typography.bold, fontSize: Typography.base },
});
