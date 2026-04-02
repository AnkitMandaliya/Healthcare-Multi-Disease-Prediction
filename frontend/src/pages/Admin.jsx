import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Activity, 
  ShieldAlert, 
  Bell, 
  Search, 
  Filter, 
  Trash2,
  Clock,
  Database,
  UserCheck,
  Zap,
  ArrowRight
} from 'lucide-react';
import api from '../services/api';

const Admin = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardData, setDashboardData] = useState(null);
  const [users, setUsers] = useState([]);
  const [inferences, setInferences] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [newNotice, setNewNotice] = useState({ title: '', message: '', type: 'info' });
  const [aiStats, setAiStats] = useState(null);
  const [models, setModels] = useState([]);
  const [activeModel, setActiveModel] = useState('');
  const [updatingModel, setUpdatingModel] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ show: false, userId: null });

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAdminData();
    }, 500); // 500ms delay
    return () => clearTimeout(timer);
  }, [searchQuery, roleFilter, activeTab]);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'overview') {
        const dbResponse = await api.get('/api/admin/dashboard');
        setDashboardData(dbResponse.data);
      } else if (activeTab === 'users') {
        const usersResponse = await api.get(`/api/admin/users?search=${searchQuery}&role=${roleFilter}`);
        setUsers(usersResponse.data);
      } else if (activeTab === 'inferences') {
        const infResponse = await api.get(`/api/admin/inferences?search=${searchQuery}`);
        setInferences(infResponse.data);
      } else if (activeTab === 'broadcast') {
        const notifsResponse = await api.get('/api/admin/notifications');
        setNotifications(notifsResponse.data);
      } else if (activeTab === 'ai') {
        const [statsRes, modelsRes] = await Promise.all([
          api.get('/api/admin/ai-stats'),
          api.get('/api/admin/models')
        ]);
        setAiStats(statsRes.data);
        setModels(modelsRes.data.models);
        setActiveModel(modelsRes.data.active);
      }
    } catch (err) {
      console.error("Admin Access Error", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (id, newRole) => {
    try {
      await api.put(`/api/admin/users/${id}`, { role: newRole });
      fetchAdminData();
    } catch (err) {
      console.error("Role update failure", err);
      alert("Unauthorized node modification or connection error.");
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteModal.userId) return;
    try {
      await api.delete(`/api/admin/users/${deleteModal.userId}`);
      setDeleteModal({ show: false, userId: null });
      fetchAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  const sendAnnouncement = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/admin/notifications', newNotice);
      setNewNotice({ title: '', message: '', type: 'info' });
      fetchAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleModelChange = async (modelId) => {
    setUpdatingModel(true);
    try {
      await api.put('/api/admin/active-model', { model_id: modelId });
      setActiveModel(modelId);
      fetchAdminData();
    } catch (err) {
      console.error("Failed to switch node", err);
    } finally {
      setUpdatingModel(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, subtitle, delay = 0 }) => (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ y: -5 }}
      className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-md flex items-center justify-between group hover:border-primary/30 hover:shadow-xl transition-all duration-500"
    >
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{title}</p>
        <h3 className="text-3xl font-black dark:text-white tabular-nums group-hover:text-primary transition-colors">{value}</h3>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight mt-1">{subtitle}</p>
      </div>
      <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center text-white shadow-lg group-hover:rotate-12 transition-transform`}>
        <Icon size={24} />
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-10">
      {/* Header Overlay */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm backdrop-blur-xl">
        <div>
          <h1 className="text-3xl font-black dark:text-white uppercase tracking-tighter leading-none">Command Hub</h1>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-2 flex items-center">
             <div className="w-2 h-2 bg-primary rounded-full mr-3 animate-pulse"></div>
             Security Tier: Level 3 Administrator 
          </p>
        </div>
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl gap-1 flex-wrap">
           {['overview', 'users', 'inferences', 'broadcast', 'ai'].map(tab => (
             <button
               key={tab}
               onClick={() => { setActiveTab(tab); setSearchQuery(''); }}
               className={`px-5 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                 activeTab === tab ? 'bg-white dark:bg-slate-900 text-primary shadow-sm scale-105' : 'text-slate-500 hover:text-slate-800'
               }`}
             >
               {tab}
             </button>
           ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'overview' && dashboardData && (
          <motion.div 
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-10"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard title="Total Nodes" value={dashboardData.stats.total_users} icon={Users} color="bg-indigo-500" subtitle="Authorized Clinicians" delay={0.1} />
              <StatCard title="Neural Tasks" value={dashboardData.stats.total_predictions} icon={Activity} color="bg-rose-500" subtitle="Real-time Inferences" delay={0.2} />
              <StatCard title="Risk Flags" value={dashboardData.stats.risked_cases} icon={ShieldAlert} color="bg-amber-500" subtitle="Anomalies Detected" delay={0.3} />
              <StatCard title="Remaining Power" value={Math.max(0, 1500 - dashboardData.stats.total_predictions)} icon={Zap} color="bg-emerald-500" subtitle="Quota Baki Units" delay={0.4} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden">
                 <div className="px-6 py-5 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800">
                    <h2 className="text-xl font-black dark:text-white uppercase tracking-tight">Recent Activity Stream</h2>
                    <Activity className="text-primary" size={20} />
                 </div>
                 <div className="p-4 space-y-3 overflow-y-auto max-h-[400px] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 dark:[&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full pr-2">
                    {dashboardData.recent.map((p, idx) => (
                      <motion.div 
                        key={idx} 
                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + idx * 0.05 }}
                        className="flex items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl hover:bg-white dark:hover:bg-slate-800 transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-700 hover:shadow-sm"
                      >
                         <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                               p.risk_level === 'High' ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'
                            }`}>
                               <Activity size={18} />
                            </div>
                            <div>
                               <p className="text-xs font-black dark:text-white uppercase tracking-tight">{p.disease}</p>
                               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{p.email}</p>
                            </div>
                         </div>
                         <div className="text-right">
                            <p className={`text-[10px] font-black uppercase tracking-widest ${
                               p.risk_level === 'High' ? 'text-red-500' : 'text-emerald-500'
                            }`}>{p.risk_level} RISK</p>
                            <p className="text-[9px] font-bold text-slate-500 mt-0.5">{new Date(p.timestamp).toLocaleTimeString()}</p>
                         </div>
                      </motion.div>
                    ))}
                 </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xl p-6">
                 <h2 className="text-xl font-black dark:text-white uppercase tracking-tight mb-6 mt-2 text-center">Neural Load Distribution</h2>
                 <div className="space-y-6 overflow-y-auto max-h-[400px] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 dark:[&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full pr-2">
                    {dashboardData.spread.map((item, idx) => (
                      <motion.div 
                        key={idx}
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + idx * 0.1 }}
                        className="space-y-2"
                      >
                         <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">
                            <span>{item._id} Target</span>
                            <span className="text-primary">{Math.round((item.count / dashboardData.stats.total_predictions) * 100)}%</span>
                         </div>
                         <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 shadow-inner">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${(item.count / dashboardData.stats.total_predictions) * 100}%` }}
                              transition={{ duration: 1, delay: 0.3 + idx * 0.1 }}
                              className={`h-full rounded-full shadow-md ${idx === 0 ? 'bg-primary' : idx === 1 ? 'bg-indigo-400' : 'bg-emerald-400'}`}
                            />
                         </div>
                      </motion.div>
                    ))}
                 </div>
              </div>
            </div>
          </motion.div>
        )}

        {(activeTab === 'users' || activeTab === 'inferences') && (
          <motion.div 
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden"
          >
            <div className="px-6 py-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
               <div>
                 <h2 className="text-xl font-black dark:text-white uppercase tracking-tight">{activeTab === 'users' ? 'Clinician Registry' : 'Neural Inference Logs'}</h2>
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-1">Historical Node State & Tracking</p>
               </div>
               <div className="flex flex-col md:flex-row gap-4 w-full">
                 <div className="relative flex-1">
                   <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                   <input 
                     type="text" 
                     placeholder={`Live search ${activeTab}...`} 
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800 rounded-xl text-xs font-black uppercase outline-none focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-slate-300" 
                   />
                 </div>
                 
                 {activeTab === 'users' && (
                   <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
                     {['all', 'admin', 'clinician', 'doctor', 'patient'].map((r) => (
                       <button
                         key={r}
                         onClick={() => setRoleFilter(r)}
                         className={`px-4 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${
                           roleFilter === r 
                             ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105' 
                             : 'bg-white dark:bg-slate-900 text-slate-400 border-slate-100 dark:border-slate-800 hover:border-slate-200'
                         }`}
                       >
                         {r}
                       </button>
                     ))}
                   </div>
                 )}
               </div>
            </div>

            <div className="overflow-auto max-h-[550px] custom-scrollbar relative">
               <table className="w-full">
                 <thead className="sticky top-0 z-10">
                   <tr className="text-left bg-white dark:bg-slate-900 shadow-sm border-b border-slate-100 dark:border-slate-800">
                     {activeTab === 'users' ? (
                       <>
                         <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Medical Identity</th>
                         <th className="px-4 py-4 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Tier</th>
                         <th className="px-4 py-4 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Encryption State</th>
                         <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] text-right">Protocol</th>
                       </>
                     ) : (
                       <>
                         <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Diagnostic Link</th>
                         <th className="px-4 py-4 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Confidence</th>
                         <th className="px-4 py-4 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Risk Grade</th>
                         <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] text-right">Timestamp</th>
                       </>
                     )}
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                    {activeTab === 'users' ? users.map((u, idx) => (
                      <motion.tr 
                        key={u._id} 
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group"
                      >
                        <td className="px-6 py-4">
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-gradient-to-br from-primary to-indigo-600 rounded-xl flex items-center justify-center font-black text-white shadow-md group-hover:scale-110 transition-transform text-xs">
                                 {u.name.substring(0,1)}
                              </div>
                              <div>
                                 <p className="text-xs font-black dark:text-white uppercase tracking-tight">{u.name}</p>
                                 <p className="text-[9px] font-bold text-slate-500 lowercase tracking-tight">{u.email}</p>
                              </div>
                           </div>
                        </td>
                        <td className="px-4 py-4">
                           <select 
                             value={u.role} 
                             onChange={(e) => handleUpdateRole(u._id, e.target.value)}
                             disabled={u.role === 'admin'}
                             className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest outline-none border-none cursor-pointer focus:ring-2 focus:ring-primary/20 transition-all ${
                               u.role === 'admin' ? 'bg-primary text-white shadow-sm shadow-primary/20' : 'bg-indigo-100 text-indigo-500 hover:bg-indigo-200'
                             }`}
                           >
                              <option value="admin">Admin</option>
                              <option value="clinician">Clinician</option>
                              <option value="doctor">Doctor</option>
                              <option value="patient">Patient</option>
                           </select>
                        </td>
                        <td className="px-4 py-4 text-[10px] text-slate-500 font-bold uppercase tracking-tight">
                           <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-sm shadow-emerald-500/50"></div>
                              <span className="text-emerald-500">Secure Node</span>
                           </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                           {u.role !== 'admin' && (
                             <button 
                               onClick={() => setDeleteModal({ show: true, userId: u._id })}
                               className="p-2 bg-red-50 text-red-400 hover:bg-red-500 hover:text-white transition-all rounded-lg shadow-sm active:scale-90"
                             >
                                <Trash2 size={16} />
                             </button>
                           )}
                        </td>
                      </motion.tr>
                    )) : inferences.map((inf, idx) => (
                       <motion.tr 
                         key={inf._id} 
                         initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                         className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all font-medium"
                       >
                         <td className="px-6 py-4">
                           <p className="text-xs font-black dark:text-white uppercase tracking-tight">{inf.disease}</p>
                           <p className="text-[9px] font-bold text-slate-400 lowercase">{inf.email}</p>
                         </td>
                         <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                               <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden w-16">
                                  <div className="h-full bg-primary" style={{ width: `${inf.probability * 100}%` }}></div>
                               </div>
                               <span className="text-[9px] font-black text-primary">{(inf.probability * 100).toFixed(1)}%</span>
                            </div>
                         </td>
                         <td className="px-4 py-4">
                            <span className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                              inf.risk_level === 'High' ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'
                            }`}>
                               {inf.risk_level}
                            </span>
                         </td>
                         <td className="px-6 py-4 text-right text-[9px] font-black text-slate-500 uppercase tracking-widest font-mono">
                            {new Date(inf.timestamp).toLocaleString()}
                         </td>
                       </motion.tr>
                    ))}
                 </tbody>
               </table>
               {(activeTab === 'users' ? users : inferences).length === 0 && (
                 <div className="text-center py-16 bg-white dark:bg-slate-900">
                    <Database size={48} className="mx-auto text-slate-100 dark:text-slate-800 mb-4 drop-shadow-sm" />
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.4em]">No matching neural entities found</p>
                 </div>
               )}
            </div>
          </motion.div>
        )}

        {activeTab === 'broadcast' && (
          <motion.div 
            key="broadcast"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          >
             <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:rotate-12 group-hover:scale-110 transition-all duration-700 pointer-events-none">
                   <Bell size={120} />
                </div>
                <h2 className="text-xl font-black dark:text-white uppercase tracking-tight mb-6 relative">Global Broadcast</h2>
                <form onSubmit={sendAnnouncement} className="space-y-6 relative">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Protocol Title</label>
                      <input 
                        required 
                        className="w-full p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-xl text-xs font-black dark:text-white focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:opacity-30"
                        placeholder="Neural Cluster Update..."
                        value={newNotice.title}
                        onChange={(e) => setNewNotice({...newNotice, title: e.target.value})}
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Directive Payload</label>
                      <textarea 
                        required 
                        rows={5}
                        className="w-full p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-xl text-xs font-black dark:text-white focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:opacity-30"
                        placeholder="Security protocols initialized..."
                        value={newNotice.message}
                        onChange={(e) => setNewNotice({...newNotice, message: e.target.value})}
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Criticality Tier</label>
                      <div className="grid grid-cols-3 gap-3">
                         {['info', 'success', 'warning'].map(type => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => setNewNotice({...newNotice, type})}
                              className={`py-3 rounded-lg border text-[9px] font-black uppercase tracking-widest transition-all ${
                                newNotice.type === type ? 'bg-primary text-white border-primary shadow-md scale-105' : 'border-slate-100 dark:border-slate-700 text-slate-400 hover:border-slate-300'
                              }`}
                            >
                              {type}
                           </button>
                         ))}
                      </div>
                   </div>
                   <button className="w-full py-4 bg-primary text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:translate-y-[-2px] active:scale-95 transition-all flex items-center justify-center gap-3">
                      Initialize Transmission <ArrowRight size={16} />
                   </button>
                </form>
             </div>

             <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-xl overflow-y-auto max-h-[750px] custom-scrollbar">
                <h2 className="text-xl font-black dark:text-white uppercase tracking-tight mb-6">Broadcast Log</h2>
                <div className="space-y-4">
                   {notifications.map((n, idx) => (
                     <motion.div 
                       key={idx} 
                       initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}
                       className="p-5 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-100 dark:border-slate-800 group hover:border-primary/20 transition-all hover:shadow-sm"
                     >
                        <div className="flex justify-between items-start mb-3">
                           <div className="flex items-center gap-3">
                              <div className={`w-2.5 h-2.5 rounded-full ${
                                n.type === 'warning' ? 'bg-amber-500 animate-pulse' : n.type === 'success' ? 'bg-emerald-500' : 'bg-primary'
                              }`} />
                              <h3 className="text-sm font-black dark:text-white uppercase tracking-tight">{n.title}</h3>
                           </div>
                           <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{new Date(n.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-xs font-medium text-slate-500 leading-relaxed italic">"{n.message}"</p>
                     </motion.div>
                   ))}
                   {notifications.length === 0 && (
                     <div className="text-center py-20 opacity-20">
                        <Bell size={64} className="mx-auto mb-4" />
                        <p className="text-[10px] font-black uppercase tracking-[0.5em]">Log Vault Empty</p>
                     </div>
                   )}
                </div>
             </div>
          </motion.div>
        )}
        {activeTab === 'ai' && aiStats && (
          <motion.div 
            key="ai"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-10"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard title="Total Requests" value={aiStats?.total || 0} icon={Activity} color="bg-primary" subtitle="Historical Volume" delay={0.1} />
              <StatCard title="Success Nodes" value={aiStats?.success || 0} icon={UserCheck} color="bg-emerald-500" subtitle="Authorized Responses" delay={0.2} />
              <StatCard title="Quota Baki" value={Math.max(0, 1500 - (aiStats?.total || 0))} icon={Database} color="bg-indigo-500" subtitle="Requests Remaining" delay={0.3} />
              <StatCard 
                 title="Failure Rate" 
                 value={aiStats?.total > 0 ? (((aiStats?.failed || 0) / aiStats.total) * 100).toFixed(1) + '%' : '0.0%'} 
                 icon={ShieldAlert} 
                 color="bg-rose-500" 
                 subtitle="System Blockages" 
                 delay={0.4} 
              />
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden p-10 flex flex-col md:flex-row gap-12 items-center">
               <div className="flex-1 space-y-4">
                  <h2 className="text-2xl font-black dark:text-white uppercase tracking-tighter">AI Node Orchestration</h2>
                  <p className="text-sm text-slate-500 leading-relaxed font-medium">Select the primary clinical inference engine for the entire diagnostic network. Free-tier models may experience varying latency and quota limits.</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                     {models.map(m => (
                        <button
                          key={m.id}
                          onClick={() => handleModelChange(m.id)}
                          disabled={updatingModel}
                          className={`p-6 rounded-2xl border-2 transition-all text-left flex flex-col gap-2 group relative overflow-hidden ${
                            activeModel === m.id 
                              ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10' 
                              : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/20'
                          }`}
                        >
                           {activeModel === m.id && (
                             <motion.div 
                               layoutId="active-indicator"
                               className="absolute top-0 right-0 p-2 bg-primary text-white rounded-bl-xl z-10"
                             >
                                <Zap size={14} fill="white" />
                             </motion.div>
                           )}
                           <span className={`text-[9px] font-black uppercase tracking-widest ${activeModel === m.id ? 'text-primary' : 'text-slate-400'}`}>
                             {activeModel === m.id ? "PRIMARY NODE ACTIVE" : "AVAILABLE CLUSTER"}
                           </span>
                           <h4 className="text-md font-black dark:text-white uppercase tracking-tight">{m.name}</h4>
                           <p className="text-[10px] font-bold text-slate-500 group-hover:text-slate-700 transition-colors">{m.id}</p>
                        </button>
                     ))}
                  </div>
               </div>

               <div className="w-full md:w-80 bg-slate-50 dark:bg-slate-800/30 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center space-y-6">
                  <div className="w-24 h-24 bg-primary/10 text-primary rounded-full flex items-center justify-center shadow-inner">
                     <Database size={40} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black dark:text-white uppercase tracking-tight">Fleet Health</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Real-time Node Monitoring</p>
                  </div>
                  <div className="w-full space-y-4">
                     <div className="flex justify-between items-center px-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Stability</span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">98.4%</span>
                     </div>
                     <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: '98.4%' }} className="h-full bg-emerald-500" />
                     </div>

                     <div className="flex justify-between items-center px-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Quota Baki</span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                          {Math.round((Math.max(0, 1500 - (aiStats?.total || 0)) / 1500) * 100)}%
                        </span>
                     </div>
                     <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <motion.div 
                           initial={{ width: 0 }} 
                           animate={{ width: `${(Math.max(0, 1500 - (aiStats?.total || 0)) / 1500) * 100}%` }} 
                           className="h-full bg-primary" 
                        />
                     </div>
                  </div>
                  <div className="pt-4 border-t border-slate-200 dark:border-slate-800 w-full text-[9px] font-black uppercase text-slate-400 tracking-widest leading-relaxed">
                     Switching nodes may take <span className="text-primary">250ms</span> to propagate across all global clusters.
                  </div>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteModal.show && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
              onClick={() => setDeleteModal({ show: false, userId: null })}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-8 rounded-[2rem] shadow-2xl max-w-sm w-full relative z-10 text-center"
            >
               <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                  <Trash2 size={32} />
               </div>
               <h3 className="text-xl font-black dark:text-white uppercase tracking-tight mb-2">Protocol Decommission</h3>
               <p className="text-xs text-slate-500 font-medium leading-relaxed mb-8">This action will permanently wipe this clinician's neural access node. This registry purge is irreversible.</p>
               <div className="flex gap-4">
                  <button 
                    onClick={() => setDeleteModal({ show: false, userId: null })}
                    className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-all"
                  >
                    Abort
                  </button>
                  <button 
                    onClick={handleDeleteUser}
                    className="flex-1 py-3 bg-red-500 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-red-500/30 hover:bg-red-600 transition-all"
                  >
                    Confirm Purge
                  </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Admin;
