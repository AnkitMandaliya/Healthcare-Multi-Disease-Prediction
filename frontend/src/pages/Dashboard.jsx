import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Users, 
  AlertTriangle, 
  CheckCircle2, 
  Brain,
  Activity,
  ChevronRight,
  Info,
  PlayCircle
} from 'lucide-react';
import CustomSelect from '../components/ui/CustomSelect';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { checkHealth, fetchStats } from '../services/api';
import { exportToPDF } from '../services/pdfService';

const KPICard = ({ title, value, change, icon: Icon, trend, colorClass }) => (
  <motion.div 
    whileHover={{ y: -4 }}
    className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 transition-all"
  >
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-2xl ${colorClass || 'bg-primary/10 text-primary'} shadow-inner border border-current/10`}>
        <Icon size={22} />
      </div>
      <div className={`flex items-center gap-1 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${
        trend === 'up' ? 'bg-emerald-500/10 text-emerald-500' : (trend === 'down' ? 'bg-red-500/10 text-red-500' : 'bg-slate-500/10 text-slate-500')
      }`}>
        {change}
      </div>
    </div>
    <p className="text-slate-400 dark:text-slate-200 text-[10px] font-black uppercase tracking-[0.2em]">{title}</p>
    <h3 className="text-3xl font-black mt-2 dark:text-white tracking-tight uppercase">{value}</h3>
  </motion.div>
);

const Dashboard = () => {
  const { notifications } = useAuth();
  const [healthData, setHealthData] = useState(null);

  const [statsData, setStatsData] = useState(null);

  useEffect(() => {
    const fetchDashboardContent = async () => {
      try {
        const [health, stats] = await Promise.all([
           checkHealth(),
           fetchStats('diabetes') // Use diabetes as the default operational context
        ]);
        setHealthData(health);
        setStatsData(stats);
      } catch (err) {
        console.error("Dashboard data sync failed", err);
      }
    };
    fetchDashboardContent();
  }, []);

  const lineData = statsData?.lineData || [];

  const pieData = statsData?.distribution || [
    { name: 'Low Risk', value: 75 },
    { name: 'High Risk', value: 15 },
  ];

  const barData = statsData?.barData || [];

  const COLORS = ['#2463EB', '#EF4444'];

  const allInsights = statsData?.insights?.map((item, i) => ({
    id: i,
    title: item.title,
    text: item.text,
    category: item.category,
    icon: item.type === 'critical' ? AlertTriangle : Info,
    color: item.color
  })) || [];



  return (
    <div id="dashboard-content" className="space-y-10">
      {/* Top Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <h2 className="text-3xl font-black dark:text-white tracking-tight uppercase leading-none">Intelligence Command</h2>
           <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-3">Advanced risk orchestration and neural state monitoring.</p>
        </div>
        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 px-6 py-3 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
           <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
              <TrendingUp size={20} />
           </div>
           <div>
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-200 uppercase tracking-widest leading-none">System Efficiency</p>
              <p className="text-lg font-bold dark:text-white mt-1 leading-none">99.8%</p>
           </div>
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard title="Total Operational Volume" value={statsData?.live_volume?.toLocaleString() || "..."} change="LIVE" icon={Brain} trend="up" colorClass="bg-primary/10 text-primary" />
        <KPICard title="Critical Patient Flags" value={statsData?.critical_flags || "0"} change={`${statsData?.critical_flags > 0 ? 'ALERT' : 'SAFE'}`} icon={AlertTriangle} trend={statsData?.critical_flags > 0 ? 'down' : 'up'} colorClass="bg-red-500/10 text-red-500" />
        <KPICard title="Diagnostic Target Precision" value="99.8%" change="CLINICAL" icon={CheckCircle2} trend="up" colorClass="bg-emerald-500/10 text-emerald-500" />
        <KPICard title="Operational Nodes" value={healthData?.models_loaded?.length || '0'} change="ONLINE" icon={Users} trend="up" colorClass="bg-purple-500/10 text-purple-500" />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-8">
          {/* Main Chart */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 transition-colors">
            <div className="flex items-center justify-between mb-10">
              <div>
                 <h4 className="font-black text-lg dark:text-white uppercase tracking-tight">System Predictive Trends</h4>
                 <p className="text-xs text-slate-500 dark:text-slate-200 font-bold uppercase tracking-widest mt-1">Cross-Node Diagnostic Activity</p>
              </div>
              <CustomSelect 
                 options={[
                   { value: "30_days", label: "Session: Last 30 Days" },
                   { value: "6_months", label: "Session: Last 6 Months" }
                 ]}
                 value="30_days"
                 className="text-[10px] font-black uppercase tracking-widest bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-primary focus:ring-4 focus:ring-primary/5 dark:text-slate-400 py-2 px-4 shadow-sm outline-none transition-all w-[240px]"
                 containerClassName="w-auto z-50"
              />
            </div>
            <div className="h-80 w-full pr-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F033" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94A3B8', fontWeight: 700}} dy={15} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94A3B8', fontWeight: 700}} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1E293B', border: 'none', borderRadius: '1.5rem', color: '#fff', padding: '12px 16px', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ color: '#fff', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}
                  />
                  <Line type="monotone" dataKey="value" stroke="#2463EB" strokeWidth={5} dot={{ r: 5, fill: '#2463EB', strokeWidth: 3, stroke: '#fff' }} activeDot={{ r: 10, fill: '#2463EB', strokeWidth: 3, stroke: '#fff' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
             {/* Distribution Chart */}
             <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 transition-colors h-fit">
                <h4 className="font-black text-lg dark:text-white uppercase tracking-tight mb-8">Risk Stratification</h4>
                <div className="flex flex-col items-center">
                   <div className="h-56 w-56 relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={pieData} innerRadius={65} outerRadius={90} paddingAngle={8} dataKey="value">
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="outline-none" />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                         <span className="text-3xl font-black dark:text-white leading-none tracking-tighter">{statsData?.critical_flags || 0}</span>
                         <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Critical</span>
                      </div>
                   </div>
                   <div className="grid grid-cols-1 gap-2 mt-8 w-full">
                      {pieData.map((item, i) => (
                         <div key={item.name} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                               <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: COLORS[i]}}></div>
                               <span className="text-[11px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-tight">{item.name}</span>
                            </div>
                            <span className="text-xs font-bold dark:text-white">{item.value}%</span>
                         </div>
                      ))}
                   </div>
                </div>
             </div>

             {/* Metric Bars */}
             <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 transition-colors h-fit">
                <h4 className="font-black text-lg dark:text-white uppercase tracking-tight mb-8">Clinical Importance</h4>
                <div className="space-y-8">
                   {barData.map(item => (
                      <div key={item.name} className="space-y-3">
                         <div className="flex justify-between items-center px-1">
                             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{item.name}</span>
                             <span className="text-xs font-black text-primary">{item.value}%</span>
                         </div>
                         <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner p-0.5">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${item.value}%` }}
                              className="h-full bg-primary rounded-full shadow-lg shadow-primary/20"
                            />
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          </div>

        </div>

        {/* Neural Insights Panel */}
        <div className="space-y-8">
           <div className="bg-gradient-to-br from-primary to-blue-800 p-10 rounded-[2.5rem] shadow-2xl text-white relative overflow-hidden group">
              <div className="relative z-10 flex flex-col h-full">
                 <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-xl shadow-inner border border-white/10">
                       <Brain size={28} />
                    </div>
                    <div>
                       <h4 className="font-black text-xl leading-none tracking-tight uppercase">Neural Stream</h4>
                       <p className="text-[9px] font-black text-blue-200 uppercase tracking-[0.2em] mt-1.5">Model Cluster Active</p>
                    </div>
                 </div>
                 
                 <div className="space-y-5 mb-10 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {allInsights.map((insight) => (
                       <motion.div key={insight.id} whileHover={{ x: 5 }} className="bg-white/10 p-5 rounded-[1.5rem] backdrop-blur-xl border border-white/10 flex items-start gap-4 shadow-lg">
                          <insight.icon size={22} className={`${insight.color} shrink-0 mt-0.5 shadow-sm`} />
                          <div className="min-w-0">
                             <p className="text-[10px] font-black uppercase opacity-70 tracking-widest mb-1.5">{insight.title}</p>
                             <p className="text-xs leading-relaxed font-medium text-blue-50 opacity-90">{insight.text}</p>
                          </div>
                       </motion.div>
                    ))}
                 </div>
                 
                 <button 
                   onClick={() => exportToPDF('dashboard-content', 'diagnosis-summary.pdf')}
                   className="w-full py-5 bg-white text-primary font-black rounded-2xl hover:bg-blue-50 transition-all shadow-xl text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 active:scale-95"
                 >
                    <Activity size={18} /> Generate Neural Report
                 </button>
              </div>
              <Activity size={300} className="absolute top-[-50px] right-[-100px] opacity-[0.03] rotate-12 pointer-events-none group-hover:scale-110 transition-transform duration-1000" />
           </div>

           {/* Operational Stream */}
           <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 transition-colors">
              <h4 className="font-black text-sm dark:text-white uppercase tracking-[0.2em] mb-8 text-slate-400">Operational Log</h4>
              <div className="space-y-6">
                 {statsData?.logs && statsData.logs.length > 0 ? statsData.logs.map((log, idx) => (
                    <div key={idx} className="flex items-center gap-5 group cursor-pointer border-b border-slate-50 dark:border-slate-800 pb-5 last:border-0 last:pb-0">
                       <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border border-current/10 shadow-inner ${log.risk === 'High' ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                          <Activity size={22} />
                       </div>
                       <div className="flex-1 min-w-0">
                          <p className="text-sm font-black truncate dark:text-white uppercase tracking-tight group-hover:text-primary transition-colors">{log.title}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{log.time} • {log.sub}</p>
                       </div>
                    </div>
                 )) : (
                    <div className="text-center py-6 text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                       <p className="text-[10px] uppercase font-bold tracking-widest">No diagnostics generated yet.</p>
                       <p className="text-xs mt-1">Submit patient data via Neural Predict.</p>
                    </div>
                 )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
