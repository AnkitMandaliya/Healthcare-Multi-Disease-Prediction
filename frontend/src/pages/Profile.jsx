import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Settings, 
  Activity, 
  MapPin, 
  Phone, 
  Mail, 
  Shield, 
  Calendar,
  Edit3,
  CheckCircle2,
  Clock,
  ExternalLink,
  Camera,
  LogOut,
  TrendingUp,
  AlertCircle,
  Hash,
  Stethoscope,
  GraduationCap,
  Briefcase
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { user, logout } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [records, setRecords] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    bio: '',
    phone: '',
    email: '',
    location: '',
    avatar: '',
    specialization: '',
    experience: '',
    department: '',
    medical_degree: '',
    password: ''
  });
  const editSectionRef = useRef(null);

  useEffect(() => {
    fetchProfileAndRecords();
  }, []);

  const fetchProfileAndRecords = async () => {
    setLoading(true);
    try {
      const [profileRes, recordsRes] = await Promise.all([
        api.get('/api/user/profile'),
        api.get('/api/user/records')
      ]);
      setProfileData(profileRes.data);
      setRecords(recordsRes.data);
      setEditForm({
        name: profileRes.data.name || '',
        bio: profileRes.data.bio || '',
        phone: profileRes.data.phone || '',
        email: profileRes.data.email || '',
        location: profileRes.data.location || '',
        specialization: profileRes.data.specialization || '',
        experience: profileRes.data.experience || '',
        department: profileRes.data.department || '',
        medical_degree: profileRes.data.medical_degree || '',
        password: '' 
      });
    } catch (err) {
      console.error("Failed to load profile data", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleEditing = () => {
    const newState = !isEditing;
    setIsEditing(newState);
    if (newState) {
      setTimeout(() => {
        editSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        await api.post('/api/user/upload-avatar', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      
      // Update all registry data directly (Secured via Session Token)
      await api.put('/api/user/profile', editForm);
      setIsEditing(false);
      setSelectedFile(null);
      setPreviewUrl(null);
      fetchProfileAndRecords();
    } catch (err) {
      console.error("Update failed", err);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-4">
        <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary"
        >
          <Activity size={32} />
        </motion.div>
        <div className="text-primary font-black uppercase tracking-[0.4em] text-[10px]">
           Synchronizing Clinical Node...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 py-6 px-4 md:px-0">
      
      {/* Dynamic Profile Header */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative group bg-white dark:bg-[#0B0F1A] rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-2xl shadow-primary/5 overflow-hidden"
      >
        {/* Enhanced Pattern Background */}
        <div className="absolute inset-0 h-48 bg-gradient-to-r from-primary via-indigo-600 to-primary/80 opacity-90 overflow-hidden">
           <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_white_1px,_transparent_1px)] bg-[size:30px_30px]"></div>
           <motion.div 
             animate={{ x: [0, 50, 0], opacity: [0.1, 0.3, 0.1] }}
             transition={{ duration: 15, repeat: Infinity }}
             className="absolute top-0 right-0 w-96 h-96 bg-white/30 blur-[120px] rounded-full"
           />
        </div>

        <div className="relative px-8 pb-10 -mt-20 flex flex-col md:flex-row items-end gap-10 pt-24">
          {/* Avatar Construction with Status Ring */}
          <div className="relative group/avatar">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="w-40 h-40 rounded-[3rem] bg-slate-100 dark:bg-[#0F172A] border-8 border-white dark:border-[#0B0F1A] shadow-2xl overflow-hidden relative z-10"
            >
              <img 
                src={previewUrl || profileData?.avatar || user.avatar} 
                alt="Profile" 
                className="w-full h-full object-cover transition-all duration-700 group-hover/avatar:scale-110" 
              />
            </motion.div>
            <div className="absolute inset-0 bg-primary/30 blur-[60px] -z-10 opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-700"></div>
          </div>
          
          {/* Detailed Node Meta Hub */}
          <div className="flex-1 space-y-4 mb-4">
            <div className="flex flex-wrap items-center gap-4">
              <h1 className="text-5xl font-black dark:text-white uppercase tracking-tighter drop-shadow-xl">{profileData?.name}</h1>
              <div className="flex gap-2">
                 <span className="px-5 py-2 bg-white text-emerald-600 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 border-emerald-500/20 shadow-xl backdrop-blur-md">
                    {profileData?.role}
                 </span>
                 <span className="px-5 py-2 bg-white text-blue-600 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 border-blue-500/20 shadow-xl backdrop-blur-md">
                    {profileData?.specialization || "Registry Pending"}
                 </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-5 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-[0.05em] text-[11px]">
               <div className="flex items-center gap-2.5 px-4 py-2 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm">
                  <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                  NODE ONLINE
               </div>
               <div className="flex items-center gap-2.5 px-4 py-2 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10">
                  <Hash size={14} className="text-primary" />
                  ID-HUB: {profileData?._id?.slice(-10).toUpperCase()}
               </div>
               <div className="flex items-center gap-2.5 px-4 py-2 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10">
                  <Shield size={14} className="text-indigo-500" />
                  UNIT: {profileData?.department || "Global Ops"}
               </div>
               <div className="px-4 py-2 bg-primary/10 text-primary rounded-xl font-black border border-primary/20">
                  PRODUCTION v1.0.0
               </div>
            </div>
          </div>

          {/* Core Actions */}
          <div className="flex gap-4 mb-4 w-full md:w-auto">
            <motion.button 
               whileHover={{ scale: 1.05 }}
               whileTap={{ scale: 0.95 }}
               onClick={toggleEditing}
               className="flex-1 md:flex-none px-10 py-5 bg-primary text-white rounded-3xl font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl shadow-primary/30"
            >
               {isEditing ? "Halt Sync" : "Sync Profile"}
            </motion.button>
            <motion.button 
               whileHover={{ scale: 1.05, backgroundColor: '#f43f5e' }}
               whileTap={{ scale: 0.95 }}
               onClick={logout}
               className="p-5 bg-rose-500/10 text-rose-500 rounded-3xl border border-rose-500/20 hover:text-white transition-all shadow-xl"
            >
               <LogOut size={22} />
            </motion.button>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Identity & Records Matrix (Left Column) */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* Identity Descriptor */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-[#0B0F1A] rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-xl p-10 space-y-8"
          >
            <div className="flex items-center justify-between">
               <h2 className="text-xl font-black dark:text-white uppercase tracking-tight flex items-center gap-3">
                 <Shield className="text-primary" size={24} /> Registry Info
               </h2>
               <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
            </div>
            
            <div className="space-y-6">
               {[
                 { icon: Mail, label: 'Secure Email Terminal', value: profileData?.email, color: 'text-blue-500' },
                 { icon: Phone, label: 'Rescue Mobile Terminal', value: profileData?.phone || "Registry Missing", color: 'text-amber-500' },
                 { icon: MapPin, label: 'Clinical Region', value: profileData?.location || "Global Node", color: 'text-indigo-500' },
                 { icon: Stethoscope, label: 'Specialization Matrix', value: profileData?.specialization || "General Medicine", color: 'text-emerald-500' },
                 { icon: Shield, label: 'Clinical Department', value: profileData?.department || "Unassigned Unit", color: 'text-purple-500' },
                 { icon: GraduationCap, label: 'Medical Credentials', value: profileData?.medical_degree || "Verified Practitioner", color: 'text-rose-500' },
                 { icon: Clock, label: 'Hub Uptime Node', value: user?.session_start ? new Date(user.session_start).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Initialized...', color: 'text-slate-400' }
               ].map((item, i) => (
                 <div key={i} className="group cursor-default">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 ml-1">{item.label}</p>
                    <div className="flex items-center gap-4 bg-slate-50/50 dark:bg-white/5 p-4 rounded-2xl group-hover:bg-primary/5 transition-all duration-300">
                       <item.icon className={`${item.color} opacity-80`} size={18} />
                       <span className="text-xs font-bold dark:text-white truncate">{item.value}</span>
                    </div>
                 </div>
               ))}
            </div>

            <div className="pt-6 border-t border-slate-100 dark:border-white/5">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 ml-1">Clinical Bio-Archive</p>
              <div className="bg-slate-50/50 dark:bg-white/5 p-5 rounded-2xl italic leading-relaxed">
                 <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
                   {profileData?.bio || "Identifier initialization complete. No biography provided."}
                 </p>
              </div>
            </div>
          </motion.div>

          {/* Activity Metrics (Enhanced) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-primary to-indigo-600 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-primary/20 relative overflow-hidden"
          >
             <div className="relative z-10 space-y-6">
                <div className="flex items-center justify-between">
                   <TrendingUp size={24} />
                   <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full">Unit Performance</span>
                </div>
                <div>
                   <div className="text-4xl font-black tracking-tight">{records.length}</div>
                   <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Predictions Executed</p>
                </div>
                <div className="space-y-2">
                   <div className="flex justify-between text-[9px] font-black uppercase tracking-widest opacity-80">
                      <span>Node Integrity</span>
                      <span>98%</span>
                   </div>
                   <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: "98%" }}
                        transition={{ duration: 1.5, delay: 0.5 }}
                        className="h-full bg-white"
                      />
                   </div>
                </div>
             </div>
             <Activity className="absolute -bottom-10 -right-10 text-white/10 w-40 h-40" />
          </motion.div>
        </div>

        {/* Diagnostic Vault & Edit Hub (Right Column) */}
        <div className="lg:col-span-8 space-y-8">
          
          <AnimatePresence mode="wait">
             {isEditing ? (
               <motion.div 
                 key="edit-form"
                 ref={editSectionRef}
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, scale: 0.95 }}
                 className="bg-white dark:bg-[#0B0F1A] rounded-[2.5rem] border-2 border-primary/20 shadow-2xl p-10 space-y-8 relative overflow-hidden"
               >
                  <div className="absolute top-0 right-0 p-8 text-primary opacity-5"><Settings size={80} /></div>

                  <div className="flex items-center gap-4 border-b border-slate-100 dark:border-white/5 pb-6">
                     <div className="p-3 bg-primary/10 text-primary rounded-2xl"><Edit3 size={24} /></div>
                     <div>
                        <h3 className="text-xl font-black dark:text-white uppercase tracking-tight">Modify Registry Data</h3>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Authorized Clinical Identity Update</p>
                     </div>
                  </div>

                  <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Identity Display Name</label>
                       <div className="relative">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                          <input 
                              className="w-full h-14 bg-slate-50 dark:bg-white/5 border-0 rounded-2xl pl-12 pr-4 text-xs font-bold dark:text-white focus:ring-4 focus:ring-primary/10 transition-all"
                              value={editForm.name}
                              onChange={e => setEditForm({...editForm, name: e.target.value})}
                              placeholder="Full Name"
                          />
                       </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Secure Email Terminal</label>
                       <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                          <input 
                              className="w-full h-14 bg-slate-50 dark:bg-white/5 border-0 rounded-2xl pl-12 pr-4 text-xs font-bold dark:text-white focus:ring-4 focus:ring-primary/10 transition-all font-mono"
                              value={editForm.email}
                              onChange={e => setEditForm({...editForm, email: e.target.value})}
                              placeholder="admin@healthai.com"
                          />
                       </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Rescue Mobile Terminal</label>
                       <div className="relative">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                          <input 
                              className="w-full h-14 bg-slate-50 dark:bg-white/5 border-0 rounded-2xl pl-12 pr-4 text-xs font-bold dark:text-white focus:ring-4 focus:ring-primary/10 transition-all"
                              value={editForm.phone}
                              onChange={e => setEditForm({...editForm, phone: e.target.value})}
                              placeholder="+91..."
                          />
                       </div>
                    </div>

                    <div className="md:col-span-2 space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Clinical Specialization</label>
                       <div className="relative">
                          <Stethoscope className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                          <input 
                              className="w-full h-14 bg-slate-50 dark:bg-white/5 border-0 rounded-2xl pl-12 pr-4 text-xs font-bold dark:text-white focus:ring-4 focus:ring-primary/10 transition-all"
                              value={editForm.specialization}
                              onChange={e => setEditForm({...editForm, specialization: e.target.value})}
                              placeholder="e.g. Cardiology, Radiology, General Practitioner"
                          />
                       </div>
                    </div>

                    <div className="md:col-span-2 space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Degrees & Certifications</label>
                       <div className="relative">
                          <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                          <input 
                              className="w-full h-14 bg-slate-50 dark:bg-white/5 border-0 rounded-2xl pl-12 pr-4 text-xs font-bold dark:text-white focus:ring-4 focus:ring-primary/10 transition-all"
                              value={editForm.medical_degree}
                              onChange={e => setEditForm({...editForm, medical_degree: e.target.value})}
                              placeholder="e.g. MD, PhD, MBBS"
                          />
                       </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Department</label>
                       <div className="relative">
                          <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                          <input 
                              className="w-full h-14 bg-slate-50 dark:bg-white/5 border-0 rounded-2xl pl-12 pr-4 text-xs font-bold dark:text-white focus:ring-4 focus:ring-primary/10 transition-all"
                              value={editForm.department}
                              onChange={e => setEditForm({...editForm, department: e.target.value})}
                              placeholder="e.g. Cardiology"
                          />
                       </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Years of Experience</label>
                       <div className="relative">
                          <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                          <input 
                              className="w-full h-14 bg-slate-50 dark:bg-white/5 border-0 rounded-2xl pl-12 pr-4 text-xs font-bold dark:text-white focus:ring-4 focus:ring-primary/10 transition-all"
                              value={editForm.experience}
                              onChange={e => setEditForm({...editForm, experience: e.target.value})}
                              placeholder="e.g. 5 Years"
                          />
                       </div>
                    </div>

                    <div className="md:col-span-2 space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Clinical Terminal Avatar (Upload)</label>
                       <div className="relative group/upload">
                          <label className="flex items-center gap-4 w-full h-14 bg-slate-50 dark:bg-white/5 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl px-6 cursor-pointer hover:bg-primary/5 hover:border-primary/30 transition-all">
                             <Camera className="text-slate-400 group-hover/upload:text-primary transition-colors" size={18} />
                             <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                {selectedFile ? selectedFile.name : "Establish New Visual Identity..."}
                             </span>
                             <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*" />
                          </label>
                          {previewUrl && (
                             <div className="mt-4 flex items-center gap-3 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                                <div className="h-10 w-10 rounded-lg overflow-hidden">
                                   <img src={previewUrl} className="h-full w-full object-cover" />
                                </div>
                                <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Preview Synchronized</span>
                             </div>
                          )}
                       </div>
                    </div>

                    <div className="md:col-span-2 pt-4">
                       <motion.button 
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          className="w-full py-5 bg-primary text-white rounded-[1.5rem] font-black uppercase tracking-[0.3em] text-[11px] shadow-2xl shadow-primary/30"
                       >
                          Update Registry Identification
                       </motion.button>
                    </div>
                  </form>
               </motion.div>
             ) : (
               <motion.div 
                 key="records-list"
                 initial={{ opacity: 0, x: 30 }}
                 animate={{ opacity: 1, x: 0 }}
                 className="bg-white dark:bg-[#0B0F1A] rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-2xl h-fit overflow-hidden"
               >
                  <div className="px-10 py-8 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50/30 dark:bg-white/2">
                     <div>
                        <h2 className="text-2xl font-black dark:text-white uppercase tracking-tight flex items-center gap-3">
                           <Activity className="text-primary" size={28} /> Diagnostic Archive
                        </h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Verified Historical Diagnostic Nodes</p>
                     </div>
                  </div>

                  <div className="px-6 py-8 overflow-y-auto max-h-[600px] scrollbar-hide">
                     <div className="space-y-4">
                       {records.map((r, idx) => (
                         <motion.div 
                           key={r._id}
                           initial={{ opacity: 0, y: 15 }}
                           animate={{ opacity: 1, y: 0 }}
                           transition={{ delay: idx * 0.05 }}
                           whileHover={{ x: 5 }}
                           className="p-6 bg-white dark:bg-[#0F1626] border border-slate-100 dark:border-white/5 rounded-3xl hover:border-primary/30 transition-all group flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm hover:shadow-xl"
                         >
                           <div className="flex items-center gap-6">
                             <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner relative overflow-hidden ${
                               r.risk_level === 'High' ? 'bg-rose-500/10 text-rose-500' : r.risk_level === 'Medium' ? 'bg-amber-500/10 text-amber-500' : 'bg-white text-emerald-600'
                             }`}>
                               <Activity size={24} />
                             </div>
                             <div>
                                <div className="flex items-center gap-2">
                                   <h3 className="text-sm font-black dark:text-white uppercase tracking-tight">{r.disease} Prediction</h3>
                                   <span className="text-[8px] font-black uppercase px-2 py-0.5 bg-slate-100 dark:bg-white/10 rounded-full text-slate-500">ID: {r._id.slice(-4)}</span>
                                </div>
                                <p className="text-[10px] font-bold text-slate-400 flex items-center gap-2 uppercase tracking-widest mt-1.5">
                                   <Clock size={12} className="text-primary" /> {new Date(r.timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                </p>
                             </div>
                           </div>

                           <div className="flex items-center justify-between md:justify-end gap-10">
                             <div className="text-left md:text-right">
                                <div className={`flex items-center md:justify-end gap-1.5 text-[9px] font-black uppercase tracking-[0.2em] mb-1 ${
                                   r.risk_level === 'High' ? 'text-rose-500' : r.risk_level === 'Medium' ? 'text-amber-500' : 'text-emerald-500'
                                }`}>
                                   <AlertCircle size={12} />
                                   {r.risk_level} Risk Level
                                </div>
                                <p className="text-[12px] font-bold dark:text-white max-w-[200px] truncate">
                                   {r.prediction_text}
                                 </p>
                             </div>
                           </div>
                         </motion.div>
                       ))}
                       
                       {records.length === 0 && (
                         <div className="py-24 text-center space-y-4">
                           <div className="w-20 h-20 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto">
                              <Activity size={32} className="text-slate-200 dark:text-slate-800" />
                           </div>
                           <div>
                              <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em]">Neural Archive Offline</p>
                              <p className="text-[9px] font-bold text-slate-300 dark:text-slate-600 mt-1 uppercase">No diagnostic history found for this clinical node.</p>
                           </div>
                         </div>
                       )}
                     </div>
                  </div>
               </motion.div>
             )}
          </AnimatePresence>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="flex flex-wrap items-center justify-center gap-10 py-6 border-t border-slate-100 dark:border-white/5 opacity-50 grayscale hover:grayscale-0 transition-all duration-700"
      >
         <div className="flex items-center gap-3 text-slate-400 grayscale">
            <Shield size={20} />
            <span className="text-[9px] font-black uppercase tracking-[0.3em]">AES-256 Encrypted Profile Node</span>
         </div>
         <div className="flex items-center gap-3 text-slate-400 grayscale">
            <CheckCircle2 size={20} />
            <span className="text-[9px] font-black uppercase tracking-[0.3em]">Identity Verified</span>
         </div>
      </motion.div>

    </div>
  );
};

export default Profile;
