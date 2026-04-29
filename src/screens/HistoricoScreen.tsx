import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  ListRenderItem,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { deleteSimulation, getSimulations } from '../services/api';
import { Simulation } from '../types/api.types';
import { Colors, Radius, Shadow, Spacing, Typography } from '../constants/theme';
import { MAX_SIMULATIONS } from '../constants/api';

const TYPE_LABEL: Record<string, string> = {
  precificador: '🏷️ Precificador',
  'hora-homem': '⏱️ Hora-Homem',
  lote: '📦 Lote',
};

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso));
}

export default function HistoricoScreen() {
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  async function load(silent = false) {
    if (!silent) setLoading(true);
    try {
      const data = await getSimulations();
      setSimulations(data.simulations);
    } catch {
      // silencia erros de rede
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  function confirmDelete(id: string, title: string) {
    Alert.alert(
      'Excluir simulação',
      `Deseja excluir "${title}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSimulation(id);
              setSimulations((prev) => prev.filter((s) => s.id !== id));
            } catch {
              Alert.alert('Erro', 'Não foi possível excluir.');
            }
          },
        },
      ]
    );
  }

  const renderItem: ListRenderItem<Simulation> = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.cardInfo}>
          <Text style={styles.cardType}>{TYPE_LABEL[item.type] ?? item.type}</Text>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardDate}>{formatDate(item.createdAt)}</Text>
        </View>
        <TouchableOpacity
          onPress={() => confirmDelete(item.id, item.title)}
          style={styles.deleteBtn}
        >
          <Text style={styles.deleteBtnText}>🗑</Text>
        </TouchableOpacity>
      </View>

      {/* Preview dos resultados */}
      <View style={styles.resultsPreview}>
        {Object.entries(item.results)
          .slice(0, 3)
          .map(([key, value]) => (
            <View key={key} style={styles.resultItem}>
              <Text style={styles.resultKey}>{key.replace(/_/g, ' ')}</Text>
              <Text style={styles.resultVal}>
                {typeof value === 'number'
                  ? key.toLowerCase().includes('margem')
                    ? `${(value as number).toFixed(2)}%`
                    : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value as number)
                  : String(value)}
              </Text>
            </View>
          ))}
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.teal500} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>💾 Histórico</Text>
        <Text style={styles.headerSub}>
          {simulations.length}/{MAX_SIMULATIONS} simulações salvas
        </Text>
      </View>

      {simulations.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyTitle}>Nenhuma simulação salva</Text>
          <Text style={styles.emptyDesc}>
            Use as calculadoras e toque em "Salvar simulação" para guardar aqui.
          </Text>
        </View>
      ) : (
        <FlatList
          data={simulations}
          keyExtractor={(s) => s.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load(true); }}
              tintColor={Colors.teal500}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.bg,
  },
  headerTitle: { fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.text },
  headerSub: { fontSize: Typography.sm, color: Colors.muted, marginTop: 2 },
  list: { padding: Spacing.lg, gap: Spacing.md, paddingBottom: Spacing.xxl },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    ...Shadow.card,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start' },
  cardInfo: { flex: 1 },
  cardType: { fontSize: Typography.xs, color: Colors.muted, marginBottom: 2 },
  cardTitle: { fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.text },
  cardDate: { fontSize: Typography.xs, color: Colors.subtle, marginTop: 2 },
  deleteBtn: { padding: Spacing.xs },
  deleteBtnText: { fontSize: 18 },
  resultsPreview: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 4,
  },
  resultItem: { flexDirection: 'row', justifyContent: 'space-between' },
  resultKey: { fontSize: Typography.xs, color: Colors.muted, textTransform: 'capitalize' },
  resultVal: { fontSize: Typography.xs, fontWeight: Typography.semibold, color: Colors.teal700 },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  emptyIcon: { fontSize: 56, marginBottom: Spacing.md },
  emptyTitle: {
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    color: Colors.text,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: Typography.sm,
    color: Colors.muted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.xl,
  },
  emptyBtn: { width: '100%', marginBottom: Spacing.sm },
});
