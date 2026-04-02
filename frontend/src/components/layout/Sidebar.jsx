import React from 'react';
import { NavLink } from 'react-router-dom';
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
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';


const Sidebar = () => {
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
    <aside className="hidden md:flex flex-col w-72 bg-white dark:bg-[#111621] border-r border-slate-200 dark:border-slate-800 transition-all duration-500 z-40 relative overflow-hidden">
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
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Enterprise v3.4.1</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-2 mt-4 relative z-10">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) => `
              flex items-center justify-between px-5 py-4 rounded-[1.5rem] transition-all duration-300 group relative
              ${isActive 
                ? 'bg-primary text-white shadow-xl shadow-primary/20' 
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50'}
            `}
          >
            {({ isActive }) => (
              <>
                <div className="flex items-center gap-4">
                  <div className={`p-2.5 rounded-xl transition-colors ${isActive ? 'bg-white/20' : 'bg-transparent'}`}>
                    <item.icon size={22} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold tracking-tight">{item.name}</span>
                    {!isActive && <span className="text-[10px] font-medium opacity-60 group-hover:opacity-100 transition-opacity uppercase tracking-widest">{item.desc}</span>}
                  </div>
                </div>
                {isActive ? (
                  <motion.div layoutId="activeHighlight" className="absolute left-0 w-1.5 h-8 bg-white rounded-r-full" />
                ) : (
                  <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom Section */}
      <div className="p-6 mt-auto relative z-10">
        <div className="p-6 rounded-[2rem] bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900/50 border border-slate-100 dark:border-slate-800 relative overflow-hidden group">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20 shadow-inner">
                <ShieldCheck size={20} />
              </div>
              <div>
                <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Protocol 9</span>
                <p className="text-[9px] text-emerald-600 font-bold uppercase tracking-widest mt-0.5">HIPAA Active</p>
              </div>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              Real-time AES-256 node encryption active for session.
            </p>
          </div>
          <Zap size={60} className="absolute bottom-[-10px] right-[-10px] text-primary/5 -rotate-12 group-hover:scale-110 transition-transform duration-700" />
        </div>
        
        {/* User Profile */}
        <NavLink to="/profile" className="mt-8 flex items-center gap-4 px-2 py-3 border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-2xl transition-all">
          <div className="relative">
            <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-2xl object-cover border-2 border-primary/20 shadow-lg" />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white dark:border-[#111621]"></div>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-black text-slate-900 dark:text-white truncate tracking-tight">{user.name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
               <span className="text-[9px] text-primary font-black uppercase tracking-[0.2em]">{user.role}</span>
            </div>
          </div>
        </NavLink>
      </div>

      {/* Background Decor */}
      <div className="absolute top-1/2 left-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none translate-x-[-50%]"></div>
    </aside>
  );
};

export default Sidebar;
