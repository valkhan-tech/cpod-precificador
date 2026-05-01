/**
 * Local Storage Service — cPod Precificador
 *
 * Funções de persistência local via AsyncStorage.
 * Usado como fallback e cache para recursos premium que também
 * existem no backend (equipes, configurações padrão).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  equipes: 'cpod_equipes',
  defaultsProdutos: 'cpod_defaults_produtos',
  defaultsHoraHomem: 'cpod_defaults_hora_homem',
} as const;

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface EquipeColaborador {
  id: string;
  nome: string;
  salario: string;
  encargos: string;
  horasMes: string;
  ativo: boolean;
}

export interface Equipe {
  id: string;
  nome: string;
  colaboradores: EquipeColaborador[];
  criadaEm: string;
}

export interface DefaultsProdutos {
  custo: string;
  embalagem: string;
  taxa: string;
  imposto: string;
  margem: string;
  quantidade: string;
}

export interface DefaultsHoraHomem {
  custoFixo: string;
  margem: string;
  impostos: string;
  encargosDefault: string;
  horasMesDefault: string;
}

// ─── Valores padrão (base) ────────────────────────────────────────────────────

export const DEFAULT_PRODUTOS: DefaultsProdutos = {
  custo: '',
  embalagem: '',
  taxa: '',
  imposto: '',
  margem: '',
  quantidade: '1',
};

export const DEFAULT_HORA_HOMEM: DefaultsHoraHomem = {
  custoFixo: '3000',
  margem: '35',
  impostos: '16',
  encargosDefault: '68',
  horasMesDefault: '176',
};

// ─── Equipes ──────────────────────────────────────────────────────────────────

export async function getEquipes(): Promise<Equipe[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.equipes);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveEquipe(nome: string, colaboradores: EquipeColaborador[]): Promise<Equipe> {
  const equipes = await getEquipes();
  const nova: Equipe = {
    id: String(Date.now()),
    nome,
    colaboradores,
    criadaEm: new Date().toISOString(),
  };
  equipes.push(nova);
  await AsyncStorage.setItem(KEYS.equipes, JSON.stringify(equipes));
  return nova;
}

export async function deleteEquipe(id: string): Promise<void> {
  const equipes = await getEquipes();
  await AsyncStorage.setItem(
    KEYS.equipes,
    JSON.stringify(equipes.filter((e) => e.id !== id))
  );
}

// ─── Defaults Produtos ────────────────────────────────────────────────────────

export async function getDefaultsProdutos(): Promise<DefaultsProdutos> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.defaultsProdutos);
    return raw ? { ...DEFAULT_PRODUTOS, ...JSON.parse(raw) } : DEFAULT_PRODUTOS;
  } catch {
    return DEFAULT_PRODUTOS;
  }
}

export async function saveDefaultsProdutos(d: DefaultsProdutos): Promise<void> {
  await AsyncStorage.setItem(KEYS.defaultsProdutos, JSON.stringify(d));
}

// ─── Defaults Hora Homem ──────────────────────────────────────────────────────

export async function getDefaultsHoraHomem(): Promise<DefaultsHoraHomem> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.defaultsHoraHomem);
    return raw ? { ...DEFAULT_HORA_HOMEM, ...JSON.parse(raw) } : DEFAULT_HORA_HOMEM;
  } catch {
    return DEFAULT_HORA_HOMEM;
  }
}

export async function saveDefaultsHoraHomem(d: DefaultsHoraHomem): Promise<void> {
  await AsyncStorage.setItem(KEYS.defaultsHoraHomem, JSON.stringify(d));
}
