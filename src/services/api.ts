/**
 * API Service — cPod Precificador
 *
 * Em produção, as chamadas vão para https://api.cpod.com.br/v1.
 * Enquanto o backend não está disponível, todas as funções retornam
 * dados mock após um delay simulado, documentando o contrato esperado.
 *
 * Contrato de Request/Response:
 * ─────────────────────────────
 * POST /auth/login
 *   body:    { email: string, password: string }
 *   200:     { user: AuthUser, tokens: AuthTokens }
 *   401:     { code: "INVALID_CREDENTIALS", message: "..." }
 *
 * POST /auth/register
 *   body:    { name: string, email: string, password: string }
 *   201:     { user: AuthUser, tokens: AuthTokens }
 *   409:     { code: "EMAIL_ALREADY_IN_USE", message: "..." }
 *
 * POST /auth/logout
 *   headers: Authorization: Bearer <accessToken>
 *   204:     (no body)
 *
 * GET /simulations
 *   headers: Authorization: Bearer <accessToken>
 *   200:     { simulations: Simulation[], total: number }
 *
 * POST /simulations
 *   headers: Authorization: Bearer <accessToken>
 *   body:    SaveSimulationRequest
 *   201:     Simulation
 *   403:     { code: "LIMIT_REACHED", message: "Limite de 10 simulações atingido." }
 *
 * DELETE /simulations/:id
 *   headers: Authorization: Bearer <accessToken>
 *   204:     (no body)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  API_BASE_URL,
  ENDPOINTS,
  MAX_SIMULATIONS,
  MOCK_DELAY_MS,
} from '../constants/api';
import {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  SaveSimulationRequest,
  Simulation,
  SimulationListResponse,
} from '../types/api.types';

const SIMULATIONS_KEY = 'cpod_simulations';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

let _accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  _accessToken = token;
}

function authHeaders(): Record<string, string> {
  if (!_accessToken) return {};
  return { Authorization: `Bearer ${_accessToken}` };
}

/** Faz uma chamada real à API. Retorna null se o backend não estiver disponível. */
async function apiCall<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...(options.headers ?? {}),
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message ?? `HTTP ${response.status}`);
  }

  return data as T;
}

// ─── Simulações local (AsyncStorage) ─────────────────────────────────────────
let simulationIdCounter = 1;

async function loadSimulations(): Promise<Simulation[]> {
  try {
    const data = await AsyncStorage.getItem(SIMULATIONS_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      const maxId = parsed.reduce((max: number, s: Simulation) => {
        const numId = parseInt(s.id.replace('sim_', ''), 10);
        return numId > max ? numId : max;
      }, 0);
      simulationIdCounter = maxId + 1;
      return parsed;
    }
  } catch {}
  return [];
}

async function saveSimulationsToStorage(simulations: Simulation[]): Promise<void> {
  await AsyncStorage.setItem(SIMULATIONS_KEY, JSON.stringify(simulations));
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export async function login(payload: LoginRequest): Promise<AuthResponse> {
  // TODO: trocar por chamada real quando backend estiver disponível
  // return apiCall<AuthResponse>(ENDPOINTS.login, { method: 'POST', body: JSON.stringify(payload) });

  await delay(MOCK_DELAY_MS);

  if (payload.email === 'demo@cpod.com.br' && payload.password === 'demo1234') {
    return {
      user: { id: 'usr_1', name: 'Usuário Demo', email: payload.email },
      tokens: { accessToken: 'mock_access_token', refreshToken: 'mock_refresh_token' },
    };
  }
  throw new Error('E-mail ou senha incorretos.');
}

export async function register(payload: RegisterRequest): Promise<AuthResponse> {
  // TODO: trocar por chamada real
  // return apiCall<AuthResponse>(ENDPOINTS.register, { method: 'POST', body: JSON.stringify(payload) });

  await delay(MOCK_DELAY_MS);
  return {
    user: { id: `usr_${Date.now()}`, name: payload.name, email: payload.email },
    tokens: { accessToken: 'mock_access_token', refreshToken: 'mock_refresh_token' },
  };
}

export async function logout(): Promise<void> {
  // TODO: trocar por chamada real
  // await apiCall<void>(ENDPOINTS.logout, { method: 'POST' });
  await delay(200);
}

// ─── Simulações ───────────────────────────────────────────────────────────────
export async function getSimulations(): Promise<SimulationListResponse> {
  await delay(MOCK_DELAY_MS);
  const simulations = await loadSimulations();
  return { simulations: simulations.reverse(), total: simulations.length };
}

export async function saveSimulation(payload: SaveSimulationRequest): Promise<Simulation> {
  await delay(MOCK_DELAY_MS);

  const simulations = await loadSimulations();

  if (simulations.length >= MAX_SIMULATIONS) {
    throw new Error('Você atingiu o limite de 10 simulações salvas. Exclua uma para continuar.');
  }

  const simulation: Simulation = {
    id: `sim_${simulationIdCounter++}`,
    userId: 'local',
    type: payload.type,
    title: payload.title,
    inputs: payload.inputs,
    results: payload.results,
    createdAt: new Date().toISOString(),
  };

  simulations.push(simulation);
  await saveSimulationsToStorage(simulations);
  return simulation;
}

export async function deleteSimulation(id: string): Promise<void> {
  await delay(MOCK_DELAY_MS);

  const simulations = await loadSimulations();
  const filtered = simulations.filter((s) => s.id !== id);
  await saveSimulationsToStorage(filtered);
}
