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

interface Colaborador {
  id: string;
  nome: string;
  salario: string;
  encargos: string;
  horasMes: string;
}

interface HoraHomemResult {
  custoHoraTotal: number;
  totalMensal: number;
  colaboradores: Array<{ nome: string; custoHora: number; custoMes: number }>;
}

export default function HoraHomemScreen() {
  const navigation = useNavigation<NavProp>();
  const { isAuthenticated } = useAuth();

  const [colaboradores, setColaboradores] = useState<Colaborador[]>([
    { id: '1', nome: 'Colaborador 1', salario: '', encargos: '68', horasMes: '176' },
  ]);
  const [horasProjeto, setHorasProjeto] = useState('');
  const [results, setResults] = useState<HoraHomemResult | null>(null);
  const [saving, setSaving] = useState(false);

  function addColaborador() {
    const id = String(Date.now());
    setColaboradores((prev) => [
      ...prev,
      { id, nome: `Colaborador ${prev.length + 1}`, salario: '', encargos: '68', horasMes: '176' },
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
      if (!c.salario || parseFloat(c.salario.replace(',', '.')) <= 0) {
        Alert.alert('Dados inválidos', `Informe o salário de "${c.nome}".`);
        return;
      }
    }

    const detalhes = colaboradores.map((c) => {
      const salario = parseFloat(c.salario.replace(',', '.'));
      const encargos = (parseFloat(c.encargos.replace(',', '.')) || 68) / 100;
      const horas = parseFloat(c.horasMes.replace(',', '.')) || 176;
      const custoMes = salario * (1 + encargos);
      const custoHora = custoMes / horas;
      return { nome: c.nome, custoHora, custoMes };
    });

    const custoHoraTotal = detalhes.reduce((sum, d) => sum + d.custoHora, 0);
    const totalMensal = detalhes.reduce((sum, d) => sum + d.custoMes, 0);

    setResults({ custoHoraTotal, totalMensal, colaboradores: detalhes });
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
        type: 'hora-homem',
        title: `Hora-Homem — ${fmt(results.custoHoraTotal)}/h`,
        inputs: { colaboradores: JSON.stringify(colaboradores), horasProjeto },
        results: {
          custoHoraTotal: results.custoHoraTotal,
          totalMensal: results.totalMensal,
        },
      });
      Alert.alert('Salvo!', 'Simulação salva no histórico.');
    } catch (e: unknown) {
      Alert.alert('Erro', e instanceof Error ? e.message : 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  }

  const horasProj = parseFloat(horasProjeto.replace(',', '.')) || 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.pageHeader}>
            <Text style={styles.pageTitle}>⏱️ Custo Hora-Homem</Text>
            <Text style={styles.pageDesc}>
              Calcule o custo real de hora-homem da sua equipe.
            </Text>
          </View>

          {/* Colaboradores */}
          {colaboradores.map((c, index) => (
            <View key={c.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>
                  <InputField
                    label="Nome"
                    placeholder={`Colaborador ${index + 1}`}
                    value={c.nome}
                    onChangeText={(v) => updateColaborador(c.id, 'nome', v)}
                  />
                </Text>
                {colaboradores.length > 1 && (
                  <TouchableOpacity
                    onPress={() => removeColaborador(c.id)}
                    style={styles.removeBtn}
                  >
                    <Text style={styles.removeBtnText}>Remover</Text>
                  </TouchableOpacity>
                )}
              </View>
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

          {/* Horas do projeto */}
          <View style={styles.card}>
            <Text style={styles.cardSection}>Simulação de projeto</Text>
            <InputField
              label="Horas do projeto (opcional)"
              hint="Calcula o custo total de mão de obra do projeto"
              placeholder="0"
              keyboardType="decimal-pad"
              suffix="h"
              value={horasProjeto}
              onChangeText={setHorasProjeto}
            />
          </View>

          <Button title="Calcular" onPress={calcular} style={styles.calcBtn} />

          {/* Resultados */}
          {results && (
            <View style={styles.resultsArea}>
              <View style={styles.priceHighlight}>
                <Text style={styles.priceLabel}>Custo total por hora</Text>
                <Text style={styles.priceValue}>{fmt(results.custoHoraTotal)}/h</Text>
              </View>

              <ResultCard
                title="Resumo da equipe"
                rows={[
                  { label: 'Custo mensal total', value: fmt(results.totalMensal) },
                  ...(horasProj > 0
                    ? [{ label: `Custo do projeto (${horasProj}h)`, value: fmt(results.custoHoraTotal * horasProj), accent: 'info' as const }]
                    : []),
                ]}
              />

              <ResultCard
                title="Por colaborador"
                rows={results.colaboradores.map((d) => ({
                  label: `${d.nome}`,
                  value: `${fmt(d.custoHora)}/h`,
                }))}
              />

              <View style={styles.actionRow}>
                <Button title="💾 Salvar" onPress={salvar} loading={saving} style={styles.actionBtn} />
                <Button title="Limpar" variant="ghost" onPress={() => { setResults(null); }} style={styles.actionBtn} />
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
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardTitle: { flex: 1 },
  cardSection: { fontSize: Typography.xs, fontWeight: Typography.bold, color: Colors.teal600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: Spacing.sm },
  removeBtn: { backgroundColor: Colors.danger + '15', borderRadius: Radius.sm, paddingHorizontal: Spacing.sm, paddingVertical: 4 },
  removeBtnText: { color: Colors.danger, fontSize: Typography.xs, fontWeight: Typography.semibold },
  addBtn: { marginBottom: Spacing.md },
  calcBtn: { marginBottom: Spacing.lg },
  resultsArea: { gap: Spacing.md },
  priceHighlight: { backgroundColor: Colors.cyan + 'ee', borderRadius: Radius.xl, padding: Spacing.lg, alignItems: 'center', ...Shadow.float },
  priceLabel: { fontSize: Typography.sm, color: Colors.teal900, fontWeight: Typography.medium, marginBottom: Spacing.xs },
  priceValue: { fontSize: Typography.xxl, fontWeight: Typography.bold, color: Colors.teal900 },
  actionRow: { flexDirection: 'row', gap: Spacing.sm },
  actionBtn: { flex: 1 },
});
