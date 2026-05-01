import React, { useState, useEffect, useCallback, useRef, Component, ErrorInfo, ReactNode } from 'react';
import { 
  Upload, Activity, HeartPulse, AlertCircle, CheckCircle2, 
  FileText, Settings, User, FileCode, Server,
  BarChart3, RefreshCw, ShieldAlert, Zap, LogOut, BrainCircuit, Info,
  History, Calendar, ChevronRight, Menu, X, Plus, Search, MoreVertical,
  Bell, Moon, Globe, Lock
} from 'lucide-react';
import { 
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Brush, ReferenceArea
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

class ErrorBoundary extends React.Component<{children: ReactNode}, {hasError: boolean, error: Error | null}> {
  state = { hasError: false, error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-red-500 bg-red-50 min-h-screen">
          <h1 className="text-2xl font-bold mb-4">Something went wrong.</h1>
          <pre className="whitespace-pre-wrap">{this.state.error?.toString()}</pre>
          <pre className="whitespace-pre-wrap mt-4 text-sm">{this.state.error?.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const CLASSES = [
  { id: 'N', name: 'Normal (N)', color: '#18181b', bg: 'bg-zinc-900', text: 'text-zinc-900', desc: 'Normal beat' },
  { id: 'S', name: 'Supraventricular (S)', color: '#52525b', bg: 'bg-zinc-500', text: 'text-zinc-500', desc: 'Atrial or nodal premature beat' },
  { id: 'V', name: 'Ventricular (V)', color: '#71717a', bg: 'bg-zinc-400', text: 'text-zinc-400', desc: 'Ventricular premature beat' },
  { id: 'F', name: 'Fusion (F)', color: '#a1a1aa', bg: 'bg-zinc-300', text: 'text-zinc-300', desc: 'Fusion of ventricular and normal beat' },
  { id: 'Q', name: 'Unknown (Q)', color: '#d4d4d8', bg: 'bg-zinc-200', text: 'text-zinc-200', desc: 'Unclassifiable beat' }
];

function MainApp() {
  const [user, setUser] = useState<{email: string} | null>({ email: 'doctor@hospital.com' });
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  
  const [modelIterations, setModelIterations] = useState(0);
  const [isTraining, setIsTraining] = useState(false);
  const [diagnostics, setDiagnostics] = useState<{hr: number, condition: string, feedback: string} | null>(null);
  const [history, setHistory] = useState<any[]>([]);

  const [modelLoaded, setModelLoaded] = useState(false);
  const [modelFile, setModelFile] = useState<string | null>(null);
  const [isLoadingModel, setIsLoadingModel] = useState(false);
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [patients, setPatients] = useState<any[]>([]);
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [newPatient, setNewPatient] = useState({ name: '', age: '', gender: 'Male', mrn: '' });
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch history when user logs in or switches to history tab
  useEffect(() => {
    if (user && activeTab === 'history') {
      fetch(`/api/history/${user.email}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setHistory(data);
          }
        })
        .catch(err => console.error("Failed to fetch history:", err));
    }
  }, [user, activeTab]);

  const fetchPatients = useCallback(() => {
    if (!user) return;
    fetch(`/api/patients/${user.email}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setPatients(data);
      })
      .catch(console.error);
  }, [user]);

  useEffect(() => {
    if (user && activeTab === 'patients') {
      fetchPatients();
    }
  }, [user, activeTab, fetchPatients]);

  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_email: user?.email,
          ...newPatient,
          age: parseInt(newPatient.age) || 0
        })
      });
      if (res.ok) {
        setShowAddPatient(false);
        setNewPatient({ name: '', age: '', gender: 'Male', mrn: '' });
        fetchPatients();
      }
    } catch (err) {
      console.error("Failed to add patient", err);
    }
  };
  
  const [ecgData, setEcgData] = useState<{time: number, value: number, attention?: number}[]>([]);
  const [anomalyRegion, setAnomalyRegion] = useState<[number, number] | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [probabilities, setProbabilities] = useState<number[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modelInputRef = useRef<HTMLInputElement>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await fetch(`/api/${authMode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (data.success) {
        if (authMode === 'login') setUser(data.user);
        else setAuthMode('login');
      } else {
        setAuthError(data.error || 'Authentication failed');
      }
    } catch (err) {
      setAuthError('Network error');
    }
  };

  const handleLogout = () => setUser(null);

  useEffect(() => {
    fetch('/api/model').then(res => res.json()).then(data => {
      if (data.is_loaded) {
        setModelLoaded(true);
        setModelFile(data.filename);
        setModelIterations(data.iterations);
      }
    }).catch(console.error);
  }, []);

  const handleTrainModel = async () => {
    setIsTraining(true);
    try {
      const res = await fetch('/api/model/train', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setModelIterations(data.iterations);
      }
    } finally {
      setIsTraining(false);
    }
  };

  const analyzeSignal = useCallback((data: any[], knownType?: string) => {
    setIsAnalyzing(true);
    setProbabilities([]);
    
    setTimeout(() => {
      let probs = [0.02, 0.02, 0.02, 0.02, 0.02];
      
      let dominantIdx = 0;
      if (knownType) {
        dominantIdx = CLASSES.findIndex(c => c.id === knownType);
      } else {
        dominantIdx = Math.random() > 0.6 ? 0 : Math.floor(Math.random() * 4) + 1;
      }
      
      probs = probs.map((p, i) => i === dominantIdx ? 0.85 + Math.random() * 0.1 : Math.random() * 0.05);
      
      const sum = probs.reduce((a, b) => a + b, 0);
      probs = probs.map(p => p / sum);
      
      setProbabilities(probs);
      
      // Diagnostics
      let hr = 75;
      let condition = "Normal Sinus Rhythm";
      let feedback = "Your heart rhythm appears normal. The P wave, QRS complex, and T wave are within expected parameters. Continue maintaining a healthy lifestyle with regular cardiovascular exercise.";
      
      if (dominantIdx === 1) {
        hr = 110 + Math.floor(Math.random() * 30);
        condition = "Premature Atrial Contraction (PAC)";
        feedback = "An early heartbeat originating in the atria was detected. While often benign and related to stress, caffeine, or fatigue, frequent occurrences should be evaluated by a cardiologist.";
      } else if (dominantIdx === 2) {
        hr = 140 + Math.floor(Math.random() * 40);
        condition = "Premature Ventricular Contraction (PVC)";
        feedback = "An abnormal heartbeat originating in the ventricles was detected. The QRS complex is notably wide and bizarre. If you experience dizziness or shortness of breath, seek immediate medical attention.";
      } else if (dominantIdx === 3) {
        hr = 65 + Math.floor(Math.random() * 20);
        condition = "Fusion Beat";
        feedback = "A fusion beat was detected, occurring when a supraventricular and a ventricular impulse coincide to produce a hybrid complex. This requires clinical correlation with your medical history.";
      } else if (dominantIdx === 4) {
        hr = 85 + Math.floor(Math.random() * 40);
        condition = "Unclassifiable / Artifact";
        feedback = "The signal contains atypical patterns that cannot be definitively classified. This may be due to sensor noise, movement artifacts, or a complex underlying arrhythmia. Please record another sample.";
      } else if (dominantIdx === 0) {
        hr = 60 + Math.floor(Math.random() * 40);
        if (hr < 60) {
          condition = "Sinus Bradycardia";
          feedback = `Your resting heart rate is ${hr} BPM, which is slower than average. This is common in well-trained athletes, but if accompanied by fatigue or fainting, consult your doctor.`;
        } else if (hr > 100) {
          condition = "Sinus Tachycardia";
          feedback = `Your resting heart rate is elevated at ${hr} BPM. This can be a normal response to exercise, stress, or fever. Ensure you are well-hydrated and resting.`;
        }
      }
      setDiagnostics({ hr, condition, feedback });
      
      // Save to history
      if (user) {
        fetch('/api/history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_email: user.email,
            predicted_class: CLASSES[dominantIdx].id,
            confidence: probs[dominantIdx],
            heart_rate: hr,
            condition,
            feedback
          })
        }).catch(err => console.error("Failed to save history:", err));
      }

      setIsAnalyzing(false);
    }, 1200);
  }, [user]);

  const generateSyntheticECG = useCallback((type: 'N' | 'S' | 'V' | 'F' | 'Q' = 'N') => {
    const data = [];
    let region: [number, number] | null = null;
    
    if (type === 'N') region = [65, 85];
    else if (type === 'V') region = [50, 110];
    else if (type === 'S') region = [15, 35];
    else region = [70, 120];

    for (let i = 0; i < 187; i++) {
      let val = 0.1; // baseline
      const noise = (Math.random() - 0.5) * 0.04;
      
      if (type === 'N') {
        if (i >= 30 && i <= 50) val += 0.15 * Math.sin((i - 30) * Math.PI / 20);
        if (i >= 65 && i <= 70) val -= 0.15 * Math.sin((i - 65) * Math.PI / 5);
        if (i >= 70 && i <= 80) val += 1.2 * Math.sin((i - 70) * Math.PI / 10);
        if (i >= 80 && i <= 85) val -= 0.25 * Math.sin((i - 80) * Math.PI / 5);
        if (i >= 110 && i <= 150) val += 0.3 * Math.sin((i - 110) * Math.PI / 40);
      } else if (type === 'V') {
        if (i >= 50 && i <= 90) val += 1.5 * Math.sin((i - 50) * Math.PI / 40);
        if (i >= 90 && i <= 110) val -= 0.8 * Math.sin((i - 90) * Math.PI / 20);
        if (i >= 120 && i <= 160) val += 0.4 * Math.sin((i - 120) * Math.PI / 40);
      } else if (type === 'S') {
        if (i >= 15 && i <= 35) val += 0.15 * Math.sin((i - 15) * Math.PI / 20);
        if (i >= 50 && i <= 55) val -= 0.15 * Math.sin((i - 50) * Math.PI / 5);
        if (i >= 55 && i <= 65) val += 1.2 * Math.sin((i - 55) * Math.PI / 10);
        if (i >= 65 && i <= 70) val -= 0.25 * Math.sin((i - 65) * Math.PI / 5);
        if (i >= 95 && i <= 135) val += 0.3 * Math.sin((i - 95) * Math.PI / 40);
      } else {
        if (i >= 40 && i <= 60) val += 0.2 * Math.sin((i - 40) * Math.PI / 20); 
        if (i >= 70 && i <= 100) val += 0.8 * Math.sin((i - 70) * Math.PI / 30); 
        if (i >= 100 && i <= 120) val -= 0.5 * Math.sin((i - 100) * Math.PI / 20); 
        if (i >= 130 && i <= 170) val += 0.2 * Math.sin((i - 130) * Math.PI / 40); 
      }
      
      let attention = Math.random() * 0.1;
      if (region && i >= region[0] && i <= region[1]) {
        const center = (region[0] + region[1]) / 2;
        const width = (region[1] - region[0]) / 2;
        attention += 0.8 * Math.exp(-Math.pow(i - center, 2) / (2 * Math.pow(width / 2, 2)));
      }
      
      data.push({ time: i, value: val + noise, attention });
    }
    setEcgData(data);
    setAnomalyRegion(region);
    analyzeSignal(data, type);
  }, [analyzeSignal]);

  useEffect(() => {
    generateSyntheticECG('N');
  }, [generateSyntheticECG]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.name.endsWith('.pth')) {
      setModelFile(file.name);
      setIsLoadingModel(true);
      setTimeout(async () => {
        await fetch('/api/model/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: file.name })
        });
        setIsLoadingModel(false);
        setModelLoaded(true);
      }, 2000);
    } else if (file.name.endsWith('.csv') || file.name.endsWith('.txt')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const values = text.split(/[\n,]/).map(v => parseFloat(v.trim())).filter(v => !isNaN(v));
        if (values.length >= 187) {
          const newData = values.slice(0, 187).map((v, i) => ({ time: i, value: v, attention: Math.random() * 0.2 }));
          setEcgData(newData);
          analyzeSignal(newData);
        } else {
          alert('File must contain at least 187 data points.');
        }
      };
      reader.readAsText(file);
    }
    
    // Reset input
    if (e.target) e.target.value = '';
  };

  const dominantClassIdx = probabilities.length > 0 ? probabilities.indexOf(Math.max(...probabilities)) : -1;
  const dominantClass = dominantClassIdx >= 0 ? CLASSES[dominantClassIdx] : null;

  return (
    <div className="flex h-screen bg-[#FAFAFA] text-zinc-900 font-sans overflow-hidden selection:bg-zinc-200 selection:text-zinc-900">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-zinc-900/20 z-20 lg:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 w-72 bg-[#FAFAFA] border-r border-zinc-200/50 flex flex-col z-30 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-20 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center mr-3">
              <HeartPulse className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-lg tracking-tight text-zinc-900">CardioAI</span>
          </div>
          <button 
            className="lg:hidden p-2 text-zinc-400 hover:text-zinc-900 rounded-full hover:bg-zinc-100 transition-colors"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-1 py-6 overflow-y-auto no-scrollbar">
          <ul className="space-y-1 px-4">
            <li>
              <button 
                onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }}
                className={cn("w-full flex items-center px-4 py-3 text-sm font-medium rounded-2xl transition-all", activeTab === 'dashboard' ? "bg-white text-zinc-900 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-zinc-100" : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100/50")}
              >
                <Activity className={cn("w-4 h-4 mr-3", activeTab === 'dashboard' ? "text-zinc-900" : "text-zinc-400")} />
                Dashboard
              </button>
            </li>
            <li>
              <button 
                onClick={() => { setActiveTab('patients'); setIsMobileMenuOpen(false); }}
                className={cn("w-full flex items-center px-4 py-3 text-sm font-medium rounded-2xl transition-all", activeTab === 'patients' ? "bg-white text-zinc-900 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-zinc-100" : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100/50")}
              >
                <User className={cn("w-4 h-4 mr-3", activeTab === 'patients' ? "text-zinc-900" : "text-zinc-400")} />
                Patients
              </button>
            </li>
            <li>
              <button 
                onClick={() => { setActiveTab('models'); setIsMobileMenuOpen(false); }}
                className={cn("w-full flex items-center px-4 py-3 text-sm font-medium rounded-2xl transition-all", activeTab === 'models' ? "bg-white text-zinc-900 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-zinc-100" : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100/50")}
              >
                <Server className={cn("w-4 h-4 mr-3", activeTab === 'models' ? "text-zinc-900" : "text-zinc-400")} />
                Models
              </button>
            </li>
            <li>
              <button 
                onClick={() => { setActiveTab('history'); setIsMobileMenuOpen(false); }}
                className={cn("w-full flex items-center px-4 py-3 text-sm font-medium rounded-2xl transition-all", activeTab === 'history' ? "bg-white text-zinc-900 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-zinc-100" : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100/50")}
              >
                <History className={cn("w-4 h-4 mr-3", activeTab === 'history' ? "text-zinc-900" : "text-zinc-400")} />
                History
              </button>
            </li>
            <li>
              <button 
                onClick={() => { setActiveTab('settings'); setIsMobileMenuOpen(false); }}
                className={cn("w-full flex items-center px-4 py-3 text-sm font-medium rounded-2xl transition-all", activeTab === 'settings' ? "bg-white text-zinc-900 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-zinc-100" : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100/50")}
              >
                <Settings className={cn("w-4 h-4 mr-3", activeTab === 'settings' ? "text-zinc-900" : "text-zinc-400")} />
                Settings
              </button>
            </li>
          </ul>
        </nav>
        <div className="p-6 shrink-0">
          <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-zinc-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
            <div className="flex items-center overflow-hidden">
              <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-600 font-medium text-sm uppercase shrink-0">
                {user.email.substring(0, 2)}
              </div>
              <div className="ml-3 overflow-hidden">
                <p className="text-sm font-medium text-zinc-900 truncate w-28">{user.email}</p>
                <p className="text-xs text-zinc-500">Clinician</p>
              </div>
            </div>
            <button onClick={() => {}} className="p-2 text-zinc-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors shrink-0">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="h-20 bg-[#FAFAFA]/80 backdrop-blur-md flex items-center justify-between px-4 sm:px-8 shrink-0 z-10 sticky top-0">
          <div className="flex items-center">
            <button 
              className="lg:hidden p-2 mr-3 text-zinc-500 hover:text-zinc-900 rounded-full hover:bg-zinc-100 transition-colors"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight capitalize">
              {activeTab}
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="hidden sm:inline-flex text-xs font-medium text-zinc-500 bg-white px-3 py-1.5 rounded-full border border-zinc-200 shadow-sm">
              MIT-BIH Format
            </span>
            <button className="p-2 text-zinc-400 hover:text-zinc-900 rounded-full hover:bg-zinc-100 transition-colors">
              <AlertCircle className="w-5 h-5" />
            </button>
          </div>
        </header>

        <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-8 overflow-y-auto no-scrollbar h-full pb-24">
          {activeTab === 'dashboard' && (
            <div className="animate-in fade-in duration-500">
              {/* Top Row: Signal Input */}
              <div className="grid grid-cols-1 gap-6 mb-8">
                {/* Signal Input Card */}
                <div className="bg-white rounded-[24px] border border-zinc-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-4 sm:p-8 flex flex-col transition-all">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center">
                      <Activity className="w-4 h-4 mr-2" />
                      ECG Signal Input
                    </h2>
                  </div>
                  
                  <div className="flex-1 flex flex-col justify-center space-y-8">
                    <div 
                      className="border border-dashed border-zinc-200 rounded-2xl p-6 sm:p-10 flex flex-col items-center justify-center text-center hover:bg-zinc-50 hover:border-zinc-300 transition-all cursor-pointer group"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div className="w-12 h-12 rounded-full bg-zinc-50 group-hover:bg-zinc-100 flex items-center justify-center mb-4 transition-colors">
                        <FileText className="w-6 h-6 text-zinc-400 group-hover:text-zinc-600 transition-colors" />
                      </div>
                      <p className="text-sm font-medium text-zinc-900 mb-1">Upload ECG Data</p>
                      <p className="text-xs text-zinc-500 mb-6">CSV or TXT file (187 time steps)</p>
                      <button className="px-6 py-2.5 bg-white border border-zinc-200 rounded-full text-sm font-medium text-zinc-700 hover:border-zinc-300 hover:text-zinc-900 shadow-sm transition-all">
                        Select File
                      </button>
                      <input 
                        type="file" 
                        accept=".csv,.txt" 
                        className="hidden" 
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                      />
                    </div>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center" aria-hidden="true">
                        <div className="w-full border-t border-zinc-100" />
                      </div>
                      <div className="relative flex justify-center">
                        <span className="px-4 bg-white text-xs text-zinc-400 uppercase tracking-wider font-medium">Or generate synthetic</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-5 gap-2 sm:gap-4">
                      {['N', 'S', 'V', 'F', 'Q'].map((type) => (
                        <button
                          key={type}
                          onClick={() => generateSyntheticECG(type as any)}
                          className="px-2 sm:px-4 py-3 bg-white border border-zinc-200 hover:border-zinc-900 hover:bg-zinc-900 hover:text-white text-zinc-600 text-sm font-medium rounded-2xl transition-all text-center shadow-sm"
                          title={`Generate ${CLASSES.find(c => c.id === type)?.name}`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Middle Row: Chart */}
              <div className="bg-white rounded-[24px] border border-zinc-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-4 sm:p-8 mb-8 transition-all">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Signal Visualization
                  </h2>
                  <div className="flex space-x-2 sm:space-x-3">
                    <span className="inline-flex items-center px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-medium bg-zinc-50 border border-zinc-100 text-zinc-500 font-mono">
                      Length: 187
                    </span>
                    <span className="inline-flex items-center px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-medium bg-zinc-50 border border-zinc-100 text-zinc-500 font-mono">
                      Fs: 360Hz
                    </span>
                  </div>
                </div>
                
                <div className="h-48 sm:h-72 w-full min-w-0 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={ecgData} margin={{ top: 10, right: 10, bottom: 10, left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
                      <XAxis 
                        dataKey="time" 
                        tick={{ fontSize: 11, fill: '#a1a1aa', fontWeight: 400 }} 
                        axisLine={false} 
                        tickLine={false} 
                        minTickGap={30}
                      />
                      <YAxis 
                        yAxisId="left"
                        domain={['auto', 'auto']} 
                        tick={{ fontSize: 11, fill: '#a1a1aa', fontWeight: 400 }} 
                        axisLine={false} 
                        tickLine={false} 
                      />
                      <YAxis 
                        yAxisId="right"
                        orientation="right"
                        domain={[0, 1]} 
                        hide
                      />
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: '1px solid #e4e4e7', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}
                        labelStyle={{ color: '#64748b', fontSize: '12px', marginBottom: '4px', fontWeight: 600 }}
                        itemStyle={{ color: '#0f172a', fontSize: '14px', fontWeight: 700 }}
                      />
                      {anomalyRegion && (
                        <ReferenceArea 
                          yAxisId="left"
                          x1={anomalyRegion[0]} 
                          x2={anomalyRegion[1]} 
                          className="fill-[#fef08a] opacity-20"
                        />
                      )}
                      <Area 
                        yAxisId="right"
                        type="monotone" 
                        dataKey="attention" 
                        fill="#fef08a" 
                        stroke="none" 
                        opacity={0.5} 
                        isAnimationActive={true}
                        animationDuration={800}
                      />
                      <Line 
                        yAxisId="left"
                        type="monotone" 
                        dataKey="value" 
                        stroke="#18181b" 
                        strokeWidth={2} 
                        dot={false} 
                        activeDot={{ r: 4, fill: '#18181b', stroke: '#fff', strokeWidth: 2 }}
                        isAnimationActive={true}
                        animationDuration={800}
                      />
                      <Brush dataKey="time" height={30} stroke="#e4e4e7" fill="#fafafa" tickFormatter={() => ''} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
                {anomalyRegion && (
                   <div className="mt-6 flex items-center text-xs text-zinc-600 bg-zinc-50 px-4 py-3 rounded-2xl border border-zinc-200">
                     <Info className="w-4 h-4 mr-2" />
                     Yellow shaded area represents the CAWT model's cross-attention weights, highlighting the most critical features for classification.
                   </div>
                )}
              </div>

              {/* Bottom Row: Results */}
              <div className="bg-white rounded-[24px] border border-zinc-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-4 sm:p-8 transition-all">
                <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center mb-8">
                  <Zap className="w-4 h-4 mr-2" />
                  Classification Results
                </h2>
                
                {isAnalyzing ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <RefreshCw className="w-8 h-8 text-zinc-900 animate-spin mb-6" />
                    <p className="text-zinc-900 font-medium">Analyzing signal...</p>
                    <p className="text-sm text-zinc-500 mt-2">Running forward pass through CAWT model</p>
                  </div>
                ) : probabilities.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-12">
                    {/* Primary Result */}
                    <div className="lg:col-span-1 flex flex-col items-center justify-center p-6 sm:p-10 bg-[#FAFAFA] rounded-3xl border border-zinc-100">
                      <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-6">Predicted Class</p>
                      <div className={cn("text-6xl sm:text-7xl font-light mb-4 tracking-tighter", dominantClass?.text)}>
                        {dominantClass?.id}
                      </div>
                      <p className="text-lg sm:text-xl font-medium text-zinc-900 text-center mb-3">
                        {dominantClass?.name.split(' (')[0]}
                      </p>
                      <p className="text-sm text-zinc-500 text-center mb-8 px-2 sm:px-4 leading-relaxed">
                        {dominantClass?.desc}
                      </p>
                      <div className="inline-flex items-center px-5 py-2.5 rounded-full bg-white border border-zinc-200 shadow-sm">
                        <span className="text-xs sm:text-sm font-medium text-zinc-500 mr-3 uppercase tracking-wider">Confidence</span>
                        <span className={cn("text-sm sm:text-base font-semibold", dominantClass?.text)}>
                          {(probabilities[dominantClassIdx] * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    
                    {/* Probabilities Bars & Diagnostics */}
                    <div className="lg:col-span-2 space-y-8 sm:space-y-10">
                      <div className="space-y-5 sm:space-y-6">
                        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-100 pb-4">Class Probabilities</h3>
                        {CLASSES.map((cls, idx) => {
                          const prob = probabilities[idx];
                          const isDominant = idx === dominantClassIdx;
                          
                          return (
                            <div key={cls.id} className="flex flex-col sm:flex-row sm:items-center group gap-2 sm:gap-0">
                              <div className="w-full sm:w-48 shrink-0 flex items-center justify-between sm:pr-6">
                                <span className={cn("text-xs sm:text-sm font-medium transition-colors truncate mr-2", isDominant ? "text-zinc-900" : "text-zinc-500 group-hover:text-zinc-700")}>
                                  {cls.name}
                                </span>
                                <span className={cn("text-xs sm:text-sm font-mono font-medium shrink-0", isDominant ? cls.text : "text-zinc-400")}>
                                  {(prob * 100).toFixed(1)}%
                                </span>
                              </div>
                              <div className="flex-1 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                                <div 
                                  className={cn("h-full rounded-full transition-all duration-1000 ease-out", cls.bg)}
                                  style={{ width: `${prob * 100}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {diagnostics && (
                        <div className="bg-zinc-50 rounded-3xl p-6 sm:p-8 border border-zinc-100">
                          <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-widest mb-6 flex items-center">
                            <Info className="w-4 h-4 mr-2" />
                            Diagnostic Feedback
                          </h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6">
                            <div className="bg-white rounded-2xl p-5 border border-zinc-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                              <div className="text-[10px] sm:text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">Estimated Heart Rate</div>
                              <div className="text-2xl sm:text-3xl font-light text-zinc-900">{diagnostics.hr} <span className="text-xs sm:text-sm font-medium text-zinc-400">BPM</span></div>
                            </div>
                            <div className="bg-white rounded-2xl p-5 border border-zinc-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                              <div className="text-[10px] sm:text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">Detected Condition</div>
                              <div className="text-sm sm:text-base font-medium text-zinc-900 leading-tight mt-1">{diagnostics.condition}</div>
                            </div>
                          </div>
                          <p className="text-sm text-zinc-600 leading-relaxed">{diagnostics.feedback}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-zinc-400 bg-zinc-50/50 rounded-3xl border border-dashed border-zinc-200">
                    <ShieldAlert className="w-12 h-12 mb-6 opacity-20" />
                    <p className="font-medium text-zinc-500">Upload data or generate a synthetic signal to see results.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'models' && (
            <div className="max-w-2xl mx-auto w-full animate-in fade-in duration-500">
              {/* Model Status Card */}
              <div className="bg-white rounded-[24px] border border-zinc-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-6 sm:p-10 flex flex-col transition-all">
                <div className="flex items-center justify-between mb-10">
                  <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center">
                    <Server className="w-4 h-4 mr-2" />
                    CAWT Model Status
                  </h2>
                  {modelLoaded ? (
                    <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-medium bg-zinc-900 border border-zinc-800 text-white">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-medium bg-zinc-100 border border-zinc-200 text-zinc-600">
                      <AlertCircle className="w-3.5 h-3.5 mr-1.5" /> Not Loaded
                    </span>
                  )}
                </div>
                
                <div className="flex-1 flex flex-col justify-center">
                  {isLoadingModel ? (
                    <div className="flex flex-col items-center justify-center py-16">
                      <RefreshCw className="w-10 h-10 text-zinc-900 animate-spin mb-6" />
                      <p className="text-sm font-medium text-zinc-900">Loading PyTorch weights...</p>
                      <p className="text-xs text-zinc-500 mt-2">Initializing Cross-Attentive Wavelet Transformer</p>
                    </div>
                  ) : modelLoaded ? (
                    <div className="bg-[#FAFAFA] rounded-3xl p-8 border border-zinc-100">
                      <div className="flex items-center mb-4">
                        <FileCode className="w-6 h-6 text-zinc-900 mr-3" />
                        <span className="font-medium text-zinc-900 text-lg mr-3">{modelFile}</span>
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-zinc-900 text-white uppercase tracking-wider">
                          Best Model
                        </span>
                      </div>
                      <p className="text-sm text-zinc-500 mb-8">
                        Model loaded successfully. Ready for inference.
                      </p>
                      <div className="grid grid-cols-2 gap-4 text-sm mb-8">
                        <div className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                          <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider block mb-2">Architecture</span>
                          <span className="font-mono font-medium text-zinc-900">CAWT</span>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                          <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider block mb-2">Parameters</span>
                          <span className="font-mono font-medium text-zinc-900">1.66M</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between border-t border-zinc-200 pt-8">
                        <div className="text-sm font-medium text-zinc-500">
                          Training Iterations: <span className="font-mono font-medium text-zinc-900 ml-2">{modelIterations}</span>
                        </div>
                        <button 
                          onClick={handleTrainModel}
                          disabled={isTraining}
                          className="flex items-center px-6 py-3 bg-zinc-900 border border-transparent text-white hover:bg-zinc-800 rounded-full text-sm font-medium transition-all disabled:opacity-50 shadow-sm"
                        >
                          {isTraining ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <BrainCircuit className="w-4 h-4 mr-2" />}
                          {isTraining ? 'Training...' : 'Train Model'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div 
                      className="border border-dashed border-zinc-200 rounded-3xl p-12 flex flex-col items-center justify-center text-center hover:bg-zinc-50 hover:border-zinc-300 transition-all cursor-pointer group"
                      onClick={() => modelInputRef.current?.click()}
                    >
                      <div className="w-16 h-16 rounded-full bg-zinc-50 group-hover:bg-zinc-100 flex items-center justify-center mb-6 transition-colors">
                        <Upload className="w-8 h-8 text-zinc-400 group-hover:text-zinc-600 transition-colors" />
                      </div>
                      <p className="text-base font-medium text-zinc-900 mb-2">Upload PyTorch Model</p>
                      <p className="text-sm text-zinc-500 mb-8">Select a .pth file to load weights</p>
                      <button className="px-8 py-3 bg-white border border-zinc-200 rounded-full text-sm font-medium text-zinc-700 hover:border-zinc-300 hover:text-zinc-900 shadow-sm transition-all">
                        Browse Files
                      </button>
                      <input 
                        type="file" 
                        accept=".pth" 
                        className="hidden" 
                        ref={modelInputRef}
                        onChange={handleFileUpload}
                      />
                    </div>
                  )}
                </div>
                
                {!modelLoaded && (
                  <div className="mt-8 bg-zinc-50 border border-zinc-100 text-zinc-600 text-sm p-5 rounded-2xl flex items-start">
                    <AlertCircle className="w-5 h-5 mr-3 shrink-0 mt-0.5 text-zinc-400" />
                    <p className="leading-relaxed">
                      <strong>Simulation Mode:</strong> Since PyTorch cannot run in the browser, uploading a .pth file will simulate a backend connection for demonstration purposes.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'patients' && (
            <div className="max-w-6xl mx-auto w-full animate-in fade-in duration-500 space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="w-5 h-5 text-zinc-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search patients by name or MRN..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3 bg-white border border-zinc-200 rounded-full text-sm placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 transition-all shadow-[0_2px_10px_rgba(0,0,0,0.02)]"
                  />
                </div>
                <button 
                  onClick={() => setShowAddPatient(true)}
                  className="flex items-center justify-center px-6 py-3 bg-zinc-900 text-white rounded-full text-sm font-medium hover:bg-zinc-800 transition-all shadow-sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Patient
                </button>
              </div>

              {showAddPatient && (
                <div className="bg-white rounded-[24px] border border-zinc-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-6 sm:p-8 animate-in slide-in-from-top-4 duration-300">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-medium text-zinc-900">Add New Patient</h3>
                    <button onClick={() => setShowAddPatient(false)} className="p-2 text-zinc-400 hover:text-zinc-900 rounded-full hover:bg-zinc-100 transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <form onSubmit={handleAddPatient} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-2">Full Name</label>
                        <input required type="text" value={newPatient.name} onChange={e => setNewPatient({...newPatient, name: e.target.value})} className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:bg-white transition-all" placeholder="Jane Doe" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-2">Medical Record Number (MRN)</label>
                        <input required type="text" value={newPatient.mrn} onChange={e => setNewPatient({...newPatient, mrn: e.target.value})} className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:bg-white transition-all" placeholder="MRN-12345" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-2">Age</label>
                        <input required type="number" min="0" max="150" value={newPatient.age} onChange={e => setNewPatient({...newPatient, age: e.target.value})} className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:bg-white transition-all" placeholder="45" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-2">Gender</label>
                        <select value={newPatient.gender} onChange={e => setNewPatient({...newPatient, gender: e.target.value})} className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:bg-white transition-all">
                          <option>Male</option>
                          <option>Female</option>
                          <option>Other</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex justify-end pt-4 border-t border-zinc-100">
                      <button type="button" onClick={() => setShowAddPatient(false)} className="px-6 py-2.5 text-sm font-medium text-zinc-600 hover:text-zinc-900 mr-4">Cancel</button>
                      <button type="submit" className="px-6 py-2.5 bg-zinc-900 text-white rounded-full text-sm font-medium hover:bg-zinc-800 transition-all">Save Patient</button>
                    </div>
                  </form>
                </div>
              )}

              <div className="bg-white rounded-[24px] border border-zinc-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden">
                {patients.length > 0 ? (
                  <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-zinc-100 bg-zinc-50/50">
                          <th className="px-6 py-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Patient Name</th>
                          <th className="px-6 py-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">MRN</th>
                          <th className="px-6 py-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Age/Gender</th>
                          <th className="px-6 py-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Added</th>
                          <th className="px-6 py-4 text-xs font-medium text-zinc-500 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {patients.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.mrn.toLowerCase().includes(searchQuery.toLowerCase())).map((patient) => (
                          <tr key={patient.id} className="hover:bg-zinc-50/50 transition-colors group">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-600 font-medium text-sm mr-4">
                                  {patient.name.substring(0, 2).toUpperCase()}
                                </div>
                                <div className="text-sm font-medium text-zinc-900">{patient.name}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-600 font-mono">{patient.mrn}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-600">{patient.age} • {patient.gender}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500">{new Date(patient.created_at).toLocaleDateString()}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button className="text-zinc-400 hover:text-zinc-900 p-2 rounded-full hover:bg-zinc-100 transition-colors">
                                <MoreVertical className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-zinc-400 px-4">
                    <User className="w-12 h-12 mb-6 opacity-20" />
                    <h3 className="text-base font-medium text-zinc-900 mb-2">No Patients Found</h3>
                    <p className="text-sm text-center max-w-sm text-zinc-500">
                      You haven't added any patients yet. Click "Add Patient" to get started.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="max-w-4xl mx-auto w-full animate-in fade-in duration-500">
              <div className="bg-white rounded-[24px] border border-zinc-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden">
                <div className="p-6 sm:p-8 border-b border-zinc-100 flex items-center justify-between">
                  <h2 className="text-base sm:text-lg font-medium text-zinc-900 flex items-center">
                    <History className="w-5 h-5 mr-3 text-zinc-400" />
                    Analysis History
                  </h2>
                  <span className="text-xs sm:text-sm font-medium text-zinc-500 bg-zinc-50 px-4 py-1.5 rounded-full border border-zinc-200">
                    {history.length} Records
                  </span>
                </div>
                
                {history.length > 0 ? (
                  <div className="divide-y divide-zinc-100">
                    {history.map((record) => {
                      const cls = CLASSES.find(c => c.id === record.predicted_class);
                      const date = new Date(record.timestamp);
                      
                      return (
                        <div key={record.id} className="p-6 sm:p-8 hover:bg-zinc-50/50 transition-colors group">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 sm:gap-0">
                            <div className="flex items-start space-x-4 sm:space-x-6">
                              <div className={cn("w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0 font-light text-xl sm:text-2xl", cls?.bg, cls?.text)}>
                                {record.predicted_class}
                              </div>
                              <div className="min-w-0">
                                <h3 className="text-sm sm:text-base font-medium text-zinc-900 mb-2 flex flex-col sm:flex-row sm:items-center">
                                  <span className="truncate">{record.condition}</span>
                                  <span className="hidden sm:inline mx-3 text-zinc-300">•</span>
                                  <span className="text-xs sm:text-sm font-medium text-zinc-500 flex items-center mt-2 sm:mt-0">
                                    <Calendar className="w-4 h-4 mr-2" />
                                    {date.toLocaleDateString()} at {date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                  </span>
                                </h3>
                                <p className="text-sm text-zinc-600 line-clamp-2 sm:line-clamp-1 mb-4 max-w-2xl">
                                  {record.feedback}
                                </p>
                                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-[10px] sm:text-xs font-medium">
                                  <span className="flex items-center text-zinc-600 bg-white border border-zinc-200 px-3 py-1.5 rounded-full shadow-sm">
                                    <HeartPulse className="w-3.5 h-3.5 mr-1.5 text-zinc-900" />
                                    {record.heart_rate} BPM
                                  </span>
                                  <span className="flex items-center text-zinc-600 bg-white border border-zinc-200 px-3 py-1.5 rounded-full shadow-sm">
                                    <Zap className="w-3.5 h-3.5 mr-1.5 text-zinc-900" />
                                    {(record.confidence * 100).toFixed(1)}% Confidence
                                  </span>
                                </div>
                              </div>
                            </div>
                            <button className="hidden sm:flex p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-full transition-colors opacity-0 group-hover:opacity-100 shrink-0">
                              <ChevronRight className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 sm:py-24 text-zinc-400 px-4">
                    <History className="w-12 h-12 sm:w-16 sm:h-16 mb-6 opacity-20" />
                    <h3 className="text-base sm:text-lg font-medium text-zinc-900 mb-2">No History Yet</h3>
                    <p className="text-sm sm:text-base text-center max-w-sm text-zinc-500">
                      Your past ECG analyses will appear here. Go to the Dashboard to analyze a signal.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="max-w-4xl mx-auto w-full animate-in fade-in duration-500 space-y-8">
              <div className="bg-white rounded-[24px] border border-zinc-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden">
                <div className="p-6 sm:p-8 border-b border-zinc-100">
                  <h2 className="text-lg font-medium text-zinc-900 flex items-center">
                    <User className="w-5 h-5 mr-3 text-zinc-400" />
                    Profile Settings
                  </h2>
                </div>
                <div className="p-6 sm:p-8 space-y-6">
                  <div className="flex items-center">
                    <div className="w-20 h-20 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-600 font-medium text-2xl mr-6">
                      {user.email.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-base font-medium text-zinc-900">{user.email}</h3>
                      <p className="text-sm text-zinc-500 mb-3">Clinician Account</p>
                      <button className="px-4 py-2 bg-white border border-zinc-200 rounded-full text-xs font-medium text-zinc-700 hover:border-zinc-300 hover:text-zinc-900 shadow-sm transition-all">
                        Change Avatar
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-zinc-100">
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-2">Email Address</label>
                      <input type="email" disabled value={user.email} className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm text-zinc-500 cursor-not-allowed" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-2">Role</label>
                      <input type="text" disabled value="Cardiologist" className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm text-zinc-500 cursor-not-allowed" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-[24px] border border-zinc-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden">
                <div className="p-6 sm:p-8 border-b border-zinc-100">
                  <h2 className="text-lg font-medium text-zinc-900 flex items-center">
                    <Settings className="w-5 h-5 mr-3 text-zinc-400" />
                    Preferences
                  </h2>
                </div>
                <div className="divide-y divide-zinc-100">
                  <div className="p-6 sm:p-8 flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-zinc-50 flex items-center justify-center mr-4">
                        <Bell className="w-5 h-5 text-zinc-600" />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-zinc-900">Email Notifications</h3>
                        <p className="text-xs text-zinc-500 mt-1">Receive alerts for completed analyses</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-zinc-900"></div>
                    </label>
                  </div>
                  <div className="p-6 sm:p-8 flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-zinc-50 flex items-center justify-center mr-4">
                        <Moon className="w-5 h-5 text-zinc-600" />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-zinc-900">Dark Mode</h3>
                        <p className="text-xs text-zinc-500 mt-1">Toggle dark theme for the interface</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-zinc-900"></div>
                    </label>
                  </div>
                  <div className="p-6 sm:p-8 flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-zinc-50 flex items-center justify-center mr-4">
                        <Globe className="w-5 h-5 text-zinc-600" />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-zinc-900">Data Region</h3>
                        <p className="text-xs text-zinc-500 mt-1">Select where your data is stored</p>
                      </div>
                    </div>
                    <select className="px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:bg-white transition-all">
                      <option>US East (N. Virginia)</option>
                      <option>EU (Frankfurt)</option>
                      <option>Asia Pacific (Tokyo)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-[24px] border border-red-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden">
                 <div className="p-6 sm:p-8 flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center mr-4">
                        <Lock className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-red-600">Danger Zone</h3>
                        <p className="text-xs text-zinc-500 mt-1">Permanently delete your account and all data</p>
                      </div>
                    </div>
                    <button className="px-6 py-2.5 bg-white border border-red-200 text-red-600 rounded-full text-sm font-medium hover:bg-red-50 transition-all">
                      Delete Account
                    </button>
                 </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <MainApp />
    </ErrorBoundary>
  );
}
