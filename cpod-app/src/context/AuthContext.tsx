import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { login as apiLogin, logout as apiLogout, register as apiRegister, setAccessToken } from '../services/api';
import { AuthUser, LoginRequest, RegisterRequest } from '../types/api.types';

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  login: (payload: LoginRequest) => Promise<void>;
  register: (payload: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
}

const ACCESS_TOKEN_KEY = 'cpod_access_token';
const REFRESH_TOKEN_KEY = 'cpod_refresh_token';
const USER_KEY = 'cpod_user';

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // Restaura sessão salva ao abrir o app
  useEffect(() => {
    (async () => {
      try {
        const [token, userJson] = await Promise.all([
          SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
          SecureStore.getItemAsync(USER_KEY),
        ]);
        if (token && userJson) {
          setAccessToken(token);
          setState({ user: JSON.parse(userJson), isLoading: false, isAuthenticated: true });
        } else {
          setState((s) => ({ ...s, isLoading: false }));
        }
      } catch {
        setState((s) => ({ ...s, isLoading: false }));
      }
    })();
  }, []);

  const login = useCallback(async (payload: LoginRequest) => {
    const { user, tokens } = await apiLogin(payload);
    await Promise.all([
      SecureStore.setItemAsync(ACCESS_TOKEN_KEY, tokens.accessToken),
      SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refreshToken),
      SecureStore.setItemAsync(USER_KEY, JSON.stringify(user)),
    ]);
    setAccessToken(tokens.accessToken);
    setState({ user, isLoading: false, isAuthenticated: true });
  }, []);

  const register = useCallback(async (payload: RegisterRequest) => {
    const { user, tokens } = await apiRegister(payload);
    await Promise.all([
      SecureStore.setItemAsync(ACCESS_TOKEN_KEY, tokens.accessToken),
      SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refreshToken),
      SecureStore.setItemAsync(USER_KEY, JSON.stringify(user)),
    ]);
    setAccessToken(tokens.accessToken);
    setState({ user, isLoading: false, isAuthenticated: true });
  }, []);

  const logout = useCallback(async () => {
    await apiLogout().catch(() => {});
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
      SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
      SecureStore.deleteItemAsync(USER_KEY),
    ]);
    setAccessToken(null);
    setState({ user: null, isLoading: false, isAuthenticated: false });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
