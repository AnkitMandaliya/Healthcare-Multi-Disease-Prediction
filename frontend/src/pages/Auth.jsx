import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  Mail, 
  Lock, 
  User, 
  ShieldCheck, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  Stethoscope, 
  Database, 
  CheckCircle2,
  Phone,
  MessageSquare,
  RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CustomSelect from '../components/ui/CustomSelect';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [loginStep, setLoginStep] = useState(1); // 1: Credentials, 2: OTP
  const [loginUid, setLoginUid] = useState(null);
  const [forgotPwdStep, setForgotPwdStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'clinician', otp: '', phone: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const [availableRoles, setAvailableRoles] = useState([]);

  // Fetch dynamic registration roles from backend
  useEffect(() => {
    fetch('https://healthcare-multi-disease-prediction.onrender.com/api/available-roles')
      .then(res => {
         if (!res.ok) throw new Error('Backend unvailable');
         return res.text();
      })
      .then(text => {
         if (!text) return { roles: [] };
         try {
            return JSON.parse(text);
         } catch(e) {
            console.error("Invalid JSON response:", text);
            return { roles: [] };
         }
      })
      .then(data => {
         if (data && data.roles) {
            const nonAdminRoles = data.roles.filter(r => r.name !== 'admin');
            setAvailableRoles(nonAdminRoles);
            if (nonAdminRoles.length > 0) {
               setFormData(prev => ({...prev, role: nonAdminRoles[0].name}));
            }
         }
      })
      .catch(err => {
         console.warn("Using fallback roles due to error:", err);
         // Fallback roles will be naturally applied because availableRoles stays empty
      });
  }, []);

  // Handle Resend Timer
  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (isForgotPassword) {
      if (forgotPwdStep === 1) handleSendOTP();
      else if (forgotPwdStep === 2) handleVerifyOTP();
      else if (forgotPwdStep === 3) handleReset();
    } else {
       if (isLogin && loginStep === 2) handleLoginVerify();
       else handleAuth();
    }
  };

  const handlePhoneChange = (e) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 0 && !/^[6-9]/.test(val)) val = val.substring(1);
    if (val.length > 10) val = val.substring(0, 10);
    if (val.length > 5) val = val.substring(0, 5) + ' ' + val.substring(5);
    setFormData({...formData, phone: val});
  };

  const handleSendOTP = async (isResend = false) => {
    setError('');
    setLoading(true);
    
    // Mutual Exclusivity: Only one at a time
    const payloadPhone = formData.phone ? '+91' + formData.phone.replace(/\D/g, '') : undefined;
    const payload = formData.email ? { email: formData.email } : { phone: payloadPhone };
    if (!formData.email && !formData.phone) {
       setError('Identification identifier required (Email or Phone)');
       setLoading(false);
       return;
    }

    try {
      const res = await fetch('https://healthcare-multi-disease-prediction.onrender.com/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      let data;
      try {
         data = await res.json();
      } catch (err) {
         throw new Error("Server communication failed. Please ensure the backend is running and connected.");
      }
      if (!res.ok) throw new Error(data.error || 'Identity protocol failed');
      
      if (!isResend) setForgotPwdStep(2);
      setResendTimer(60); // Start 60s countdown
      setError(isResend ? 'New protocol token dispatched.' : 'Protocol instructions dispatched to targeted terminal.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    setError('');
    setLoading(true);
    try {
      const payloadPhone = formData.phone ? '+91' + formData.phone.replace(/\D/g, '') : undefined;
      const res = await fetch('https://healthcare-multi-disease-prediction.onrender.com/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email || payloadPhone, otp: formData.otp }) // Backend handles combined lookup
      });
      let data;
      try {
         data = await res.json();
      } catch (err) {
         throw new Error("Server communication failed. Please ensure the backend is running and connected.");
      }
      if (!res.ok) throw new Error(data.error || 'Verification fail');
      
      setForgotPwdStep(3);
      setError('Identity verified. Provide new secure passkey.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotClick = () => {
    const identification = formData.email?.trim() || '';
    setError('');
    
    // Detect type
    if (/^\d+$/.test(identification.replace(/\s/g, ''))) {
      // It's a phone number
      setFormData({ ...formData, email: '', phone: identification, otp: '' });
    } else if (identification.includes('@')) {
      // It's an email
      setFormData({ ...formData, email: identification, phone: '', otp: '' });
    } else {
      // Unknown or empty, just reset both but keep name/role for reg
      setFormData({ ...formData, email: '', phone: '', otp: '' });
    }
    
    setIsForgotPassword(true);
    setForgotPwdStep(1);
  };

  const handleAuth = async () => {
    setError('');
    setLoading(true);
    
    try {
       const endpoint = isLogin ? '/api/login' : '/api/register';
       const phoneFormatted = formData.phone ? '+91' + formData.phone.replace(/\D/g, '') : '';
       
       let loginIdentifier = formData.email?.trim() || '';
       if (/^\d{10}$/.test(loginIdentifier.replace(/\s/g, ''))) {
          loginIdentifier = '+91' + loginIdentifier.replace(/\s/g, '');
       }

       const bodyData = isLogin 
         ? { email: loginIdentifier, password: formData.password }
         : { ...formData, phone: phoneFormatted };

       // Register validation: Name, Email OR Phone, and Password
       if (!isLogin) {
         if (!formData.name || !formData.password || (!formData.email && !formData.phone)) {
           throw new Error("Credentials missing: Name, (Email OR Phone), and Password required.");
         }
       }

       const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyData)
       });
       
       let data;
       try {
           data = await res.json();
       } catch (err) {
           throw new Error("Connection refused. The backend server or database is completely offline.");
       }
       
       if (!res.ok) throw new Error(data?.error || 'Authentication failed');

       if (isLogin) {
          if (data.otp_required) {
            setLoginStep(2);
            setLoginUid(data.uid);
            setResendTimer(60);
            setError(`Security node check: Verification dispatched to ${data.sent_to}`);
          } else {
            login(data.user, data.access_token);
            if (data.user.role === 'admin') navigate('/admin');
            else navigate('/dashboard');
          }
       } else {
          setIsLogin(true);
          setError('Registration successful. Establish your connection hub below.');
       }
    } catch (err) {
       setError(err.message);
    } finally {
       setLoading(false);
    }
  };

  const handleLoginVerify = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('https://healthcare-multi-disease-prediction.onrender.com/api/login-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: loginUid, otp: formData.otp })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Verification failed');
      
      login(data.user, data.access_token);
      if (data.user.role === 'admin') navigate('/admin');
      else navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setLoading(true);
    try {
      const payloadPhone = formData.phone ? '+91' + formData.phone.replace(/\D/g, '') : undefined;
      const res = await fetch(`https://healthcare-multi-disease-prediction.onrender.com/api/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email || payloadPhone, password: formData.password })
      });
      let data;
      try {
         data = await res.json();
      } catch (err) {
         throw new Error("Server communication failed. Please ensure the backend is running and connected.");
      }
      if (!res.ok) throw new Error(data.error || 'Reset failed');
      // Protocol re-secured: Prepare login context
      const secureIdentifier = formData.email || formData.phone || '';
      setFormData({ 
        ...formData, 
        email: secureIdentifier, 
        password: '', 
        otp: '', 
        phone: '' 
      });
      
      setIsForgotPassword(false);
      setForgotPwdStep(1);
      setIsLogin(true);
      setError('Protocol re-secured. Identity verified. Access context initialized.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0B0F1A] flex flex-col md:flex-row overflow-hidden transition-colors duration-500">
      
      {/* Left Visual Side (Modern Medical Aesthetic) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-primary overflow-hidden items-center justify-center p-20">
        <div className="absolute inset-0 opacity-20">
           <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent"></div>
           <svg className="w-full h-full" viewBox="0 0 100 100">
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.1"></path>
              </pattern>
              <rect width="100" height="100" fill="url(#grid)"></rect>
           </svg>
        </div>

        <div className="relative z-10 w-full max-w-lg">
           <motion.div 
             initial={{ opacity: 0, x: -30 }}
             animate={{ opacity: 1, x: 0 }}
             transition={{ duration: 0.8 }}
             className="space-y-8"
           >
              <div className="flex items-center gap-3">
                 <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center text-primary shadow-xl">
                    <Activity size={28} />
                 </div>
                 <h1 className="text-3xl font-black text-white tracking-tight uppercase">HealthAI <span className="text-white/60">Node</span></h1>
              </div>

              <div className="space-y-6">
                 <h2 className="text-5xl font-black text-white leading-tight tracking-tighter">
                    Enterprise Tier <br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-100 to-white/60">Diagnostic Intelligence</span>
                 </h2>
                 <p className="text-lg text-blue-100/70 leading-relaxed font-medium">
                    Securing the future of clinical diagnosis with high-fidelity neural networks and decentralized data protocols.
                 </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 {[
                   { icon: Database, text: "99.8% Accuracy", sub: "Clinical Validated" },
                   { icon: ShieldCheck, text: "AES-256 Node", sub: "Enterprise Encrypted" },
                   { icon: Stethoscope, text: "500+ Labs", sub: "Internal Network" },
                   { icon: CheckCircle2, text: "v1.0 Active", sub: "Latest Model Core" }
                 ].map((stat, i) => (
                    <div key={i} className="p-5 rounded-3xl bg-white/10 backdrop-blur-md border border-white/10 hover:bg-white/15 transition-all">
                       <stat.icon size={20} className="text-white mb-2" />
                       <div className="text-white font-black text-sm uppercase tracking-wide">{stat.text}</div>
                       <div className="text-[10px] text-blue-200/60 font-black uppercase tracking-widest">{stat.sub}</div>
                    </div>
                 ))}
              </div>
           </motion.div>
        </div>
      </div>

      {/* Right Form Side */}
      <div className="flex-1 flex items-center justify-center p-8 md:p-16 lg:bg-slate-50/50 dark:lg:bg-transparent">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-10">
             <div className="flex items-center gap-2">
                <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center text-white">
                   <Activity size={24} />
                </div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">HealthAI</h2>
             </div>
          </div>

          <div className="mb-10 text-center lg:text-left">
             <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase mb-2">
                {isForgotPassword ? (forgotPwdStep === 1 ? 'Recover Node' : (forgotPwdStep === 2 ? 'Verify Identity' : 'Secure Passkey')) : (isLogin ? 'Access Hub' : 'Initialize Node')}
             </h3>
             <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                {isForgotPassword ? 'Security Protocol Sequence' : (isLogin ? 'Establish Secure Connection' : 'Create New Clinical Identifier')}
             </p>
          </div>

          <AnimatePresence mode="wait">
            <motion.form 
              key={isLogin + '-' + isForgotPassword + '-' + forgotPwdStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              onSubmit={handleSubmit} 
              className="space-y-5"
            >
              {error && (
                 <div className={`p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest ${error.includes('successful') || error.includes('verified') || error.includes('dispatched') ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'} text-center shadow-sm`}>
                    {error}
                 </div>
              )}

              {/* Login / Register Fields */}
              {!isForgotPassword && (
                 <>
                    {!isLogin && (
                       <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Full Clinical Name</label>
                          <div className="mt-2 relative">
                             <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                             <input 
                                type="text" 
                                required 
                                className="w-full h-14 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl pl-12 pr-4 text-sm font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all dark:text-white shadow-sm"
                                placeholder="Dr. Jane Doe"
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                             />
                          </div>
                       </div>
                    )}

                    {(!isLogin || loginStep === 1) && (
                      <div className="space-y-5">
                        <div>
                           <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{isLogin ? 'Establish Identifier (Email or Mobile No.)' : 'Establish Identifier (Email)'}</label>
                           <div className="mt-2 relative">
                              {isLogin && formData.email && /^\d+$/.test(formData.email.replace(/\s/g, "")) ? (<Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary animate-pulse transition-all" />) : (<Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />)}
                              <input 
                                 type="text" 
                                 required={isLogin} 
                                 className="w-full h-14 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl pl-12 pr-4 text-sm font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all dark:text-white shadow-sm"
                                 placeholder={isLogin ? "email@health.com / 91xxxxxx" : "node@healthai.com"}
                                 value={formData.email}
                                 onChange={(e) => setFormData({...formData, email: e.target.value})}
                              />
                           </div>
                        </div>
    
                        {!isLogin && (
                           <div>
                              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Rescue Mobile No.</label>
                              <div className="mt-2 relative flex items-center">
                                 <Phone size={18} className="absolute left-4 z-10 text-slate-400" />
                                 <span className="absolute left-10 z-10 text-sm font-bold pointer-events-none text-slate-600 dark:text-slate-300">+91</span>
                                 <input 
                                    type="text" 
                                    required={!formData.email}
                                    className="w-full h-14 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl pl-[4.5rem] pr-4 text-sm font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all dark:text-white shadow-sm"
                                    placeholder="00000 00000"
                                    value={formData.phone}
                                    onChange={handlePhoneChange}
                                 />
                              </div>
                           </div>
                        )}
    
                        <div>
                           <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Secure Passkey</label>
                           <div className="mt-2 relative">
                              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                              <input 
                                 type={showPassword ? "text" : "password"}
                                 required 
                                 className="w-full h-14 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl pl-12 pr-12 text-sm font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all dark:text-white shadow-sm"
                                 placeholder="••••••••"
                                 value={formData.password}
                                 onChange={(e) => setFormData({...formData, password: e.target.value})}
                              />
                              <button
                                 type="button"
                                 onClick={() => setShowPassword(!showPassword)}
                                 className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-primary transition-colors"
                              >
                                 {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                              </button>
                           </div>
                        </div>
                      </div>
                    )}

                    {isLogin && loginStep === 2 && (
                       <div className="space-y-6">
                          <div className="p-5 rounded-3xl bg-primary/5 border border-primary/10 text-center space-y-2">
                             <MessageSquare className="mx-auto text-primary" size={32} />
                             <p className="text-[10px] font-black uppercase text-primary tracking-widest">Authentication Factor</p>
                             <p className="text-[9px] font-bold text-slate-400">Security node verification token required for access.</p>
                          </div>
                          <div>
                             <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 text-center block">6-Digit Code (OTP)</label>
                             <div className="mt-3 relative">
                                <ShieldCheck size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                                <input 
                                   type="text" 
                                   required 
                                   maxLength="6"
                                   className="w-full h-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center text-2xl font-black tracking-[0.5em] focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all dark:text-white shadow-inner"
                                   placeholder="000000"
                                   value={formData.otp}
                                   onChange={(e) => setFormData({...formData, otp: e.target.value.replace(/\D/g, '')})}
                                />
                             </div>
                          </div>

                          <div className="text-center mt-6">
                             <button 
                                type="button"
                                disabled={loading || resendTimer > 0}
                                onClick={() => handleAuth()}
                                className={`inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-colors ${resendTimer > 0 ? 'text-slate-400 cursor-not-allowed' : 'text-primary hover:text-primary/70'}`}
                             >
                                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                                {resendTimer > 0 ? `Resend protocol in ${resendTimer}s` : 'Re-dispatch Protocol Token'}
                             </button>
                          </div>
                       </div>
                    )}

                    {!isLogin && (
                       <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Authorized Node Role</label>
                          <div className="mt-2 relative">
                             <ShieldCheck size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                             <CustomSelect 
                                name="role"
                                value={formData.role}
                                onChange={(e) => setFormData({...formData, role: e.target.value})}
                               options={availableRoles.length > 0 
                                   ? availableRoles.map(r => ({
                                       value: r.name,
                                       label: r.name.charAt(0).toUpperCase() + r.name.slice(1)
                                     }))
                                   : [
                                       { value: "clinician", label: "Clinician" },
                                       { value: "patient", label: "Patient" }
                                     ]}
                                className="w-full h-14 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl pl-[3.5rem] pr-4 text-sm font-bold outline-none transition-all dark:text-white shadow-sm"
                             />
                          </div>
                       </div>
                    )}
                 </>
              )}

              {/* Forgot Password Flow */}
              {isForgotPassword && (
                 <>
                    {forgotPwdStep === 1 && (
                       <div className="space-y-6">
                          <div>
                             <label className={`text-[10px] font-black uppercase tracking-widest ml-1 transition-colors ${formData.phone ? 'text-slate-200 line-through' : 'text-slate-400'}`}>Recovery Identifer (Email)</label>
                             <div className="mt-2 relative">
                                <Mail size={18} className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${formData.phone ? 'text-slate-200' : 'text-slate-400'}`} />
                                <input 
                                   type="email" 
                                   disabled={!!formData.phone}
                                   className="w-full h-14 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl pl-12 pr-4 text-sm font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all dark:text-white shadow-sm disabled:opacity-20"
                                   placeholder="node@healthai.com"
                                   value={formData.email}
                                   onChange={(e) => setFormData({...formData, email: e.target.value})}
                                />
                             </div>
                          </div>
                          
                          <div className="relative">
                             <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100 dark:border-slate-800"></div></div>
                             <div className="relative flex justify-center text-[8px] font-black uppercase tracking-[0.3em]"><span className="bg-white dark:bg-[#0B0F1A] px-2 text-slate-400">OR MOBILE RESCUE</span></div>
                          </div>

                          <div>
                             <label className={`text-[10px] font-black uppercase tracking-widest ml-1 transition-colors ${formData.email ? 'text-slate-200 line-through' : 'text-slate-400'}`}>Rescue Mobile No.</label>
                             <div className="mt-2 relative flex items-center">
                                <Phone size={18} className={`absolute left-4 z-10 transition-colors ${formData.email ? 'text-slate-200' : 'text-slate-400'}`} />
                                <span className={`absolute left-10 z-10 text-sm font-bold pointer-events-none transition-colors ${formData.email ? 'text-slate-200' : 'text-slate-600 dark:text-slate-300'}`}>+91</span>
                                <input 
                                   type="text" 
                                   disabled={!!formData.email}
                                   className="w-full h-14 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl pl-[4.5rem] pr-4 text-sm font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all dark:text-white shadow-sm disabled:opacity-20"
                                   placeholder="00000 00000"
                                   value={formData.phone}
                                   onChange={handlePhoneChange}
                                />
                             </div>
                          </div>
                          
                          {/* Clear Fields button if both are messy */}
                          {(formData.email || formData.phone) && (
                            <button 
                               type="button"
                               onClick={() => setFormData({...formData, email: '', phone: ''})}
                               className="text-[9px] font-black uppercase tracking-widest text-slate-300 hover:text-red-400 transition-colors block mx-auto"
                            >
                               Reset Selection
                            </button>
                          )}
                       </div>
                    )}

                    {forgotPwdStep === 2 && (
                       <div className="space-y-6">
                          <div className="p-5 rounded-3xl bg-primary/5 border border-primary/10 text-center space-y-2">
                             <MessageSquare className="mx-auto text-primary" size={32} />
                             <p className="text-[10px] font-black uppercase text-primary tracking-widest">Awaiting Verification Code</p>
                             <p className="text-[9px] font-bold text-slate-400">We've dispatched a 6-digit identity token to your terminal.</p>
                          </div>
                          <div>
                             <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 text-center block">6-Digit Identity Code (OTP)</label>
                             <div className="mt-3 relative">
                                <ShieldCheck size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                                <input 
                                   type="text" 
                                   required 
                                   maxLength="6"
                                   className="w-full h-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center text-2xl font-black tracking-[0.5em] focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all dark:text-white shadow-inner"
                                   placeholder="000000"
                                   value={formData.otp}
                                   onChange={(e) => setFormData({...formData, otp: e.target.value.replace(/\D/g, '')})}
                                />
                             </div>
                          </div>

                          <div className="text-center">
                             <button 
                                type="button"
                                disabled={loading || resendTimer > 0}
                                onClick={() => handleSendOTP(true)}
                                className={`inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-colors ${resendTimer > 0 ? 'text-slate-400 cursor-not-allowed' : 'text-primary hover:text-primary/70'}`}
                             >
                                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                                {resendTimer > 0 ? `Resend protocol in ${resendTimer}s` : 'Re-dispatch Protocol Token'}
                             </button>
                          </div>
                       </div>
                    )}

                    {forgotPwdStep === 3 && (
                       <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">New Identity Passkey</label>
                          <div className="mt-2 relative">
                             <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                             <input 
                                type={showPassword ? "text" : "password"}
                                required 
                                className="w-full h-14 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl pl-12 pr-12 text-sm font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all dark:text-white shadow-sm"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={(e) => setFormData({...formData, password: e.target.value})}
                             />
                             <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-primary transition-colors"
                             >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                             </button>
                          </div>
                       </div>
                    )}
                 </>
              )}

              <button 
                type="submit" 
                disabled={loading}
                className="w-full h-16 bg-primary text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-primary/30 hover:scale-[1.02] transform transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 mt-8"
              >
                {loading ? 'Processing Node...' : (isForgotPassword ? (forgotPwdStep === 1 ? 'Dispatch OTP Code' : (forgotPwdStep === 2 ? 'Establish Verification' : 'Finalize Passkey')) : (isLogin ? 'Establish Connection' : 'Initialize Node Registry'))}
                {!loading && <ArrowRight size={18} />}
              </button>
            </motion.form>
          </AnimatePresence>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-10 flex flex-col gap-4 text-center"
          >
             <button 
                onClick={() => { setIsLogin(!isLogin); setIsForgotPassword(false); setLoginStep(1); setForgotPwdStep(1); setError(''); }}
                className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-primary transition-colors"
             >
                {isForgotPassword ? 'Abort Recovery Protocol' : (isLogin ? (loginStep === 2 ? 'Abort Verification' : 'Request New Clinical Identity') : 'Return to Login Context')}
             </button>
             {isLogin && !isForgotPassword && (
                <button 
                  onClick={handleForgotClick}
                  className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500 hover:text-amber-600 transition-colors"
                >
                  Forgot Secure Passkey?
                </button>
              )}
          </motion.div>
        </motion.div>
      </div>

      {/* Decorative Blur Accents */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -z-10 pointer-events-none"></div>
      <div className="fixed bottom-0 left-0 w-[300px] h-[300px] bg-primary/10 rounded-full blur-[100px] -z-10 pointer-events-none"></div>
    </div>
  );
};

export default Auth;
