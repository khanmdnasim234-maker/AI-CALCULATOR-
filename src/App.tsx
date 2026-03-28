/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Calculator as CalcIcon, 
  History as HistoryIcon, 
  Settings, 
  Moon, 
  Sun, 
  Trash2, 
  ChevronLeft, 
  Menu,
  ArrowRightLeft,
  Scale,
  Ruler,
  Coins,
  Delete,
  X,
  ShieldCheck,
  Lock,
  Unlock,
  Copy,
  Check,
  Plus,
  Eye,
  EyeOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as math from 'mathjs';
import { format } from 'date-fns';
import { cn } from './lib/utils';

// --- Types ---

type View = 'calculator' | 'converter' | 'history' | 'vault';
type ConverterType = 'currency' | 'weight' | 'length';

interface HistoryItem {
  id: string;
  expression: string;
  result: string;
  timestamp: number;
}

interface BackupCode {
  id: string;
  code: string;
  isUsed: boolean;
  label?: string;
}

// --- Constants ---

const SCIENTIFIC_KEYS = [
  'sin', 'cos', 'tan', 'log', 'sqrt', 'pow', 'pi', 'e', '(', ')'
];

const BASIC_KEYS = [
  '7', '8', '9', '/',
  '4', '5', '6', '*',
  '1', '2', '3', '-',
  '0', '.', '=', '+'
];

// --- Components ---

export default function App() {
  const [view, setView] = useState<View>('calculator');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    const saved = localStorage.getItem('calc_history');
    return saved ? JSON.parse(saved) : [];
  });

  const [vaultCodes, setVaultCodes] = useState<BackupCode[]>(() => {
    const saved = localStorage.getItem('vault_codes');
    if (saved) return JSON.parse(saved);
    
    // Initial codes from user request
    return [
      { id: '1', code: '7173 8599', isUsed: false },
      { id: '2', code: '9153 5330', isUsed: false },
      { id: '3', code: '7158 9451', isUsed: false },
      { id: '4', code: '2091 6514', isUsed: false },
      { id: '5', code: '4158 0361', isUsed: false },
      { id: '6', code: '2935 7338', isUsed: false },
      { id: '7', code: '6812 8358', isUsed: false },
      { id: '8', code: '0984 7473', isUsed: false },
      { id: '9', code: '7813 8349', isUsed: false },
      { id: '10', code: '2021 3036', isUsed: false },
    ];
  });

  const [vaultPassword, setVaultPassword] = useState<string>(() => {
    return localStorage.getItem('vault_password') || '1234';
  });

  const [isVaultLocked, setIsVaultLocked] = useState(true);

  // Theme management
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Save history
  useEffect(() => {
    localStorage.setItem('calc_history', JSON.stringify(history));
  }, [history]);

  // Save vault codes
  useEffect(() => {
    localStorage.setItem('vault_codes', JSON.stringify(vaultCodes));
  }, [vaultCodes]);

  const toggleTheme = () => {
    vibrate();
    setIsDarkMode(!isDarkMode);
  };

  const vibrate = () => {
    if (navigator.vibrate) {
      navigator.vibrate(20);
    }
  };

  const addToHistory = (expression: string, result: string) => {
    // Secret trigger: if expression is the vault password, open vault
    if (expression === vaultPassword) {
      setIsVaultLocked(false);
      setView('vault');
      return;
    }

    const newItem: HistoryItem = {
      id: Math.random().toString(36).substr(2, 9),
      expression,
      result,
      timestamp: Date.now(),
    };
    setHistory([newItem, ...history].slice(0, 50)); // Keep last 50
  };

  const clearHistory = () => {
    vibrate();
    setHistory([]);
  };

  const deleteHistoryItem = (id: string) => {
    vibrate();
    setHistory(history.filter(item => item.id !== id));
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface text-on-surface transition-colors duration-300 overflow-hidden">
      {/* Header */}
      <header className="p-4 flex items-center justify-between glass sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsDrawerOpen(true)}
            className="p-2 rounded-full hover:bg-surface-variant transition-colors"
          >
            <Menu size={24} />
          </button>
          <h1 className="text-xl font-semibold capitalize">
            {view === 'calculator' ? 'Calculator' : 
             view === 'converter' ? 'Unit Converter' : 
             view === 'history' ? 'History' : 'Secure Vault'}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-surface-variant transition-colors"
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative overflow-y-auto">
        <AnimatePresence>
          {view === 'calculator' && (
            <CalculatorView key="calc" onResult={addToHistory} vibrate={vibrate} />
          )}
          {view === 'converter' && (
            <ConverterView key="conv" vibrate={vibrate} />
          )}
          {view === 'history' && (
            <HistoryView 
              key="hist" 
              history={history} 
              onDelete={deleteHistoryItem} 
              onClear={clearHistory}
              vibrate={vibrate}
            />
          )}
          {view === 'vault' && (
            <VaultView 
              key="vault"
              codes={vaultCodes}
              setCodes={setVaultCodes}
              isLocked={isVaultLocked}
              setIsLocked={setIsVaultLocked}
              password={vaultPassword}
              setPassword={(p) => {
                setVaultPassword(p);
                localStorage.setItem('vault_password', p);
              }}
              vibrate={vibrate}
            />
          )}
        </AnimatePresence>
      </main>

      {/* Drawer Overlay */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-black/50 z-[60]"
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 h-full w-72 bg-surface z-[70] shadow-2xl p-6 flex flex-col gap-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-primary italic">AI CALCULATOR</h2>
                <button onClick={() => setIsDrawerOpen(false)} className="p-2 rounded-full hover:bg-surface-variant">
                  <X size={24} />
                </button>
              </div>
              
              <nav className="flex flex-col gap-2">
                <DrawerItem 
                  icon={<CalcIcon size={20} />} 
                  label="Calculator" 
                  active={view === 'calculator'} 
                  onClick={() => { setView('calculator'); setIsDrawerOpen(false); }} 
                />
                <DrawerItem 
                  icon={<ArrowRightLeft size={20} />} 
                  label="Unit Converter" 
                  active={view === 'converter'} 
                  onClick={() => { setView('converter'); setIsDrawerOpen(false); }} 
                />
                <DrawerItem 
                  icon={<HistoryIcon size={20} />} 
                  label="History" 
                  active={view === 'history'} 
                  onClick={() => { setView('history'); setIsDrawerOpen(false); }} 
                />
              </nav>
              
              <div className="mt-auto border-t border-outline/20 pt-6">
                <p className="text-xs text-on-surface-variant text-center">Version 1.1.0</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Sub-Views ---

function CalculatorView({ onResult, vibrate }: { onResult: (exp: string, res: string) => void, vibrate: () => void, key?: string }) {
  const [display, setDisplay] = useState('');
  const [result, setResult] = useState('');
  const [isScientific, setIsScientific] = useState(false);

  // Real-time calculation preview
  useEffect(() => {
    if (!display) {
      setResult('');
      return;
    }

    try {
      // Basic cleanup for mathjs
      let expr = display.replace(/pi/g, 'PI').replace(/e/g, 'E');
      
      // Try to evaluate. If it's a partial expression (like "5+"), mathjs might throw.
      // We only update the result if it's a valid complete expression.
      const res = math.evaluate(expr);
      
      if (res !== undefined && typeof res !== 'function') {
        const formattedRes = Number.isInteger(res) ? res.toString() : res.toFixed(8).replace(/\.?0+$/, "");
        setResult(formattedRes);
      }
    } catch (e) {
      // Silently fail during typing for incomplete expressions
    }
  }, [display]);

  const handleKey = (key: string) => {
    vibrate();
    if (key === '=') {
      if (result && result !== 'Error') {
        onResult(display, result);
        setDisplay(result);
        setResult('');
      }
    } else if (key === 'AC') {
      setDisplay('');
      setResult('');
    } else if (key === 'DEL') {
      setDisplay(display.slice(0, -1));
    } else {
      // Handle scientific functions
      if (['sin', 'cos', 'tan', 'log', 'sqrt'].includes(key)) {
        setDisplay(display + key + '(');
      } else {
        setDisplay(display + key);
      }
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="h-full flex flex-col p-4 max-w-md mx-auto w-full"
    >
      {/* Display Area */}
      <div className="flex-1 flex flex-col justify-end items-end p-6 mb-4 glass-card min-h-[160px]">
        <div className="text-on-surface-variant text-lg mb-2 overflow-x-auto whitespace-nowrap w-full text-right scrollbar-hide">
          {display || '0'}
        </div>
        <div className="text-primary text-5xl font-bold overflow-x-auto whitespace-nowrap w-full text-right scrollbar-hide">
          {result || '0'}
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-between items-center mb-4 px-2">
        <button 
          onClick={() => setIsScientific(!isScientific)}
          className="m3-button-text flex items-center gap-2"
        >
          {isScientific ? 'Basic' : 'Scientific'}
        </button>
        <button onClick={() => handleKey('DEL')} className="p-3 rounded-full hover:bg-surface-variant text-error">
          <Delete size={24} />
        </button>
      </div>

      {/* Keypad */}
      <div className="grid grid-cols-4 gap-3">
        {isScientific && (
          <div className="col-span-4 grid grid-cols-5 gap-2 mb-2">
            {SCIENTIFIC_KEYS.map(key => (
              <CalcButton key={key} label={key} onClick={() => handleKey(key)} type="tonal" small />
            ))}
          </div>
        )}
        
        <CalcButton label="AC" onClick={() => handleKey('AC')} type="outline" className="text-error border-error/30" />
        <CalcButton label="(" onClick={() => handleKey('(')} type="tonal" />
        <CalcButton label=")" onClick={() => handleKey(')')} type="tonal" />
        <CalcButton label="/" onClick={() => handleKey('/')} type="tonal" className="text-primary" />

        <CalcButton label="7" onClick={() => handleKey('7')} />
        <CalcButton label="8" onClick={() => handleKey('8')} />
        <CalcButton label="9" onClick={() => handleKey('9')} />
        <CalcButton label="*" onClick={() => handleKey('*')} type="tonal" className="text-primary" />

        <CalcButton label="4" onClick={() => handleKey('4')} />
        <CalcButton label="5" onClick={() => handleKey('5')} />
        <CalcButton label="6" onClick={() => handleKey('6')} />
        <CalcButton label="-" onClick={() => handleKey('-')} type="tonal" className="text-primary" />

        <CalcButton label="1" onClick={() => handleKey('1')} />
        <CalcButton label="2" onClick={() => handleKey('2')} />
        <CalcButton label="3" onClick={() => handleKey('3')} />
        <CalcButton label="+" onClick={() => handleKey('+')} type="tonal" className="text-primary" />

        <CalcButton label="0" onClick={() => handleKey('0')} className="col-span-1" />
        <CalcButton label="." onClick={() => handleKey('.')} />
        <CalcButton label="=" onClick={() => handleKey('=')} type="filled" className="col-span-2" />
      </div>
    </motion.div>
  );
}

function ConverterView({ vibrate }: { vibrate: () => void, key?: string }) {
  const [type, setType] = useState<ConverterType>('length');
  const [value, setValue] = useState('1');
  const [fromUnit, setFromUnit] = useState('');
  const [toUnit, setToUnit] = useState('');
  const [result, setResult] = useState<number | null>(null);
  const [currencyRates, setCurrencyRates] = useState<any>(null);
  const [isLoadingCurrency, setIsLoadingCurrency] = useState(false);

  const units: any = {
    length: ['Meters', 'Kilometers', 'Centimeters', 'Miles', 'Feet', 'Inches'],
    weight: ['Kilograms', 'Grams', 'Pounds', 'Ounces'],
    currency: [
      'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'HKD', 'NZD', 
      'SEK', 'KRW', 'SGD', 'NOK', 'MXN', 'INR', 'RUB', 'ZAR', 'TRY', 'BRL', 
      'TWD', 'DKK', 'PLN', 'THB', 'IDR', 'HUF', 'CZK', 'ILS', 'CLP', 'PHP', 
      'AED', 'COP', 'SAR', 'MYR', 'RON', 'VND', 'ARS', 'IQD', 'KWD', 'PKR', 
      'EGP', 'NGN', 'KES', 'GHS', 'BDT', 'QAR', 'KZT', 'UAH', 'MAD', 'DZD',
      'TND', 'LBP', 'JOD', 'OMR', 'BHD', 'LKR', 'MMK', 'KHR', 'LAK', 'MNT',
      'AFN', 'NPR', 'MVR', 'MUR', 'SCR', 'MGA', 'ETB', 'TZS', 'UGX', 'RWF',
      'BWP', 'NAD', 'ZMW', 'AOA', 'MZN', 'SDG', 'LYD', 'MAD', 'XOF', 'XAF'
    ].sort()
  };

  useEffect(() => {
    if (type === 'currency' && !currencyRates) {
      fetchRates();
    }
  }, [type]);

  const fetchRates = async () => {
    setIsLoadingCurrency(true);
    try {
      const response = await fetch('https://open.er-api.com/v6/latest/USD');
      const data = await response.json();
      if (data && data.rates) {
        setCurrencyRates(data.rates);
      }
    } catch (error) {
      console.error('Failed to fetch rates:', error);
      // Fallback rates
      setCurrencyRates({ USD: 1, EUR: 0.92, GBP: 0.79, INR: 83, BDT: 110, JPY: 150 });
    } finally {
      setIsLoadingCurrency(false);
    }
  };

  useEffect(() => {
    setFromUnit(units[type][0]);
    setToUnit(units[type][1]);
  }, [type]);

  useEffect(() => {
    convert();
  }, [value, fromUnit, toUnit, type]);

  const convert = () => {
    const val = parseFloat(value);
    if (isNaN(val)) {
      setResult(null);
      return;
    }

    // Mock conversion logic (In real app, use a library or API)
    if (type === 'length') {
      const factors: any = { Meters: 1, Kilometers: 0.001, Centimeters: 100, Miles: 0.000621371, Feet: 3.28084, Inches: 39.3701 };
      const inMeters = val / factors[fromUnit];
      setResult(inMeters * factors[toUnit]);
    } else if (type === 'weight') {
      const factors: any = { Kilograms: 1, Grams: 1000, Pounds: 2.20462, Ounces: 35.274 };
      const inKg = val / factors[fromUnit];
      setResult(inKg * factors[toUnit]);
    } else if (type === 'currency') {
      if (currencyRates && currencyRates[fromUnit] && currencyRates[toUnit]) {
        const inUsd = val / currencyRates[fromUnit];
        setResult(inUsd * currencyRates[toUnit]);
      } else if (!currencyRates) {
        // Fallback if rates not loaded yet
        const rates: any = { USD: 1, EUR: 0.92, GBP: 0.79, INR: 83, BDT: 110, JPY: 150 };
        if (rates[fromUnit] && rates[toUnit]) {
          const inUsd = val / rates[fromUnit];
          setResult(inUsd * rates[toUnit]);
        }
      }
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="p-6 max-w-md mx-auto w-full flex flex-col gap-6"
    >
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <TabButton active={type === 'length'} onClick={() => { vibrate(); setType('length'); }} icon={<Ruler size={18} />} label="Length" />
        <TabButton active={type === 'weight'} onClick={() => { vibrate(); setType('weight'); }} icon={<Scale size={18} />} label="Weight" />
        <TabButton active={type === 'currency'} onClick={() => { vibrate(); setType('currency'); }} icon={<Coins size={18} />} label="Currency" />
      </div>

      <div className="glass-card p-6 flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-primary">From</label>
          <div className="flex gap-3">
            <input 
              type="number" 
              value={value} 
              onChange={(e) => setValue(e.target.value)}
              className="flex-1 bg-surface-variant/50 rounded-xl p-3 outline-none focus:ring-2 ring-primary/30 text-lg"
            />
            <select 
              value={fromUnit} 
              onChange={(e) => setFromUnit(e.target.value)}
              className="bg-surface-variant/50 rounded-xl p-3 outline-none min-w-[100px]"
            >
              {units[type].map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </div>

        <div className="flex justify-center">
          <div className="p-2 bg-primary/10 rounded-full text-primary">
            <ArrowRightLeft size={24} className="rotate-90" />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-primary flex justify-between">
            To
            {isLoadingCurrency && <span className="text-[10px] animate-pulse">Updating rates...</span>}
          </label>
          <div className="flex gap-3">
            <div className="flex-1 bg-primary/5 rounded-xl p-3 text-lg font-bold text-primary">
              {result?.toLocaleString(undefined, { maximumFractionDigits: 4 }) || '0'}
            </div>
            <select 
              value={toUnit} 
              onChange={(e) => setToUnit(e.target.value)}
              className="bg-surface-variant/50 rounded-xl p-3 outline-none min-w-[100px]"
            >
              {units[type].map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </div>
      </div>
      
      <p className="text-xs text-on-surface-variant text-center italic">
        {type === 'currency' 
          ? "* Real-time rates provided by ExchangeRate-API." 
          : "* Values are approximate and for demonstration purposes."}
      </p>
    </motion.div>
  );
}

function HistoryView({ history, onDelete, onClear, vibrate }: { 
  history: HistoryItem[], 
  onDelete: (id: string) => void, 
  onClear: () => void,
  vibrate: () => void,
  key?: string
}) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="p-4 max-w-md mx-auto w-full flex flex-col h-full"
    >
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium">Recent Calculations</h3>
        {history.length > 0 && (
          <button onClick={onClear} className="m3-button-text text-error flex items-center gap-2">
            <Trash2 size={18} /> Clear All
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-on-surface-variant opacity-50 gap-4">
          <HistoryIcon size={64} strokeWidth={1} />
          <p>No history yet</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 overflow-y-auto pb-10">
          {history.map((item) => (
            <motion.div 
              layout
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-4 flex justify-between items-center group"
            >
              <div className="flex-1 overflow-hidden">
                <p className="text-xs text-on-surface-variant mb-1">
                  {format(item.timestamp, 'MMM d, h:mm a')}
                </p>
                <p className="text-sm truncate opacity-70">{item.expression}</p>
                <p className="text-xl font-bold text-primary truncate">= {item.result}</p>
              </div>
              <button 
                onClick={() => onDelete(item.id)}
                className="p-2 text-error opacity-0 group-hover:opacity-100 transition-opacity hover:bg-error/10 rounded-full"
              >
                <Trash2 size={20} />
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function VaultView({ 
  codes, 
  setCodes, 
  isLocked, 
  setIsLocked, 
  password, 
  setPassword,
  vibrate 
}: { 
  codes: BackupCode[], 
  setCodes: React.Dispatch<React.SetStateAction<BackupCode[]>>,
  isLocked: boolean,
  setIsLocked: (l: boolean) => void,
  password: string,
  setPassword: (p: string) => void,
  vibrate: () => void,
  key?: string
}) {
  const [inputPass, setInputPass] = useState('');
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [isEditingPass, setIsEditingPass] = useState(false);
  const [newPass, setNewPass] = useState(password);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleUnlock = () => {
    vibrate();
    if (inputPass === password) {
      setIsLocked(false);
      setError('');
    } else {
      setError('Incorrect password');
      setTimeout(() => setError(''), 2000);
    }
  };

  const toggleCodeUsed = (id: string) => {
    vibrate();
    setCodes(codes.map(c => c.id === id ? { ...c, isUsed: !c.isUsed } : c));
  };

  const copyToClipboard = (text: string, id: string) => {
    vibrate();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const addCode = () => {
    vibrate();
    const newCode: BackupCode = {
      id: Math.random().toString(36).substr(2, 9),
      code: '0000 0000',
      isUsed: false,
      label: 'New Code'
    };
    setCodes([...codes, newCode]);
  };

  const deleteCode = (id: string) => {
    vibrate();
    setCodes(codes.filter(c => c.id !== id));
  };

  const updateCode = (id: string, updates: Partial<BackupCode>) => {
    setCodes(codes.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  if (isLocked) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-6 max-w-md mx-auto w-full flex flex-col items-center justify-center h-full gap-8"
      >
        <div className="p-6 bg-primary/10 rounded-full text-primary">
          <Lock size={64} strokeWidth={1.5} />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Vault Locked</h2>
          <p className="text-on-surface-variant text-sm">Enter your secret code to access your backup codes.</p>
          <p className="text-xs text-primary mt-2 opacity-70">Tip: You can also unlock by typing the code in the calculator and pressing '='</p>
        </div>

        <div className="w-full flex flex-col gap-4">
          <div className="relative">
            <input 
              type={showPass ? "text" : "password"}
              value={inputPass}
              onChange={(e) => setInputPass(e.target.value)}
              placeholder="Enter PIN"
              className={cn(
                "w-full bg-surface-variant/50 rounded-2xl p-4 text-center text-2xl tracking-widest outline-none focus:ring-2 ring-primary/30 transition-all",
                error && "ring-error ring-2"
              )}
              onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
            />
            <button 
              onClick={() => setShowPass(!showPass)}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-on-surface-variant"
            >
              {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {error && <p className="text-error text-center text-sm font-medium">{error}</p>}
          <button 
            onClick={handleUnlock}
            className="m3-button-filled w-full py-4 text-lg font-bold"
          >
            Unlock Vault
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 max-w-md mx-auto w-full flex flex-col h-full gap-6"
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <Unlock size={20} />
          </div>
          <h3 className="text-lg font-medium">Your Backup Codes</h3>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => { vibrate(); setIsLocked(true); setInputPass(''); }}
            className="p-2 rounded-full hover:bg-surface-variant text-on-surface-variant"
            title="Lock Vault"
          >
            <Lock size={20} />
          </button>
          <button 
            onClick={() => { vibrate(); setIsEditingPass(!isEditingPass); }}
            className="p-2 rounded-full hover:bg-surface-variant text-on-surface-variant"
            title="Settings"
          >
            <Settings size={20} />
          </button>
        </div>
      </div>

      {isEditingPass && (
        <motion.div 
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="glass-card p-4 flex flex-col gap-4 overflow-hidden"
        >
          <p className="text-sm font-medium">Change Vault PIN</p>
          <div className="flex gap-2">
            <input 
              type="text"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              className="flex-1 bg-surface-variant/50 rounded-xl p-2 outline-none"
            />
            <button 
              onClick={() => {
                vibrate();
                setPassword(newPass);
                setIsEditingPass(false);
              }}
              className="m3-button-filled px-4 py-2 text-sm"
            >
              Save
            </button>
          </div>
        </motion.div>
      )}

      <div className="flex-1 overflow-y-auto flex flex-col gap-3 pb-20 scrollbar-hide">
        {codes.map((code) => (
          <div 
            key={code.id}
            className={cn(
              "glass-card p-4 flex flex-col gap-2 transition-all group",
              code.isUsed && "opacity-50 grayscale"
            )}
          >
            <div className="flex justify-between items-start">
              <input 
                type="text"
                value={code.label || ''}
                placeholder="Add label..."
                onChange={(e) => updateCode(code.id, { label: e.target.value })}
                className="text-xs font-medium text-primary bg-transparent outline-none w-full"
              />
              <button 
                onClick={() => deleteCode(code.id)}
                className="p-1 text-error opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={14} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <input 
                type="text"
                value={code.code}
                onChange={(e) => updateCode(code.id, { code: e.target.value })}
                className={cn(
                  "text-xl font-mono font-bold bg-transparent outline-none flex-1",
                  code.isUsed && "line-through"
                )}
              />
              <div className="flex gap-1">
                <button 
                  onClick={() => copyToClipboard(code.code, code.id)}
                  className="p-2 rounded-full hover:bg-primary/10 text-primary transition-colors"
                >
                  {copiedId === code.id ? <Check size={18} /> : <Copy size={18} />}
                </button>
                <button 
                  onClick={() => toggleCodeUsed(code.id)}
                  className={cn(
                    "p-2 rounded-full transition-colors",
                    code.isUsed ? "bg-primary text-on-primary" : "hover:bg-primary/10 text-primary"
                  )}
                >
                  <Check size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
        <button 
          onClick={addCode}
          className="m3-button-outline w-full py-4 flex items-center justify-center gap-2 border-dashed"
        >
          <Plus size={20} /> Add New Code
        </button>
      </div>
    </motion.div>
  );
}

// --- UI Components ---

function CalcButton({ label, onClick, type = 'tonal', className, small = false }: { 
  label: string, 
  onClick: () => void, 
  type?: 'filled' | 'tonal' | 'outline',
  className?: string,
  small?: boolean,
  key?: string
}) {
  const baseClass = type === 'filled' ? 'm3-button-filled' : type === 'tonal' ? 'm3-button-tonal' : 'm3-button-outline';
  
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      transition={{ duration: 0.05 }}
      onClick={onClick}
      className={cn(
        baseClass,
        "flex items-center justify-center font-medium",
        small ? "h-10 text-sm" : "h-16 text-xl",
        className
      )}
    >
      {label}
    </motion.button>
  );
}

function DrawerItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center gap-4 p-4 rounded-2xl transition-all duration-200",
        active ? "bg-primary-container text-on-primary-container font-bold" : "hover:bg-surface-variant text-on-surface-variant"
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all",
        active ? "bg-primary text-on-primary shadow-md" : "bg-surface-variant/50 text-on-surface-variant hover:bg-surface-variant"
      )}
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}
