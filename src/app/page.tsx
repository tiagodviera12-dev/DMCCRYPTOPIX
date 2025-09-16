'use client';

import { useState, useEffect } from 'react';
import { 
  Bitcoin, 
  TrendingUp, 
  TrendingDown, 
  ArrowUpDown, 
  QrCode, 
  Clock, 
  Eye, 
  EyeOff,
  Wallet,
  History,
  Bell,
  Settings,
  Copy,
  Check,
  User,
  LogOut,
  Shield,
  Wifi,
  WifiOff,
  AlertTriangle,
  RefreshCw,
  Database,
  Key,
  Smartphone,
  Zap,
  Star,
  ChevronRight,
  ArrowLeft,
  X,
  Brain,
  BarChart3,
  Target,
  Activity,
  Sparkles
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

// Interfaces para tipagem
interface CryptoData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  balance: number;
  id: string;
}

interface Transaction {
  id: number;
  type: 'conversion' | 'pix';
  crypto?: string;
  amount: number;
  brlValue?: number;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  hash?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  kycStatus: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

interface AppSettings {
  notifications: boolean;
  biometric: boolean;
  darkMode: boolean;
  currency: string;
  language: string;
  priceAlerts: boolean;
}

interface AIAnalysis {
  sentiment: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  priceTarget: {
    short: number;
    medium: number;
    long: number;
  };
  keyPoints: string[];
  riskLevel: 'low' | 'medium' | 'high';
  recommendation: 'buy' | 'hold' | 'sell';
}

// Dados iniciais
const initialCryptoData: CryptoData[] = [
  { symbol: 'BTC', name: 'Bitcoin', price: 245678.90, change: 2.45, balance: 0.00234567, id: 'bitcoin' },
  { symbol: 'ETH', name: 'Ethereum', price: 12456.78, change: -1.23, balance: 0.15678, id: 'ethereum' },
  { symbol: 'USDT', name: 'Tether', price: 5.12, change: 0.01, balance: 1250.00, id: 'tether' },
  { symbol: 'BNB', name: 'BNB', price: 1234.56, change: 3.21, balance: 2.5, id: 'binancecoin' }
];

const initialTransactions: Transaction[] = [
  { id: 1, type: 'conversion', crypto: 'BTC', amount: 0.001, brlValue: 245.67, date: '2024-01-15 14:30', status: 'completed', hash: '0x1a2b3c...' },
  { id: 2, type: 'pix', amount: 500.00, date: '2024-01-15 12:15', status: 'completed' },
  { id: 3, type: 'conversion', crypto: 'ETH', amount: 0.05, brlValue: 622.83, date: '2024-01-14 16:45', status: 'completed', hash: '0x4d5e6f...' }
];

export default function DMCCryptoPIX() {
  // Estados principais
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [cryptoData, setCryptoData] = useState<CryptoData[]>(initialCryptoData);
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [selectedCrypto, setSelectedCrypto] = useState(cryptoData[0]);
  const [convertAmount, setConvertAmount] = useState('');
  const [showBalance, setShowBalance] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [pixCode, setPixCode] = useState('');
  const [copied, setCopied] = useState(false);
  
  // Estados de conectividade e sistema
  const [isOnline, setIsOnline] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [settings, setSettings] = useState<AppSettings>({
    notifications: true,
    biometric: false,
    darkMode: true,
    currency: 'BRL',
    language: 'pt-BR',
    priceAlerts: true
  });

  // Estados de autenticação
  const [showLogin, setShowLogin] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [isRegistering, setIsRegistering] = useState(false);

  // Estados para IA
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedCryptoForAI, setSelectedCryptoForAI] = useState<CryptoData | null>(null);

  // Verificar conectividade
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Carregar dados do localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('dmccrypto_user');
    const savedTransactions = localStorage.getItem('dmccrypto_transactions');
    const savedSettings = localStorage.getItem('dmccrypto_settings');
    const savedCrypto = localStorage.getItem('dmccrypto_balances');

    if (savedUser) {
      setUser(JSON.parse(savedUser));
      setIsAuthenticated(true);
    }
    if (savedTransactions) {
      setTransactions(JSON.parse(savedTransactions));
    }
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
    if (savedCrypto) {
      const saved = JSON.parse(savedCrypto);
      setCryptoData(prev => prev.map(crypto => ({
        ...crypto,
        balance: saved[crypto.symbol] || crypto.balance
      })));
    }
  }, []);

  // Buscar cotações reais da API CoinGecko
  const fetchRealPrices = async () => {
    if (!isOnline) return;
    
    setIsLoading(true);
    try {
      const ids = cryptoData.map(crypto => crypto.id).join(',');
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=brl&include_24hr_change=true`
      );
      
      if (response.ok) {
        const data = await response.json();
        setCryptoData(prev => prev.map(crypto => ({
          ...crypto,
          price: data[crypto.id]?.brl || crypto.price,
          change: data[crypto.id]?.brl_24h_change || crypto.change
        })));
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Erro ao buscar cotações:', error);
      // Fallback para simulação se API falhar
      simulatePriceUpdates();
    } finally {
      setIsLoading(false);
    }
  };

  // Simulação de cotações quando offline
  const simulatePriceUpdates = () => {
    setCryptoData(prev => prev.map(crypto => ({
      ...crypto,
      price: crypto.price * (1 + (Math.random() - 0.5) * 0.02),
      change: crypto.change + (Math.random() - 0.5) * 0.5
    })));
    setLastUpdate(new Date());
  };

  // Atualizar cotações periodicamente
  useEffect(() => {
    if (isAuthenticated) {
      fetchRealPrices();
      const interval = setInterval(() => {
        if (isOnline) {
          fetchRealPrices();
        } else {
          simulatePriceUpdates();
        }
      }, 30000); // 30 segundos

      return () => clearInterval(interval);
    }
  }, [isAuthenticated, isOnline]);

  // Salvar dados no localStorage
  const saveToStorage = (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  // Função para gerar dados de gráfico simulados
  const generateChartData = (crypto: CryptoData) => {
    const data = [];
    const basePrice = crypto.price;
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      const variation = (Math.random() - 0.5) * 0.1;
      const price = basePrice * (1 + variation);
      
      data.push({
        date: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        price: price,
        volume: Math.random() * 1000000
      });
    }
    
    return data;
  };

  // Função para analisar cripto com IA (simulada)
  const analyzeWithAI = async (crypto: CryptoData) => {
    setIsAnalyzing(true);
    
    // Simular chamada para API de IA
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const sentiments: ('bullish' | 'bearish' | 'neutral')[] = ['bullish', 'bearish', 'neutral'];
    const sentiment = sentiments[Math.floor(Math.random() * sentiments.length)];
    
    const analysis: AIAnalysis = {
      sentiment,
      confidence: Math.floor(Math.random() * 40) + 60, // 60-100%
      priceTarget: {
        short: crypto.price * (1 + (Math.random() - 0.5) * 0.2),
        medium: crypto.price * (1 + (Math.random() - 0.5) * 0.4),
        long: crypto.price * (1 + (Math.random() - 0.5) * 0.8)
      },
      keyPoints: [
        `Análise técnica indica ${sentiment === 'bullish' ? 'tendência de alta' : sentiment === 'bearish' ? 'tendência de baixa' : 'movimento lateral'}`,
        `Volume de negociação ${Math.random() > 0.5 ? 'acima' : 'abaixo'} da média`,
        `Indicadores RSI sugerem ${Math.random() > 0.5 ? 'sobrecompra' : 'sobrevenda'}`,
        `Suporte identificado em R$ ${(crypto.price * 0.9).toLocaleString('pt-BR')}`,
        `Resistência próxima em R$ ${(crypto.price * 1.1).toLocaleString('pt-BR')}`
      ],
      riskLevel: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as 'low' | 'medium' | 'high',
      recommendation: sentiment === 'bullish' ? 'buy' : sentiment === 'bearish' ? 'sell' : 'hold'
    };
    
    setAiAnalysis(analysis);
    setIsAnalyzing(false);
  };

  // Função para abrir modal de IA
  const openAIModal = (crypto: CryptoData) => {
    setSelectedCryptoForAI(crypto);
    setShowAIModal(true);
    setAiAnalysis(null);
    analyzeWithAI(crypto);
  };

  // Autenticação
  const handleLogin = async () => {
    setIsLoading(true);
    // Simular autenticação
    setTimeout(() => {
      const mockUser: User = {
        id: '1',
        name: 'Usuário Demo',
        email: loginForm.email,
        phone: '+55 11 99999-9999',
        kycStatus: 'approved',
        createdAt: new Date().toISOString()
      };
      setUser(mockUser);
      setIsAuthenticated(true);
      saveToStorage('dmccrypto_user', mockUser);
      setShowLogin(false);
      setIsLoading(false);
    }, 1500);
  };

  const handleRegister = async () => {
    setIsLoading(true);
    // Simular registro
    setTimeout(() => {
      const newUser: User = {
        id: Date.now().toString(),
        name: registerForm.name,
        email: registerForm.email,
        phone: registerForm.phone,
        kycStatus: 'pending',
        createdAt: new Date().toISOString()
      };
      setUser(newUser);
      setIsAuthenticated(true);
      saveToStorage('dmccrypto_user', newUser);
      setShowLogin(false);
      setIsLoading(false);
    }, 1500);
  };

  const handleLogout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('dmccrypto_user');
    setActiveTab('dashboard');
  };

  const totalBalanceBRL = cryptoData.reduce((total, crypto) => 
    total + (crypto.balance * crypto.price), 0
  );

  const handleConvert = () => {
    if (!convertAmount) return;
    
    const amount = parseFloat(convertAmount);
    const brlValue = amount * selectedCrypto.price;
    const fee = brlValue * 0.01;
    
    // Criar nova transação
    const newTransaction: Transaction = {
      id: Date.now(),
      type: 'conversion',
      crypto: selectedCrypto.symbol,
      amount,
      brlValue: brlValue - fee,
      date: new Date().toLocaleString('pt-BR'),
      status: 'completed',
      hash: '0x' + Math.random().toString(16).substring(2, 10) + '...'
    };

    // Atualizar saldo
    setCryptoData(prev => prev.map(crypto => 
      crypto.symbol === selectedCrypto.symbol 
        ? { ...crypto, balance: crypto.balance - amount }
        : crypto
    ));

    // Adicionar transação
    const updatedTransactions = [newTransaction, ...transactions];
    setTransactions(updatedTransactions);
    saveToStorage('dmccrypto_transactions', updatedTransactions);

    // Salvar saldos
    const balances = cryptoData.reduce((acc, crypto) => ({
      ...acc,
      [crypto.symbol]: crypto.symbol === selectedCrypto.symbol 
        ? crypto.balance - amount 
        : crypto.balance
    }), {});
    saveToStorage('dmccrypto_balances', balances);

    alert(`Conversão realizada!\\n${amount} ${selectedCrypto.symbol} = R$ ${(brlValue - fee).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\\nTaxa: R$ ${fee.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
    setConvertAmount('');
  };

  const generatePixCode = () => {
    const mockPixCode = '00020126580014br.gov.bcb.pix0136' + Math.random().toString(36).substring(2, 15) + '5204000053039865802BR5925DMC CRYPTO PIX LTDA6009SAO PAULO62070503***6304';
    setPixCode(mockPixCode);
  };

  const copyPixCode = () => {
    navigator.clipboard.writeText(pixCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Tela de Login/Registro
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white font-inter flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-cyan-500/10 via-transparent to-purple-500/10"></div>
        
        <div className="w-full max-w-md relative z-10">
          <div className="text-center mb-8">
            <div className="w-24 h-24 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-cyan-500/25 animate-pulse">
              <Bitcoin className="w-12 h-12 text-white drop-shadow-lg" />
            </div>
            <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              DMCCryptoPIX
            </h1>
            <p className="text-gray-300 text-lg">Crypto to PIX - Seguro e Instantâneo</p>
            <div className="flex items-center justify-center space-x-4 mt-4 text-sm text-gray-400">
              <div className="flex items-center space-x-1">
                <Shield className="w-4 h-4 text-cyan-400" />
                <span>Seguro</span>
              </div>
              <div className="flex items-center space-x-1">
                <Zap className="w-4 h-4 text-yellow-400" />
                <span>Instantâneo</span>
              </div>
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4 text-purple-400" />
                <span>Premium</span>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
            <div className="flex mb-8 bg-black/20 rounded-2xl p-1">
              <button
                onClick={() => setIsRegistering(false)}
                className={`flex-1 py-3 px-6 rounded-xl transition-all duration-300 font-medium ${
                  !isRegistering 
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25' 
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                Entrar
              </button>
              <button
                onClick={() => setIsRegistering(true)}
                className={`flex-1 py-3 px-6 rounded-xl transition-all duration-300 font-medium ${
                  isRegistering 
                    ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg shadow-purple-500/25' 
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                Cadastrar
              </button>
            </div>

            {!isRegistering ? (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-3 text-gray-200">E-mail</label>
                  <input
                    type="email"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full bg-black/30 backdrop-blur-sm border border-white/20 rounded-2xl px-6 py-4 text-white placeholder-gray-400 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 transition-all"
                    placeholder="seu@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-3 text-gray-200">Senha</label>
                  <input
                    type="password"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full bg-black/30 backdrop-blur-sm border border-white/20 rounded-2xl px-6 py-4 text-white placeholder-gray-400 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 transition-all"
                    placeholder="••••••••"
                  />
                </div>
                <button
                  onClick={handleLogin}
                  disabled={isLoading || !loginForm.email || !loginForm.password}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold py-5 rounded-2xl hover:from-cyan-600 hover:to-blue-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3 shadow-xl shadow-cyan-500/25 transform hover:scale-[1.02]"
                >
                  {isLoading ? <RefreshCw className="w-6 h-6 animate-spin" /> : <Shield className="w-6 h-6" />}
                  <span className="text-lg">{isLoading ? 'Entrando...' : 'Entrar Seguro'}</span>
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-3 text-gray-200">Nome Completo</label>
                  <input
                    type="text"
                    value={registerForm.name}
                    onChange={(e) => setRegisterForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-black/30 backdrop-blur-sm border border-white/20 rounded-2xl px-6 py-4 text-white placeholder-gray-400 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/20 transition-all"
                    placeholder="Seu nome completo"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-3 text-gray-200">E-mail</label>
                  <input
                    type="email"
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full bg-black/30 backdrop-blur-sm border border-white/20 rounded-2xl px-6 py-4 text-white placeholder-gray-400 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/20 transition-all"
                    placeholder="seu@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-3 text-gray-200">Telefone</label>
                  <input
                    type="tel"
                    value={registerForm.phone}
                    onChange={(e) => setRegisterForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full bg-black/30 backdrop-blur-sm border border-white/20 rounded-2xl px-6 py-4 text-white placeholder-gray-400 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/20 transition-all"
                    placeholder="+55 11 99999-9999"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-3 text-gray-200">Senha</label>
                  <input
                    type="password"
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full bg-black/30 backdrop-blur-sm border border-white/20 rounded-2xl px-6 py-4 text-white placeholder-gray-400 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/20 transition-all"
                    placeholder="••••••••"
                  />
                </div>
                <button
                  onClick={handleRegister}
                  disabled={isLoading || !registerForm.name || !registerForm.email || !registerForm.password}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white font-bold py-5 rounded-2xl hover:from-purple-600 hover:to-pink-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3 shadow-xl shadow-purple-500/25 transform hover:scale-[1.02]"
                >
                  {isLoading ? <RefreshCw className="w-6 h-6 animate-spin" /> : <User className="w-6 h-6" />}
                  <span className="text-lg">{isLoading ? 'Criando conta...' : 'Criar Conta'}</span>
                </button>
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-white/10">
              <div className="flex items-center justify-center space-x-6 text-sm text-gray-300">
                <div className="flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-cyan-400" />
                  <span>Seguro</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Key className="w-5 h-5 text-purple-400" />
                  <span>Criptografado</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Database className="w-5 h-5 text-pink-400" />
                  <span>LGPD</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white font-inter relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}></div>
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5"></div>

      {/* Modal de Análise IA - FUNDO PRETO E AZUL SÓLIDO */}
      {showAIModal && selectedCryptoForAI && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-black via-slate-900 to-blue-900 rounded-3xl border border-blue-500/30 shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            {/* Header do Modal */}
            <div className="flex items-center justify-between p-6 border-b border-blue-500/20 bg-gradient-to-r from-black to-blue-900/50">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-sm font-bold text-white">{selectedCryptoForAI.symbol}</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                    Análise IA - {selectedCryptoForAI.name}
                  </h2>
                  <p className="text-blue-300">Análise inteligente com previsões de preços</p>
                </div>
              </div>
              <button
                onClick={() => setShowAIModal(false)}
                className="p-3 rounded-2xl bg-blue-500/20 hover:bg-blue-500/30 transition-all duration-300 border border-blue-400/30"
              >
                <X className="w-6 h-6 text-blue-300" />
              </button>
            </div>

            <div className="p-6 space-y-6 bg-gradient-to-br from-black via-slate-900 to-blue-900">
              {/* Loading State */}
              {isAnalyzing && (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-cyan-500/25 animate-pulse">
                    <Brain className="w-10 h-10 text-white animate-pulse" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                    Analisando com IA...
                  </h3>
                  <p className="text-blue-300 mb-6">Processando dados de mercado e gerando insights</p>
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-3 h-3 bg-cyan-400 rounded-full animate-bounce"></div>
                    <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              )}

              {/* Análise Completa */}
              {aiAnalysis && (
                <div className="space-y-6">
                  {/* Resumo da Análise */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className={`bg-gradient-to-br p-6 rounded-2xl border shadow-lg ${
                      aiAnalysis.sentiment === 'bullish' 
                        ? 'from-green-500/30 to-emerald-500/30 border-green-400/50 bg-black/50' 
                        : aiAnalysis.sentiment === 'bearish'
                        ? 'from-red-500/30 to-rose-500/30 border-red-400/50 bg-black/50'
                        : 'from-yellow-500/30 to-amber-500/30 border-yellow-400/50 bg-black/50'
                    }`}>
                      <div className="flex items-center space-x-3 mb-3">
                        <Activity className={`w-6 h-6 ${
                          aiAnalysis.sentiment === 'bullish' ? 'text-green-400' :
                          aiAnalysis.sentiment === 'bearish' ? 'text-red-400' : 'text-yellow-400'
                        }`} />
                        <span className="font-bold text-white">Sentimento</span>
                      </div>
                      <div className={`text-2xl font-bold mb-2 ${
                        aiAnalysis.sentiment === 'bullish' ? 'text-green-400' :
                        aiAnalysis.sentiment === 'bearish' ? 'text-red-400' : 'text-yellow-400'
                      }`}>
                        {aiAnalysis.sentiment === 'bullish' ? 'Alta' : 
                         aiAnalysis.sentiment === 'bearish' ? 'Baixa' : 'Neutro'}
                      </div>
                      <div className="text-sm text-blue-200">
                        Confiança: {aiAnalysis.confidence}%
                      </div>
                    </div>

                    <div className={`bg-gradient-to-br p-6 rounded-2xl border shadow-lg ${
                      aiAnalysis.riskLevel === 'low' 
                        ? 'from-green-500/30 to-emerald-500/30 border-green-400/50 bg-black/50' 
                        : aiAnalysis.riskLevel === 'high'
                        ? 'from-red-500/30 to-rose-500/30 border-red-400/50 bg-black/50'
                        : 'from-yellow-500/30 to-amber-500/30 border-yellow-400/50 bg-black/50'
                    }`}>
                      <div className="flex items-center space-x-3 mb-3">
                        <Shield className={`w-6 h-6 ${
                          aiAnalysis.riskLevel === 'low' ? 'text-green-400' :
                          aiAnalysis.riskLevel === 'high' ? 'text-red-400' : 'text-yellow-400'
                        }`} />
                        <span className="font-bold text-white">Risco</span>
                      </div>
                      <div className={`text-2xl font-bold mb-2 ${
                        aiAnalysis.riskLevel === 'low' ? 'text-green-400' :
                        aiAnalysis.riskLevel === 'high' ? 'text-red-400' : 'text-yellow-400'
                      }`}>
                        {aiAnalysis.riskLevel === 'low' ? 'Baixo' : 
                         aiAnalysis.riskLevel === 'high' ? 'Alto' : 'Médio'}
                      </div>
                      <div className="text-sm text-blue-200">
                        Nível de risco
                      </div>
                    </div>

                    <div className={`bg-gradient-to-br p-6 rounded-2xl border shadow-lg ${
                      aiAnalysis.recommendation === 'buy' 
                        ? 'from-green-500/30 to-emerald-500/30 border-green-400/50 bg-black/50' 
                        : aiAnalysis.recommendation === 'sell'
                        ? 'from-red-500/30 to-rose-500/30 border-red-400/50 bg-black/50'
                        : 'from-blue-500/30 to-indigo-500/30 border-blue-400/50 bg-black/50'
                    }`}>
                      <div className="flex items-center space-x-3 mb-3">
                        <Target className={`w-6 h-6 ${
                          aiAnalysis.recommendation === 'buy' ? 'text-green-400' :
                          aiAnalysis.recommendation === 'sell' ? 'text-red-400' : 'text-blue-400'
                        }`} />
                        <span className="font-bold text-white">Recomendação</span>
                      </div>
                      <div className={`text-2xl font-bold mb-2 ${
                        aiAnalysis.recommendation === 'buy' ? 'text-green-400' :
                        aiAnalysis.recommendation === 'sell' ? 'text-red-400' : 'text-blue-400'
                      }`}>
                        {aiAnalysis.recommendation === 'buy' ? 'Comprar' : 
                         aiAnalysis.recommendation === 'sell' ? 'Vender' : 'Manter'}
                      </div>
                      <div className="text-sm text-blue-200">
                        Ação sugerida
                      </div>
                    </div>
                  </div>

                  {/* Gráfico de Preços */}
                  <div className="bg-gradient-to-br from-black/80 to-blue-900/50 backdrop-blur-xl rounded-2xl p-6 border border-blue-500/30">
                    <div className="flex items-center space-x-3 mb-6">
                      <BarChart3 className="w-6 h-6 text-cyan-400" />
                      <h3 className="text-xl font-bold text-white">Histórico de Preços (30 dias)</h3>
                    </div>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={generateChartData(selectedCryptoForAI)}>
                          <defs>
                            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e40af" />
                          <XAxis dataKey="date" stroke="#60a5fa" fontSize={12} />
                          <YAxis stroke="#60a5fa" fontSize={12} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#1e3a8a', 
                              border: '1px solid #3b82f6',
                              borderRadius: '12px',
                              color: '#f1f5f9'
                            }}
                            formatter={(value: any) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Preço']}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="price" 
                            stroke="#06b6d4" 
                            strokeWidth={2}
                            fillOpacity={1} 
                            fill="url(#colorPrice)" 
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Previsões de Preço */}
                  <div className="bg-gradient-to-br from-black/80 to-blue-900/50 backdrop-blur-xl rounded-2xl p-6 border border-blue-500/30">
                    <div className="flex items-center space-x-3 mb-6">
                      <Sparkles className="w-6 h-6 text-purple-400" />
                      <h3 className="text-xl font-bold text-white">Previsões de Preço</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-black/60 rounded-xl p-4 border border-blue-500/20">
                        <div className="text-sm text-blue-300 mb-2">Curto Prazo (7 dias)</div>
                        <div className="text-2xl font-bold text-cyan-400">
                          R$ {aiAnalysis.priceTarget.short.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                        <div className={`text-sm flex items-center mt-2 ${
                          aiAnalysis.priceTarget.short > selectedCryptoForAI.price ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {aiAnalysis.priceTarget.short > selectedCryptoForAI.price ? 
                            <TrendingUp className="w-4 h-4 mr-1" /> : 
                            <TrendingDown className="w-4 h-4 mr-1" />
                          }
                          {((aiAnalysis.priceTarget.short / selectedCryptoForAI.price - 1) * 100).toFixed(1)}%
                        </div>
                      </div>
                      <div className="bg-black/60 rounded-xl p-4 border border-blue-500/20">
                        <div className="text-sm text-blue-300 mb-2">Médio Prazo (30 dias)</div>
                        <div className="text-2xl font-bold text-purple-400">
                          R$ {aiAnalysis.priceTarget.medium.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                        <div className={`text-sm flex items-center mt-2 ${
                          aiAnalysis.priceTarget.medium > selectedCryptoForAI.price ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {aiAnalysis.priceTarget.medium > selectedCryptoForAI.price ? 
                            <TrendingUp className="w-4 h-4 mr-1" /> : 
                            <TrendingDown className="w-4 h-4 mr-1" />
                          }
                          {((aiAnalysis.priceTarget.medium / selectedCryptoForAI.price - 1) * 100).toFixed(1)}%
                        </div>
                      </div>
                      <div className="bg-black/60 rounded-xl p-4 border border-blue-500/20">
                        <div className="text-sm text-blue-300 mb-2">Longo Prazo (90 dias)</div>
                        <div className="text-2xl font-bold text-pink-400">
                          R$ {aiAnalysis.priceTarget.long.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                        <div className={`text-sm flex items-center mt-2 ${
                          aiAnalysis.priceTarget.long > selectedCryptoForAI.price ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {aiAnalysis.priceTarget.long > selectedCryptoForAI.price ? 
                            <TrendingUp className="w-4 h-4 mr-1" /> : 
                            <TrendingDown className="w-4 h-4 mr-1" />
                          }
                          {((aiAnalysis.priceTarget.long / selectedCryptoForAI.price - 1) * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pontos-Chave da Análise */}
                  <div className="bg-gradient-to-br from-black/80 to-blue-900/50 backdrop-blur-xl rounded-2xl p-6 border border-blue-500/30">
                    <div className="flex items-center space-x-3 mb-6">
                      <Brain className="w-6 h-6 text-cyan-400" />
                      <h3 className="text-xl font-bold text-white">Insights da IA</h3>
                    </div>
                    <div className="space-y-3">
                      {aiAnalysis.keyPoints.map((point, index) => (
                        <div key={index} className="flex items-start space-x-3 p-3 bg-black/60 rounded-xl border border-blue-500/20">
                          <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2 flex-shrink-0"></div>
                          <p className="text-blue-100">{point}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex space-x-4">
                    <button
                      onClick={() => {
                        setShowAIModal(false);
                        setSelectedCrypto(selectedCryptoForAI);
                        setActiveTab('convert');
                      }}
                      className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold py-4 rounded-2xl hover:from-cyan-600 hover:to-blue-700 transition-all duration-300 shadow-xl shadow-cyan-500/25 transform hover:scale-[1.02]"
                    >
                      Converter Agora
                    </button>
                    <button
                      onClick={() => analyzeWithAI(selectedCryptoForAI)}
                      className="px-6 py-4 bg-gradient-to-r from-blue-500/30 to-purple-500/30 backdrop-blur-sm border border-blue-400/50 text-blue-200 font-bold rounded-2xl hover:from-blue-500/40 hover:to-purple-500/40 transition-all duration-300"
                    >
                      Atualizar Análise
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-black/20 backdrop-blur-xl px-4 py-6 border-b border-white/10 relative z-10">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/25">
              <Bitcoin className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                DMCCryptoPIX
              </h1>
              <div className="flex items-center space-x-2">
                <p className="text-sm text-gray-300">Olá, {user?.name}</p>
                {isOnline ? (
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <Wifi className="w-4 h-4 text-green-400" />
                  </div>
                ) : (
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                    <WifiOff className="w-4 h-4 text-red-400" />
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {!isOnline && <AlertTriangle className="w-5 h-5 text-yellow-400 animate-bounce" />}
            {/* BOTÃO ATUALIZAR MELHORADO */}
            <button 
              onClick={() => fetchRealPrices()} 
              disabled={isLoading}
              className="group relative p-3 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 backdrop-blur-sm border border-emerald-400/30 hover:from-emerald-500/30 hover:to-teal-500/30 transition-all duration-300 transform hover:scale-110 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40"
            >
              <RefreshCw className={`w-5 h-5 text-emerald-400 group-hover:text-emerald-300 transition-colors ${isLoading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
              <div className="absolute -top-2 -right-2 w-3 h-3 bg-emerald-400 rounded-full animate-pulse opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </button>
            {/* BOTÃO NOTIFICAÇÕES MELHORADO */}
            <button className="group relative p-3 rounded-2xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 backdrop-blur-sm border border-amber-400/30 hover:from-amber-500/30 hover:to-orange-500/30 transition-all duration-300 transform hover:scale-110 shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40">
              <Bell className="w-5 h-5 text-amber-400 group-hover:text-amber-300 transition-colors group-hover:animate-pulse" />
              {settings.notifications && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                </div>
              )}
            </button>
            <button 
              onClick={() => setActiveTab('settings')}
              className="group p-3 rounded-2xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm border border-purple-400/30 hover:from-purple-500/30 hover:to-pink-500/30 transition-all duration-300 transform hover:scale-110 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40"
            >
              <Settings className="w-5 h-5 text-purple-400 group-hover:text-purple-300 transition-colors group-hover:rotate-90 transition-transform duration-300" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto relative z-10">
        {activeTab === 'dashboard' && (
          <div className="p-4 space-y-6">
            {/* Status de Conectividade */}
            {!isOnline && (
              <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-sm border border-yellow-400/30 rounded-2xl p-4 flex items-center space-x-3 shadow-lg">
                <WifiOff className="w-6 h-6 text-yellow-400" />
                <div>
                  <div className="text-sm font-medium text-yellow-300">Modo Offline</div>
                  <div className="text-xs text-yellow-200">Cotações podem estar desatualizadas</div>
                </div>
              </div>
            )}

            {/* Saldo Total */}
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-medium text-gray-200">Saldo Total</h2>
                <div className="flex items-center space-x-3">
                  {/* BOTÃO VISUALIZAR SALDO MELHORADO */}
                  <button 
                    onClick={() => setShowBalance(!showBalance)}
                    className="group relative p-3 rounded-2xl bg-gradient-to-r from-indigo-500/20 to-blue-500/20 backdrop-blur-sm border border-indigo-400/30 hover:from-indigo-500/30 hover:to-blue-500/30 transition-all duration-300 transform hover:scale-110 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40"
                  >
                    {showBalance ? (
                      <Eye className="w-5 h-5 text-indigo-400 group-hover:text-indigo-300 transition-colors" />
                    ) : (
                      <EyeOff className="w-5 h-5 text-indigo-400 group-hover:text-indigo-300 transition-colors" />
                    )}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-400/0 to-blue-400/0 group-hover:from-indigo-400/10 group-hover:to-blue-400/10 transition-all duration-300"></div>
                  </button>
                  <div className="text-xs text-gray-400 bg-black/20 px-3 py-1 rounded-full">
                    {lastUpdate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
              <div className="text-4xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                {showBalance ? `R$ ${totalBalanceBRL.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ ••••••'}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm">
                  <div className="w-3 h-3 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                  <TrendingUp className="w-4 h-4 text-green-400 mr-1" />
                  <span className="text-green-400 font-medium">+2.34% (24h)</span>
                  {isOnline && <span className="ml-2 text-xs text-green-400">● Ao vivo</span>}
                </div>
                <div className="flex items-center space-x-1 text-xs text-gray-400">
                  <Zap className="w-3 h-3" />
                  <span>Atualizado</span>
                </div>
              </div>
            </div>

            {/* Ações Principais */}
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setActiveTab('convert')}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold py-6 px-6 rounded-2xl hover:from-cyan-600 hover:to-blue-700 transition-all duration-300 flex items-center justify-center space-x-3 shadow-xl shadow-cyan-500/25 transform hover:scale-105"
              >
                <ArrowUpDown className="w-6 h-6" />
                <span className="text-lg">Converter</span>
              </button>
              <button 
                onClick={() => setActiveTab('pix')}
                className="bg-gradient-to-r from-purple-500 to-pink-600 text-white font-bold py-6 px-6 rounded-2xl hover:from-purple-600 hover:to-pink-700 transition-all duration-300 flex items-center justify-center space-x-3 shadow-xl shadow-purple-500/25 transform hover:scale-105"
              >
                <QrCode className="w-6 h-6" />
                <span className="text-lg">PIX</span>
              </button>
            </div>

            {/* Criptomoedas */}
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-2xl">
              <h3 className="text-lg font-bold mb-6 text-gray-200">Suas Criptomoedas</h3>
              <div className="space-y-4">
                {cryptoData.map((crypto) => (
                  <div 
                    key={crypto.symbol} 
                    onClick={() => openAIModal(crypto)}
                    className="flex items-center justify-between p-4 bg-black/20 rounded-2xl border border-white/10 hover:bg-black/30 transition-all cursor-pointer group hover:border-cyan-400/30 hover:shadow-lg hover:shadow-cyan-500/20"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <span className="text-sm font-bold text-white">{crypto.symbol}</span>
                      </div>
                      <div>
                        <div className="font-bold text-white">{crypto.name}</div>
                        <div className="text-sm text-gray-400">{crypto.balance} {crypto.symbol}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-white">R$ {crypto.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                      <div className={`text-sm flex items-center justify-end ${crypto.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {crypto.change >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                        {crypto.change >= 0 ? '+' : ''}{crypto.change.toFixed(2)}%
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Brain className="w-5 h-5 text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-xl border border-cyan-400/20">
                <div className="flex items-center space-x-2 text-sm text-cyan-300">
                  <Brain className="w-4 h-4" />
                  <span>Clique em qualquer cripto para análise com IA</span>
                </div>
              </div>
            </div>

            {/* Transações Recentes */}
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-200">Transações Recentes</h3>
                <button 
                  onClick={() => setActiveTab('history')}
                  className="text-cyan-400 text-sm hover:text-cyan-300 transition-colors font-medium"
                >
                  Ver todas →
                </button>
              </div>
              <div className="space-y-3">
                {transactions.slice(0, 3).map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between py-3 px-4 bg-black/20 rounded-2xl border border-white/10 hover:bg-black/30 transition-all">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gradient-to-r from-gray-600 to-gray-700 rounded-xl flex items-center justify-center">
                        {tx.type === 'conversion' ? <ArrowUpDown className="w-5 h-5 text-white" /> : <QrCode className="w-5 h-5 text-white" />}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">
                          {tx.type === 'conversion' ? `Conversão ${tx.crypto}` : 'Pagamento PIX'}
                        </div>
                        <div className="text-xs text-gray-400">{tx.date}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-white">
                        R$ {(tx.brlValue || tx.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                      <div className={`text-xs px-2 py-1 rounded-full ${
                        tx.status === 'completed' ? 'bg-green-500/20 text-green-400' : 
                        tx.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' : 
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {tx.status === 'completed' ? 'Concluído' : tx.status === 'pending' ? 'Pendente' : 'Falhou'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'convert' && (
          <div className="p-4 space-y-6">
            <div className="flex items-center justify-between">
              {/* BOTÃO VOLTAR MELHORADO */}
              <button 
                onClick={() => setActiveTab('dashboard')}
                className="group flex items-center space-x-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-slate-500/20 to-gray-500/20 backdrop-blur-sm border border-slate-400/30 hover:from-slate-500/30 hover:to-gray-500/30 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-slate-500/20 hover:shadow-slate-500/40"
              >
                <ArrowLeft className="w-5 h-5 text-slate-400 group-hover:text-slate-300 transition-colors group-hover:-translate-x-1 transition-transform duration-300" />
                <span className="text-slate-400 group-hover:text-slate-300 font-medium transition-colors">Voltar</span>
              </button>
              <h2 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">Converter Cripto</h2>
              <div></div>
            </div>

            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl space-y-8">
              {/* Seleção de Criptomoeda */}
              <div>
                <label className="block text-sm font-bold mb-4 text-gray-200">Selecionar Criptomoeda</label>
                <div className="grid grid-cols-2 gap-4">
                  {cryptoData.map((crypto) => (
                    <button
                      key={crypto.symbol}
                      onClick={() => setSelectedCrypto(crypto)}
                      className={`p-5 rounded-2xl border transition-all duration-300 ${
                        selectedCrypto.symbol === crypto.symbol
                          ? 'border-cyan-400 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 shadow-lg shadow-cyan-500/25'
                          : 'border-white/20 hover:border-white/40 bg-black/20'
                      }`}
                    >
                      <div className="text-sm font-bold text-white">{crypto.symbol}</div>
                      <div className="text-xs text-gray-400">R$ {crypto.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Valor a Converter */}
              <div>
                <label className="block text-sm font-bold mb-4 text-gray-200">Quantidade ({selectedCrypto.symbol})</label>
                <input
                  type="number"
                  value={convertAmount}
                  onChange={(e) => setConvertAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-black/30 backdrop-blur-sm border border-white/20 rounded-2xl px-6 py-4 text-white placeholder-gray-400 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 transition-all text-lg"
                />
                <div className="text-xs text-gray-400 mt-3 bg-black/20 px-4 py-2 rounded-xl">
                  Saldo disponível: <span className="text-white font-medium">{selectedCrypto.balance} {selectedCrypto.symbol}</span>
                </div>
              </div>

              {/* Valor em BRL */}
              {convertAmount && (
                <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 backdrop-blur-sm rounded-2xl p-6 border border-cyan-400/30 shadow-lg">
                  <div className="text-sm text-gray-300 mb-2">Você receberá</div>
                  <div className="text-3xl font-bold text-white mb-2">
                    R$ {(parseFloat(convertAmount) * selectedCrypto.price * 0.99).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-xs text-gray-400">
                    Taxa: R$ {(parseFloat(convertAmount) * selectedCrypto.price * 0.01).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (1%)
                  </div>
                </div>
              )}

              <button
                onClick={handleConvert}
                disabled={!convertAmount || parseFloat(convertAmount) > selectedCrypto.balance}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold py-5 rounded-2xl hover:from-cyan-600 hover:to-blue-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-cyan-500/25 transform hover:scale-[1.02] text-lg"
              >
                Converter Agora
              </button>
            </div>
          </div>
        )}

        {activeTab === 'pix' && (
          <div className="p-4 space-y-6">
            <div className="flex items-center justify-between">
              {/* BOTÃO VOLTAR MELHORADO */}
              <button 
                onClick={() => setActiveTab('dashboard')}
                className="group flex items-center space-x-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-slate-500/20 to-gray-500/20 backdrop-blur-sm border border-slate-400/30 hover:from-slate-500/30 hover:to-gray-500/30 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-slate-500/20 hover:shadow-slate-500/40"
              >
                <ArrowLeft className="w-5 h-5 text-slate-400 group-hover:text-slate-300 transition-colors group-hover:-translate-x-1 transition-transform duration-300" />
                <span className="text-slate-400 group-hover:text-slate-300 font-medium transition-colors">Voltar</span>
              </button>
              <h2 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Pagamento PIX</h2>
              <div></div>
            </div>

            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl space-y-8">
              <div className="text-center">
                <div className="text-lg font-medium mb-3 text-gray-200">Saldo Disponível</div>
                <div className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                  R$ {totalBalanceBRL.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-sm text-gray-400">Pronto para usar via PIX</div>
              </div>

              <button
                onClick={generatePixCode}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white font-bold py-5 rounded-2xl hover:from-purple-600 hover:to-pink-700 transition-all duration-300 shadow-xl shadow-purple-500/25 transform hover:scale-[1.02] text-lg"
              >
                Gerar Código PIX
              </button>

              {pixCode && (
                <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm rounded-2xl p-8 border border-purple-400/30 shadow-lg">
                  <div className="text-center mb-6">
                    <div className="w-40 h-40 bg-white rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-2xl">
                      <QrCode className="w-24 h-24 text-black" />
                    </div>
                    <div className="text-sm text-gray-300 mb-3">Código PIX</div>
                    <div className="text-xs bg-black/30 p-4 rounded-xl break-all font-mono text-gray-300 border border-white/10">
                      {pixCode}
                    </div>
                  </div>
                  
                  <button
                    onClick={copyPixCode}
                    className="w-full bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-sm border border-purple-400 text-purple-300 font-bold py-4 rounded-2xl hover:bg-white/20 transition-all duration-300 flex items-center justify-center space-x-3"
                  >
                    {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    <span>{copied ? 'Copiado!' : 'Copiar Código'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="p-4 space-y-6">
            <div className="flex items-center justify-between">
              {/* BOTÃO VOLTAR MELHORADO */}
              <button 
                onClick={() => setActiveTab('dashboard')}
                className="group flex items-center space-x-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-slate-500/20 to-gray-500/20 backdrop-blur-sm border border-slate-400/30 hover:from-slate-500/30 hover:to-gray-500/30 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-slate-500/20 hover:shadow-slate-500/40"
              >
                <ArrowLeft className="w-5 h-5 text-slate-400 group-hover:text-slate-300 transition-colors group-hover:-translate-x-1 transition-transform duration-300" />
                <span className="text-slate-400 group-hover:text-slate-300 font-medium transition-colors">Voltar</span>
              </button>
              <h2 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">Histórico</h2>
              <div></div>
            </div>

            <div className="space-y-4">
              {transactions.map((tx) => (
                <div key={tx.id} className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-gray-600 to-gray-700 rounded-2xl flex items-center justify-center shadow-lg">
                        {tx.type === 'conversion' ? <ArrowUpDown className="w-6 h-6 text-white" /> : <QrCode className="w-6 h-6 text-white" />}
                      </div>
                      <div>
                        <div className="font-bold text-white">
                          {tx.type === 'conversion' ? `Conversão ${tx.crypto}` : 'Pagamento PIX'}
                        </div>
                        <div className="text-sm text-gray-400">{tx.date}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-white text-lg">
                        R$ {(tx.brlValue || tx.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                      <div className={`text-sm px-3 py-1 rounded-full font-medium ${
                        tx.status === 'completed' ? 'bg-green-500/20 text-green-400' : 
                        tx.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' : 
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {tx.status === 'completed' ? 'Concluído' : tx.status === 'pending' ? 'Pendente' : 'Falhou'}
                      </div>
                    </div>
                  </div>
                  
                  {tx.type === 'conversion' && (
                    <div className="text-sm text-gray-300 bg-black/20 p-4 rounded-xl border border-white/10">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-gray-400">Quantidade:</span>
                          <div className="font-medium">{tx.amount} {tx.crypto}</div>
                        </div>
                        <div>
                          <span className="text-gray-400">Taxa:</span>
                          <div className="font-medium">R$ {((tx.brlValue || 0) * 0.01).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                        </div>
                      </div>
                      {tx.hash && (
                        <div className="mt-3 pt-3 border-t border-white/10">
                          <span className="text-gray-400">Hash:</span>
                          <div className="text-xs font-mono text-gray-300 mt-1">{tx.hash}</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="p-4 space-y-6">
            <div className="flex items-center justify-between">
              {/* BOTÃO VOLTAR MELHORADO */}
              <button 
                onClick={() => setActiveTab('dashboard')}
                className="group flex items-center space-x-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-slate-500/20 to-gray-500/20 backdrop-blur-sm border border-slate-400/30 hover:from-slate-500/30 hover:to-gray-500/30 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-slate-500/20 hover:shadow-slate-500/40"
              >
                <ArrowLeft className="w-5 h-5 text-slate-400 group-hover:text-slate-300 transition-colors group-hover:-translate-x-1 transition-transform duration-300" />
                <span className="text-slate-400 group-hover:text-slate-300 font-medium transition-colors">Voltar</span>
              </button>
              <h2 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">Configurações</h2>
              <div></div>
            </div>

            {/* Perfil do Usuário */}
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
              <div className="flex items-center space-x-6 mb-6">
                <div className="w-20 h-20 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-cyan-500/25">
                  <User className="w-10 h-10 text-white" />
                </div>
                <div>
                  <div className="text-xl font-bold text-white">{user?.name}</div>
                  <div className="text-sm text-gray-400">{user?.email}</div>
                  <div className={`text-xs px-3 py-1 rounded-full inline-block mt-2 font-medium ${
                    user?.kycStatus === 'approved' ? 'bg-green-500/20 text-green-400' :
                    user?.kycStatus === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    KYC: {user?.kycStatus === 'approved' ? 'Aprovado' : user?.kycStatus === 'pending' ? 'Pendente' : 'Rejeitado'}
                  </div>
                </div>
              </div>
            </div>

            {/* Configurações */}
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl space-y-6">
              <h3 className="text-lg font-bold mb-6 text-gray-200">Preferências</h3>
              
              <div className="flex items-center justify-between p-4 bg-black/20 rounded-2xl border border-white/10">
                <div className="flex items-center space-x-4">
                  <Bell className="w-6 h-6 text-gray-300" />
                  <span className="font-medium text-white">Notificações</span>
                </div>
                <button
                  onClick={() => setSettings(prev => ({ ...prev, notifications: !prev.notifications }))}
                  className={`w-14 h-7 rounded-full transition-all duration-300 ${
                    settings.notifications ? 'bg-gradient-to-r from-cyan-500 to-blue-600' : 'bg-gray-600'
                  }`}
                >
                  <div className={`w-6 h-6 bg-white rounded-full transition-transform duration-300 ${
                    settings.notifications ? 'translate-x-7' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-black/20 rounded-2xl border border-white/10">
                <div className="flex items-center space-x-4">
                  <Smartphone className="w-6 h-6 text-gray-300" />
                  <span className="font-medium text-white">Biometria</span>
                </div>
                <button
                  onClick={() => setSettings(prev => ({ ...prev, biometric: !prev.biometric }))}
                  className={`w-14 h-7 rounded-full transition-all duration-300 ${
                    settings.biometric ? 'bg-gradient-to-r from-purple-500 to-pink-600' : 'bg-gray-600'
                  }`}
                >
                  <div className={`w-6 h-6 bg-white rounded-full transition-transform duration-300 ${
                    settings.biometric ? 'translate-x-7' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-black/20 rounded-2xl border border-white/10">
                <div className="flex items-center space-x-4">
                  <TrendingUp className="w-6 h-6 text-gray-300" />
                  <span className="font-medium text-white">Alertas de Preço</span>
                </div>
                <button
                  onClick={() => setSettings(prev => ({ ...prev, priceAlerts: !prev.priceAlerts }))}
                  className={`w-14 h-7 rounded-full transition-all duration-300 ${
                    settings.priceAlerts ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gray-600'
                  }`}
                >
                  <div className={`w-6 h-6 bg-white rounded-full transition-transform duration-300 ${
                    settings.priceAlerts ? 'translate-x-7' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
            </div>

            {/* Status do Sistema */}
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
              <h3 className="text-lg font-bold mb-6 text-gray-200">Status do Sistema</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-black/20 rounded-2xl border border-white/10">
                  <span className="text-white font-medium">Conectividade</span>
                  <div className="flex items-center space-x-3">
                    {isOnline ? <Wifi className="w-5 h-5 text-green-400" /> : <WifiOff className="w-5 h-5 text-red-400" />}
                    <span className={`text-sm font-medium px-3 py-1 rounded-full ${
                      isOnline ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {isOnline ? 'Online' : 'Offline'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-black/20 rounded-2xl border border-white/10">
                  <span className="text-white font-medium">Última Atualização</span>
                  <span className="text-sm text-gray-400 bg-black/30 px-3 py-1 rounded-full">
                    {lastUpdate.toLocaleTimeString('pt-BR')}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-black/20 rounded-2xl border border-white/10">
                  <span className="text-white font-medium">Versão</span>
                  <span className="text-sm text-gray-400 bg-black/30 px-3 py-1 rounded-full">v2.1.0</span>
                </div>
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="w-full bg-gradient-to-r from-red-500/20 to-red-600/20 backdrop-blur-sm border border-red-400/30 text-red-300 font-bold py-5 rounded-2xl hover:from-red-500/30 hover:to-red-600/30 transition-all duration-300 flex items-center justify-center space-x-3 shadow-lg"
            >
              <LogOut className="w-6 h-6" />
              <span className="text-lg">Sair da Conta</span>
            </button>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/20 backdrop-blur-xl border-t border-white/10 z-20">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-around">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex flex-col items-center space-y-2 py-3 px-5 rounded-2xl transition-all duration-300 ${
                activeTab === 'dashboard' 
                  ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 shadow-lg shadow-cyan-500/25' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Wallet className="w-6 h-6" />
              <span className="text-xs font-medium">Dashboard</span>
            </button>
            <button
              onClick={() => setActiveTab('convert')}
              className={`flex flex-col items-center space-y-2 py-3 px-5 rounded-2xl transition-all duration-300 ${
                activeTab === 'convert' 
                  ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 shadow-lg shadow-cyan-500/25' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <ArrowUpDown className="w-6 h-6" />
              <span className="text-xs font-medium">Converter</span>
            </button>
            <button
              onClick={() => setActiveTab('pix')}
              className={`flex flex-col items-center space-y-2 py-3 px-5 rounded-2xl transition-all duration-300 ${
                activeTab === 'pix' 
                  ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-400 shadow-lg shadow-purple-500/25' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <QrCode className="w-6 h-6" />
              <span className="text-xs font-medium">PIX</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex flex-col items-center space-y-2 py-3 px-5 rounded-2xl transition-all duration-300 ${
                activeTab === 'history' 
                  ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 shadow-lg shadow-cyan-500/25' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <History className="w-6 h-6" />
              <span className="text-xs font-medium">Histórico</span>
            </button>
          </div>
        </div>
      </div>

      {/* Espaçamento para bottom navigation */}
      <div className="h-24"></div>
    </div>
  );
}