import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import InputField from '../components/InputField';
import Button from '../components/Button';
import ResultCard from '../components/ResultCard';
import { useAuth } from '../context/AuthContext';
import { saveSimulation } from '../services/api';
import { Colors, Radius, Shadow, Spacing, Typography } from '../constants/theme';
import { RootStackParamList } from '../navigation/types';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

function fmt(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}

interface LoteItem {
  index: number;
  quantidade: number;
  custo: number;
  precoVenda: number;
  investimento: number;
  lucro: number;
  margemReal: number;
}

interface LoteResults {
  itens: LoteItem[];
  totalInvestido: number;
  totalLucro: number;
  totalReceita: number;
}

export default function LoteScreen() {
  const navigation = useNavigation<NavProp>();
  const { isAuthenticated } = useAuth();

  const [entrada, setEntrada] = useState('');
  const [margem, setMargem] = useState('30');
  const [embalagem, setEmbalagem] = useState('1.50');
  const [taxa, setTaxa] = useState('20');
  const [imposto, setImposto] = useState('20');
  const [results, setResults] = useState<LoteResults | null>(null);
  const [saving, setSaving] = useState(false);

  function calcular() {
    const margemV = parseFloat(margem.replace(',', '.')) / 100;
    const embalagemV = parseFloat(embalagem.replace(',', '.'));
    const taxaV = parseFloat(taxa.replace(',', '.')) / 100;
    const impostoV = parseFloat(imposto.replace(',', '.')) / 100;

    const linhas = entrada.trim().split('\n').filter((l) => l.trim());
    if (linhas.length === 0) {
      Alert.alert('Sem dados', 'Informe pelo menos um item no formato quantidade;custo;venda.');
      return;
    }

    const itens: LoteItem[] = [];
    let totalInvestido = 0;
    let totalLucro = 0;
    let totalReceita = 0;

    for (let i = 0; i < linhas.length; i++) {
      const partes = linhas[i].trim().split(';');
      if (partes.length < 2) continue;
      const qtd = parseInt(partes[0], 10) || 1;
      const custoUnit = parseFloat(partes[1].replace(',', '.')) || 0;
      const precoInput = partes[2] ? parseFloat(partes[2].replace(',', '.')) : 0;
      const custoTotal = custoUnit + embalagemV;
      const pv = precoInput > 0 ? precoInput : custoTotal / (1 - taxaV - impostoV - margemV);
      const investimento = custoTotal * qtd;
      const receita = pv * qtd;
      const lucro = receita - investimento - receita * taxaV - receita * impostoV;
      const margemReal = (lucro / receita) * 100;
      itens.push({ index: i + 1, quantidade: qtd, custo: custoUnit, precoVenda: pv, investimento, lucro, margemReal });
      totalInvestido += investimento;
      totalLucro += lucro;
      totalReceita += receita;
    }

    setResults({ itens, totalInvestido, totalLucro, totalReceita });
  }

  async function salvar() {
    if (!results) return;
    if (!isAuthenticated) {
      Alert.alert(
        'Recurso Premium',
        'Salvar simulações é um recurso do cPod Premium, em breve disponível.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Ver detalhes', onPress: () => navigation.navigate('Premium') },
        ]
      );
      return;
    }
    setSaving(true);
    try {
      await saveSimulation({
        type: 'lote',
        title: `Lote — ${results.itens.length} itens`,
        inputs: { entrada, margem, embalagem, taxa, imposto },
        results: { totalInvestido: results.totalInvestido, totalLucro: results.totalLucro },
      });
      Alert.alert('Salvo!', 'Simulação salva no histórico.');
    } catch (e: unknown) {
      Alert.alert('Erro', e instanceof Error ? e.message : 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.pageHeader}>
            <Text style={styles.pageTitle}>📦 Simulador em Lote</Text>
            <Text style={styles.pageDesc}>
              Simule múltiplos produtos de uma vez. Um item por linha.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardSection}>Formato de entrada</Text>
            <View style={styles.formatBox}>
              <Text style={styles.formatCode}>quantidade;custo;venda</Text>
              <Text style={styles.formatHint}>
                Ex:{'\n'}10;12.00;0{'\n'}5;8.50;25.00{'\n'}
                {'\n'}Deixe venda como 0 para calcular automaticamente.
              </Text>
            </View>

            <InputField
              label="Itens"
              placeholder={'10;12;0\n5;8.50;25\n3;45;0'}
              multiline
              numberOfLines={6}
              style={styles.textArea}
              value={entrada}
              onChangeText={setEntrada}
            />

            <Text style={styles.cardSection}>Parâmetros globais</Text>
            <View style={styles.row2}>
              <View style={styles.halfField}>
                <InputField label="Margem (%)" placeholder="30" keyboardType="decimal-pad" suffix="%" value={margem} onChangeText={setMargem} />
              </View>
              <View style={styles.halfField}>
                <InputField label="Embalagem (R$)" placeholder="1.50" keyboardType="decimal-pad" prefix="R$" value={embalagem} onChangeText={setEmbalagem} />
              </View>
            </View>
            <View style={styles.row2}>
              <View style={styles.halfField}>
                <InputField label="Taxa (%)" placeholder="20" keyboardType="decimal-pad" suffix="%" value={taxa} onChangeText={setTaxa} />
              </View>
              <View style={styles.halfField}>
                <InputField label="Imposto (%)" placeholder="20" keyboardType="decimal-pad" suffix="%" value={imposto} onChangeText={setImposto} />
              </View>
            </View>

            <Button title="Simular lote" onPress={calcular} />
          </View>

          {results && (
            <View style={styles.resultsArea}>
              <ResultCard
                title="Totais"
                rows={[
                  { label: 'Total investido', value: fmt(results.totalInvestido) },
                  { label: 'Total de receita', value: fmt(results.totalReceita) },
                  {
                    label: 'Lucro total',
                    value: fmt(results.totalLucro),
                    accent: results.totalLucro > 0 ? 'success' : 'danger',
                  },
                ]}
              />

              <Text style={styles.sectionTitle}>Detalhamento por item</Text>
              {results.itens.map((item) => (
                <View key={item.index} style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemLabel}>Item {item.index}</Text>
                    <Text style={styles.itemQtd}>{item.quantidade} un</Text>
                  </View>
                  <View style={styles.itemRow}>
                    <Text style={styles.itemKey}>Custo unit.</Text>
                    <Text style={styles.itemVal}>{fmt(item.custo)}</Text>
                  </View>
                  <View style={styles.itemRow}>
                    <Text style={styles.itemKey}>Preço venda</Text>
                    <Text style={styles.itemVal}>{fmt(item.precoVenda)}</Text>
                  </View>
                  <View style={styles.itemRow}>
                    <Text style={styles.itemKey}>Investimento</Text>
                    <Text style={styles.itemVal}>{fmt(item.investimento)}</Text>
                  </View>
                  <View style={styles.itemRow}>
                    <Text style={styles.itemKey}>Lucro</Text>
                    <Text style={[styles.itemVal, { color: item.lucro >= 0 ? Colors.success : Colors.danger }]}>
                      {fmt(item.lucro)}
                    </Text>
                  </View>
                  <View style={styles.itemRow}>
                    <Text style={styles.itemKey}>Margem real</Text>
                    <Text style={[styles.itemVal, { color: item.margemReal >= 10 ? Colors.success : item.margemReal >= 3 ? Colors.warning : Colors.danger }]}>
                      {item.margemReal.toFixed(1)}%
                    </Text>
                  </View>
                </View>
              ))}

              <View style={styles.actionRow}>
                <Button title="💾 Salvar" onPress={salvar} loading={saving} style={styles.actionBtn} />
                <Button title="Limpar" variant="ghost" onPress={() => setResults(null)} style={styles.actionBtn} />
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, padding: Spacing.lg, paddingBottom: Spacing.xxl },
  pageHeader: { marginBottom: Spacing.lg },
  pageTitle: { fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.text, marginBottom: Spacing.xs },
  pageDesc: { fontSize: Typography.sm, color: Colors.muted, lineHeight: 20 },
  card: { backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.lg, marginBottom: Spacing.md, ...Shadow.card },
  cardSection: { fontSize: Typography.xs, fontWeight: Typography.bold, color: Colors.teal600, letterSpacing: 1, textTransform: 'uppercase', marginTop: Spacing.md, marginBottom: Spacing.sm },
  formatBox: { backgroundColor: Colors.teal50, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.md },
  formatCode: { fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', fontSize: Typography.sm, color: Colors.teal700, fontWeight: Typography.bold },
  formatHint: { fontSize: Typography.xs, color: Colors.muted, marginTop: Spacing.xs, lineHeight: 18 },
  textArea: { height: 120, textAlignVertical: 'top', paddingTop: Spacing.sm },
  row2: { flexDirection: 'row', gap: Spacing.sm },
  halfField: { flex: 1 },
  resultsArea: { gap: Spacing.md },
  sectionTitle: { fontSize: Typography.md, fontWeight: Typography.bold, color: Colors.text },
  itemCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, ...Shadow.card },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  itemLabel: { fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.text },
  itemQtd: { fontSize: Typography.sm, color: Colors.muted },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  itemKey: { fontSize: Typography.xs, color: Colors.muted },
  itemVal: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.text },
  actionRow: { flexDirection: 'row', gap: Spacing.sm },
  actionBtn: { flex: 1 },
});
