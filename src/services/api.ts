/**
 * API Service — cPod Precificador
 *
 * Em produção, as chamadas vão para https://api.cpod.com.br/v1.
 * Enquanto o backend não está disponível, todas as funções retornam
 * dados mock após um delay simulado, documentando o contrato esperado.
 *
 * ─── Contratos de Request/Response ───────────────────────────────────────────
 *
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
 *
 * ─── Endpoints Premium ────────────────────────────────────────────────────────
 *
 * GET /equipes                       [Premium]
 *   headers: Authorization: Bearer <accessToken>
 *   200:     { equipes: Equipe[] }
 *
 * POST /equipes                      [Premium]
 *   headers: Authorization: Bearer <accessToken>
 *   body:    { nome: string, colaboradores: EquipeColaborador[] }
 *   201:     Equipe
 *   403:     { code: "PREMIUM_REQUIRED", message: "..." }
 *   403:     { code: "LIMIT_REACHED", message: "Limite de 20 equipes atingido." }
 *
 * DELETE /equipes/:id                [Premium]
 *   headers: Authorization: Bearer <accessToken>
 *   204:     (no body)
 *
 * GET /config/defaults/produtos      [Premium]
 *   headers: Authorization: Bearer <accessToken>
 *   200:     DefaultsProdutos
 *
 * PUT /config/defaults/produtos      [Premium]
 *   headers: Authorization: Bearer <accessToken>
 *   body:    DefaultsProdutos
 *   200:     DefaultsProdutos
 *
 * GET /config/defaults/hora_homem    [Premium]
 *   headers: Authorization: Bearer <accessToken>
 *   200:     DefaultsHoraHomem
 *
 * PUT /config/defaults/hora_homem    [Premium]
 *   headers: Authorization: Bearer <accessToken>
 *   body:    DefaultsHoraHomem
 *   200:     DefaultsHoraHomem
 *
 * GET /assinaturas/status
 *   headers: Authorization: Bearer <accessToken>
 *   200:     { assinatura: Assinatura | null }
 *
 * POST /assinaturas/checkout
 *   headers: Authorization: Bearer <accessToken>
 *   body:    { plano: PlanoAssinatura }
 *   200:     { checkoutUrl: string }   ← URL para gateway de pagamento (Stripe, etc.)
 *   400:     { code: "ALREADY_SUBSCRIBED", message: "..." }
 */

import {
  API_BASE_URL,
  ENDPOINTS,
  MAX_SIMULATIONS,
  MOCK_DELAY_MS,
} from '../constants/api';
import {
  AuthResponse,
  Assinatura,
  CheckoutRequest,
  CheckoutResponse,
  LoginRequest,
  PlanoAssinatura,
  RegisterRequest,
  SaveSimulationRequest,
  Simulation,
  SimulationListResponse,
} from '../types/api.types';
import {
  getEquipes as storageGetEquipes,
  saveEquipe as storageSaveEquipe,
  deleteEquipe as storageDeleteEquipe,
  getDefaultsProdutos as storageGetDefaultsProdutos,
  saveDefaultsProdutos as storageSaveDefaultsProdutos,
  getDefaultsHoraHomem as storageGetDefaultsHoraHomem,
  saveDefaultsHoraHomem as storageSaveDefaultsHoraHomem,
  Equipe,
  EquipeColaborador,
  DefaultsProdutos,
  DefaultsHoraHomem,
} from './storage';

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

// ─── Mock store (somente em dev / quando API não responde) ────────────────────
const MOCK_SIMULATIONS: Simulation[] = [];
let mockIdCounter = 1;

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
  // TODO: trocar por chamada real
  // return apiCall<SimulationListResponse>(ENDPOINTS.simulations);

  await delay(MOCK_DELAY_MS);
  return { simulations: [...MOCK_SIMULATIONS].reverse(), total: MOCK_SIMULATIONS.length };
}

export async function saveSimulation(payload: SaveSimulationRequest): Promise<Simulation> {
  // TODO: trocar por chamada real
  // return apiCall<Simulation>(ENDPOINTS.simulations, { method: 'POST', body: JSON.stringify(payload) });

  await delay(MOCK_DELAY_MS);

  if (MOCK_SIMULATIONS.length >= MAX_SIMULATIONS) {
    throw new Error('Você atingiu o limite de 10 simulações salvas. Exclua uma para continuar.');
  }

  const simulation: Simulation = {
    id: `sim_${mockIdCounter++}`,
    userId: 'usr_1',
    type: payload.type,
    title: payload.title,
    inputs: payload.inputs,
    results: payload.results,
    createdAt: new Date().toISOString(),
  };
  MOCK_SIMULATIONS.push(simulation);
  return simulation;
}

export async function deleteSimulation(id: string): Promise<void> {
  // TODO: trocar por chamada real
  // await apiCall<void>(ENDPOINTS.simulationById(id), { method: 'DELETE' });

  await delay(MOCK_DELAY_MS);
  const idx = MOCK_SIMULATIONS.findIndex((s) => s.id === id);
  if (idx !== -1) MOCK_SIMULATIONS.splice(idx, 1);
}

// ─── Equipes (Premium) ────────────────────────────────────────────────────────

export async function getEquipesList(): Promise<Equipe[]> {
  // TODO: return apiCall<{ equipes: Equipe[] }>(ENDPOINTS.equipes).then(r => r.equipes);
  await delay(MOCK_DELAY_MS);
  return storageGetEquipes();
}

export async function createEquipe(nome: string, colaboradores: EquipeColaborador[]): Promise<Equipe> {
  // TODO: return apiCall<Equipe>(ENDPOINTS.equipes, { method: 'POST', body: JSON.stringify({ nome, colaboradores }) });
  await delay(MOCK_DELAY_MS);
  return storageSaveEquipe(nome, colaboradores);
}

export async function removeEquipe(id: string): Promise<void> {
  // TODO: await apiCall<void>(ENDPOINTS.equipeById(id), { method: 'DELETE' });
  await delay(MOCK_DELAY_MS);
  return storageDeleteEquipe(id);
}

// ─── Configurações Padrão (Premium) ──────────────────────────────────────────

export async function fetchDefaultsProdutos(): Promise<DefaultsProdutos> {
  // TODO: return apiCall<DefaultsProdutos>(ENDPOINTS.defaultsProdutos);
  await delay(MOCK_DELAY_MS);
  return storageGetDefaultsProdutos();
}

export async function updateDefaultsProdutos(d: DefaultsProdutos): Promise<DefaultsProdutos> {
  // TODO: return apiCall<DefaultsProdutos>(ENDPOINTS.defaultsProdutos, { method: 'PUT', body: JSON.stringify(d) });
  await delay(MOCK_DELAY_MS);
  await storageSaveDefaultsProdutos(d);
  return d;
}

export async function fetchDefaultsHoraHomem(): Promise<DefaultsHoraHomem> {
  // TODO: return apiCall<DefaultsHoraHomem>(ENDPOINTS.defaultsHoraHomem);
  await delay(MOCK_DELAY_MS);
  return storageGetDefaultsHoraHomem();
}

export async function updateDefaultsHoraHomem(d: DefaultsHoraHomem): Promise<DefaultsHoraHomem> {
  // TODO: return apiCall<DefaultsHoraHomem>(ENDPOINTS.defaultsHoraHomem, { method: 'PUT', body: JSON.stringify(d) });
  await delay(MOCK_DELAY_MS);
  await storageSaveDefaultsHoraHomem(d);
  return d;
}

// ─── Assinatura (Premium) ─────────────────────────────────────────────────────

export async function getAssinaturaStatus(): Promise<Assinatura | null> {
  // TODO: return apiCall<{ assinatura: Assinatura | null }>(ENDPOINTS.assinaturaStatus).then(r => r.assinatura);
  await delay(MOCK_DELAY_MS);
  return null; // mock: nenhuma assinatura ativa
}

export async function initiateCheckout(plano: PlanoAssinatura): Promise<CheckoutResponse> {
  // TODO: return apiCall<CheckoutResponse>(ENDPOINTS.assinaturaCheckout, { method: 'POST', body: JSON.stringify({ plano }) });
  await delay(MOCK_DELAY_MS);
  // Mock: retorna uma URL simulada (em produção seria Stripe, etc.)
  return { checkoutUrl: `https://checkout.cpod.com.br/${plano}?mock=true` };
}
