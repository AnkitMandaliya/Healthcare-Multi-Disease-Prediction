import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Activity, 
  Microscope,
  ChevronRight,
  ShieldCheck,
  BrainCircuit,
  Database,
  ChartBar,
  Sparkles,
  Zap,
  User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';


const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const navItems = [
    { name: 'Mission Control', path: '/dashboard', icon: LayoutDashboard, desc: 'Operational Overview' },
    { name: 'Neural Predict', path: '/predict', icon: BrainCircuit, desc: 'AI Diagnostic Engine' },
  ];

  if (user?.role === 'admin') {
    navItems.push({ name: 'Admin Hub', path: '/admin', icon: Database, desc: 'Command Center' });
  }

  if (user?.permissions?.includes('manage_roles')) {
    navItems.push({ name: 'Access Control', path: '/roles', icon: ShieldCheck, desc: 'Enterprise Identity' });
  }

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      <aside className={`
        fixed inset-y-0 left-0 z-50 flex flex-col w-72 bg-white dark:bg-[#111621] border-r border-slate-200 dark:border-slate-800 transition-all duration-500 overflow-hidden md:relative md:translate-x-0 md:flex
        ${isOpen ? 'translate-x-0 shadow-2xl shadow-slate-900/20' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Brand Section */}
        <div className="p-8 relative">
          <div className="flex items-center gap-4 text-primary relative z-10">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center shadow-inner border border-primary/20 group cursor-pointer">
              <Microscope size={28} className="group-hover:rotate-12 transition-transform" />
            </div>
            <div>
              <h1 className="font-black text-2xl tracking-tighter dark:text-white leading-none uppercase">HealthAI</h1>
              <div className="flex items-center gap-1.5 mt-1.5">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">PRODUCTION v1.0.0</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-2 mt-4 relative z-10 overflow-y-auto custom-scrollbar">
          <div className="mb-4 px-5">
             <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Neural Diagnostics</p>
          </div>
          {navItems.filter(i => ['/dashboard', '/predict'].includes(i.path)).map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) => `
                flex items-center justify-between px-5 py-3.5 rounded-[1.3rem] transition-all duration-300 group relative mb-1
                ${isActive 
                  ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50'}
              `}
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-4">
                    <item.icon size={20} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-primary transition-colors'} />
                    <div className="flex flex-col">
                      <span className="text-sm font-bold tracking-tight">{item.name}</span>
                      {!isActive && <span className="text-[9px] font-medium opacity-60 uppercase tracking-widest leading-none mt-1">{item.desc}</span>}
                    </div>
                  </div>
                  {isActive && <motion.div layoutId="activeHighlight" className="absolute left-0 w-1 h-6 bg-white rounded-r-full" />}
                </>
              )}
            </NavLink>
          ))}

          {(navItems.some(i => ['/admin', '/roles'].includes(i.path))) && (
             <>
                <div className="mt-8 mb-4 px-5">
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">System Governance</p>
                </div>
                {navItems.filter(i => ['/admin', '/roles'].includes(i.path)).map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    onClick={onClose}
                    className={({ isActive }) => `
                      flex items-center justify-between px-5 py-3.5 rounded-[1.3rem] transition-all duration-300 group relative mb-1
                      ${isActive 
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50'}
                    `}
                  >
                    {({ isActive }) => (
                      <>
                        <div className="flex items-center gap-4">
                          <item.icon size={20} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-500 transition-colors'} />
                          <div className="flex flex-col">
                            <span className="text-sm font-bold tracking-tight">{item.name}</span>
                            {!isActive && <span className="text-[9px] font-medium opacity-60 uppercase tracking-widest leading-none mt-1">{item.desc}</span>}
                          </div>
                        </div>
                        {isActive && <motion.div layoutId="adminHighlight" className="absolute left-0 w-1 h-6 bg-white rounded-r-full" />}
                      </>
                    )}
                  </NavLink>
                ))}
             </>
          )}
        </nav>

        {/* Bottom Section */}
        <div className="p-6 mt-auto relative z-10 border-t border-slate-100 dark:border-slate-800">
          <div className="p-5 rounded-[1.7rem] bg-slate-50 dark:bg-white/2 border border-slate-100 dark:border-white/5 relative overflow-hidden group mb-6">
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20 shadow-inner">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">Protocol 9</span>
                  <p className="text-[8px] text-emerald-600 font-bold uppercase tracking-widest mt-0.5">HIPAA ACTIVE</p>
                </div>
              </div>
              <p className="text-[9px] text-slate-400 dark:text-slate-500 leading-relaxed font-bold uppercase tracking-tighter">
                AES-256 NODE ENCRYPTION ACTIVE
              </p>
            </div>
            <Zap size={50} className="absolute bottom-[-10px] right-[-10px] text-primary/5 -rotate-12 group-hover:scale-110 transition-transform duration-700" />
          </div>
          
          {/* User Hub */}
          {user ? (
            <Link to="/profile" onClick={onClose} className="flex items-center justify-between p-2 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group">
               <div className="flex items-center gap-3">
                  <div className="relative">
                    <img src={user.avatar} alt={user.name} className="w-11 h-11 rounded-xl object-cover border-2 border-primary/20 shadow-lg group-hover:border-primary transition-colors" />
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-[#111621]"></div>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black text-slate-900 dark:text-white truncate tracking-tight">{user.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                       <span className="text-[8px] text-primary font-black uppercase tracking-[0.2em]">{user.role || 'Clinician'}</span>
                    </div>
                  </div>
               </div>
            </Link>
          ) : (
            <div className="flex items-center gap-3 p-2 animate-pulse opacity-50">
               <div className="w-11 h-11 rounded-xl bg-slate-200 dark:bg-slate-800" />
               <div className="space-y-2">
                  <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="h-2 w-12 bg-slate-200 dark:bg-slate-800 rounded" />
               </div>
            </div>
          )}
        </div>

        {/* Background Decor */}
        <div className="absolute top-1/2 left-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none translate-x-[-50%]"></div>
      </aside>
    </>
  );
};

export default Sidebar;
