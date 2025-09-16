// Hooks customizados para integração com APIs e serviços externos

import { useState, useEffect, useCallback } from 'react';
import { APIService, CacheService, ConnectionUtils } from '@/lib/api';

// Hook para cotações de criptomoedas
export function useCryptoPrices(cryptoIds: string[], refreshInterval: number = 30000) {
  const [prices, setPrices] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchPrices = useCallback(async () => {
    if (!ConnectionUtils.isOnline()) {
      // Tentar carregar do cache quando offline
      const cached = CacheService.get('crypto_prices');
      if (cached) {
        setPrices(cached);
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const data = await APIService.getCryptoPrices(cryptoIds);
      setPrices(data);
      setLastUpdate(new Date());
      
      // Salvar no cache
      CacheService.set('crypto_prices', data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar cotações');
      
      // Fallback para cache em caso de erro
      const cached = CacheService.get('crypto_prices');
      if (cached) {
        setPrices(cached);
      }
    } finally {
      setLoading(false);
    }
  }, [cryptoIds]);

  useEffect(() => {
    fetchPrices();
    
    const interval = setInterval(fetchPrices, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchPrices, refreshInterval]);

  return { prices, loading, error, lastUpdate, refetch: fetchPrices };
}

// Hook para autenticação
export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Carregar dados do localStorage
    const savedUser = localStorage.getItem('dmccrypto_user');
    const savedToken = localStorage.getItem('dmccrypto_token');
    
    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
      setToken(savedToken);
    }
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await APIService.login(email, password);
      
      setUser(response.user);
      setToken(response.token);
      
      localStorage.setItem('dmccrypto_user', JSON.stringify(response.user));
      localStorage.setItem('dmccrypto_token', response.token);
      
      if (response.refreshToken) {
        localStorage.setItem('dmccrypto_refresh_token', response.refreshToken);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro no login');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: any) => {
    setLoading(true);
    setError(null);

    try {
      const response = await APIService.register(userData);
      
      setUser(response.user);
      setToken(response.token);
      
      localStorage.setItem('dmccrypto_user', JSON.stringify(response.user));
      localStorage.setItem('dmccrypto_token', response.token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro no cadastro');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('dmccrypto_user');
    localStorage.removeItem('dmccrypto_token');
    localStorage.removeItem('dmccrypto_refresh_token');
    CacheService.clear();
  };

  return {
    user,
    token,
    loading,
    error,
    login,
    register,
    logout,
    isAuthenticated: !!user && !!token
  };
}

// Hook para conectividade
export function useConnection() {
  const [isOnline, setIsOnline] = useState(ConnectionUtils.isOnline());
  const [connectionQuality, setConnectionQuality] = useState<'good' | 'poor' | 'offline'>('good');

  useEffect(() => {
    const cleanup = ConnectionUtils.onConnectionChange(setIsOnline);
    
    // Testar qualidade da conexão periodicamente
    const testConnection = async () => {
      if (!isOnline) {
        setConnectionQuality('offline');
        return;
      }

      const start = Date.now();
      try {
        await ConnectionUtils.testConnection();
        const duration = Date.now() - start;
        setConnectionQuality(duration > 2000 ? 'poor' : 'good');
      } catch {
        setConnectionQuality('poor');
      }
    };

    testConnection();
    const interval = setInterval(testConnection, 30000);

    return () => {
      cleanup();
      clearInterval(interval);
    };
  }, [isOnline]);

  return { isOnline, connectionQuality };
}

// Hook para transações
export function useTransactions(token: string | null) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const data = await APIService.getConversions(token);
      setTransactions(data);
      
      // Salvar no localStorage
      localStorage.setItem('dmccrypto_transactions', JSON.stringify(data));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar transações');
      
      // Fallback para localStorage
      const saved = localStorage.getItem('dmccrypto_transactions');
      if (saved) {
        setTransactions(JSON.parse(saved));
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  const createConversion = async (conversionData: any) => {
    if (!token) throw new Error('Token não encontrado');

    try {
      const newTransaction = await APIService.createConversion(token, conversionData);
      setTransactions(prev => [newTransaction, ...prev]);
      return newTransaction;
    } catch (err) {
      throw err;
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return {
    transactions,
    loading,
    error,
    createConversion,
    refetch: fetchTransactions
  };
}

// Hook para notificações
export function useNotifications(token: string | null) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    try {
      const data = await APIService.getNotifications(token);
      setNotifications(data);
      setUnreadCount(data.filter((n: any) => !n.read).length);
    } catch (err) {
      console.error('Erro ao buscar notificações:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const markAsRead = async (notificationId: string) => {
    if (!token) return;

    try {
      await APIService.markNotificationAsRead(token, notificationId);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Erro ao marcar notificação como lida:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    
    // Atualizar notificações a cada 2 minutos
    const interval = setInterval(fetchNotifications, 120000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    refetch: fetchNotifications
  };
}

// Hook para alertas de preço
export function usePriceAlerts(token: string | null) {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAlerts = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    try {
      const data = await APIService.getPriceAlerts(token);
      setAlerts(data);
    } catch (err) {
      console.error('Erro ao buscar alertas:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const createAlert = async (alertData: any) => {
    if (!token) throw new Error('Token não encontrado');

    try {
      const newAlert = await APIService.createPriceAlert(token, alertData);
      setAlerts(prev => [...prev, newAlert]);
      return newAlert;
    } catch (err) {
      throw err;
    }
  };

  const deleteAlert = async (alertId: string) => {
    if (!token) return;

    try {
      await APIService.deletePriceAlert(token, alertId);
      setAlerts(prev => prev.filter(a => a.id !== alertId));
    } catch (err) {
      console.error('Erro ao deletar alerta:', err);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  return {
    alerts,
    loading,
    createAlert,
    deleteAlert,
    refetch: fetchAlerts
  };
}

// Hook para sincronização de dados
export function useDataSync(token: string | null) {
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const syncData = async () => {
    if (!token) return;

    setSyncing(true);
    try {
      const deviceId = localStorage.getItem('device_id') || 
        Math.random().toString(36).substring(2, 15);
      
      if (!localStorage.getItem('device_id')) {
        localStorage.setItem('device_id', deviceId);
      }

      await APIService.syncData(token, deviceId);
      setLastSync(new Date());
    } catch (err) {
      console.error('Erro na sincronização:', err);
    } finally {
      setSyncing(false);
    }
  };

  const createBackup = async () => {
    if (!token) return;

    try {
      const backup = await APIService.backupUserData(token);
      return backup;
    } catch (err) {
      console.error('Erro ao criar backup:', err);
      throw err;
    }
  };

  return {
    syncing,
    lastSync,
    syncData,
    createBackup
  };
}

// Hook para webhooks (integração com outros sistemas)
export function useWebhooks(token: string | null) {
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchWebhooks = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    try {
      const data = await APIService.getWebhooks(token);
      setWebhooks(data);
    } catch (err) {
      console.error('Erro ao buscar webhooks:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const registerWebhook = async (webhookData: any) => {
    if (!token) throw new Error('Token não encontrado');

    try {
      const newWebhook = await APIService.registerWebhook(token, webhookData);
      setWebhooks(prev => [...prev, newWebhook]);
      return newWebhook;
    } catch (err) {
      throw err;
    }
  };

  useEffect(() => {
    fetchWebhooks();
  }, [fetchWebhooks]);

  return {
    webhooks,
    loading,
    registerWebhook,
    refetch: fetchWebhooks
  };
}