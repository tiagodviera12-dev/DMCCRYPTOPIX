// Componente de configuração de integrações

'use client';

import { useState, useEffect } from 'react';
import { 
  Settings, 
  Plus, 
  Trash2, 
  Check, 
  X, 
  Wifi, 
  Database, 
  CreditCard, 
  Code,
  AlertCircle,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';
import { 
  integrationManager, 
  paymentAdapter, 
  exchangeAdapter, 
  databaseAdapter,
  customCodeIntegration,
  INTEGRATION_PRESETS,
  quickSetup,
  type ExternalSystem 
} from '@/lib/integration';

interface IntegrationSetupProps {
  onClose: () => void;
}

export default function IntegrationSetup({ onClose }: IntegrationSetupProps) {
  const [systems, setSystems] = useState<ExternalSystem[]>([]);
  const [activeTab, setActiveTab] = useState<'systems' | 'presets' | 'custom'>('systems');
  const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({});
  const [newSystem, setNewSystem] = useState({
    name: '',
    type: 'api' as const,
    apiUrl: '',
    apiKey: '',
    webhookUrl: '',
    active: true
  });
  const [testing, setTesting] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, 'success' | 'error' | null>>({});

  useEffect(() => {
    setSystems(integrationManager.getAllSystems());
    
    // Escutar eventos de integração
    const handleSystemRegistered = () => {
      setSystems(integrationManager.getAllSystems());
    };
    
    integrationManager.on('system_registered', handleSystemRegistered);
    integrationManager.on('system_unregistered', handleSystemRegistered);
    
    return () => {
      integrationManager.off('system_registered', handleSystemRegistered);
      integrationManager.off('system_unregistered', handleSystemRegistered);
    };
  }, []);

  const handleAddSystem = () => {
    if (!newSystem.name || !newSystem.apiUrl) return;

    const id = newSystem.name.toLowerCase().replace(/\s+/g, '_');
    integrationManager.registerSystem(id, {
      name: newSystem.name,
      type: newSystem.type,
      config: {
        apiUrl: newSystem.apiUrl,
        apiKey: newSystem.apiKey || undefined,
        webhookUrl: newSystem.webhookUrl || undefined,
        timeout: 10000,
        retries: 3
      },
      active: newSystem.active
    });

    setNewSystem({
      name: '',
      type: 'api',
      apiUrl: '',
      apiKey: '',
      webhookUrl: '',
      active: true
    });
  };

  const handleRemoveSystem = (id: string) => {
    integrationManager.unregisterSystem(id);
  };

  const handleTestConnection = async (id: string) => {
    setTesting(id);
    setTestResults(prev => ({ ...prev, [id]: null }));

    try {
      await integrationManager.connectToSystem(id, { action: 'ping' });
      setTestResults(prev => ({ ...prev, [id]: 'success' }));
    } catch (error) {
      setTestResults(prev => ({ ...prev, [id]: 'error' }));
    } finally {
      setTesting(null);
    }
  };

  const handleQuickSetup = (preset: keyof typeof INTEGRATION_PRESETS, apiKey: string) => {
    quickSetup(preset, apiKey);
  };

  const toggleApiKeyVisibility = (id: string) => {
    setShowApiKey(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-[#1A1A1A] rounded-2xl border border-gray-800 w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div className="flex items-center space-x-3">
            <Settings className="w-6 h-6 text-[#00FFFF]" />
            <h2 className="text-xl font-bold text-white">Configurar Integrações</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-800">
          <button
            onClick={() => setActiveTab('systems')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'systems' 
                ? 'text-[#00FFFF] border-b-2 border-[#00FFFF]' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Sistemas Conectados
          </button>
          <button
            onClick={() => setActiveTab('presets')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'presets' 
                ? 'text-[#00FFFF] border-b-2 border-[#00FFFF]' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Configuração Rápida
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'custom' 
                ? 'text-[#00FFFF] border-b-2 border-[#00FFFF]' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Código Personalizado
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {activeTab === 'systems' && (
            <div className="space-y-6">
              {/* Lista de sistemas */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-white">Sistemas Ativos</h3>
                {systems.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum sistema integrado ainda</p>
                    <p className="text-sm">Adicione uma integração abaixo</p>
                  </div>
                ) : (
                  systems.map((system, index) => (
                    <div key={index} className="bg-[#000000] rounded-xl p-4 border border-gray-800">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          {system.type === 'api' && <Wifi className="w-5 h-5 text-blue-400" />}
                          {system.type === 'database' && <Database className="w-5 h-5 text-green-400" />}
                          {system.type === 'service' && <CreditCard className="w-5 h-5 text-purple-400" />}
                          <div>
                            <div className="font-medium text-white">{system.name}</div>
                            <div className="text-sm text-gray-400 capitalize">{system.type}</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${system.active ? 'bg-green-400' : 'bg-red-400'}`} />
                          <span className="text-sm text-gray-400">
                            {system.active ? 'Ativo' : 'Inativo'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-400 mb-3">
                        <div>URL: {system.config.apiUrl}</div>
                        {system.config.apiKey && (
                          <div className="flex items-center space-x-2">
                            <span>API Key: </span>
                            <span className="font-mono">
                              {showApiKey[system.name] 
                                ? system.config.apiKey 
                                : '••••••••••••••••'
                              }
                            </span>
                            <button
                              onClick={() => toggleApiKeyVisibility(system.name)}
                              className="text-gray-500 hover:text-gray-300"
                            >
                              {showApiKey[system.name] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {testResults[system.name] === 'success' && (
                            <div className="flex items-center space-x-1 text-green-400">
                              <Check className="w-4 h-4" />
                              <span className="text-sm">Conectado</span>
                            </div>
                          )}
                          {testResults[system.name] === 'error' && (
                            <div className="flex items-center space-x-1 text-red-400">
                              <AlertCircle className="w-4 h-4" />
                              <span className="text-sm">Erro na conexão</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleTestConnection(system.name)}
                            disabled={testing === system.name}
                            className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-1"
                          >
                            {testing === system.name ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <Wifi className="w-4 h-4" />
                            )}
                            <span>Testar</span>
                          </button>
                          <button
                            onClick={() => handleRemoveSystem(system.name)}
                            className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Adicionar novo sistema */}
              <div className="bg-[#000000] rounded-xl p-6 border border-gray-800">
                <h3 className="text-lg font-medium text-white mb-4">Adicionar Nova Integração</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Nome</label>
                    <input
                      type="text"
                      value={newSystem.name}
                      onChange={(e) => setNewSystem(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full bg-[#1A1A1A] border border-gray-700 rounded-lg px-3 py-2 text-white"
                      placeholder="Nome do sistema"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Tipo</label>
                    <select
                      value={newSystem.type}
                      onChange={(e) => setNewSystem(prev => ({ ...prev, type: e.target.value as any }))}
                      className="w-full bg-[#1A1A1A] border border-gray-700 rounded-lg px-3 py-2 text-white"
                    >
                      <option value="api">API</option>
                      <option value="database">Banco de Dados</option>
                      <option value="service">Serviço</option>
                      <option value="webhook">Webhook</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">URL da API</label>
                    <input
                      type="url"
                      value={newSystem.apiUrl}
                      onChange={(e) => setNewSystem(prev => ({ ...prev, apiUrl: e.target.value }))}
                      className="w-full bg-[#1A1A1A] border border-gray-700 rounded-lg px-3 py-2 text-white"
                      placeholder="https://api.exemplo.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">API Key (opcional)</label>
                    <input
                      type="password"
                      value={newSystem.apiKey}
                      onChange={(e) => setNewSystem(prev => ({ ...prev, apiKey: e.target.value }))}
                      className="w-full bg-[#1A1A1A] border border-gray-700 rounded-lg px-3 py-2 text-white"
                      placeholder="Sua chave de API"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Webhook URL (opcional)</label>
                    <input
                      type="url"
                      value={newSystem.webhookUrl}
                      onChange={(e) => setNewSystem(prev => ({ ...prev, webhookUrl: e.target.value }))}
                      className="w-full bg-[#1A1A1A] border border-gray-700 rounded-lg px-3 py-2 text-white"
                      placeholder="https://webhook.exemplo.com"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={newSystem.active}
                      onChange={(e) => setNewSystem(prev => ({ ...prev, active: e.target.checked }))}
                      className="rounded border-gray-700"
                    />
                    <span className="text-sm text-gray-300">Ativar imediatamente</span>
                  </label>
                  <button
                    onClick={handleAddSystem}
                    disabled={!newSystem.name || !newSystem.apiUrl}
                    className="px-4 py-2 bg-[#00FFFF] text-black font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Adicionar</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'presets' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-white">Configurações Pré-definidas</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(INTEGRATION_PRESETS).map(([key, preset]) => (
                  <div key={key} className="bg-[#000000] rounded-xl p-4 border border-gray-800">
                    <div className="flex items-center space-x-3 mb-3">
                      {preset.type === 'api' && <Wifi className="w-5 h-5 text-blue-400" />}
                      {preset.type === 'database' && <Database className="w-5 h-5 text-green-400" />}
                      <div>
                        <div className="font-medium text-white">{preset.name}</div>
                        <div className="text-sm text-gray-400 capitalize">{preset.type}</div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-400 mb-3">
                      {preset.config.apiUrl}
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="password"
                        placeholder="API Key"
                        className="flex-1 bg-[#1A1A1A] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            const apiKey = (e.target as HTMLInputElement).value;
                            if (apiKey) {
                              handleQuickSetup(key as keyof typeof INTEGRATION_PRESETS, apiKey);
                              (e.target as HTMLInputElement).value = '';
                            }
                          }
                        }}
                      />
                      <button
                        onClick={(e) => {
                          const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                          const apiKey = input.value;
                          if (apiKey) {
                            handleQuickSetup(key as keyof typeof INTEGRATION_PRESETS, apiKey);
                            input.value = '';
                          }
                        }}
                        className="px-3 py-2 bg-[#00FFFF] text-black font-medium rounded-lg hover:opacity-90 transition-opacity"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'custom' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-white">Código Personalizado</h3>
              <div className="bg-[#000000] rounded-xl p-6 border border-gray-800">
                <div className="flex items-center space-x-3 mb-4">
                  <Code className="w-5 h-5 text-[#00FFFF]" />
                  <span className="font-medium text-white">Funções Personalizadas</span>
                </div>
                <div className="text-sm text-gray-400 mb-4">
                  Registre funções JavaScript personalizadas para integração com seu código:
                </div>
                <div className="bg-[#1A1A1A] rounded-lg p-4 font-mono text-sm text-gray-300">
                  <div className="text-[#00FFFF]">// Exemplo de uso:</div>
                  <div className="mt-2">
                    <span className="text-blue-400">customCodeIntegration</span>
                    <span className="text-white">.registerFunction(</span>
                    <span className="text-green-400">'processPayment'</span>
                    <span className="text-white">, </span>
                    <span className="text-yellow-400">async</span>
                    <span className="text-white"> (amount, currency) => {`{`}</span>
                  </div>
                  <div className="ml-4">
                    <span className="text-gray-400">// Sua lógica personalizada aqui</span>
                  </div>
                  <div className="ml-4">
                    <span className="text-purple-400">return</span>
                    <span className="text-white"> processedPayment;</span>
                  </div>
                  <div>
                    <span className="text-white">{`});`}</span>
                  </div>
                </div>
                <div className="mt-4 text-sm text-gray-400">
                  <p>Funções disponíveis: {customCodeIntegration.getAvailableFunctions().join(', ') || 'Nenhuma'}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}