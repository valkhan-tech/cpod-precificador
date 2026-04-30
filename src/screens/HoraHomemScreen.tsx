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

function fmt(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}
function fmtPct(v: number) {
  return v.toFixed(2) + '%';
}
function parseN(s: string) {
  return parseFloat(s.replace(',', '.')) || 0;
}

interface Colaborador {
  id: string;
  nome: string;
  salario: string;
  encargos: string;
  horasMes: string;
}

interface CalcResult {
  // team
  n: number;
  custoColaboradores: number;
  custoTotal: number;
  rateioColab: number;
  totalHoras: number;
  horasUnitarias: number;
  custoHoraSomatorio: number;
  custoHoraUnitario: number;
  // faturamento
  faturamentoMinimo: number;
  faturamentoPeriodo: number;
  valorHoraSugerido: number;
  valorHoraAplicado: number;
  // liquido (baseado em meta)
  impostosValor: number;
  liquidoMensal: number;
  liquidoPeriodo: number;
  margemMeta: number;
  // liquido real (se faturamentoExtra > 0)
  temReal: boolean;
  liquidoMensalReal: number;
  liquidoPeriodoReal: number;
  margemReal: number;
  impostosValorReal: number;
  // antecipação
  temAntecipacao: boolean;
  saldoMensal: number;
  saldoPeriodo: number;
  // detalhes por colaborador
  detalhes: Array<{
    nome: string;
    horasMes: number;
    custoMes: number;
    custoHoraBase: number;
    custoHoraComRateio: number;
    valorHoraVenda: number;
  }>;
  // projeto
  horasProjeto: number;
}

export default function HoraHomemScreen() {
  const navigation = useNavigation<NavProp>();
  const { isAuthenticated } = useAuth();

  const [colaboradores, setColaboradores] = useState<Colaborador[]>([
    { id: '1', nome: '', salario: '', encargos: '68', horasMes: '176' },
  ]);

  // Config
  const [custoFixo, setCustoFixo] = useState('3000');
  const [margem, setMargem] = useState('35');
  const [impostos, setImpostos] = useState('16');
  const [projecaoMeses, setProjecaoMeses] = useState('1');
  const [faturamentoExtra, setFaturamentoExtra] = useState('');
  const [antecipacaoLucros, setAntecipacaoLucros] = useState('');
  const [horasProjeto, setHorasProjeto] = useState('');

  const [results, setResults] = useState<CalcResult | null>(null);
  const [saving, setSaving] = useState(false);

  function addColaborador() {
    const id = String(Date.now());
    setColaboradores((prev) => [
      ...prev,
      { id, nome: '', salario: '', encargos: '68', horasMes: '176' },
    ]);
  }

  function removeColaborador(id: string) {
    if (colaboradores.length <= 1) return;
    setColaboradores((prev) => prev.filter((c) => c.id !== id));
  }

  function updateColaborador(id: string, field: keyof Colaborador, value: string) {
    setColaboradores((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  }

  function calcular() {
    for (const c of colaboradores) {
      if (!c.salario || parseN(c.salario) <= 0) {
        const label = c.nome.trim() || `colaborador ${colaboradores.indexOf(c) + 1}`;
        Alert.alert('Dados inválidos', `Informe o salário de "${label}".`);
        return;
      }
    }

    const cfixo = parseN(custoFixo);
    const marg = parseN(margem) / 100;
    const imp = parseN(impostos) / 100;
    const proj = Math.max(1, Math.round(parseN(projecaoMeses)));
    const fatExtra = parseN(faturamentoExtra);
    const antecip = parseN(antecipacaoLucros);
    const horasProj = parseN(horasProjeto);
    const n = colaboradores.length;

    // 1. Custo dos colaboradores
    const detalhesBase = colaboradores.map((c) => {
      const salario = parseN(c.salario);
      const enc = (parseN(c.encargos) || 68) / 100;
      const horas = parseN(c.horasMes) || 176;
      const custoMes = salario * (1 + enc);  // salário + encargos
      const valorHora = custoMes / horas;    // custo por hora
      return { nome: c.nome.trim() || `Colaborador ${colaboradores.indexOf(c) + 1}`, salario, enc, horas, custoMes, valorHora };
    });

    let totalHoras = 0;
    let custoColaboradores = 0;
    let custoHoraSomatorio = 0;

    detalhesBase.forEach((d) => {
      totalHoras += d.horas;
      custoColaboradores += d.custoMes;   // = valorHora * horas
      custoHoraSomatorio += d.valorHora;
    });

    // 2. Métricas de equipe
    const horasUnitarias = n > 0 ? totalHoras / n : 0;
    const rateioColab = n > 0 ? cfixo / n : 0;
    const custoHoraUnitario = custoHoraSomatorio + rateioColab;

    // 3. Faturamento
    const custoTotal = custoColaboradores + cfixo;
    const denominador = 1 - marg - imp;
    const faturamentoMinimo = denominador > 0 ? custoTotal / denominador : 0;
    const valorHoraSugerido = horasUnitarias > 0 ? faturamentoMinimo / horasUnitarias : 0;
    const valorHoraAplicado = (fatExtra > 0 && horasUnitarias > 0) ? fatExtra / horasUnitarias : valorHoraSugerido;
    const faturamentoPeriodo = faturamentoMinimo * proj;

    // 4. Líquido meta
    const impostosValor = faturamentoMinimo * imp;
    const liquidoMensal = faturamentoMinimo - impostosValor - custoColaboradores - cfixo;
    const liquidoPeriodo = liquidoMensal * proj;

    // 5. Líquido real (se faturamento real informado)
    const temReal = fatExtra > 0;
    const impostosValorReal = fatExtra * imp;
    const liquidoMensalReal = fatExtra - impostosValorReal - custoColaboradores - cfixo;
    const liquidoPeriodoReal = liquidoMensalReal * proj;
    const margemReal = fatExtra > 0 ? (liquidoMensalReal / fatExtra) * 100 : 0;

    // 6. Antecipação
    const temAntecipacao = antecip > 0;
    const baseParaSaldo = temReal ? liquidoMensalReal : liquidoMensal;
    const saldoMensal = baseParaSaldo - antecip;
    const saldoPeriodo = baseParaSaldo * proj - antecip * proj;

    // 7. Detalhes por colaborador
    const detalhes = detalhesBase.map((d) => ({
      nome: d.nome,
      horasMes: d.horas,
      custoMes: d.custoMes,
      custoHoraBase: d.valorHora,
      custoHoraComRateio: d.valorHora + rateioColab,
      valorHoraVenda: valorHoraSugerido,
    }));

    setResults({
      n, custoColaboradores, custoTotal, rateioColab, totalHoras, horasUnitarias,
      custoHoraSomatorio, custoHoraUnitario,
      faturamentoMinimo, faturamentoPeriodo, valorHoraSugerido, valorHoraAplicado,
      impostosValor, liquidoMensal, liquidoPeriodo, margemMeta: marg * 100,
      temReal, liquidoMensalReal, liquidoPeriodoReal, margemReal, impostosValorReal,
      temAntecipacao, saldoMensal, saldoPeriodo,
      detalhes, horasProjeto: horasProj,
    });
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
        type: 'servicos',
        title: `Serviços — ${fmt(results.valorHoraSugerido)}/h sugerido`,
        inputs: {
          colaboradores: JSON.stringify(colaboradores),
          custoFixo, margem, impostos, projecaoMeses, faturamentoExtra, antecipacaoLucros,
        },
        results: {
          custoHoraUnitario: results.custoHoraUnitario,
          valorHoraSugerido: results.valorHoraSugerido,
          faturamentoMinimo: results.faturamentoMinimo,
          liquidoMensal: results.liquidoMensal,
        },
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
            <Text style={styles.pageTitle}>⏱️ Custo Serviços</Text>
            <Text style={styles.pageDesc}>
              Calcule o custo real de servicos da sua equipe.
            </Text>
          </View>

          {/* ── Colaboradores ─────────────────────────────── */}
          {colaboradores.map((c, index) => (
            <View key={c.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardSection}>
                  Colaborador {index + 1}
                </Text>
                {colaboradores.length > 1 && (
                  <TouchableOpacity onPress={() => removeColaborador(c.id)} style={styles.removeBtn}>
                    <Text style={styles.removeBtnText}>Remover</Text>
                  </TouchableOpacity>
                )}
              </View>
              <InputField
                label="Nome"
                placeholder={`Colaborador ${index + 1}`}
                value={c.nome}
                onChangeText={(v) => updateColaborador(c.id, 'nome', v)}
              />
              <InputField
                label="Salário bruto (R$)"
                placeholder="0,00"
                keyboardType="decimal-pad"
                prefix="R$"
                value={c.salario}
                onChangeText={(v) => updateColaborador(c.id, 'salario', v)}
              />
              <InputField
                label="Encargos (%)"
                hint="Custo patronal: INSS, FGTS, férias, etc. Média: 68%"
                placeholder="68"
                keyboardType="decimal-pad"
                suffix="%"
                value={c.encargos}
                onChangeText={(v) => updateColaborador(c.id, 'encargos', v)}
              />
              <InputField
                label="Horas trabalhadas no mês"
                placeholder="176"
                keyboardType="decimal-pad"
                suffix="h"
                value={c.horasMes}
                onChangeText={(v) => updateColaborador(c.id, 'horasMes', v)}
              />
            </View>
          ))}

          <Button
            title="+ Adicionar colaborador"
            variant="secondary"
            onPress={addColaborador}
            style={styles.addBtn}
          />

          {/* ── Configurações de Cálculo ───────────────────── */}
          <View style={styles.card}>
            <Text style={styles.cardSection}>Configurações de Cálculo</Text>
            <InputField
              label="Custo Fixo Mensal (R$)"
              hint="Aluguel, ferramentas, infraestrutura, etc."
              placeholder="3000"
              keyboardType="decimal-pad"
              prefix="R$"
              value={custoFixo}
              onChangeText={setCustoFixo}
            />
            <InputField
              label="Margem Desejada (%)"
              placeholder="35"
              keyboardType="decimal-pad"
              suffix="%"
              value={margem}
              onChangeText={setMargem}
            />
            <InputField
              label="Carga Tributária (%)"
              hint="Simples, Presumido, Real, DAS/MEI, etc."
              placeholder="16"
              keyboardType="decimal-pad"
              suffix="%"
              value={impostos}
              onChangeText={setImpostos}
            />
            <InputField
              label="Projeção (Meses)"
              placeholder="1"
              keyboardType="decimal-pad"
              value={projecaoMeses}
              onChangeText={setProjecaoMeses}
            />
          </View>

          {/* ── Opcional ──────────────────────────────────── */}
          <View style={styles.card}>
            <Text style={styles.cardSection}>Opcional</Text>
            <InputField
              label="Faturamento Mensal Real (R$)"
              hint="Se informado, calcula a margem real obtida"
              placeholder="0"
              keyboardType="decimal-pad"
              prefix="R$"
              value={faturamentoExtra}
              onChangeText={setFaturamentoExtra}
            />
            <InputField
              label="Antecipação de Lucros Mensal (R$)"
              hint="Valores antecipados/retirados do lucro"
              placeholder="0"
              keyboardType="decimal-pad"
              prefix="R$"
              value={antecipacaoLucros}
              onChangeText={setAntecipacaoLucros}
            />
            <InputField
              label="Horas do Projeto (opcional)"
              hint="Calcula o custo total de mão de obra do projeto"
              placeholder="0"
              keyboardType="decimal-pad"
              suffix="h"
              value={horasProjeto}
              onChangeText={setHorasProjeto}
            />
          </View>

          <Button title="Calcular" onPress={calcular} style={styles.calcBtn} />

          {/* ── Resultados ────────────────────────────────── */}
          {results && (
            <View style={styles.resultsArea}>

              {/* Destaque principal */}
              <View style={styles.highlightRow}>
                <View style={[styles.highlightBox, { backgroundColor: Colors.teal700 }]}>
                  <Text style={styles.highlightLabel}>Custo/Hr Equipe</Text>
                  <Text style={styles.highlightValue}>{fmt(results.custoHoraUnitario)}</Text>
                </View>
                <View style={[styles.highlightBox, { backgroundColor: Colors.purple }]}>
                  <Text style={styles.highlightLabel}>Fat./Hr Sugerido</Text>
                  <Text style={styles.highlightValue}>{fmt(results.valorHoraSugerido)}</Text>
                </View>
                {results.temReal && (
                  <View style={[styles.highlightBox, { backgroundColor: Colors.teal600 }]}>
                    <Text style={styles.highlightLabel}>Fat./Hr Aplicado</Text>
                    <Text style={styles.highlightValue}>{fmt(results.valorHoraAplicado)}</Text>
                  </View>
                )}
              </View>

              {/* Custos */}
              <ResultCard
                title="Custos da Equipe"
                rows={[
                  { label: `Colaboradores (${results.n})`, value: fmt(results.custoColaboradores) },
                  { label: 'Custo Fixo Mensal', value: fmt(parseN(custoFixo)) },
                  { label: 'Custo Total Mensal', value: fmt(results.custoTotal), accent: 'danger' },
                  { label: 'Rateio Custo Fixo/Colab.', value: fmt(results.rateioColab) },
                ]}
              />

              {/* Faturamento */}
              <ResultCard
                title="Faturamento"
                rows={[
                  { label: 'Faturamento Mínimo Mensal', value: fmt(results.faturamentoMinimo), accent: 'info' },
                  { label: `Faturamento Período (${projecaoMeses}m)`, value: fmt(results.faturamentoPeriodo), accent: 'info' },
                  ...(results.temReal
                    ? [{ label: 'Faturamento Mensal Real', value: fmt(parseN(faturamentoExtra)), accent: 'success' as const }]
                    : []),
                ]}
              />

              {/* Resultado */}
              <ResultCard
                title={results.temReal ? `Resultado Real (margem ${fmtPct(results.margemReal)})` : `Resultado Projetado (meta ${fmtPct(results.margemMeta)})`}
                rows={[
                  { label: 'Impostos s/ Faturamento', value: fmt(results.temReal ? results.impostosValorReal : results.impostosValor), accent: 'danger' },
                  { label: 'Líquido Mensal', value: fmt(results.temReal ? results.liquidoMensalReal : results.liquidoMensal), accent: 'success' },
                  { label: `Líquido Período (${projecaoMeses}m)`, value: fmt(results.temReal ? results.liquidoPeriodoReal : results.liquidoPeriodo), accent: 'success' },
                  ...(results.temAntecipacao
                    ? [
                        { label: 'Saldo após Antecipação/Mês', value: fmt(results.saldoMensal), accent: 'warning' as const },
                        { label: `Saldo após Antecipação (${projecaoMeses}m)`, value: fmt(results.saldoPeriodo), accent: 'warning' as const },
                      ]
                    : []),
                ]}
              />

              {/* Projeto */}
              {results.horasProjeto > 0 && (
                <ResultCard
                  title="Simulação de Projeto"
                  rows={[
                    { label: `Horas do projeto`, value: `${results.horasProjeto}h` },
                    { label: 'Custo MO do projeto', value: fmt(results.custoHoraUnitario * results.horasProjeto), accent: 'info' },
                    { label: 'Preço de venda sugerido', value: fmt(results.valorHoraSugerido * results.horasProjeto), accent: 'success' },
                  ]}
                />
              )}

              {/* Detalhamento por colaborador */}
              <ResultCard
                title="Detalhamento por Colaborador"
                rows={results.detalhes.flatMap((d) => [
                  { label: `${d.nome} — ${Math.round(d.horasMes)}h/mês`, value: fmt(d.custoMes) },
                  { label: '  Custo/Hora Base', value: fmt(d.custoHoraBase) },
                  { label: '  Custo/Hora c/ Rateio', value: fmt(d.custoHoraComRateio), accent: 'warning' as const },
                ])}
              />

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
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  cardSection: { fontSize: Typography.xs, fontWeight: Typography.bold, color: Colors.teal600, letterSpacing: 1, textTransform: 'uppercase' },
  removeBtn: { backgroundColor: Colors.danger + '15', borderRadius: Radius.sm, paddingHorizontal: Spacing.sm, paddingVertical: 4 },
  removeBtnText: { color: Colors.danger, fontSize: Typography.xs, fontWeight: Typography.semibold },
  addBtn: { marginBottom: Spacing.md },
  calcBtn: { marginBottom: Spacing.lg },
  resultsArea: { gap: Spacing.md },
  highlightRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  highlightBox: { flex: 1, minWidth: 110, borderRadius: Radius.lg, padding: Spacing.md, alignItems: 'center', ...Shadow.float },
  highlightLabel: { fontSize: Typography.xs, color: '#fff', opacity: 0.85, textAlign: 'center', marginBottom: 4 },
  highlightValue: { fontSize: Typography.md, fontWeight: Typography.bold, color: '#fff', textAlign: 'center' },
  actionRow: { flexDirection: 'row', gap: Spacing.sm },
  actionBtn: { flex: 1 },
});
