export type SimulationType = 'precificador' | 'hora-homem' | 'lote';

// ─── Auth ─────────────────────────────────────────────────────────────────────
export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: AuthUser;
  tokens: AuthTokens;
}

// ─── Simulações ───────────────────────────────────────────────────────────────
export interface Simulation {
  id: string;
  userId: string;
  type: SimulationType;
  title: string;
  inputs: Record<string, number | string>;
  results: Record<string, number | string>;
  createdAt: string;
}

export interface SaveSimulationRequest {
  type: SimulationType;
  title: string;
  inputs: Record<string, number | string>;
  results: Record<string, number | string>;
}

export interface SimulationListResponse {
  simulations: Simulation[];
  total: number;
}

// ─── Erros da API ─────────────────────────────────────────────────────────────
export interface ApiError {
  code: string;
  message: string;
}
