// Utilitários para integração com outros códigos e sistemas

// Tipos para integração
export interface IntegrationConfig {
  apiUrl: string;
  apiKey?: string;
  webhookUrl?: string;
  timeout?: number;
  retries?: number;
}

export interface ExternalSystem {
  name: string;
  type: 'api' | 'webhook' | 'database' | 'service';
  config: IntegrationConfig;
  active: boolean;
}

// Gerenciador de integrações
export class IntegrationManager {
  private systems: Map<string, ExternalSystem> = new Map();
  private eventListeners: Map<string, Function[]> = new Map();

  // Registrar um sistema externo
  registerSystem(id: string, system: ExternalSystem): void {
    this.systems.set(id, system);
    this.emit('system_registered', { id, system });
  }

  // Remover sistema
  unregisterSystem(id: string): void {
    this.systems.delete(id);
    this.emit('system_unregistered', { id });
  }

  // Obter sistema
  getSystem(id: string): ExternalSystem | undefined {
    return this.systems.get(id);
  }

  // Listar todos os sistemas
  getAllSystems(): ExternalSystem[] {
    return Array.from(this.systems.values());
  }

  // Conectar com sistema externo
  async connectToSystem(id: string, data?: any): Promise<any> {
    const system = this.systems.get(id);
    if (!system) {
      throw new Error(`Sistema ${id} não encontrado`);
    }

    if (!system.active) {
      throw new Error(`Sistema ${id} está inativo`);
    }

    try {
      const result = await this.makeRequest(system, data);
      this.emit('system_connected', { id, result });
      return result;
    } catch (error) {
      this.emit('system_error', { id, error });
      throw error;
    }
  }

  // Fazer requisição para sistema externo
  private async makeRequest(system: ExternalSystem, data?: any): Promise<any> {
    const { config } = system;
    const timeout = config.timeout || 10000;
    const retries = config.retries || 3;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'DMCCryptoPIX/1.0'
    };

    if (config.apiKey) {
      headers['Authorization'] = `Bearer ${config.apiKey}`;
    }

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await fetch(config.apiUrl, {
          method: data ? 'POST' : 'GET',
          headers,
          body: data ? JSON.stringify(data) : undefined,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        lastError = error as Error;
        if (attempt < retries) {
          await this.delay(1000 * attempt); // Backoff exponencial
        }
      }
    }

    throw lastError;
  }

  // Enviar webhook
  async sendWebhook(id: string, event: string, payload: any): Promise<void> {
    const system = this.systems.get(id);
    if (!system || !system.config.webhookUrl) {
      return;
    }

    try {
      await fetch(system.config.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Event-Type': event,
          'X-Source': 'DMCCryptoPIX'
        },
        body: JSON.stringify({
          event,
          timestamp: new Date().toISOString(),
          data: payload
        })
      });
    } catch (error) {
      console.error(`Erro ao enviar webhook para ${id}:`, error);
    }
  }

  // Sistema de eventos
  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Erro no listener do evento ${event}:`, error);
        }
      });
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Instância global do gerenciador
export const integrationManager = new IntegrationManager();

// Adaptadores para sistemas específicos
export class PaymentSystemAdapter {
  constructor(private manager: IntegrationManager) {}

  // Integrar com sistema de pagamento PIX
  async integratePixProvider(config: {
    providerName: string;
    apiUrl: string;
    apiKey: string;
    webhookUrl?: string;
  }): Promise<void> {
    this.manager.registerSystem('pix_provider', {
      name: config.providerName,
      type: 'api',
      config: {
        apiUrl: config.apiUrl,
        apiKey: config.apiKey,
        webhookUrl: config.webhookUrl
      },
      active: true
    });
  }

  // Gerar PIX via sistema externo
  async generatePixCode(amount: number, description?: string): Promise<string> {
    const result = await this.manager.connectToSystem('pix_provider', {
      action: 'generate_pix',
      amount,
      description
    });
    return result.pixCode;
  }

  // Validar pagamento PIX
  async validatePixPayment(pixCode: string): Promise<any> {
    return await this.manager.connectToSystem('pix_provider', {
      action: 'validate_payment',
      pixCode
    });
  }
}

export class CryptoExchangeAdapter {
  constructor(private manager: IntegrationManager) {}

  // Integrar com exchange de criptomoedas
  async integrateExchange(config: {
    exchangeName: string;
    apiUrl: string;
    apiKey: string;
    secretKey: string;
  }): Promise<void> {
    this.manager.registerSystem('crypto_exchange', {
      name: config.exchangeName,
      type: 'api',
      config: {
        apiUrl: config.apiUrl,
        apiKey: config.apiKey
      },
      active: true
    });
  }

  // Obter cotações em tempo real
  async getRealTimePrices(symbols: string[]): Promise<any> {
    return await this.manager.connectToSystem('crypto_exchange', {
      action: 'get_prices',
      symbols
    });
  }

  // Executar ordem de compra/venda
  async executeOrder(orderData: {
    symbol: string;
    side: 'buy' | 'sell';
    amount: number;
    price?: number;
  }): Promise<any> {
    return await this.manager.connectToSystem('crypto_exchange', {
      action: 'execute_order',
      ...orderData
    });
  }
}

export class DatabaseAdapter {
  constructor(private manager: IntegrationManager) {}

  // Integrar com banco de dados externo
  async integrateDatabase(config: {
    dbName: string;
    connectionString: string;
    apiUrl: string;
    apiKey?: string;
  }): Promise<void> {
    this.manager.registerSystem('external_db', {
      name: config.dbName,
      type: 'database',
      config: {
        apiUrl: config.apiUrl,
        apiKey: config.apiKey
      },
      active: true
    });
  }

  // Sincronizar dados com banco externo
  async syncUserData(userId: string, userData: any): Promise<void> {
    await this.manager.connectToSystem('external_db', {
      action: 'sync_user',
      userId,
      data: userData
    });
  }

  // Buscar dados do usuário
  async getUserData(userId: string): Promise<any> {
    return await this.manager.connectToSystem('external_db', {
      action: 'get_user',
      userId
    });
  }
}

// Utilitários para código personalizado
export class CustomCodeIntegration {
  private customFunctions: Map<string, Function> = new Map();

  // Registrar função personalizada
  registerFunction(name: string, fn: Function): void {
    this.customFunctions.set(name, fn);
  }

  // Executar função personalizada
  async executeFunction(name: string, ...args: any[]): Promise<any> {
    const fn = this.customFunctions.get(name);
    if (!fn) {
      throw new Error(`Função ${name} não encontrada`);
    }

    try {
      return await fn(...args);
    } catch (error) {
      console.error(`Erro ao executar função ${name}:`, error);
      throw error;
    }
  }

  // Listar funções disponíveis
  getAvailableFunctions(): string[] {
    return Array.from(this.customFunctions.keys());
  }

  // Remover função
  removeFunction(name: string): void {
    this.customFunctions.delete(name);
  }
}

// Instâncias dos adaptadores
export const paymentAdapter = new PaymentSystemAdapter(integrationManager);
export const exchangeAdapter = new CryptoExchangeAdapter(integrationManager);
export const databaseAdapter = new DatabaseAdapter(integrationManager);
export const customCodeIntegration = new CustomCodeIntegration();

// Configurações pré-definidas para integrações comuns
export const INTEGRATION_PRESETS = {
  // Mercado Pago PIX
  mercadoPago: {
    name: 'Mercado Pago',
    type: 'api' as const,
    config: {
      apiUrl: 'https://api.mercadopago.com/v1',
      timeout: 15000,
      retries: 3
    }
  },

  // PagSeguro PIX
  pagSeguro: {
    name: 'PagSeguro',
    type: 'api' as const,
    config: {
      apiUrl: 'https://ws.sandbox.pagseguro.uol.com.br',
      timeout: 15000,
      retries: 3
    }
  },

  // Binance API
  binance: {
    name: 'Binance',
    type: 'api' as const,
    config: {
      apiUrl: 'https://api.binance.com/api/v3',
      timeout: 10000,
      retries: 2
    }
  },

  // Supabase
  supabase: {
    name: 'Supabase',
    type: 'database' as const,
    config: {
      apiUrl: 'https://your-project.supabase.co/rest/v1',
      timeout: 10000,
      retries: 2
    }
  }
};

// Função helper para configuração rápida
export function quickSetup(preset: keyof typeof INTEGRATION_PRESETS, apiKey: string): void {
  const config = INTEGRATION_PRESETS[preset];
  integrationManager.registerSystem(preset, {
    ...config,
    config: {
      ...config.config,
      apiKey
    },
    active: true
  });
}