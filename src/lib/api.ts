// API Service para integração com serviços externos
export class APIService {
  private static baseURL = process.env.NEXT_PUBLIC_API_URL || 'https://api.dmccryptopix.com';
  
  // Configuração de headers padrão
  private static getHeaders(token?: string) {
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  // Método genérico para requisições
  private static async request<T>(
    endpoint: string, 
    options: RequestInit = {},
    token?: string
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getHeaders(token),
        ...options.headers
      }
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  // Cotações de Criptomoedas (CoinGecko)
  static async getCryptoPrices(ids: string[]): Promise<any> {
    const idsString = ids.join(',');
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${idsString}&vs_currencies=brl&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Falha ao buscar cotações');
      return await response.json();
    } catch (error) {
      console.error('Erro ao buscar cotações:', error);
      throw error;
    }
  }

  // Histórico de preços
  static async getCryptoHistory(id: string, days: number = 7): Promise<any> {
    const url = `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=brl&days=${days}`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Falha ao buscar histórico');
      return await response.json();
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
      throw error;
    }
  }

  // Autenticação
  static async login(email: string, password: string): Promise<any> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  }

  static async register(userData: {
    name: string;
    email: string;
    password: string;
    phone: string;
  }): Promise<any> {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  static async refreshToken(refreshToken: string): Promise<any> {
    return this.request('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken })
    });
  }

  // Carteira
  static async getWalletBalance(token: string): Promise<any> {
    return this.request('/wallet/balance', { method: 'GET' }, token);
  }

  static async updateWalletBalance(token: string, balances: any): Promise<any> {
    return this.request('/wallet/balance', {
      method: 'PUT',
      body: JSON.stringify({ balances })
    }, token);
  }

  // Conversões
  static async createConversion(token: string, conversionData: {
    fromCrypto: string;
    amount: number;
    toAmount: number;
    rate: number;
  }): Promise<any> {
    return this.request('/conversions', {
      method: 'POST',
      body: JSON.stringify(conversionData)
    }, token);
  }

  static async getConversions(token: string, limit: number = 10): Promise<any> {
    return this.request(`/conversions?limit=${limit}`, { method: 'GET' }, token);
  }

  // PIX
  static async generatePixCode(token: string, amount: number): Promise<any> {
    return this.request('/pix/generate', {
      method: 'POST',
      body: JSON.stringify({ amount })
    }, token);
  }

  static async validatePixCode(token: string, pixCode: string): Promise<any> {
    return this.request('/pix/validate', {
      method: 'POST',
      body: JSON.stringify({ pixCode })
    }, token);
  }

  static async processPixPayment(token: string, paymentData: {
    pixCode: string;
    amount: number;
    description?: string;
  }): Promise<any> {
    return this.request('/pix/payment', {
      method: 'POST',
      body: JSON.stringify(paymentData)
    }, token);
  }

  // KYC
  static async submitKYC(token: string, kycData: {
    documentType: string;
    documentNumber: string;
    documentImage: string;
    selfieImage: string;
  }): Promise<any> {
    return this.request('/kyc/submit', {
      method: 'POST',
      body: JSON.stringify(kycData)
    }, token);
  }

  static async getKYCStatus(token: string): Promise<any> {
    return this.request('/kyc/status', { method: 'GET' }, token);
  }

  // Notificações
  static async registerPushToken(token: string, pushToken: string): Promise<any> {
    return this.request('/notifications/register', {
      method: 'POST',
      body: JSON.stringify({ pushToken })
    }, token);
  }

  static async getNotifications(token: string, limit: number = 20): Promise<any> {
    return this.request(`/notifications?limit=${limit}`, { method: 'GET' }, token);
  }

  static async markNotificationAsRead(token: string, notificationId: string): Promise<any> {
    return this.request(`/notifications/${notificationId}/read`, {
      method: 'PUT'
    }, token);
  }

  // Configurações
  static async updateSettings(token: string, settings: any): Promise<any> {
    return this.request('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings)
    }, token);
  }

  static async getSettings(token: string): Promise<any> {
    return this.request('/settings', { method: 'GET' }, token);
  }

  // Alertas de Preço
  static async createPriceAlert(token: string, alertData: {
    cryptoId: string;
    targetPrice: number;
    condition: 'above' | 'below';
  }): Promise<any> {
    return this.request('/alerts', {
      method: 'POST',
      body: JSON.stringify(alertData)
    }, token);
  }

  static async getPriceAlerts(token: string): Promise<any> {
    return this.request('/alerts', { method: 'GET' }, token);
  }

  static async deletePriceAlert(token: string, alertId: string): Promise<any> {
    return this.request(`/alerts/${alertId}`, { method: 'DELETE' }, token);
  }

  // Webhooks para integração com outros sistemas
  static async registerWebhook(token: string, webhookData: {
    url: string;
    events: string[];
    secret?: string;
  }): Promise<any> {
    return this.request('/webhooks', {
      method: 'POST',
      body: JSON.stringify(webhookData)
    }, token);
  }

  static async getWebhooks(token: string): Promise<any> {
    return this.request('/webhooks', { method: 'GET' }, token);
  }

  // Backup e Sincronização
  static async backupUserData(token: string): Promise<any> {
    return this.request('/backup/create', { method: 'POST' }, token);
  }

  static async restoreUserData(token: string, backupId: string): Promise<any> {
    return this.request('/backup/restore', {
      method: 'POST',
      body: JSON.stringify({ backupId })
    }, token);
  }

  static async syncData(token: string, deviceId: string): Promise<any> {
    return this.request('/sync', {
      method: 'POST',
      body: JSON.stringify({ deviceId })
    }, token);
  }
}

// Utilitários para conexão
export class ConnectionUtils {
  static isOnline(): boolean {
    return navigator.onLine;
  }

  static async testConnection(): Promise<boolean> {
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/ping', {
        method: 'GET',
        mode: 'no-cors'
      });
      return true;
    } catch {
      return false;
    }
  }

  static onConnectionChange(callback: (isOnline: boolean) => void): () => void {
    const handleOnline = () => callback(true);
    const handleOffline = () => callback(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }
}

// Cache para dados offline
export class CacheService {
  private static readonly CACHE_PREFIX = 'dmccrypto_';
  private static readonly CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutos

  static set(key: string, data: any, expiry?: number): void {
    const item = {
      data,
      timestamp: Date.now(),
      expiry: expiry || this.CACHE_EXPIRY
    };
    localStorage.setItem(this.CACHE_PREFIX + key, JSON.stringify(item));
  }

  static get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(this.CACHE_PREFIX + key);
      if (!item) return null;

      const parsed = JSON.parse(item);
      const now = Date.now();

      if (now - parsed.timestamp > parsed.expiry) {
        this.remove(key);
        return null;
      }

      return parsed.data;
    } catch {
      return null;
    }
  }

  static remove(key: string): void {
    localStorage.removeItem(this.CACHE_PREFIX + key);
  }

  static clear(): void {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(this.CACHE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  }
}