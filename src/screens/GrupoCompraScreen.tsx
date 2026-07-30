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
  return v.toFixed(1) + '%';
}
function parseN(s: string) {
  return parseFloat(s.replace(',', '.')) || 0;
}

type MetodoRateio = 'quantidade' | 'valor' | 'igual';

interface Produto {
  id: string;
  nome: string;
  quantidade: string;
  custoUnitario: string;
  precoVenda: string;
}

interface ProdutoResult {
  nome: string;
  quantidade: number;
  custoUnitarioBase: number;
  custoIndiretoUnit: number;
  embalagemUnit: number;
  custoTotalUnit: number;
  precoVenda: number;
  investimento: number;
  receita: number;
  lucro: number;
  margemReal: number;
}

interface GrupoCompraResult {
  produtos: ProdutoResult[];
  custoIndiretoTotal: number;
  metodoRateio: MetodoRateio;
  totalInvestido: number;
  totalReceita: number;
  totalLucro: number;
  margemGeral: number;
  roi: number;
}

// ─── Premium Paywall ─────────────────────────────────────────────────────────
function PremiumGate({ onLogin }: { onLogin: () => void }) {
  return (
    <View style={gateStyles.container}>
      <Text style={gateStyles.icon}>🔒</Text>
      <Text style={gateStyles.title}>Recurso Premium</Text>
      <Text style={gateStyles.desc}>
        O Simulador de Grupo de Compra permite ratear custos indiretos entre produtos,
        calcular o custo real por peça e analisar a rentabilidade consolidada de uma
        operação de compra.
      </Text>
      <View style={gateStyles.featureList}>
        {[
          '📦 Múltiplos produtos por compra',
          '🚚 Rateio de frete e despesas compartilhadas',
          '📊 Rentabilidade consolidada e por item',
          '🏷️ Precificação automática por produto',
          '💰 Valor total do estoque',
        ].map((f) => (
          <View key={f} style={gateStyles.featureRow}>
            <Text style={gateStyles.featureText}>{f}</Text>
          </View>
        ))}
      </View>
      <View style={gateStyles.badge}>
        <Text style={gateStyles.badgeText}>Em breve para assinantes</Text>
      </View>
      <TouchableOpacity style={gateStyles.loginBtn} onPress={onLogin}>
        <Text style={gateStyles.loginBtnText}>Entrar na lista de espera</Text>
      </TouchableOpacity>
    </View>
  );
}

const gateStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },
  icon: { fontSize: 56, marginBottom: Spacing.md },
  title: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    color: Colors.text,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  desc: {
    fontSize: Typography.sm,
    color: Colors.muted,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  featureList: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    gap: Spacing.sm,
    ...Shadow.card,
    marginBottom: Spacing.lg,
  },
  featureRow: { flexDirection: 'row', alignItems: 'center' },
  featureText: { fontSize: Typography.sm, color: Colors.text, lineHeight: 20 },
  badge: {
    backgroundColor: Colors.teal100,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  badgeText: {
    fontSize: Typography.xs,
    color: Colors.teal700,
    fontWeight: Typography.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  loginBtn: {
    width: '100%',
    height: 48,
    backgroundColor: Colors.teal700,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginBtnText: { color: Colors.white, fontWeight: Typography.bold, fontSize: Typography.base },
});

// ─── Tela Principal ───────────────────────────────────────────────────────────
export default function GrupoCompraScreen() {
  const navigation = useNavigation<NavProp>();
  const { isAuthenticated, hasPremium } = useAuth();

  // Produtos
  const [produtos, setProdutos] = useState<Produto[]>([
    { id: '1', nome: '', quantidade: '', custoUnitario: '', precoVenda: '' },
  ]);
  const [activeProdutoIndex, setActiveProdutoIndex] = useState(0);
  const produtoScrollRef = useRef<ScrollView>(null);

  // Grupo
  const [nomeGrupo, setNomeGrupo] = useState('');
  const [metodoRateio, setMetodoRateio] = useState<MetodoRateio>('valor');

  // Custos indiretos
  const [frete, setFrete] = useState('');
  const [outrasDespesas, setOutrasDespesas] = useState('');
  const [embalagemUnit, setEmbalagemUnit] = useState('');

  // Precificação
  const [taxa, setTaxa] = useState('');
  const [impostos, setImpostos] = useState('');
  const [margem, setMargem] = useState('30');

  const [results, setResults] = useState<GrupoCompraResult | null>(null);
  const [saving, setSaving] = useState(false);

  function scrollToProduto(index: number) {
    produtoScrollRef.current?.scrollTo({ x: index * CARD_WIDTH, animated: true });
    setActiveProdutoIndex(index);
  }

  function addProduto() {
    const id = String(Date.now());
    setProdutos((prev) => {
      const next = [...prev, { id, nome: '', quantidade: '', custoUnitario: '', precoVenda: '' }];
      setTimeout(() => scrollToProduto(next.length - 1), 80);
      return next;
    });
  }

  function removeProduto(id: string) {
    if (produtos.length <= 1) return;
    setProdutos((prev) => {
      const next = prev.filter((p) => p.id !== id);
      const newIndex = Math.min(activeProdutoIndex, next.length - 1);
      setTimeout(() => scrollToProduto(newIndex), 80);
      return next;
    });
  }

  function updateProduto(id: string, field: keyof Produto, value: string) {
    setProdutos((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  }

  function calcular() {
    for (const p of produtos) {
      if (!p.quantidade || parseN(p.quantidade) < 1) {
        const label = p.nome.trim() || `produto ${produtos.indexOf(p) + 1}`;
        Alert.alert('Dados inválidos', `Informe a quantidade de "${label}".`);
        return;
      }
      if (!p.custoUnitario || parseN(p.custoUnitario) <= 0) {
        const label = p.nome.trim() || `produto ${produtos.indexOf(p) + 1}`;
        Alert.alert('Dados inválidos', `Informe o custo unitário de "${label}".`);
        return;
      }
    }

    const freteV = parseN(frete);
    const outrasV = parseN(outrasDespesas);
    const embUnit = parseN(embalagemUnit);
    const taxaV = parseN(taxa) / 100;
    const impostosV = parseN(impostos) / 100;
    const margemV = parseN(margem) / 100;
    const custoIndiretoTotal = freteV + outrasV;

    // Bases para rateio
    const qtds = produtos.map((p) => Math.max(1, Math.round(parseN(p.quantidade))));
    const custosBase = produtos.map((p) => parseN(p.custoUnitario));
    const totalQtd = qtds.reduce((a, b) => a + b, 0);
    const totalInvestBase = qtds.reduce((sum, q, i) => sum + q * custosBase[i], 0);

    const rateios = produtos.map((_, i) => {
      if (custoIndiretoTotal === 0) return 0;
      if (metodoRateio === 'quantidade') {
        return custoIndiretoTotal * (qtds[i] / totalQtd);
      }
      if (metodoRateio === 'valor') {
        const investBase = qtds[i] * custosBase[i];
        return totalInvestBase > 0 ? custoIndiretoTotal * (investBase / totalInvestBase) : 0;
      }
      // igual
      return custoIndiretoTotal / produtos.length;
    });

    const denominador = 1 - taxaV - impostosV - margemV;

    const produtosResult: ProdutoResult[] = produtos.map((p, i) => {
      const qtd = qtds[i];
      const custoUnitarioBase = custosBase[i];
      const custoIndiretoUnit = rateios[i] / qtd;
      const custoTotalUnit = custoUnitarioBase + embUnit + custoIndiretoUnit;

      const pvInformado = parseN(p.precoVenda);
      const precoVenda =
        pvInformado > 0
          ? pvInformado
          : denominador > 0
          ? custoTotalUnit / denominador
          : custoTotalUnit;

      const investimento = custoTotalUnit * qtd;
      const receita = precoVenda * qtd;
      const lucro = receita - investimento - receita * taxaV - receita * impostosV;
      const margemReal = receita > 0 ? (lucro / receita) * 100 : 0;

      return {
        nome: p.nome.trim() || `Produto ${i + 1}`,
        quantidade: qtd,
        custoUnitarioBase,
        custoIndiretoUnit,
        embalagemUnit: embUnit,
        custoTotalUnit,
        precoVenda,
        investimento,
        receita,
        lucro,
        margemReal,
      };
    });

    const totalInvestido = produtosResult.reduce((s, p) => s + p.investimento, 0);
    const totalReceita = produtosResult.reduce((s, p) => s + p.receita, 0);
    const totalLucro = produtosResult.reduce((s, p) => s + p.lucro, 0);
    const margemGeral = totalReceita > 0 ? (totalLucro / totalReceita) * 100 : 0;
    const roi = totalInvestido > 0 ? (totalLucro / totalInvestido) * 100 : 0;

    setResults({
      produtos: produtosResult,
      custoIndiretoTotal,
      metodoRateio,
      totalInvestido,
      totalReceita,
      totalLucro,
      margemGeral,
      roi,
    });
  }

  async function salvar() {
    if (!results) return;
    if (!isAuthenticated) {
      Alert.alert('Recurso Premium', 'Salvar simulações é um recurso do cPod Premium, em breve disponível.', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Ver detalhes', onPress: () => navigation.navigate('Premium') },
      ]);
      return;
    }
    setSaving(true);
    try {
      await saveSimulation({
        type: 'grupo_compra',
        title: nomeGrupo.trim()
          ? `Grupo: ${nomeGrupo}`
          : `Grupo — ${produtos.length} produto${produtos.length !== 1 ? 's' : ''}`,
        inputs: {
          nomeGrupo,
          produtos: JSON.stringify(produtos),
          frete,
          outrasDespesas,
          embalagemUnit,
          taxa,
          impostos,
          margem,
          metodoRateio,
        },
        results: {
          totalInvestido: results.totalInvestido,
          totalReceita: results.totalReceita,
          totalLucro: results.totalLucro,
          margemGeral: results.margemGeral,
        },
      });
      Alert.alert('Salvo!', 'Simulação salva no histórico.');
    } catch (e: unknown) {
      Alert.alert('Erro', e instanceof Error ? e.message : 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  }

  function margemAccent(m: number): 'danger' | 'warning' | 'info' | 'success' {
    if (m < 5) return 'danger';
    if (m < 15) return 'warning';
    if (m < 30) return 'info';
    return 'success';
  }

  const METODOS: { key: MetodoRateio; label: string }[] = [
    { key: 'valor', label: 'Por Valor' },
    { key: 'quantidade', label: 'Por Qtd.' },
    { key: 'igual', label: 'Igualitário' },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.pageHeader}>
            <Text style={styles.pageTitle}>🛍️ Grupo de Compra</Text>
            <Text style={styles.pageDesc}>
              Rateie custos de frete e despesas entre produtos, calcule o custo real por
              peça e a rentabilidade da compra.
            </Text>
          </View>

          {/* ── Premium Gate ───────────────────────────── */}
          {!hasPremium ? (
            <PremiumGate onLogin={() => navigation.navigate('Premium')} />
          ) : (
            <>
              {/* ── Nome e Rateio ──────────────────────── */}
              <View style={styles.card}>
                <Text style={styles.cardSection}>Identificação</Text>
                <InputField
                  label="Nome da Compra / Grupo (opcional)"
                  placeholder="Ex: Compra Feira da Moda — Abril"
                  value={nomeGrupo}
                  onChangeText={setNomeGrupo}
                />
                <Text style={styles.fieldLabel}>Método de Rateio do Custo Indireto</Text>
                <Text style={styles.fieldHint}>
                  Como distribuir frete e outras despesas entre os produtos
                </Text>
                <View style={styles.segmented}>
                  {METODOS.map((m) => (
                    <TouchableOpacity
                      key={m.key}
                      style={[styles.segBtn, metodoRateio === m.key && styles.segBtnActive]}
                      onPress={() => setMetodoRateio(m.key)}
                    >
                      <Text
                        style={[
                          styles.segBtnText,
                          metodoRateio === m.key && styles.segBtnTextActive,
                        ]}
                      >
                        {m.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* ── Produtos ───────────────────────────── */}
              <View style={styles.produtosWrapper}>
                <View style={styles.prodNavRow}>
                  <Text style={styles.prodNavTitle}>
                    Produto {activeProdutoIndex + 1} / {produtos.length}
                  </Text>
                  <View style={styles.prodNavActions}>
                    <TouchableOpacity
                      style={[
                        styles.navArrow,
                        activeProdutoIndex === 0 && styles.navArrowDisabled,
                      ]}
                      onPress={() =>
                        activeProdutoIndex > 0 && scrollToProduto(activeProdutoIndex - 1)
                      }
                      disabled={activeProdutoIndex === 0}
                    >
                      <Text style={styles.navArrowText}>‹</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.navArrow,
                        activeProdutoIndex === produtos.length - 1 && styles.navArrowDisabled,
                      ]}
                      onPress={() =>
                        activeProdutoIndex < produtos.length - 1 &&
                        scrollToProduto(activeProdutoIndex + 1)
                      }
                      disabled={activeProdutoIndex === produtos.length - 1}
                    >
                      <Text style={styles.navArrowText}>›</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navAddBtn} onPress={addProduto}>
                      <Text style={styles.navAddBtnText}>+ Adicionar</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {produtos.length > 1 && (
                  <View style={styles.dotsRow}>
                    {produtos.map((_, i) => (
                      <TouchableOpacity key={i} onPress={() => scrollToProduto(i)}>
                        <View style={[styles.dot, i === activeProdutoIndex && styles.dotActive]} />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                <ScrollView
                  ref={produtoScrollRef}
                  horizontal
                  snapToInterval={CARD_WIDTH}
                  decelerationRate="fast"
                  disableIntervalMomentum
                  showsHorizontalScrollIndicator={false}
                  scrollEventThrottle={16}
                  onMomentumScrollEnd={(e) => {
                    const index = Math.round(
                      e.nativeEvent.contentOffset.x / CARD_WIDTH
                    );
                    setActiveProdutoIndex(index);
                  }}
                  contentContainerStyle={{ paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg }}
                >
                  {produtos.map((p, index) => (
                    <View key={p.id} style={[styles.card, styles.prodCard]}>
                      <View style={styles.cardHeader}>
                        <Text style={styles.cardSection}>Produto {index + 1}</Text>
                        {produtos.length > 1 && (
                          <TouchableOpacity
                            onPress={() => removeProduto(p.id)}
                            style={styles.removeBtn}
                          >
                            <Text style={styles.removeBtnText}>Remover</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                      <InputField
                        label="Nome do Produto"
                        placeholder={`Produto ${index + 1}`}
                        value={p.nome}
                        onChangeText={(v) => updateProduto(p.id, 'nome', v)}
                      />
                      <InputField
                        label="Quantidade"
                        placeholder="0"
                        keyboardType="decimal-pad"
                        suffix="un"
                        value={p.quantidade}
                        onChangeText={(v) => updateProduto(p.id, 'quantidade', v)}
                      />
                      <InputField
                        label="Custo Unitário (R$)"
                        placeholder="0,00"
                        keyboardType="decimal-pad"
                        prefix="R$"
                        value={p.custoUnitario}
                        onChangeText={(v) => updateProduto(p.id, 'custoUnitario', v)}
                      />
                      <InputField
                        label="Preço de Venda (R$)"
                        hint="Deixe vazio para calcular automaticamente"
                        placeholder="0,00"
                        keyboardType="decimal-pad"
                        prefix="R$"
                        value={p.precoVenda}
                        onChangeText={(v) => updateProduto(p.id, 'precoVenda', v)}
                      />
                    </View>
                  ))}
                </ScrollView>
              </View>

              {/* ── Custos Indiretos ───────────────────── */}
              <View style={styles.card}>
                <Text style={styles.cardSection}>Custos Indiretos</Text>
                <InputField
                  label="Frete Total da Compra (R$)"
                  hint="Valor será rateado entre os produtos"
                  placeholder="0,00"
                  keyboardType="decimal-pad"
                  prefix="R$"
                  value={frete}
                  onChangeText={setFrete}
                />
                <InputField
                  label="Outras Despesas (R$)"
                  hint="Despachante, seguro, taxas, etc."
                  placeholder="0,00"
                  keyboardType="decimal-pad"
                  prefix="R$"
                  value={outrasDespesas}
                  onChangeText={setOutrasDespesas}
                />
                <InputField
                  label="Embalagem por Unidade (R$)"
                  hint="Aplicado a cada unidade de todos os produtos"
                  placeholder="0,00"
                  keyboardType="decimal-pad"
                  prefix="R$"
                  value={embalagemUnit}
                  onChangeText={setEmbalagemUnit}
                />
              </View>

              {/* ── Precificação ───────────────────────── */}
              <View style={styles.card}>
                <Text style={styles.cardSection}>Precificação</Text>
                <InputField
                  label="Taxa / Marketplace (%)"
                  hint="Comissão da plataforma de venda"
                  placeholder="0"
                  keyboardType="decimal-pad"
                  suffix="%"
                  value={taxa}
                  onChangeText={setTaxa}
                />
                <InputField
                  label="Impostos (%)"
                  hint="Simples, MEI, Presumido, etc."
                  placeholder="0"
                  keyboardType="decimal-pad"
                  suffix="%"
                  value={impostos}
                  onChangeText={setImpostos}
                />
                <InputField
                  label="Margem Desejada (%)"
                  placeholder="30"
                  keyboardType="decimal-pad"
                  suffix="%"
                  value={margem}
                  onChangeText={setMargem}
                />
              </View>

              <Button title="Calcular" onPress={calcular} style={styles.calcBtn} />

              {/* ── Resultados ─────────────────────────── */}
              {results && (
                <View style={styles.resultsArea}>
                  {/* Destaques */}
                  <View style={styles.highlightRow}>
                    <View style={[styles.highlightBox, { backgroundColor: Colors.teal700 }]}>
                      <Text style={styles.highlightLabel}>Valor em Estoque</Text>
                      <Text style={styles.highlightValue}>
                        {fmt(results.totalInvestido)}
                      </Text>
                    </View>
                    <View style={[styles.highlightBox, { backgroundColor: Colors.purple }]}>
                      <Text style={styles.highlightLabel}>Receita Potencial</Text>
                      <Text style={styles.highlightValue}>
                        {fmt(results.totalReceita)}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.highlightBox,
                        {
                          backgroundColor:
                            results.totalLucro >= 0 ? Colors.teal600 : Colors.danger,
                        },
                      ]}
                    >
                      <Text style={styles.highlightLabel}>Lucro Potencial</Text>
                      <Text style={styles.highlightValue}>
                        {fmt(results.totalLucro)}
                      </Text>
                    </View>
                  </View>

                  {/* Consolidado */}
                  <ResultCard
                    title="Resumo da Compra"
                    rows={[
                      {
                        label: `${results.produtos.length} produto${results.produtos.length !== 1 ? 's' : ''}`,
                        value: `${results.produtos.reduce((s, p) => s + p.quantidade, 0)} unidades`,
                      },
                      {
                        label: 'Custo Indireto Total',
                        value: fmt(results.custoIndiretoTotal),
                        accent: 'warning',
                      },
                      {
                        label: 'Total Investido (estoque)',
                        value: fmt(results.totalInvestido),
                        accent: 'danger',
                      },
                      {
                        label: 'Receita Potencial',
                        value: fmt(results.totalReceita),
                        accent: 'info',
                      },
                      {
                        label: 'Lucro Potencial',
                        value: fmt(results.totalLucro),
                        accent: results.totalLucro >= 0 ? 'success' : 'danger',
                      },
                      {
                        label: `Margem Geral`,
                        value: fmtPct(results.margemGeral),
                        accent: margemAccent(results.margemGeral),
                      },
                      {
                        label: 'ROI',
                        value: fmtPct(results.roi),
                        accent: margemAccent(results.roi),
                      },
                    ]}
                  />

                  {/* Detalhamento por produto */}
                  <ResultCard
                    title="Detalhamento por Produto"
                    rows={results.produtos.flatMap((p) => [
                      {
                        label: `${p.nome} (${p.quantidade} un)`,
                        value: fmt(p.custoUnitarioBase),
                      },
                      {
                        label: '  Custo Indireto/Un (rateio)',
                        value: fmt(p.custoIndiretoUnit),
                        accent: 'warning' as const,
                      },
                      {
                        label: '  Custo Total/Un',
                        value: fmt(p.custoTotalUnit),
                        accent: 'danger' as const,
                      },
                      { label: '  Preço de Venda/Un', value: fmt(p.precoVenda) },
                      {
                        label: '  Margem Real',
                        value: fmtPct(p.margemReal),
                        accent: margemAccent(p.margemReal),
                      },
                      {
                        label: '  Lucro do Produto',
                        value: fmt(p.lucro),
                        accent: p.lucro >= 0 ? ('success' as const) : ('danger' as const),
                      },
                    ])}
                  />

                  <View style={styles.actionRow}>
                    <Button
                      title="💾 Salvar simulação"
                      onPress={salvar}
                      loading={saving}
                      style={styles.actionBtnSave}
                    />
                    <Button
                      title="Limpar"
                      variant="neutral"
                      onPress={() => setResults(null)}
                      style={styles.actionBtnClear}
                    />
                  </View>
                </View>
              )}
            </>
          )}
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
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
    backgroundColor: Colors.bg,
  },
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  cardSection: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    color: Colors.teal600,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
  },

  fieldLabel: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    color: Colors.text,
    marginBottom: 2,
  },
  fieldHint: {
    fontSize: Typography.xs,
    color: Colors.muted,
    marginBottom: Spacing.sm,
  },

  segmented: {
    flexDirection: 'row',
    backgroundColor: Colors.bg,
    borderRadius: Radius.lg,
    padding: 3,
    gap: 3,
  },
  segBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  segBtnActive: { backgroundColor: Colors.teal700 },
  segBtnText: {
    fontSize: Typography.xs,
    fontWeight: Typography.semibold,
    color: Colors.muted,
  },
  segBtnTextActive: { color: Colors.white },

  produtosWrapper: { marginBottom: Spacing.md, marginHorizontal: -Spacing.lg },
  prodNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  prodNavTitle: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    color: Colors.teal600,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  prodNavActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  navArrow: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    backgroundColor: Colors.teal700,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navArrowDisabled: { backgroundColor: Colors.border },
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
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.border },
  dotActive: { backgroundColor: Colors.teal600, width: 16 },
  prodCard: { width: CARD_WIDTH, marginBottom: 0 },

  removeBtn: {
    backgroundColor: Colors.danger + '15',
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  removeBtnText: {
    color: Colors.danger,
    fontSize: Typography.xs,
    fontWeight: Typography.semibold,
  },

  calcBtn: { marginBottom: Spacing.lg },

  resultsArea: { gap: Spacing.md },
  highlightRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  highlightBox: {
    flex: 1,
    minWidth: 100,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    ...Shadow.float,
  },
  highlightLabel: {
    fontSize: Typography.xs,
    color: '#fff',
    opacity: 0.85,
    textAlign: 'center',
    marginBottom: 4,
  },
  highlightValue: {
    fontSize: Typography.sm,
    fontWeight: Typography.bold,
    color: '#fff',
    textAlign: 'center',
  },

  actionRow: { flexDirection: 'row', gap: Spacing.sm },
  actionBtnSave: { flex: 65 },
  actionBtnClear: { flex: 25 },
});
