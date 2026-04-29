export const API_BASE_URL = 'https://api.cpod.com.br/v1';

export const ENDPOINTS = {
  login: '/auth/login',
  register: '/auth/register',
  logout: '/auth/logout',
  refreshToken: '/auth/refresh',
  simulations: '/simulations',
  simulationById: (id: string) => `/simulations/${id}`,
};

export const MAX_SIMULATIONS = 10;

// ─── Mock delay (simula latência de rede) ─────────────────────────────────────
export const MOCK_DELAY_MS = 600;
