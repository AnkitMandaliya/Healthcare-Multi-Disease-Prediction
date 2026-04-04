import { Link, useNavigate } from 'react-router-dom';
import { Bell, Menu, Sun, Moon, Sparkles, Filter, Settings, User } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';

const Navbar = ({ onMenuClick }) => {
  const { isDarkMode, toggleTheme } = useTheme();
  const { notifications, user } = useAuth();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#111621]/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 px-8 py-4 flex items-center justify-between transition-all duration-500">

      <div className="flex items-center gap-6">
        <button 
          onClick={onMenuClick}
          className="md:hidden p-3 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center gap-4 ml-6">
        {/* Appearance Toggle */}
        <button 
          onClick={toggleTheme}
          className="p-3 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all shadow-sm hover:shadow-md relative overflow-hidden group"
        >
          <div className="relative z-10">
            {isDarkMode ? <Sun size={20} className="group-hover:rotate-45 transition-transform" /> : <Moon size={20} className="group-hover:-rotate-12 transition-transform" />}
          </div>
          <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors"></div>
        </button>

        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className={`p-3 rounded-2xl relative transition-all shadow-sm hover:shadow-md overflow-hidden group ${
              isNotifOpen ? 'bg-primary/10 text-primary' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Bell size={20} className={isNotifOpen ? '' : 'group-hover:animate-swing'} />
            {notifications.length > 0 && (
              <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-primary rounded-full border-2 border-white dark:border-[#111621] shadow-sm animate-pulse"></span>
            )}
          </button>
          
          <AnimatePresence>
            {isNotifOpen && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-3 w-[calc(100vw-2rem)] sm:w-96 bg-white dark:bg-[#111621] border border-slate-200 dark:border-slate-800 rounded-[2rem] shadow-2xl overflow-hidden z-50 origin-top-right"
              >
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                  <div>
                    <h4 className="font-black text-sm dark:text-white uppercase tracking-tight">System Alerts</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Operational Nodes: High Priority</p>
                  </div>
                  <span className="text-[10px] font-black bg-primary/10 text-primary px-3 py-1 rounded-full uppercase tracking-widest animate-pulse">Live</span>
                </div>
                <div className="max-h-[min(400px,60vh)] overflow-y-auto custom-scrollbar">
                  {notifications.length > 0 ? notifications.map(notif => (
                    <div key={notif._id} className="p-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 border-b border-slate-50 dark:border-slate-800/50 last:border-0 cursor-pointer group transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-sm font-black text-slate-900 dark:text-white truncate group-hover:text-primary transition-colors uppercase tracking-tight">{notif.title}</p>
                        <span className="text-[10px] text-slate-400 font-bold whitespace-nowrap bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">{notif.time}</span>
                      </div>
                      <div className="mt-2 space-y-1">
                         <div className="flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full ${notif.type === 'warning' ? 'bg-rose-500' : 'bg-primary/50'}`}></div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{notif.patient || 'System'}</p>
                         </div>
                         <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed pl-3.5 multiline-truncate-2">
                            {notif.message}
                         </p>
                      </div>
                    </div>
                  )) : (
                    <div className="p-10 text-center text-slate-400">
                       <p className="text-[10px] font-black uppercase tracking-widest">No active alerts</p>
                    </div>
                  )}
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/30 text-center border-t border-slate-100 dark:border-slate-800">
                  <button className="text-xs font-black text-primary uppercase tracking-widest hover:underline decoration-2 underline-offset-4">Open Communication Hub</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile/Settings Quick Link */}
        <div className="h-10 w-px bg-slate-200 dark:bg-slate-800 mx-2 hidden lg:block"></div>
        
        <Link to="/profile" className="flex items-center gap-3 pl-2 group cursor-pointer lg:flex hidden">
           <div className="flex flex-col items-end">
              <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">{user.name}</p>
              <p className="text-[9px] font-bold text-primary uppercase tracking-[0.2em]">Verified Hub Lead</p>
           </div>
           <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center p-0.5 group-hover:border-primary transition-colors">
              <img src={user.avatar} alt="User" className="w-full h-full object-cover rounded-lg" />
           </div>
        </Link>
      </div>
    </header>
  );
};

export default Navbar;
