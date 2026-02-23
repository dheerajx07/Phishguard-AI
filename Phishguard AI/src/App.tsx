import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  Search, 
  RefreshCw, 
  Lock, 
  AlertTriangle, 
  Activity,
  User,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Info,
  ArrowRight,
  Zap,
  Eye,
  Terminal,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { analyzeUrl, PhishingAnalysis } from './services/geminiService';
import { useBehaviorMonitor } from './hooks/useBehaviorMonitor';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const MOCK_SITES: Record<string, { title: string, content: string, isPhishing: boolean }> = {
  'https://secure.bankofamerica.com': {
    title: 'Bank of America | Online Banking',
    content: 'Welcome to Bank of America. Please sign in to access your accounts. We use multi-factor authentication for your security.',
    isPhishing: false
  },
  'https://bankofamerica-secure-login.net': {
    title: 'Bank of America | Secure Login',
    content: 'URGENT: Your account has been suspended. Please enter your SSN and Credit Card details immediately to verify your identity.',
    isPhishing: true
  },
  'https://accounts.google.com': {
    title: 'Google Accounts',
    content: 'One account. All of Google working for you. Sign in to continue to Gmail.',
    isPhishing: false
  },
  'https://g-mail-security-update.com': {
    title: 'Google Security Update',
    content: 'Someone has your password. Click here to reset it now. Enter your current password to confirm.',
    isPhishing: true
  }
};

export default function App() {
  const [view, setView] = useState<'landing' | 'demo'>('landing');
  const [url, setUrl] = useState('https://secure.bankofamerica.com');
  const [currentUrl, setCurrentUrl] = useState(url);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<PhishingAnalysis | null>(null);
  const [riskScore, setRiskScore] = useState(0);
  const [riskReason, setRiskReason] = useState('System Initialized');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  
  const socketRef = useRef<WebSocket | null>(null);
  const behavior = useBehaviorMonitor(showLogin);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(`${protocol}//${window.location.host}`);
    socketRef.current = socket;

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'RISK_UPDATE') {
        setRiskScore(data.payload.riskScore);
        setRiskReason(data.payload.reason);
      }
    };

    return () => socket.close();
  }, []);

  useEffect(() => {
    if (showLogin && socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'BEHAVIOR_REPORT',
        payload: {
          typingSpeed: behavior.typingSpeed,
          mouseJitter: behavior.mouseJitter,
          sessionToken: 'mock-token-123'
        }
      }));
    }
  }, [behavior, showLogin]);

  const handleNavigate = useCallback(async (targetUrl: string) => {
    setIsAnalyzing(true);
    setCurrentUrl(targetUrl);
    setAnalysis(null);
    setShowLogin(false);

    const site = MOCK_SITES[targetUrl] || { 
      title: 'Unknown Site', 
      content: 'Generic content for ' + targetUrl,
      isPhishing: false 
    };

    try {
      const result = await analyzeUrl(targetUrl, site.content);
      setAnalysis(result);
    } catch (error) {
      console.error('Analysis failed', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  useEffect(() => {
    if (view === 'demo') {
      handleNavigate(url);
    }
  }, [view]);

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'CRITICAL': return 'text-red-600 bg-red-50 border-red-200';
      case 'HIGH': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    }
  };

  if (view === 'landing') {
    return (
      <div className="min-h-screen bg-white text-[#141414] font-sans">
        {/* Navigation */}
        <nav className="h-20 border-b border-black/5 flex items-center justify-between px-8 md:px-16 sticky top-0 bg-white/80 backdrop-blur-md z-50">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-emerald-600" />
            <span className="font-bold text-xl tracking-tight">PHISHGUARD</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium">
            <a href="#features" className="hover:text-emerald-600 transition-colors">Features</a>
            <a href="#technology" className="hover:text-emerald-600 transition-colors">Technology</a>
            <a href="#demo" onClick={() => setView('demo')} className="hover:text-emerald-600 transition-colors">Live Demo</a>
          </div>
          <button 
            onClick={() => setView('demo')}
            className="bg-[#141414] text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-black/90 transition-all"
          >
            Get Started
          </button>
        </nav>

        {/* Hero Section */}
        <section className="pt-24 pb-32 px-8 md:px-16 max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold uppercase tracking-wider">
                <Zap className="w-3 h-3" />
                Next-Gen Threat Intelligence
              </div>
              <h1 className="text-6xl md:text-7xl font-bold tracking-tighter leading-[0.9]">
                Stop Phishing <br />
                <span className="text-emerald-600">Before It Starts.</span>
              </h1>
              <p className="text-xl text-gray-500 max-w-lg leading-relaxed">
                PhishGuard uses real-time AI heuristics and behavioral biometrics to detect credential harvesting and session hijacking with 99.9% accuracy.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={() => setView('demo')}
                  className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                >
                  Launch Live Demo <ArrowRight className="w-5 h-5" />
                </button>
                <button className="border border-black/10 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-black/5 transition-all">
                  View Documentation
                </button>
              </div>
              <div className="flex items-center gap-6 pt-4">
                <div className="flex -space-x-3">
                  {[1,2,3,4].map(i => (
                    <img key={i} src={`https://picsum.photos/seed/${i}/100/100`} className="w-10 h-10 rounded-full border-2 border-white" alt="User" referrerPolicy="no-referrer" />
                  ))}
                </div>
                <div className="text-sm text-gray-500">
                  Trusted by <span className="font-bold text-black">500+</span> security researchers
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 bg-emerald-500/10 blur-3xl rounded-full" />
              <div className="relative bg-[#141414] rounded-3xl p-4 shadow-2xl border border-white/10">
                <div className="bg-[#1a1a1a] rounded-2xl p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-4">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-emerald-400" />
                      <span className="text-[10px] font-mono text-emerald-400 uppercase">Threat_Monitor_v2.0</span>
                    </div>
                    <div className="flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-white/10" />
                      <div className="w-2 h-2 rounded-full bg-white/10" />
                    </div>
                  </div>
                  <div className="space-y-3 font-mono text-xs">
                    <div className="text-gray-500">[09:41:02] Initializing heuristic engine...</div>
                    <div className="text-emerald-400">[09:41:03] Connection established with Gemini-3-Flash</div>
                    <div className="text-gray-500">[09:41:05] Monitoring behavioral telemetry...</div>
                    <div className="text-red-400">[09:41:08] ALERT: Anomalous mouse jitter detected (0.82)</div>
                    <div className="text-red-400">[09:41:09] ALERT: High-speed typing pattern (bot signature)</div>
                    <div className="text-orange-400">[09:41:10] RISK_SCORE: 84% - Potential Session Hijack</div>
                  </div>
                  <div className="pt-4">
                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-red-500"
                        animate={{ width: '84%' }}
                        transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="py-32 bg-gray-50 px-8 md:px-16">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-20 space-y-4">
              <h2 className="text-4xl font-bold tracking-tight">Comprehensive Protection</h2>
              <p className="text-gray-500">Our multi-layered approach ensures that even the most sophisticated phishing attempts are neutralized in real-time.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: <Eye className="w-6 h-6 text-blue-600" />,
                  title: "Visual Heuristics",
                  desc: "Analyzes page layout, branding, and UI elements to detect pixel-perfect clones of popular services."
                },
                {
                  icon: <Activity className="w-6 h-6 text-emerald-600" />,
                  title: "Behavioral Biometrics",
                  desc: "Tracks typing cadence and mouse dynamics to distinguish between legitimate users and automated bots."
                },
                {
                  icon: <ShieldCheck className="w-6 h-6 text-purple-600" />,
                  title: "Session Integrity",
                  desc: "Continuously monitors session state to prevent hijacking even after a successful login."
                }
              ].map((feature, i) => (
                <div key={i} className="bg-white p-8 rounded-3xl border border-black/5 hover:shadow-xl transition-all group">
                  <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Technology Section */}
        <section id="technology" className="py-32 px-8 md:px-16 max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-24 items-center">
            <div className="order-2 lg:order-1">
              <img src="https://picsum.photos/seed/tech/800/600" className="rounded-3xl shadow-2xl" alt="Technology" referrerPolicy="no-referrer" />
            </div>
            <div className="space-y-8 order-1 lg:order-2">
              <h2 className="text-4xl font-bold tracking-tight">Powered by Gemini AI</h2>
              <p className="text-gray-500 leading-relaxed">
                At the core of PhishGuard is the Gemini 3 Flash model, providing lightning-fast reasoning to analyze complex phishing scenarios that traditional rule-based systems miss.
              </p>
              <div className="space-y-4">
                {[
                  "Real-time URL reputation analysis",
                  "Deep content inspection for social engineering",
                  "Instant risk scoring and mitigation",
                  "Zero-day phishing detection"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span className="font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-32 px-8 md:px-16">
          <div className="max-w-5xl mx-auto bg-[#141414] rounded-[3rem] p-16 text-center text-white relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
              <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500 blur-[120px] rounded-full" />
              <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500 blur-[120px] rounded-full" />
            </div>
            <h2 className="text-5xl font-bold mb-8 relative z-10">Ready to secure your platform?</h2>
            <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto relative z-10">
              Join hundreds of organizations using PhishGuard to protect their users from the next generation of cyber threats.
            </p>
            <button 
              onClick={() => setView('demo')}
              className="bg-white text-black px-12 py-5 rounded-2xl font-bold text-xl hover:bg-gray-100 transition-all relative z-10"
            >
              Try the Live Demo
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-20 px-8 md:px-16 border-t border-black/5 text-center">
          <div className="flex items-center justify-center gap-2 mb-8">
            <Shield className="w-6 h-6 text-emerald-600" />
            <span className="font-bold text-xl tracking-tight">PHISHGUARD</span>
          </div>
          <p className="text-gray-400 text-sm">© 2026 PhishGuard AI. All rights reserved. Research Project.</p>
        </footer>
      </div>
    );
  }

  // Demo View (Original Simulator)
  return (
    <div className="min-h-screen bg-[#F5F5F0] text-[#141414] font-sans selection:bg-emerald-200">
      {/* Header / Status Bar */}
      <header className="h-12 border-b border-[#141414]/10 bg-white flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button onClick={() => setView('landing')} className="flex items-center gap-2 hover:text-emerald-600 transition-colors">
            <Shield className="w-5 h-5 text-emerald-600" />
            <span className="font-bold tracking-tight text-sm uppercase">PhishGuard <span className="text-emerald-600">v2.0</span></span>
          </button>
          <div className="h-4 w-px bg-[#141414]/10" />
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase opacity-50">
            <Activity className="w-3 h-3" />
            <span>Real-time Monitor Active</span>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-[10px] uppercase font-bold opacity-40 leading-none">Session Risk</div>
              <div className={cn(
                "text-xs font-mono font-bold",
                riskScore > 50 ? "text-red-600" : "text-emerald-600"
              )}>{riskScore}%</div>
            </div>
            <div className="w-24 h-1.5 bg-black/5 rounded-full overflow-hidden">
              <motion.div 
                className={cn("h-full", riskScore > 50 ? "bg-red-600" : "bg-emerald-600")}
                initial={{ width: 0 }}
                animate={{ width: `${riskScore}%` }}
              />
            </div>
          </div>
          <button onClick={() => setView('landing')} className="text-xs font-bold uppercase opacity-40 hover:opacity-100 transition-opacity">
            Exit Demo
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Browser Simulator */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-black/5 overflow-hidden flex flex-col min-h-[600px]">
            {/* Browser Chrome */}
            <div className="bg-[#EFEFEF] p-3 flex items-center gap-3 border-b border-black/5">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="flex items-center gap-1 ml-2">
                <ChevronLeft className="w-4 h-4 opacity-30" />
                <ChevronRight className="w-4 h-4 opacity-30" />
                <RefreshCw className="w-3.5 h-3.5 ml-1 opacity-50" />
              </div>
              <div className="flex-1 relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  {analysis?.isPhishing ? (
                    <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                  ) : (
                    <Lock className="w-3.5 h-3.5 text-emerald-600" />
                  )}
                </div>
                <input 
                  type="text" 
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleNavigate(url)}
                  className="w-full bg-white rounded-lg py-1.5 pl-9 pr-4 text-sm font-mono border border-black/5 focus:outline-none focus:ring-1 focus:ring-emerald-500/20"
                />
                <button 
                  onClick={() => handleNavigate(url)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-black/5 rounded"
                >
                  <Search className="w-3.5 h-3.5 opacity-50" />
                </button>
              </div>
            </div>

            {/* Viewport */}
            <div className="flex-1 p-8 bg-white relative">
              {isAnalyzing && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center gap-4">
                  <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
                  <p className="text-sm font-medium animate-pulse">Analyzing page safety...</p>
                </div>
              )}

              <AnimatePresence mode="wait">
                <motion.div
                  key={currentUrl}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="max-w-xl mx-auto"
                >
                  <h1 className="text-3xl font-bold mb-4">{MOCK_SITES[currentUrl]?.title || 'Welcome'}</h1>
                  <p className="text-gray-600 mb-8 leading-relaxed">
                    {MOCK_SITES[currentUrl]?.content || 'This is a simulated environment for testing PhishGuard detection capabilities.'}
                  </p>

                  {!isLoggedIn && !showLogin && (
                    <button 
                      onClick={() => setShowLogin(true)}
                      className="w-full bg-[#141414] text-white py-3 rounded-xl font-medium hover:bg-black/90 transition-all flex items-center justify-center gap-2"
                    >
                      Sign In to Account
                    </button>
                  )}

                  {showLogin && (
                    <div className="space-y-4 border border-black/5 p-6 rounded-2xl bg-gray-50/50">
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold opacity-40">Username</label>
                        <input type="text" className="w-full bg-white border border-black/10 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Enter username" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold opacity-40">Password</label>
                        <input type="password" className="w-full bg-white border border-black/10 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="••••••••" />
                      </div>
                      <button 
                        onClick={() => {
                          setIsLoggedIn(true);
                          setShowLogin(false);
                        }}
                        className="w-full bg-emerald-600 text-white py-3 rounded-xl font-medium hover:bg-emerald-700 transition-all"
                      >
                        Continue
                      </button>
                      <div className="flex items-center gap-2 justify-center text-[10px] text-gray-400">
                        <Lock className="w-3 h-3" />
                        <span>Secure Session Monitoring Active</span>
                      </div>
                    </div>
                  )}

                  {isLoggedIn && (
                    <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl text-center">
                      <ShieldCheck className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
                      <h2 className="text-xl font-bold text-emerald-900">Securely Logged In</h2>
                      <p className="text-emerald-700 text-sm mt-2">Your session is being monitored for hijacking attempts.</p>
                      <button 
                        onClick={() => setIsLoggedIn(false)}
                        className="mt-6 text-sm font-medium text-emerald-600 hover:underline"
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-2 gap-4">
            {Object.keys(MOCK_SITES).map(siteUrl => (
              <button
                key={siteUrl}
                onClick={() => {
                  setUrl(siteUrl);
                  handleNavigate(siteUrl);
                }}
                className="p-4 bg-white border border-black/5 rounded-xl hover:border-emerald-500/30 transition-all text-left group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold uppercase opacity-40">Test Scenario</span>
                  <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="text-sm font-medium truncate">{MOCK_SITES[siteUrl].title}</div>
                <div className="text-[10px] font-mono text-gray-400 truncate">{siteUrl}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Sidebar Intelligence */}
        <div className="lg:col-span-4 space-y-6">
          {/* AI Analysis Panel */}
          <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-600" />
                Threat Intelligence
              </h3>
              <div className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded uppercase">
                AI Engine
              </div>
            </div>

            {analysis ? (
              <div className="space-y-6">
                <div className={cn(
                  "p-4 rounded-xl border flex items-start gap-4",
                  getRiskColor(analysis.riskLevel)
                )}>
                  {analysis.isPhishing ? (
                    <ShieldAlert className="w-6 h-6 shrink-0" />
                  ) : (
                    <ShieldCheck className="w-6 h-6 shrink-0" />
                  )}
                  <div>
                    <div className="font-bold text-sm">
                      {analysis.isPhishing ? 'Phishing Detected' : 'Likely Safe'}
                    </div>
                    <div className="text-xs opacity-80 mt-1">
                      Confidence: {(analysis.confidence * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold uppercase opacity-40">Detection Reasons</h4>
                  <ul className="space-y-2">
                    {analysis.reasons.map((reason, i) => (
                      <li key={i} className="text-xs flex items-start gap-2">
                        <div className="w-1 h-1 rounded-full bg-black/20 mt-1.5 shrink-0" />
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-4 border-t border-black/5">
                  <h4 className="text-[10px] font-bold uppercase opacity-40 mb-2">Recommendation</h4>
                  <p className="text-xs italic text-gray-600 leading-relaxed">
                    "{analysis.recommendation}"
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center space-y-3">
                <div className="w-12 h-12 bg-black/5 rounded-full flex items-center justify-center mx-auto">
                  <Search className="w-5 h-5 opacity-20" />
                </div>
                <p className="text-xs text-gray-400">Navigate to a site to begin AI analysis</p>
              </div>
            )}
          </div>

          {/* Behavioral Telemetry */}
          <div className="bg-[#141414] text-white rounded-2xl shadow-lg p-6">
            <h3 className="font-bold flex items-center gap-2 mb-6">
              <Activity className="w-4 h-4 text-emerald-400" />
              Behavioral Telemetry
            </h3>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-[10px] uppercase font-bold opacity-40">Typing Latency</div>
                  <div className="text-xl font-mono">{behavior.typingSpeed.toFixed(0)}<span className="text-xs opacity-40 ml-1">ms</span></div>
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] uppercase font-bold opacity-40">Mouse Jitter</div>
                  <div className="text-xl font-mono">{behavior.mouseJitter.toFixed(2)}</div>
                </div>
              </div>

              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="w-3 h-3 text-emerald-400" />
                  <span className="text-[10px] font-bold uppercase opacity-60">Anomaly Engine Status</span>
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  {riskReason}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-[10px] uppercase font-bold opacity-40">
                  <span>Session Integrity</span>
                  <span>{100 - riskScore}%</span>
                </div>
                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-emerald-400"
                    animate={{ width: `${100 - riskScore}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
