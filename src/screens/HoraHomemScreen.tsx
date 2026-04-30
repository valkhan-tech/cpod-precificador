import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Dimensions,
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

const CARD_WIDTH = Dimensions.get('window').width - Spacing.lg * 2;

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
  ativo: boolean;
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
    { id: '1', nome: '', salario: '', encargos: '68', horasMes: '176', ativo: true },
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
  const [activeColabIndex, setActiveColabIndex] = useState(0);
  const colabScrollRef = useRef<ScrollView>(null);

  function scrollToColab(index: number) {
    colabScrollRef.current?.scrollTo({ x: index * CARD_WIDTH, animated: true });
    setActiveColabIndex(index);
  }

  function addColaborador() {
    const id = String(Date.now());
    setColaboradores((prev) => {
      const next = [...prev, { id, nome: '', salario: '', encargos: '68', horasMes: '176', ativo: true }];
      setTimeout(() => scrollToColab(next.length - 1), 80);
      return next;
    });
  }

  function removeColaborador(id: string) {
    if (colaboradores.length <= 1) return;
    setColaboradores((prev) => {
      const next = prev.filter((c) => c.id !== id);
      const newIndex = Math.min(activeColabIndex, next.length - 1);
      setTimeout(() => scrollToColab(newIndex), 80);
      return next;
    });
  }

  function toggleColaboradorAtivo(id: string) {
    setColaboradores((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ativo: !c.ativo } : c))
    );
  }

  function updateColaborador(id: string, field: keyof Colaborador, value: string) {
    setColaboradores((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  }

  function calcular() {
    const ativos = colaboradores.filter((c) => c.ativo);
    if (ativos.length === 0) {
      Alert.alert('Dados inválidos', 'Ative pelo menos um colaborador para calcular.');
      return;
    }
    for (const c of ativos) {
      if (!c.salario || parseN(c.salario) <= 0) {
        const label = c.nome.trim() || `colaborador ${ativos.indexOf(c) + 1}`;
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
    const n = ativos.length;

    // 1. Custo dos colaboradores (somente ativos)
    const detalhesBase = ativos.map((c, i) => {
      const salario = parseN(c.salario);
      const enc = (parseN(c.encargos) || 68) / 100;
      const horas = parseN(c.horasMes) || 176;
      // custo/hora base = (salário bruto + encargos) / horas mês
      const custoMes = salario * (1 + enc);
      const custoHoraBase = custoMes / horas;
      return { nome: c.nome.trim() || `Colaborador ${i + 1}`, salario, enc, horas, custoMes, custoHoraBase };
    });

    let totalHoras = 0;
    let custoColaboradores = 0;

    detalhesBase.forEach((d) => {
      totalHoras += d.horas;
      custoColaboradores += d.custoMes;
    });

    // 2. Métricas de equipe (sem impostos — impostos só incidem sobre faturamento)
    const horasUnitarias = n > 0 ? totalHoras / n : 0;
    const rateioColab = n > 0 ? cfixo / n : 0;
    // custoHoraBase = (salário * (1+enc)) / horas
    // custoHoraComRateio = (salário * (1+enc) + rateio) / horas
    const custoHoraSomatorio = detalhesBase.reduce((acc, d) => acc + d.custoHoraBase, 0);
    const custoHoraUnitario = detalhesBase.reduce(
      (acc, d) => acc + (d.custoMes + rateioColab) / d.horas, 0
    );

    // 3. Faturamento — impostos aplicados apenas aqui, sem bi-tributação
    const custoTotal = custoColaboradores + cfixo; // apenas custos diretos
    const denominador = 1 - marg - imp;
    const faturamentoMinimo = denominador > 0 ? custoTotal / denominador : 0;
    const valorHoraSugerido = horasUnitarias > 0 ? faturamentoMinimo / horasUnitarias : 0;
    const valorHoraAplicado = (fatExtra > 0 && horasUnitarias > 0) ? fatExtra / horasUnitarias : valorHoraSugerido;
    const faturamentoPeriodo = faturamentoMinimo * proj;

    // 4. Líquido meta
    const impostosValor = faturamentoMinimo * imp;
    const liquidoMensal = faturamentoMinimo - impostosValor - custoTotal;
    const liquidoPeriodo = liquidoMensal * proj;

    // 5. Líquido real
    const temReal = fatExtra > 0;
    const impostosValorReal = fatExtra * imp;
    const liquidoMensalReal = fatExtra - impostosValorReal - custoTotal;
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
      custoHoraBase: d.custoHoraBase,
      custoHoraComRateio: (d.custoMes + rateioColab) / d.horas,
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
          <View style={styles.colabWrapper}>
            {/* Barra de navegação */}
            <View style={styles.colabNavRow}>
              <Text style={styles.colabNavTitle}>
                Colaborador {activeColabIndex + 1} / {colaboradores.length}
              </Text>
              <View style={styles.colabNavActions}>
                <TouchableOpacity
                  style={[styles.navArrow, activeColabIndex === 0 && styles.navArrowDisabled]}
                  onPress={() => activeColabIndex > 0 && scrollToColab(activeColabIndex - 1)}
                  disabled={activeColabIndex === 0}
                >
                  <Text style={styles.navArrowText}>‹</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.navArrow, activeColabIndex === colaboradores.length - 1 && styles.navArrowDisabled]}
                  onPress={() => activeColabIndex < colaboradores.length - 1 && scrollToColab(activeColabIndex + 1)}
                  disabled={activeColabIndex === colaboradores.length - 1}
                >
                  <Text style={styles.navArrowText}>›</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navAddBtn} onPress={addColaborador}>
                  <Text style={styles.navAddBtnText}>+ Adicionar</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Dots */}
            {colaboradores.length > 1 && (
              <View style={styles.dotsRow}>
                {colaboradores.map((_, i) => (
                  <TouchableOpacity key={i} onPress={() => scrollToColab(i)}>
                    <View style={[styles.dot, i === activeColabIndex && styles.dotActive]} />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Scroll horizontal */}
            <ScrollView
              ref={colabScrollRef}
              horizontal
              snapToInterval={CARD_WIDTH}
              decelerationRate="fast"
              disableIntervalMomentum
              showsHorizontalScrollIndicator={false}
              scrollEventThrottle={16}
              onMomentumScrollEnd={(e) => {
                const index = Math.round(e.nativeEvent.contentOffset.x / CARD_WIDTH);
                setActiveColabIndex(index);
              }}
              contentContainerStyle={{ paddingVertical: Spacing.md, paddingHorizontal: Spacing.sm }}
            >
              {colaboradores.map((c, index) => (
                <View key={c.id} style={[styles.card, styles.colabCard, !c.ativo && styles.colabCardInativo]}>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderLeft}>
                      <TouchableOpacity
                        style={[styles.checkbox, c.ativo && styles.checkboxActive]}
                        onPress={() => toggleColaboradorAtivo(c.id)}
                      >
                        {c.ativo && <Text style={styles.checkboxCheck}>✓</Text>}
                      </TouchableOpacity>
                      <Text style={[styles.cardSection, !c.ativo && styles.cardSectionInativo]}>
                        Colaborador {index + 1}{!c.ativo ? ' (inativo)' : ''}
                      </Text>
                    </View>
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
            </ScrollView>
          </View>

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
                  { label: `Mão de obra (${results.n} ativo${results.n !== 1 ? 's' : ''})`, value: fmt(results.custoColaboradores) },
                  { label: 'Custo Fixo Mensal', value: fmt(parseN(custoFixo)) },
                  { label: 'Total de Custos Diretos', value: fmt(results.custoTotal), accent: 'danger' },
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
                {/* <Button title="💾 Salvar simulação" onPress={salvar} loading={saving} style={styles.actionBtnSave} /> */}
                <Button title="Limpar" variant="neutral" onPress={() => setResults(null)} style={styles.actionBtnClear} />
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.teal900 },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, padding: Spacing.lg, paddingBottom: Spacing.xxl, backgroundColor: Colors.bg },
  pageHeader: { marginBottom: Spacing.lg },
  pageTitle: { fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.text, marginBottom: Spacing.xs },
  pageDesc: { fontSize: Typography.sm, color: Colors.muted, lineHeight: 20 },
  card: { backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.lg, marginBottom: Spacing.md, ...Shadow.card },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  cardSection: { fontSize: Typography.xs, fontWeight: Typography.bold, color: Colors.teal600, letterSpacing: 1, textTransform: 'uppercase' },
  cardSectionInativo: { color: Colors.muted },
  colabCardInativo: { opacity: 0.5 },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: Colors.teal600,
    borderColor: Colors.teal600,
  },
  checkboxCheck: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: Typography.bold,
    lineHeight: 14,
  },
  removeBtn: { backgroundColor: Colors.danger + '15', borderRadius: Radius.sm, paddingHorizontal: Spacing.sm, paddingVertical: 4 },
  removeBtnText: { color: Colors.danger, fontSize: Typography.xs, fontWeight: Typography.semibold },
  colabWrapper: { marginBottom: Spacing.md, marginHorizontal: -Spacing.sm },
  colabNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  colabNavTitle: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    color: Colors.teal600,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  colabNavActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  navArrow: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    backgroundColor: Colors.teal700,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navArrowDisabled: {
    backgroundColor: Colors.border,
  },
  navArrowText: {
    color: Colors.white,
    fontSize: 20,
    fontWeight: Typography.bold,
    lineHeight: 24,
  },
  navAddBtn: {
    height: 32,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.sm,
    backgroundColor: Colors.teal50,
    borderWidth: 1.5,
    borderColor: Colors.teal300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navAddBtnText: {
    color: Colors.teal700,
    fontSize: Typography.xs,
    fontWeight: Typography.semibold,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.border,
  },
  dotActive: {
    backgroundColor: Colors.teal600,
    width: 16,
  },
  colabCard: {
    width: CARD_WIDTH,
    marginBottom: 0,
  },
  calcBtn: { marginBottom: Spacing.lg },
  resultsArea: { gap: Spacing.md },
  highlightRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  highlightBox: { flex: 1, minWidth: 110, borderRadius: Radius.lg, padding: Spacing.md, alignItems: 'center', ...Shadow.float },
  highlightLabel: { fontSize: Typography.xs, color: '#fff', opacity: 0.85, textAlign: 'center', marginBottom: 4 },
  highlightValue: { fontSize: Typography.md, fontWeight: Typography.bold, color: '#fff', textAlign: 'center' },
  actionRow: { flexDirection: 'row', gap: Spacing.sm },
  actionBtnSave: { flex: 65 },
  actionBtnClear: { flex: 25 },
});
