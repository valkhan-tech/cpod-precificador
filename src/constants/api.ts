export const API_BASE_URL = 'https://api.cpod.com.br/v1';

export const ENDPOINTS = {
  // Auth
  login: '/auth/login',
  register: '/auth/register',
  logout: '/auth/logout',
  refreshToken: '/auth/refresh',
  // Simulações
  simulations: '/simulations',
  simulationById: (id: string) => `/simulations/${id}`,
  // Equipes (Premium)
  equipes: '/equipes',
  equipeById: (id: string) => `/equipes/${id}`,
  // Configurações padrão (Premium)
  defaultsProdutos: '/config/defaults/produtos',
  defaultsHoraHomem: '/config/defaults/hora_homem',
  // Assinatura (Premium)
  assinaturaStatus: '/assinaturas/status',
  assinaturaCheckout: '/assinaturas/checkout',
};

export const MAX_SIMULATIONS = 10;
export const MAX_EQUIPES = 20;

// ─── Planos de assinatura ─────────────────────────────────────────────────────
export const PLANOS = {
  mensal: { label: 'Mensal', valor: 9.90, periodo: '/ mês' },
  anual:  { label: 'Anual',  valor: 99.90, periodo: '/ ano', economia: 'Economize R$\u00a019,00' },
} as const;

// ─── Mock delay (simula latência de rede) ─────────────────────────────────────
export const MOCK_DELAY_MS = 600;
