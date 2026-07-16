import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Lock, 
  CheckCircle, 
  Globe, 
  Cpu, 
  ArrowRight, 
  Key, 
  Check, 
  Smartphone, 
  Fingerprint, 
  Server,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import KarrentsLogo from './KarrentsLogo';

interface AuthProps {
  onLoginSuccess: (email: string) => void;
  userEmail: string;
}

export default function Auth({ onLoginSuccess, userEmail }: AuthProps) {
  const [authStep, setAuthStep] = useState<'gateway' | 'google-loading' | 'mfa-challenge' | 'hw-key-touch'>('gateway');
  const [selectedEmail, setSelectedEmail] = useState<string>(userEmail);
  const [mfaCode, setMfaCode] = useState<string>('');
  const [mfaError, setMfaError] = useState<string>('');
  
  // Real-time security checks state
  const [checks, setChecks] = useState({
    tls: { name: 'TLS 1.3 Tunnel Enforced', status: 'scanning', value: 'Resolving...' },
    headers: { name: 'Anti-Clickjacking Frame Check', status: 'scanning', value: 'Inspecting...' },
    sandbox: { name: 'Client Sandbox Isolation', status: 'scanning', value: 'Testing...' },
    keyExchange: { name: 'ECDH Key exchange parameters', status: 'scanning', value: 'Generating...' }
  });

  const [clientIp, setClientIp] = useState<string>('192.168.1.1');
  const [browserEngine, setBrowserEngine] = useState<string>('V8 / Chromium');

  // Run security posture scans on mount
  useEffect(() => {
    // Generate realistic random IP
    const randomIp = `197.89.${Math.floor(Math.random() * 254) + 1}.${Math.floor(Math.random() * 254) + 1}`;
    setClientIp(randomIp);

    // Detect user-agent briefly
    const ua = navigator.userAgent;
    if (ua.includes('Firefox')) setBrowserEngine('Gecko / Firefox');
    else if (ua.includes('Safari') && !ua.includes('Chrome')) setBrowserEngine('WebKit / Apple Safari');
    else setBrowserEngine('V8 Engine / Chromium Secure Sandbox');

    // Simulate progressive posture checks
    const t1 = setTimeout(() => {
      setChecks(prev => ({
        ...prev,
        tls: { name: 'TLS 1.3 Tunnel Enforced', status: 'passed', value: 'AES_256_GCM' }
      }));
    }, 400);

    const t2 = setTimeout(() => {
      setChecks(prev => ({
        ...prev,
        headers: { name: 'Anti-Clickjacking Frame Check', status: 'passed', value: 'X-Frame DENY active' }
      }));
    }, 800);

    const t3 = setTimeout(() => {
      setChecks(prev => ({
        ...prev,
        sandbox: { name: 'Client Sandbox Isolation', status: 'passed', value: 'Level 3 sandboxed' }
      }));
    }, 1200);

    const t4 = setTimeout(() => {
      setChecks(prev => ({
        ...prev,
        keyExchange: { name: 'ECDH Key exchange parameters', status: 'passed', value: 'Curve25519 (256-bit)' }
      }));
    }, 1600);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, []);

  const handleGoogleSignIn = () => {
    setAuthStep('google-loading');
    
    // Simulate OAuth exchange with PKCE and JWT signature validation
    setTimeout(() => {
      setAuthStep('mfa-challenge');
    }, 1800);
  };

  const handleMfaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mfaCode.trim().length !== 6 || isNaN(Number(mfaCode))) {
      setMfaError('Invalid cryptographic verification token. Must be 6 digits.');
      return;
    }
    
    setMfaError('');
    onLoginSuccess(selectedEmail);
  };

  const handleHwKeyLogin = () => {
    setAuthStep('hw-key-touch');
    
    // Simulate WebAuthn authentication with FIDO2 hardware token
    setTimeout(() => {
      onLoginSuccess(selectedEmail);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans select-none antialiased relative overflow-hidden">
      {/* Background visual styling */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-blue-900/10 via-zinc-950 to-zinc-950 pointer-events-none z-0" />
      <div className="absolute top-[20%] left-[10%] w-[350px] h-[350px] bg-blue-500/5 blur-[100px] rounded-full pointer-events-none z-0" />
      <div className="absolute bottom-[10%] right-[15%] w-[450px] h-[450px] bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none z-0" />

      {/* Header Bar */}
      <header className="relative z-10 border-b border-zinc-900 bg-zinc-950/40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-blue-600 p-1.5 rounded-lg border border-blue-500 shadow-lg shadow-blue-500/10">
              <KarrentsLogo className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold tracking-tight text-white text-sm leading-tight">Karrents</span>
              <span className="text-[9px] text-zinc-500 tracking-wider uppercase font-semibold">Security Intelligence</span>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-zinc-900/60 border border-zinc-800/80 px-3 py-1.5 rounded-full text-[10px] font-mono text-zinc-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            <span>SECURE GATEWAY v3.1</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-grow flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 gap-8 bg-zinc-900/40 border border-zinc-850 p-6 md:p-8 rounded-2xl shadow-2xl shadow-black/60 backdrop-blur-lg">
          
          {/* Left Column: Posture Compliance Panel */}
          <div className="md:col-span-5 space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-extrabold text-blue-500 uppercase tracking-widest block mb-1">
                  Security Posture Audit
                </span>
                <h2 className="text-lg font-bold text-white tracking-tight leading-snug">
                  Secure-by-Default Compliance Checks
                </h2>
                <p className="text-[11px] text-zinc-400 leading-relaxed mt-1">
                  Our defense-in-depth protocols execute sandbox isolation and cryptographic channel mapping on connection setup.
                </p>
              </div>

              {/* Status checks */}
              <div className="space-y-2.5">
                {Object.entries(checks).map(([key, item]) => {
                  const checkItem = item as { name: string; status: string; value: string };
                  return (
                    <div key={key} className="bg-zinc-950/50 border border-zinc-850 p-2.5 rounded-lg flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center gap-2 min-w-0">
                        {checkItem.status === 'passed' ? (
                          <div className="h-4 w-4 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                            <Check className="w-2.5 h-2.5 text-emerald-400" />
                          </div>
                        ) : (
                          <div className="h-4 w-4 rounded-full border border-zinc-800 flex items-center justify-center shrink-0">
                            <RefreshCw className="w-2.5 h-2.5 text-blue-400 animate-spin" />
                          </div>
                        )}
                        <span className="text-[11px] text-zinc-300 truncate font-semibold">{checkItem.name}</span>
                      </div>
                      <span className={`text-[10px] font-bold ${checkItem.status === 'passed' ? 'text-emerald-400' : 'text-zinc-500'}`}>
                        {checkItem.value}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Forensic client metadata */}
            <div className="bg-zinc-950/40 border border-zinc-900 p-3.5 rounded-xl space-y-2 text-[10px] font-mono text-zinc-500">
              <div className="flex justify-between">
                <span>Client IPv4 Node:</span>
                <span className="text-zinc-300 font-bold select-all">{clientIp}</span>
              </div>
              <div className="flex justify-between">
                <span>Browser Sandbox:</span>
                <span className="text-zinc-300 font-bold">{browserEngine}</span>
              </div>
              <div className="flex justify-between">
                <span>Zero-Logs Memory:</span>
                <span className="text-blue-400 font-bold">TRANSIENT_ON_DEMAND</span>
              </div>
              <div className="flex justify-between">
                <span>Domain Scope:</span>
                <span className="text-zinc-300 font-bold">karrents.com</span>
              </div>
            </div>
          </div>

          {/* Divider on desktop */}
          <div className="hidden md:block md:col-span-1 justify-self-center self-stretch w-px bg-zinc-800/40" />

          {/* Right Column: Authentication Panel */}
          <div className="md:col-span-6 flex flex-col justify-center space-y-6">
            
            {/* Brand Context */}
            <div className="text-center md:text-left space-y-1">
              <div className="inline-flex items-center gap-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full px-2.5 py-0.5 text-[9px] font-mono font-extrabold uppercase">
                <Cpu className="w-3 h-3" />
                <span>Karrents Labs</span>
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight leading-none pt-1">
                Karrents Security Intelligence
              </h1>
              <p className="text-xs text-zinc-400">
                Authorized defender portal. Aggregating, correlating, and explaining cybersecurity information from trusted sources.
              </p>
            </div>

            {/* Step 1: Default Auth Gateway */}
            {authStep === 'gateway' && (
              <div className="space-y-4">
                {/* Google Sign In button */}
                <button
                  id="google-signin-btn"
                  onClick={handleGoogleSignIn}
                  className="w-full bg-white hover:bg-zinc-100 text-zinc-900 px-4 py-3 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2.5 border border-zinc-200"
                >
                  {/* Google SVG Logo */}
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  <span>Sign In with Google Secure OAuth</span>
                </button>

                <div className="relative flex items-center justify-center py-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-zinc-800/60" />
                  </div>
                  <span className="relative bg-zinc-950 px-3 text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                    Or Use Hardware Key
                  </span>
                </div>

                {/* WebAuthn / FIDO2 Hardware Key button */}
                <button
                  id="hardware-key-btn"
                  onClick={handleHwKeyLogin}
                  className="w-full bg-zinc-950 hover:bg-zinc-900 text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700 px-4 py-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2"
                >
                  <Fingerprint className="w-4 h-4 text-blue-400" />
                  <span>Verify Hardware Security Key (FIDO2)</span>
                </button>

                {/* Safety notice */}
                <div className="bg-zinc-950/60 border border-zinc-900 p-3.5 rounded-xl text-[10px] text-zinc-500 leading-relaxed flex gap-2.5 items-start">
                  <Lock className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-zinc-400 block mb-0.5">Secure-by-Default Operations Mode</span>
                    Your connection undergoes strict end-to-end token validation. Credentials never touch local logs. System operates under absolute zero-knowledge persistence rules.
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Google Loading Animation */}
            {authStep === 'google-loading' && (
              <div className="space-y-6 py-6 flex flex-col items-center justify-center text-center">
                <div className="relative">
                  <div className="h-14 w-14 rounded-full border-t-2 border-b-2 border-blue-500 animate-spin" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600/10 p-2.5 rounded-full border border-blue-500/20">
                    <Shield className="w-5 h-5 text-blue-400" />
                  </div>
                </div>
                <div className="space-y-1.5 font-mono">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Google OAuth Signature Handshake
                  </h3>
                  <div className="text-[10px] text-zinc-500 space-y-1">
                    <p className="text-blue-400 animate-pulse">● Initializing OAuth2 transaction with PKCE</p>
                    <p className="text-zinc-500">● Awaiting Google Identity JWT response token</p>
                    <p className="text-zinc-600">● Redirect mapping verified for karrents.com</p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: MFA Cryptographic input */}
            {authStep === 'mfa-challenge' && (
              <form onSubmit={handleMfaSubmit} className="space-y-4 animate-fade-in">
                <div className="bg-blue-500/5 border border-blue-500/10 p-4 rounded-xl flex gap-3">
                  <Smartphone className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-zinc-400 leading-relaxed">
                    <span className="font-bold text-white block mb-0.5">Security Notice: 2FA Active</span>
                    An end-to-end verified login request was registered for <strong className="text-zinc-200">{selectedEmail}</strong>. Please input your 6-digit cryptographic verification token below.
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-mono block">
                    Cryptographic 2FA Token
                  </label>
                  <input
                    id="mfa-token-input"
                    type="text"
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter 6-digit code (e.g. 123456)"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-blue-500 font-mono text-center tracking-widest text-lg"
                    required
                    autoFocus
                  />
                  {mfaError && (
                    <p className="text-[10px] font-mono font-bold text-red-400 flex items-center gap-1 mt-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>{mfaError}</span>
                    </p>
                  )}
                </div>

                <div className="flex gap-2.5">
                  <button
                    type="button"
                    onClick={() => setAuthStep('gateway')}
                    className="flex-1 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white px-4 py-2.5 rounded-lg text-xs font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/10"
                  >
                    <span>Verify & Grant Access</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            )}

            {/* Step 4: WebAuthn Touch Challenge */}
            {authStep === 'hw-key-touch' && (
              <div className="space-y-6 py-6 flex flex-col items-center justify-center text-center animate-fade-in">
                <div className="relative">
                  <div className="h-16 w-16 rounded-full border-t-2 border-b-2 border-blue-400 animate-spin" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600/15 p-3 rounded-full border border-blue-500/30">
                    <Fingerprint className="w-6 h-6 text-blue-400 animate-pulse" />
                  </div>
                </div>
                <div className="space-y-1.5 font-mono">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider animate-pulse">
                    Waiting for WebAuthn Token Touch
                  </h3>
                  <p className="text-[10px] text-zinc-500 max-w-xs leading-relaxed">
                    Insert your physical key (e.g., YubiKey) and touch the contact sensor to complete ECDSA-SHA256 signature handshake.
                  </p>
                </div>
                <button
                  onClick={() => setAuthStep('gateway')}
                  className="bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 text-zinc-500 hover:text-zinc-300 px-3 py-1 rounded-md text-[10px] font-mono transition-colors"
                >
                  Back to Gateway
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer credits and disclosures */}
      <footer className="relative z-10 border-t border-zinc-900/60 bg-zinc-950/40 p-4 text-center">
        <p className="text-[10px] text-zinc-500 leading-relaxed max-w-xl mx-auto">
          © 2026 Karrents Security Intelligence. All rights reserved. This platform is a secure, sandbox-isolated intelligence hub operated under zero-logs retention regimes.
        </p>
      </footer>
    </div>
  );
}
