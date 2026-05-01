export type SimulationType = 'precificador' | 'servicos' | 'lote' | 'grupo_compra';

export type PlanoAssinatura = 'mensal' | 'anual';

// ─── Auth ─────────────────────────────────────────────────────────────────────
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  isPremium?: boolean; // controlado pelo backend; ausente = false
}

// ─── Assinatura ───────────────────────────────────────────────────────────────
export interface Assinatura {
  id: string;
  userId: string;
  plano: PlanoAssinatura;
  ativo: boolean;
  validoAte: string; // ISO date
  valor: number;
}

export interface CheckoutRequest {
  plano: PlanoAssinatura;
}

export interface CheckoutResponse {
  checkoutUrl: string; // URL do gateway de pagamento (Stripe, etc.)
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
