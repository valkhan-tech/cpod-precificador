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
  if (margin < 30) return 'info';
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
  markup: number;
}

export default function PrecificadorScreen() {
  const navigation = useNavigation<NavProp>();
  const { isAuthenticated } = useAuth();

  const [nomeProduto, setNomeProduto] = useState('');
  const [custo, setCusto] = useState('');
  const [embalagem, setEmbalagem] = useState('');
  const [taxa, setTaxa] = useState('');
  const [imposto, setImposto] = useState('');
  const [impostoMei, setImpostoMei] = useState('');
  const [margem, setMargem] = useState('');
  const [precoVendaInput, setPrecoVendaInput] = useState('');
  const [quantidade, setQuantidade] = useState('1');
  const [modoImposto, setModoImposto] = useState<'percentual' | 'mei'>('percentual');
  const [modoSimulacao, setModoSimulacao] = useState<'margem' | 'preco'>('margem');
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
    if (modoSimulacao === 'preco') {
      if (pvi <= 0) {
        Alert.alert('Dados inválidos', 'Informe o preço de venda que deseja praticar.');
        return;
      }
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
    const markup = custoUnit > 0 ? ((precoVenda - custoUnit) / custoUnit) * 100 : 0;

    setResults({ precoVenda, investimento, receita, totalTaxa, totalImposto, lucro, margemReal, markup });
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
    setNomeProduto(''); setCusto(''); setEmbalagem(''); setTaxa(''); setImposto('');
    setImpostoMei(''); setMargem(''); setPrecoVendaInput(''); setQuantidade('1');
    setModoImposto('percentual'); setModoSimulacao('margem');
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
            <Text style={styles.cardSection}>Produto</Text>
            <View style={styles.productRow}>
              <View style={styles.productNameField}>
                <InputField
                  label="Nome do produto"
                  placeholder="Ex: Coca-Cola 350ml"
                  value={nomeProduto}
                  onChangeText={setNomeProduto}
                />
              </View>
              <View style={styles.productQtyField}>
                <InputField
                  label="Qtd."
                  hint=""
                  placeholder="1"
                  keyboardType="number-pad"
                  value={quantidade}
                  onChangeText={setQuantidade}
                />
              </View>
            </View>

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
              label="Embalagem ou custos indiretos (R$)"
              hint="Rateie por unidade. Ex: frete R$ 10 em 10 unidades = R$ 1,00/un. Some embalagem, sacola, caixa de envio, etc."
              placeholder="0,00"
              keyboardType="decimal-pad"
              prefix="R$"
              value={embalagem}
              onChangeText={setEmbalagem}
            />

            <View style={styles.sectionRow}>
              <Text style={styles.cardSection}>Taxas e Impostos</Text>
            </View>
            <InputField
              label="Tx da plataforma / Tx Maq. / comissão (%)"
              hint="Ex: Mercado Livre 17%, iFood 12%, Maq. CC 4%"
              placeholder="4"
              keyboardType="decimal-pad"
              suffix="%"
              value={taxa}
              onChangeText={setTaxa}
            />

            {/* Toggle Imposto % / MEI */}
            <View style={[styles.sectionRow, { marginTop: Spacing.sm }]}>
              <Text style={styles.subLabel}>Tipo de imposto</Text>
              <TouchableOpacity
                style={styles.infoBtn}
                onPress={() =>
                  Alert.alert(
                    'Imposto % ou MEI?',
                    'Imposto (%)\nUse para regimes tributários com alíquota sobre o faturamento (Simples Nacional, Lucro Presumido etc.).\n\nMEI (valor fixo)\nO MEI não paga imposto proporcional ao faturamento — paga uma taxa fixa mensal (DAS). Por isso, só faz sentido informá-la ao simular grandes quantidades, pois o custo se dilui entre os produtos. Para simular poucos itens, recomenda-se usar 1% de imposto como estimativa.',
                    [{ text: 'Entendi' }]
                  )
                }
              >
                <Text style={styles.infoBtnText}>ⓘ</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.toggleRow}>
              <TouchableOpacity
                style={[styles.toggleBtn, modoImposto === 'percentual' && styles.toggleBtnActive]}
                onPress={() => { setModoImposto('percentual'); setImpostoMei(''); }}
              >
                <Text style={[styles.toggleText, modoImposto === 'percentual' && styles.toggleTextActive]}>
                  Imposto (%)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, modoImposto === 'mei' && styles.toggleBtnActive]}
                onPress={() => { setModoImposto('mei'); setImposto(''); }}
              >
                <Text style={[styles.toggleText, modoImposto === 'mei' && styles.toggleTextActive]}>
                  MEI (R$)
                </Text>
              </TouchableOpacity>
            </View>
            {modoImposto === 'percentual' ? (
              <InputField
                label="Imposto (%)"
                hint="Para MEI, recomenda-se usar 1% como estimativa por produto"
                placeholder="1"
                keyboardType="decimal-pad"
                suffix="%"
                value={imposto}
                onChangeText={setImposto}
              />
            ) : (
              <InputField
                label="MEI (R$)"
                hint="Valor fixo do DAS mensal — ideal ao simular grandes quantidades"
                placeholder="0,00"
                keyboardType="decimal-pad"
                prefix="R$"
                value={impostoMei}
                onChangeText={setImpostoMei}
              />
            )}

            <View style={styles.sectionRow}>
              <Text style={styles.cardSection}>Margem e Simulação</Text>
              <TouchableOpacity
                style={styles.infoBtn}
                onPress={() =>
                  Alert.alert(
                    'Como funciona?',
                    'Margem de lucro\nInforme a margem desejada e o sistema calculará o preço de venda ideal para atingi-la.\n\nPreço de venda\nInforme o preço que deseja praticar e o sistema calculará a margem de lucratividade real desse preço.',
                    [{ text: 'Entendi' }]
                  )
                }
              >
                <Text style={styles.infoBtnText}>ⓘ</Text>
              </TouchableOpacity>
            </View>

            {/* Toggle Margem / Preço de venda */}
            <View style={styles.toggleRow}>
              <TouchableOpacity
                style={[styles.toggleBtn, modoSimulacao === 'margem' && styles.toggleBtnActive]}
                onPress={() => { setModoSimulacao('margem'); setPrecoVendaInput(''); }}
              >
                <Text style={[styles.toggleText, modoSimulacao === 'margem' && styles.toggleTextActive]}>
                  Margem de lucro
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, modoSimulacao === 'preco' && styles.toggleBtnActive]}
                onPress={() => { setModoSimulacao('preco'); setMargem(''); }}
              >
                <Text style={[styles.toggleText, modoSimulacao === 'preco' && styles.toggleTextActive]}>
                  Preço de venda
                </Text>
              </TouchableOpacity>
            </View>

            {modoSimulacao === 'margem' ? (
              <InputField
                label="Margem de lucro desejada (%)"
                hint="O preço de venda será calculado para atingir essa margem"
                placeholder="30"
                keyboardType="decimal-pad"
                suffix="%"
                value={margem}
                min={0}
                max={99}
                maxLength={2}
                onChangeText={setMargem}
              />
            ) : (
              <InputField
                label="Preço de venda (R$)"
                hint="Informe o preço que deseja praticar para validar a margem real"
                placeholder="0,00"
                keyboardType="decimal-pad"
                prefix="R$"
                value={precoVendaInput}
                onChangeText={setPrecoVendaInput}
              />
            )}

            <Button title="Calcular" onPress={calcular} style={styles.calcBtn} />
          </View>

          {/* Resultados */}
          {results && (() => {
            const qtd = parseInt(quantidade, 10) || 1;
            const isMulti = qtd > 1;
            const u = (total: number) => fmt(total / qtd);
            return (
            <View style={styles.resultsArea}>
              {/* Preço sugerido destaque */}
              <View style={styles.priceHighlight}>
                <Text style={styles.priceLabel}>
                  {modoSimulacao === 'margem' ? 'Preço sugerido de venda' : 'Preço de venda informado'}
                </Text>
                <Text style={styles.priceValue}>{fmt(results.precoVenda)}</Text>
              </View>

              <View style={styles.resultCardWrapper}>
                <View style={styles.resultCardHeader}>
                  <View style={styles.resultCardTitleRow}>
                    <Text style={styles.resultCardTitle}>
                      {nomeProduto ? nomeProduto : 'Resumo financeiro'}
                    </Text>
                    {nomeProduto ? (
                      <Text style={styles.resultCardQty}>
                        x{quantidade || '1'}
                      </Text>
                    ) : null}
                  </View>
                  <TouchableOpacity
                    style={styles.infoBtn}
                    onPress={() =>
                      Alert.alert(
                        'Margem de lucro vs. Markup',
                        'Muita gente acredita que vender um produto pelo dobro do custo significa ter 100% de lucro — mas isso é markup, não margem.\n\nExemplo:\nCusto R$ 50 → Venda R$ 100\n• Markup = 100%\n• Margem real = lucro ÷ receita = R$ 50 ÷ R$ 100 = 50%\n\nA margem é sempre calculada sobre o preço de venda, não sobre o custo. Além disso, taxas e impostos reduzem ainda mais o lucro real.\n\nUsamos sempre a margem sobre receita, que é o indicador correto para saber quanto do seu faturamento vira lucro.',
                        [{ text: 'Entendi' }]
                      )
                    }
                  >
                    <Text style={styles.infoBtnText}>ⓘ</Text>
                  </TouchableOpacity>
                </View>
                <ResultCard
                  headers={isMulti ? ['', 'Unitário', 'Total'] : undefined}
                  rows={[
                    { label: 'Investimento', value: u(results.investimento), valueAlt: isMulti ? fmt(results.investimento) : undefined },
                    { label: 'Receita', value: u(results.receita), valueAlt: isMulti ? fmt(results.receita) : undefined },
                    { label: 'Taxas pagas', value: u(results.totalTaxa), valueAlt: isMulti ? fmt(results.totalTaxa) : undefined },
                    { label: 'Impostos pagos', value: u(results.totalImposto), valueAlt: isMulti ? fmt(results.totalImposto) : undefined },
                    {
                      label: 'Lucro líquido',
                      value: u(results.lucro),
                      valueAlt: isMulti ? fmt(results.lucro) : undefined,
                      accent: marginAccent(results.margemReal),
                    },
                    {
                      label: 'Margem real',
                      value: `${results.margemReal.toFixed(2)}%`,
                      accent: marginAccent(results.margemReal),
                    },
                    {
                      label: 'Markup (sobre custo)',
                      value: `${results.markup.toFixed(2)}%`,
                    },
                  ]}
                />
              </View>

              {/* Legenda de cores */}
              <View style={styles.legend}>
                <View style={styles.legendGrid}>
                  {[
                    { color: Colors.danger,  label: '< 3%',    desc: 'Risco alto' },
                    { color: Colors.warning, label: '3–10%',   desc: 'Atenção' },
                    { color: Colors.info,    label: '10–30%',  desc: 'Bom' },
                    { color: Colors.success, label: '≥ 30%',   desc: 'Excelente' },
                  ].map((l) => (
                    <View key={l.label} style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: l.color }]} />
                      <Text style={styles.legendLabel}>{l.label}</Text>
                      <Text style={styles.legendDesc}>{l.desc}</Text>
                    </View>
                  ))}
                </View>
                <View style={styles.legendInfo}>
                  <Text style={styles.legendInfoTitle}>Sobre as margens</Text>
                  <Text style={styles.legendInfoText}>
                    A maioria dos negócios opera com margens entre{' '}
                    <Text style={styles.legendInfoBold}>10–20%</Text> — considerado o padrão saudável.
                    Setores específicos como moda, cosméticos e produtos artesanais costumam atingir{' '}
                    <Text style={styles.legendInfoBold}>30–40%</Text>. Margens abaixo de 10% exigem
                    atenção redobrada aos custos.
                  </Text>
                </View>
              </View>

              <View style={styles.actionRow}>
                {/* <Button
                  title="💾 Salvar simulação"
                  onPress={salvar}
                  loading={saving}
                  style={styles.actionBtnSave}
                /> */}
                <Button
                  title="Limpar"
                  variant="neutral"
                  onPress={limpar}
                  style={styles.actionBtnClear}
                />
              </View>
            </View>
            );
          })()}
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
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  subLabel: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    color: Colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  infoBtn: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
  },
  infoBtnText: {
    fontSize: Typography.lg,
    color: Colors.teal600,
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: Colors.bg,
    borderRadius: Radius.md,
    padding: 3,
    marginBottom: Spacing.sm,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: Radius.sm,
  },
  toggleBtnActive: {
    backgroundColor: Colors.teal700,
  },
  toggleText: {
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
    color: Colors.muted,
  },
  toggleTextActive: {
    color: Colors.white,
    fontWeight: Typography.bold,
  },
  calcBtn: { marginTop: Spacing.md },
  productRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'flex-end',
  },
  productNameField: { flex: 3 },
  productQtyField: { flex: 1 },
  resultsArea: { gap: Spacing.md },
  resultCardWrapper: { gap: Spacing.xs },
  resultCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xs,
  },
  resultCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  resultCardTitle: {
    fontSize: Typography.md,
    fontWeight: Typography.semibold,
    color: Colors.text,
  },
  resultCardQty: {
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
    color: Colors.teal600,
  },
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
    gap: Spacing.sm,
    ...Shadow.card,
  },
  legendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    width: '47%',
  },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    color: Colors.text,
  },
  legendDesc: {
    fontSize: Typography.xs,
    color: Colors.muted,
  },
  legendInfo: {
    backgroundColor: Colors.bg,
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    marginTop: Spacing.xs,
  },
  legendInfoTitle: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    color: Colors.teal600,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Spacing.xs,
  },
  legendInfoText: {
    fontSize: Typography.xs,
    color: Colors.muted,
    lineHeight: 17,
  },
  legendInfoBold: {
    fontWeight: Typography.bold,
    color: Colors.text,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionBtnSave: { flex: 65 },
  actionBtnClear: { flex: 25 },
});
