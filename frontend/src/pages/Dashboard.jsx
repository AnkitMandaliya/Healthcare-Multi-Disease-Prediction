import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Users, 
  AlertTriangle, 
  CheckCircle,
  Brain,
  Activity,
  ChevronRight,
  Info,
  PlayCircle,
  ShieldAlert,
  Zap
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { checkHealth, fetchStats } from '../services/api';

const KPICard = ({ title, value, change, icon: Icon, trend, colorClass, subtitle, progress = 70 }) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    whileHover={{ y: -5, scale: 1.02, transition: { duration: 0.2 } }}
    className="relative group bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl p-3 md:p-7 rounded-2xl md:rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/60 dark:border-white/10 overflow-hidden transition-all isolate"
  >
    {/* Animated glow orb behind card content */}
    <div className={`absolute -inset-8 opacity-0 group-hover:opacity-30 transition-opacity duration-700 blur-[30px] md:blur-[60px] -z-10 rounded-full ${colorClass?.includes('primary') ? 'bg-primary' : colorClass?.includes('emerald') ? 'bg-emerald-500' : 'bg-rose-500'}`} />
    
    <div className="absolute -top-4 -right-4 p-4 md:-top-6 md:-right-6 md:p-8 opacity-[0.02] dark:opacity-[0.03] group-hover:scale-125 group-hover:rotate-12 transition-all duration-700 pointer-events-none">
       <Icon className="w-16 h-16 md:w-36 md:h-36" />
    </div>
    
    <div className="flex items-center justify-between mb-3 md:mb-6 relative z-10">
      <div className={`p-2 md:p-3.5 rounded-xl md:rounded-2xl ${colorClass || 'bg-primary/10 text-primary'} shadow-inner border border-white/20 dark:border-white/5`}>
        <Icon className="w-4 h-4 md:w-6 md:h-6" />
      </div>
      <div className={`flex items-center gap-1 text-[9px] md:text-[11px] font-extrabold px-2.5 md:px-3.5 py-1 md:py-1.5 rounded-full uppercase tracking-widest backdrop-blur-md border ${
        trend === 'up' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' : (trend === 'down' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' : 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20')
      }`}>
        {trend === 'up' && <TrendingUp className="w-3 h-3 md:w-3.5 md:h-3.5" />}
        {change}
      </div>
    </div>

    <div className="relative z-10 flex flex-col gap-0.5 md:gap-1">
      <p className="text-slate-500 dark:text-slate-400 text-[9px] md:text-[11px] font-bold uppercase tracking-[0.25em]">{title}</p>
      <div className="flex items-baseline gap-2 mt-0.5 md:mt-1">
         <h3 className="text-xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">{value}</h3>
         {subtitle && <span className="text-[8px] md:text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{subtitle}</span>}
      </div>
      
      <div className="mt-3 md:mt-5 h-1 md:h-1.5 w-full bg-slate-100 dark:bg-slate-800/50 rounded-full overflow-hidden shadow-inner">
         <motion.div 
           initial={{ width: 0 }}
           animate={{ width: `${progress}%` }}
           className={`h-full rounded-full ${colorClass?.includes('text-primary') ? 'bg-gradient-to-r from-blue-600 to-primary' : (colorClass?.includes('text-emerald') ? 'bg-gradient-to-r from-emerald-600 to-emerald-400' : 'bg-gradient-to-r from-rose-600 to-rose-400')}`}
         />
      </div>
    </div>
  </motion.div>
);

const Dashboard = () => {
  const { notifications, user } = useAuth();
  const [healthData, setHealthData] = useState(null);
  const [statsData, setStatsData] = useState(null);
  const [activeMetric, setActiveMetric] = useState('volume');
  const carouselRef = useRef(null);

  useEffect(() => {
    let interval;
    // Auto-scroll logic for mobile KPI carousel
    if (window.innerWidth < 768) {
      interval = setInterval(() => {
        if (carouselRef.current) {
          const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
          const maxScroll = scrollWidth - clientWidth;
          
          if (scrollLeft >= maxScroll - 10) {
            carouselRef.current.scrollTo({ left: 0, behavior: 'smooth' });
          } else {
            carouselRef.current.scrollBy({ left: clientWidth * 0.8, behavior: 'smooth' });
          }
        }
      }, 3500);
    }
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchDashboardContent = async () => {
      try {
        const [health, stats] = await Promise.all([
           checkHealth(),
           fetchStats('all', 7)
        ]);
        setHealthData(health);
        setStatsData(stats);
      } catch (err) {
        console.error("Dashboard synchronization error:", err);
      }
    };
    fetchDashboardContent();
  }, []);

  const lineData = statsData?.lineData || [];
  const pieData = statsData?.distribution || [{ name: 'Normal', value: 100 }, { name: 'High Risk', value: 0 }];
  const barData = statsData?.barData || [];
  const COLORS = ['#2463EB', '#F43F5E', '#10B981', '#F59E0B'];

  // Global Page Animation Variants
  const pageVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.98 },
    show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } }
  };

  const allInsights = statsData?.insights?.map((item, i) => ({
    id: i,
    title: item.title,
    text: item.text,
    category: item.category,
    icon: item.type === 'critical' ? AlertTriangle : Info,
    color: item.type === 'critical' ? 'text-rose-500' : 'text-primary'
  })) || [];

  return (
    <div className="relative min-h-screen w-full max-w-[1600px] mx-auto space-y-2 md:space-y-10 pb-4 md:pb-10 px-2 md:px-0">
      {/* Ambient Background Glows */}
      <div className="fixed top-0 left-[10%] w-[60vw] h-[60vw] md:w-[600px] md:h-[600px] bg-primary/10 dark:bg-primary/20 rounded-full blur-[80px] md:blur-[120px] pointer-events-none -z-10 mix-blend-multiply dark:mix-blend-soft-light opacity-70"></div>
      <div className="fixed bottom-0 right-[-10%] w-[50vw] h-[50vw] md:w-[500px] md:h-[500px] bg-emerald-500/10 rounded-full blur-[80px] md:blur-[100px] pointer-events-none -z-10 mix-blend-multiply dark:mix-blend-soft-light opacity-50"></div>

      {/* Dynamic Header Section */}
      <div className="relative z-20 flex flex-col lg:flex-row lg:items-center justify-between gap-3 md:gap-8 bg-white/70 dark:bg-slate-900/60 p-3 md:p-8 rounded-2xl md:rounded-[3rem] border border-white/60 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-none backdrop-blur-2xl">
        <div className="space-y-1 md:space-y-2">
           <div className="flex items-center gap-2 md:gap-3">
              <span className="px-2 md:px-3 py-0.5 md:py-1 bg-primary/10 text-primary text-[8px] md:text-[10px] font-black uppercase tracking-widest rounded-full border border-primary/20">Live Intelligence</span>
              <div className="flex items-center gap-1.5 md:gap-2">
                 <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                 <span className="text-[8px] md:text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Network Secure</span>
              </div>
           </div>
            <h2 className="text-base md:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-tight">Neural Command <span className="text-primary">Center</span></h2>
            <p className="text-slate-500 dark:text-slate-400 text-[8px] md:text-sm font-medium">Monitoring clinical diagnostic streams for <span className="text-slate-900 dark:text-white font-bold">{user?.name || 'Personnel'}</span></p>
        </div>
        
         <div className="flex items-center gap-3 md:gap-4 w-full lg:w-auto justify-between lg:justify-end border-t lg:border-t-0 lg:border-l border-slate-100 dark:border-white/5 pt-3 md:pt-4 lg:pt-0 lg:pl-6">
            <div className="flex flex-col items-start lg:items-end pr-3 md:pr-6 border-r border-slate-200 dark:border-slate-800">
               <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Status</p>
               <p className="text-xs md:text-xl font-black text-emerald-500 uppercase tracking-tighter">Operational</p>
            </div>
            <div className="flex items-center gap-1.5 md:gap-2">
               <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-emerald-500 rounded-full animate-pulse"></div>
               <span className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest">Secure</span>
            </div>
         </div>
      </div>

      {/* Main Intelligence Grid */}
      <motion.div 
        variants={pageVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 lg:grid-cols-4 gap-3 md:gap-8"
      >
        
        {/* Left Column: Metrics & Main Stream */}
        <motion.div variants={pageVariants} className="lg:col-span-3 space-y-3 md:space-y-8">
          
          {/* KPI Grid - Horizontal Scroll on Mobile */}
          <div ref={carouselRef} className="flex overflow-x-auto pb-3 md:pb-0 -mx-2 px-2 md:mx-0 md:px-0 md:grid md:grid-cols-3 gap-2 md:gap-6 md:overflow-x-visible scrollbar-hide snap-x snap-mandatory scroll-smooth">
            <div className="w-[75vw] max-w-[280px] md:max-w-none shrink-0 snap-center md:w-auto">
              <KPICard 
                title="Total Diagnostics" 
                value={statsData?.live_volume?.toLocaleString() || "0"} 
                change={statsData?.live_volume > 0 ? `+${statsData.live_volume}` : "0"} 
                icon={Brain} 
                trend="up" 
                colorClass="bg-primary/10 text-primary" 
                subtitle="CYCLES"
                progress={statsData?.live_volume ? Math.min(100, Math.round((statsData.live_volume / 50) * 100)) : 0}
              />
            </div>
            <div className="w-[75vw] max-w-[280px] md:max-w-none shrink-0 snap-center md:w-auto">
              <KPICard 
                title="Critical Risk Flags" 
                value={statsData?.critical_flags || "0"} 
                change={statsData?.live_volume > 0 ? `${Math.round((statsData.critical_flags / statsData.live_volume) * 100)}%` : "0%"} 
                icon={ShieldAlert} 
                trend={statsData?.critical_flags > 0 ? "down" : "stable"} 
                colorClass="bg-rose-500/10 text-rose-500" 
                subtitle="ALERTS"
                progress={statsData?.live_volume > 0 ? Math.round((statsData.critical_flags / statsData.live_volume) * 100) : 0}
              />
            </div>
            <div className="w-[75vw] max-w-[280px] md:max-w-none shrink-0 snap-center md:w-auto">
              <KPICard 
                title="Network Nodes" 
                value={healthData?.models_loaded?.length || '0'} 
                change="ACTIVE" 
                icon={Users} 
                trend="up" 
                colorClass="bg-emerald-500/10 text-emerald-500" 
                subtitle="ACTIVE"
                progress={healthData?.models_loaded ? Math.round((healthData.models_loaded.length / 3) * 100) : 0}
              />
            </div>
          </div>

          {/* Primary Visualization Hub */}
          <motion.div variants={itemVariants} className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl p-3 md:p-8 rounded-2xl md:rounded-[3rem] border border-white/60 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none relative overflow-hidden isolate">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 md:gap-6 mb-4 md:mb-10 relative z-10">
              <div>
                 <h4 className="font-black text-sm md:text-2xl text-slate-900 dark:text-white uppercase tracking-tight">Diagnostic Flow Dynamics</h4>
                 <p className="text-[8px] md:text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-0.5 md:mt-1">Real-time prediction throughput vs critical events</p>
              </div>
              <div className="flex flex-wrap items-center gap-2 md:gap-6 bg-slate-50/50 dark:bg-white/5 p-2 md:p-4 rounded-xl md:rounded-3xl border border-slate-100 dark:border-white/5 shadow-inner">
                 {/* Metric Stream */}
                 <div className="flex items-center gap-2 md:gap-3">
                    <span className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Stream</span>
                    <div className="flex bg-slate-200/50 dark:bg-slate-800/50 p-0.5 md:p-1 rounded-lg md:rounded-xl border border-slate-200 dark:border-white/10 shadow-inner">
                       {['volume', 'criticality'].map(m => (
                         <button 
                           key={m}
                           onClick={() => setActiveMetric(m)}
                           className={`px-3 md:px-6 py-1 md:py-2 rounded-md md:rounded-lg text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all ${activeMetric === m ? 'bg-white dark:bg-slate-700 text-primary dark:text-white shadow-lg scale-105' : 'text-slate-400 hover:text-slate-700'}`}
                         >
                           {m}
                         </button>
                       ))}
                    </div>
                 </div>
              </div>
            </div>

            <div className="h-[120px] md:h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart key={`global-${activeMetric}`} data={lineData}>
                  <defs>
                    <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2463EB" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#2463EB" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F022" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 10, fill: '#64748B', fontWeight: 800}} 
                    dy={15}
                    interval={0}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 10, fill: '#64748B', fontWeight: 800}} 
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0F172A', border: 'none', borderRadius: '1.5rem', color: '#fff', padding: '16px', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.5)' }}
                    itemStyle={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', color: '#38BDF8' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey={activeMetric === 'volume' ? 'value' : 'criticality'} 
                    stroke={activeMetric === 'volume' ? '#2463EB' : '#F43F5E'} 
                    strokeWidth={6} 
                    dot={{ r: 6, fill: activeMetric === 'volume' ? '#2463EB' : '#F43F5E', strokeWidth: 4, stroke: '#fff' }} 
                    activeDot={{ r: 8, fill: activeMetric === 'volume' ? '#2463EB' : '#F43F5E', strokeWidth: 3, stroke: '#fff' }} 
                    animationDuration={2000}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-8">
             {/* Risk Distribution Bento Card */}
             <div className="bg-white dark:bg-slate-900/60 p-3 md:p-10 rounded-xl md:rounded-[3rem] border border-slate-100 dark:border-white/5 shadow-xl">
                <div className="flex items-center justify-between mb-4 md:mb-8">
                   <h4 className="font-black text-sm md:text-lg text-slate-900 dark:text-white uppercase tracking-tight">Risk Stratification</h4>
                   <AlertTriangle className="text-slate-200 dark:text-slate-800 w-4 h-4 md:w-6 md:h-6" />
                </div>
                <div className="flex flex-col items-center">
                   <div className="h-28 w-28 md:h-64 md:w-64 relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={pieData} innerRadius="50%" outerRadius="80%" paddingAngle={10} dataKey="value">
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                         <span className="text-xl md:text-4xl font-black text-slate-900 dark:text-white leading-none tracking-tighter">{pieData[1]?.value || 0}%</span>
                         <span className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5 md:mt-1">HIGH RISK</span>
                      </div>
                   </div>
                   <div className="grid grid-cols-2 gap-2 md:gap-4 mt-4 md:mt-10 w-full">
                      {pieData.map((item, i) => (
                         <div key={item.name} className="p-2 md:p-4 rounded-xl md:rounded-3xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-white/5">
                            <div className="flex items-center gap-1 md:gap-2 mb-0.5 md:mb-1">
                               <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full" style={{backgroundColor: COLORS[i]}}></div>
                               <span className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.name}</span>
                            </div>
                            <span className="text-sm md:text-xl font-black text-slate-900 dark:text-white">{item.value}%</span>
                         </div>
                      ))}
                   </div>
                </div>
             </div>

             {/* Clinical Importance Bento Card */}
             <div className="bg-white dark:bg-slate-900/60 p-3 md:p-10 rounded-xl md:rounded-[3rem] border border-slate-100 dark:border-white/5 shadow-xl">
                <div className="flex items-center justify-between mb-4 md:mb-8">
                   <h4 className="font-black text-sm md:text-lg text-slate-900 dark:text-white uppercase tracking-tight">Neural Priority</h4>
                   <Zap className="text-slate-200 dark:text-slate-800 w-4 h-4 md:w-6 md:h-6" />
                </div>
                <div className="space-y-3 md:space-y-8">
                   {barData.length > 0 ? barData.map((item, idx) => (
                      <div key={item.name} className="space-y-1.5 md:space-y-3">
                         <div className="flex justify-between items-end">
                             <div className="space-y-0.5 md:space-y-1">
                                <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-slate-400">P-VALUE {idx + 1}</span>
                                <h5 className="text-[10px] md:text-xs font-bold text-slate-900 dark:text-white uppercase tracking-tight">{item.name}</h5>
                             </div>
                             <span className="text-xs md:text-sm font-black text-primary">{item.value}%</span>
                         </div>
                         <div className="h-2 md:h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden p-0.5 md:p-1 shadow-inner">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${item.value}%` }}
                              transition={{ duration: 1.5, ease: "easeOut" }}
                              className="h-full bg-gradient-to-r from-primary to-blue-400 rounded-xl shadow-lg"
                            />
                         </div>
                      </div>
                   )) : (
                      <div className="py-10 md:py-20 text-center opacity-30">
                         <p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest">Awaiting Metric Stream...</p>
                      </div>
                   )}
                </div>
             </div>
          </motion.div>
        </motion.div>

        {/* Right Column: Insights & Logs */}
        <motion.div variants={pageVariants} className="space-y-3 md:space-y-8">
           
           {/* Neural Insight Stream */}
           <div className="bg-gradient-to-br from-slate-900 to-blue-900 p-3 md:p-8 rounded-xl md:rounded-[3rem] shadow-2xl relative overflow-hidden">
              <div className="relative z-10">
                 <div className="flex items-center gap-2 md:gap-4 mb-4 md:mb-8">
                    <div className="p-1.5 md:p-3 bg-white/10 rounded-lg md:rounded-2xl backdrop-blur-xl border border-white/10 shadow-lg">
                       <Brain className="text-white w-4 h-4 md:w-6 md:h-6" />
                    </div>
                    <h4 className="font-black text-sm md:text-lg text-white uppercase tracking-tight">Neural Stream</h4>
                 </div>
                 
                 <div className="space-y-2 md:space-y-4 max-h-[180px] md:max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
                    {allInsights.map((insight, idx) => (
                       <motion.div 
                         key={insight.id} 
                         initial={{ opacity: 0, x: 20 }}
                         animate={{ opacity: 1, x: 0 }}
                         transition={{ delay: idx * 0.1 }}
                         className="bg-white/5 hover:bg-white/10 p-3 md:p-5 rounded-xl md:rounded-3xl border border-white/10 transition-all cursor-default"
                       >
                          <div className="flex items-center gap-2 md:gap-3 mb-1 md:mb-2">
                             <insight.icon className={`${insight.color} w-3 h-3 md:w-4 md:h-4`} />
                             <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-blue-200/60">{insight.title}</span>
                          </div>
                          <p className="text-[9px] md:text-xs leading-relaxed text-blue-50/80 font-medium">{insight.text}</p>
                       </motion.div>
                    ))}
                 </div>
                 
                   <button 
                   onClick={() => {
                     const btn = document.activeElement;
                     const originalText = btn.innerText;
                     btn.innerText = "SCANNING NODE...";
                     btn.disabled = true;
                     setTimeout(() => {
                        btn.innerText = "AUDIT COMPLETE";
                        setTimeout(() => {
                           btn.innerText = originalText;
                           btn.disabled = false;
                        }, 2000);
                     }, 3000);
                   }}
                   className="w-full mt-4 md:mt-8 py-3 md:py-5 bg-white text-slate-900 font-black rounded-xl md:rounded-2xl hover:bg-blue-50 transition-all shadow-xl text-[10px] md:text-xs uppercase tracking-widest disabled:opacity-50"
                 >
                    Initialize Full Audit
                 </button>
              </div>
              <Activity className="absolute bottom-[-100px] right-[-100px] text-white opacity-[0.03]" size={400} />
           </div>

           {/* System Announcements */}
           <div className="bg-white dark:bg-slate-900/60 p-3 md:p-8 rounded-xl md:rounded-[3rem] border border-slate-100 dark:border-white/5 shadow-xl">
              <div className="flex items-center justify-between mb-3 md:mb-8">
                 <h4 className="font-black text-[10px] md:text-sm text-slate-900 dark:text-white uppercase tracking-widest">Broadcast Log</h4>
                 <div className="flex items-center gap-1 md:gap-2">
                    <div className="w-1 h-1 md:w-1.5 md:h-1.5 bg-rose-500 rounded-full animate-ping"></div>
                    <span className="text-[8px] md:text-[10px] font-black text-rose-500 uppercase tracking-widest">LIVE</span>
                 </div>
              </div>
              <div className="space-y-2 md:space-y-4 max-h-[150px] md:max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                 {notifications && notifications.length > 0 ? notifications.map((notif, idx) => {
                    const styles = {
                      info: { color: 'text-primary', bg: 'bg-primary/5', icon: Info },
                      success: { color: 'text-emerald-500', bg: 'bg-emerald-500/5', icon: CheckCircle },
                      warning: { color: 'text-rose-500', bg: 'bg-rose-500/5', icon: AlertTriangle }
                    };
                    const config = styles[notif.type] || styles.info;
                    const Icon = config.icon;

                    return (
                      <motion.div 
                        key={notif._id || idx} 
                        className={`p-3 md:p-5 rounded-xl md:rounded-3xl border border-slate-100 dark:border-white/5 ${config.bg} transition-all`}
                      >
                         <div className="flex justify-between items-start mb-1 md:mb-2">
                            <div className="flex items-center gap-1.5 md:gap-2">
                               <Icon className={`${config.color} w-3 h-3 md:w-3.5 md:h-3.5`} />
                               <h5 className={`text-[10px] md:text-xs font-black uppercase tracking-tight ${config.color}`}>{notif.title}</h5>
                            </div>
                            <span className="text-[7px] md:text-[9px] font-bold text-slate-400 uppercase">
                               {notif.timestamp ? new Date(notif.timestamp).toLocaleDateString() : 'RECENT'}
                            </span>
                         </div>
                         <p className="text-[9px] md:text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed font-medium line-clamp-2">{notif.message}</p>
                      </motion.div>
                    );
                 }) : (
                    <div className="py-6 md:py-10 text-center opacity-30">
                       <Info className="mx-auto mb-2 md:mb-3 w-6 h-6 md:w-10 md:h-10" />
                       <p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest">No Alerts Broadcasted</p>
                    </div>
                 )}
              </div>
            </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Dashboard;
