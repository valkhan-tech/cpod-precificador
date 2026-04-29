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

function fmt(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function marginAccent(margin: number): 'danger' | 'warning' | 'info' | 'success' {
  if (margin < 3) return 'danger';
  if (margin < 10) return 'warning';
  if (margin < 20) return 'info';
  return 'success';
}

interface Results {
  precoVenda: number;
  investimento: number;
  receita: number;
  totalTaxa: number;
  totalImposto: number;
  lucro: number;
  margemReal: number;
}

export default function PrecificadorScreen() {
  const navigation = useNavigation<NavProp>();
  const { isAuthenticated } = useAuth();

  const [custo, setCusto] = useState('');
  const [embalagem, setEmbalagem] = useState('');
  const [taxa, setTaxa] = useState('');
  const [imposto, setImposto] = useState('');
  const [impostoMei, setImpostoMei] = useState('');
  const [margem, setMargem] = useState('');
  const [precoVendaInput, setPrecoVendaInput] = useState('');
  const [quantidade, setQuantidade] = useState('1');
  const [results, setResults] = useState<Results | null>(null);
  const [saving, setSaving] = useState(false);

  function calcular() {
    const c = parseFloat(custo.replace(',', '.')) || 0;
    const emb = parseFloat(embalagem.replace(',', '.')) || 0;
    const t = (parseFloat(taxa.replace(',', '.')) || 0) / 100;
    const imp = (parseFloat(imposto.replace(',', '.')) || 0) / 100;
    const impMei = parseFloat(impostoMei.replace(',', '.')) || 0;
    const m = (parseFloat(margem.replace(',', '.')) || 0) / 100;
    const pvi = parseFloat(precoVendaInput.replace(',', '.')) || 0;
    const qtd = parseInt(quantidade, 10) || 1;

    if (c <= 0) {
      Alert.alert('Dados inválidos', 'Informe o custo do produto.');
      return;
    }

    const custoUnit = c + emb;
    let precoVenda: number;
    if (pvi > 0) {
      precoVenda = pvi;
    } else {
      const impostoCalc = impMei > 0 ? 0 : imp;
      precoVenda = custoUnit / (1 - t - impostoCalc - m);
    }

    const investimento = custoUnit * qtd;
    const receita = precoVenda * qtd;
    const totalTaxa = receita * t;
    const totalImposto = impMei > 0 ? impMei : receita * imp;
    const lucro = receita - investimento - totalTaxa - totalImposto;
    const margemReal = (lucro / receita) * 100;

    setResults({ precoVenda, investimento, receita, totalTaxa, totalImposto, lucro, margemReal });
  }

  async function salvar() {
    if (!results) return;
    if (!isAuthenticated) {
      Alert.alert(
        'Conta necessária',
        'Crie uma conta gratuita para salvar simulações.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Criar conta', onPress: () => navigation.navigate('Register') },
        ]
      );
      return;
    }
    setSaving(true);
    try {
      await saveSimulation({
        type: 'precificador',
        title: `Precificador — ${fmt(results.precoVenda)}`,
        inputs: { custo, embalagem, taxa, imposto, impostoMei, margem, precoVendaInput, quantidade },
        results: {
          precoVenda: results.precoVenda,
          lucro: results.lucro,
          margemReal: results.margemReal,
        },
      });
      Alert.alert('Salvo!', 'Simulação salva no histórico.');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Erro ao salvar.';
      Alert.alert('Erro', message);
    } finally {
      setSaving(false);
    }
  }

  function limpar() {
    setCusto(''); setEmbalagem(''); setTaxa(''); setImposto('');
    setImpostoMei(''); setMargem(''); setPrecoVendaInput(''); setQuantidade('1');
    setResults(null);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={styles.pageHeader}>
            <Text style={styles.pageTitle}>🏷️ Precificador</Text>
            <Text style={styles.pageDesc}>
              Informe os dados do produto e calcule o preço ideal de venda.
            </Text>
          </View>

          {/* Formulário */}
          <View style={styles.card}>
            <Text style={styles.cardSection}>Custos</Text>
            <InputField
              label="Custo do produto (R$)"
              hint="Quanto você pagou por este produto?"
              placeholder="0,00"
              keyboardType="decimal-pad"
              prefix="R$"
              value={custo}
              onChangeText={setCusto}
            />
            <InputField
              label="Custo de embalagem (R$)"
              placeholder="0,00"
              keyboardType="decimal-pad"
              prefix="R$"
              value={embalagem}
              onChangeText={setEmbalagem}
            />

            <Text style={styles.cardSection}>Taxas e Impostos</Text>
            <InputField
              label="Taxa da plataforma / comissão (%)"
              hint="Ex: Mercado Livre 17%, iFood 12%"
              placeholder="0"
              keyboardType="decimal-pad"
              suffix="%"
              value={taxa}
              onChangeText={setTaxa}
            />
            <InputField
              label="Imposto (%)"
              hint="Deixe em branco se informar DAS/MEI abaixo"
              placeholder="0"
              keyboardType="decimal-pad"
              suffix="%"
              value={imposto}
              onChangeText={setImposto}
            />
            <InputField
              label="DAS / MEI (R$)"
              hint="Se pagou um valor fixo de DAS este mês, informe aqui"
              placeholder="0,00"
              keyboardType="decimal-pad"
              prefix="R$"
              value={impostoMei}
              onChangeText={setImpostoMei}
            />

            <Text style={styles.cardSection}>Margem e Simulação</Text>
            <InputField
              label="Margem de lucro desejada (%)"
              placeholder="30"
              keyboardType="decimal-pad"
              suffix="%"
              value={margem}
              onChangeText={setMargem}
            />
            <InputField
              label="Preço de venda (opcional)"
              hint="Preencha para verificar a margem de um preço já definido"
              placeholder="0,00"
              keyboardType="decimal-pad"
              prefix="R$"
              value={precoVendaInput}
              onChangeText={setPrecoVendaInput}
            />
            <InputField
              label="Quantidade"
              hint="Para simular receita e lucro total do lote"
              placeholder="1"
              keyboardType="number-pad"
              value={quantidade}
              onChangeText={setQuantidade}
            />

            <Button title="Calcular" onPress={calcular} style={styles.calcBtn} />
          </View>

          {/* Resultados */}
          {results && (
            <View style={styles.resultsArea}>
              {/* Preço sugerido destaque */}
              <View style={styles.priceHighlight}>
                <Text style={styles.priceLabel}>Preço sugerido de venda</Text>
                <Text style={styles.priceValue}>{fmt(results.precoVenda)}</Text>
              </View>

              <ResultCard
                title="Resumo financeiro"
                rows={[
                  { label: 'Investimento total', value: fmt(results.investimento) },
                  { label: 'Receita total', value: fmt(results.receita) },
                  { label: 'Taxas pagas', value: fmt(results.totalTaxa) },
                  { label: 'Impostos pagos', value: fmt(results.totalImposto) },
                  {
                    label: 'Lucro líquido',
                    value: fmt(results.lucro),
                    accent: marginAccent(results.margemReal),
                  },
                  {
                    label: 'Margem real',
                    value: `${results.margemReal.toFixed(2)}%`,
                    accent: marginAccent(results.margemReal),
                  },
                ]}
              />

              {/* Legenda de cores */}
              <View style={styles.legend}>
                {[
                  { color: Colors.danger, label: '< 3% — Risco alto' },
                  { color: Colors.warning, label: '3–10% — Atenção' },
                  { color: Colors.info, label: '10–20% — Razoável' },
                  { color: Colors.success, label: '> 20% — Excelente' },
                ].map((l) => (
                  <View key={l.label} style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: l.color }]} />
                    <Text style={styles.legendText}>{l.label}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.actionRow}>
                <Button
                  title="💾 Salvar simulação"
                  onPress={salvar}
                  loading={saving}
                  style={styles.actionBtn}
                />
                <Button
                  title="Limpar"
                  variant="ghost"
                  onPress={limpar}
                  style={styles.actionBtn}
                />
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
  pageTitle: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  pageDesc: { fontSize: Typography.sm, color: Colors.muted, lineHeight: 20 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadow.card,
  },
  cardSection: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    color: Colors.teal600,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  calcBtn: { marginTop: Spacing.md },
  resultsArea: { gap: Spacing.md },
  priceHighlight: {
    backgroundColor: Colors.teal700,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    ...Shadow.float,
  },
  priceLabel: {
    fontSize: Typography.sm,
    color: Colors.teal100,
    fontWeight: Typography.medium,
    marginBottom: Spacing.xs,
  },
  priceValue: {
    fontSize: Typography.xxxl,
    fontWeight: Typography.bold,
    color: Colors.white,
  },
  legend: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.xs,
    ...Shadow.card,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: Typography.xs, color: Colors.muted },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionBtn: { flex: 1 },
});
