import React, { useState, useEffect } from 'react';
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
  ChevronRight
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
    location: '',
    avatar: ''
  });

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
        location: profileRes.data.location || ''
      });
    } catch (err) {
      console.error("Failed to load profile data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      // 1. Upload file if selected
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        await api.post('/api/user/upload-avatar', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      // 2. Update profile data
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
      <div className="flex items-center justify-center min-h-[60vh] text-primary font-black uppercase tracking-[0.4em] animate-pulse">
        Accessing Neural Profile Node...
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 py-4">
      {/* Hero Profile Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden"
      >
        <div className="h-32 bg-gradient-to-r from-primary/20 via-primary/40 to-indigo-500/30"></div>
        <div className="px-8 pb-8 -mt-12 flex flex-col md:flex-row items-end gap-6">
          <div className="relative group">
            <div className="w-28 h-28 rounded-[2rem] bg-slate-100 dark:bg-slate-800 border-4 border-white dark:border-slate-900 shadow-lg overflow-hidden group-hover:scale-[1.02] transition-transform">
              <img src={previewUrl || profileData?.avatar || user.avatar} alt="Profile" className="w-full h-full object-cover" />
            </div>
            <button 
              onClick={() => setIsEditing(true)}
              className="absolute bottom-2 right-2 p-2 bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-100 dark:border-slate-700 text-primary hover:scale-110 transition-all opacity-0 group-hover:opacity-100"
            >
              <Camera size={16} />
            </button>
          </div>
          
          <div className="flex-1 space-y-1 mb-2">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black dark:text-white uppercase tracking-tighter">{profileData?.name}</h1>
              <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-[9px] font-black uppercase tracking-widest border border-primary/20">
                {profileData?.role}
              </span>
            </div>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[8px] flex items-center gap-2">
              <Activity size={12} /> Network Node Unit 
            </p>
          </div>

          <div className="flex gap-2 mb-2">
            <button 
               onClick={() => setIsEditing(!isEditing)}
               className="px-6 py-3 bg-primary text-white rounded-xl font-black uppercase tracking-widest text-[9px] shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all"
            >
               {isEditing ? "Cancel" : "Edit Profile"}
            </button>
            <button 
               onClick={logout}
               className="p-3 bg-rose-500/10 text-rose-500 rounded-xl border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all"
            >
               <LogOut size={16} />
            </button>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Details */}
        <div className="space-y-6">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-lg p-8 space-y-6"
          >
            <h2 className="text-lg font-black dark:text-white uppercase tracking-tight flex items-center gap-2">
              <User className="text-primary" size={20} /> Identity
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400">
                  <Mail size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Email Address</p>
                  <p className="text-xs font-bold dark:text-white truncate">{profileData?.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400">
                  <Phone size={16} />
                </div>
                <div>
                  <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Contact</p>
                  <p className="text-xs font-bold dark:text-white">{profileData?.phone || "N/A"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400">
                  <MapPin size={16} />
                </div>
                <div>
                  <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Location Node</p>
                  <p className="text-xs font-bold dark:text-white">{profileData?.location || "Unknown"}</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-2">Protocol Bio</p>
              <p className="text-[11px] font-medium text-slate-600 dark:text-white leading-relaxed italic">
                {profileData?.bio || "No biography provided."}
              </p>
            </div>
          </motion.div>

          {isEditing && (
            <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               className="bg-white dark:bg-slate-900 rounded-[2rem] border-2 border-primary/20 shadow-xl p-8 space-y-4"
            >
               <h3 className="text-md font-black dark:text-white uppercase tracking-tight">Modify Unit Data</h3>
               <form onSubmit={handleUpdate} className="space-y-3">
                  <div className="space-y-1">
                     <label className="text-[8px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Identity Name</label>
                     <input 
                        className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-0 rounded-xl text-xs font-bold dark:text-white focus:ring-2 focus:ring-primary/20"
                        value={editForm.name}
                        onChange={e => setEditForm({...editForm, name: e.target.value})}
                     />
                  </div>
                  <div className="space-y-1">
                     <label className="text-[8px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Identity Image Node</label>
                     <div className="flex items-center gap-4">
                        <button 
                           type="button"
                           onClick={() => document.getElementById('avatar-upload').click()}
                           className="flex-1 p-3 bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase text-primary hover:border-primary transition-all flex items-center justify-center gap-2"
                        >
                           <Camera size={14} /> {selectedFile ? "Scan Selected: " + selectedFile.name : "Select Image Node"}
                        </button>
                        <input 
                           id="avatar-upload"
                           type="file" 
                           className="hidden" 
                           accept="image/*"
                           onChange={handleFileUpload}
                        />
                     </div>
                  </div>
                  <div className="space-y-1">
                     <label className="text-[8px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Biography</label>
                     <textarea 
                        className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-0 rounded-xl text-xs font-bold dark:text-white focus:ring-2 focus:ring-primary/20"
                        value={editForm.bio}
                        onChange={e => setEditForm({...editForm, bio: e.target.value})}
                        rows={2}
                     />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                     <div className="space-y-1">
                        <label className="text-[8px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Phone</label>
                        <input 
                           className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-0 rounded-xl text-xs font-bold dark:text-white focus:ring-2 focus:ring-primary/20"
                           value={editForm.phone}
                           onChange={e => setEditForm({...editForm, phone: e.target.value})}
                        />
                     </div>
                     <div className="space-y-1">
                        <label className="text-[8px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Region</label>
                        <input 
                           className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-0 rounded-xl text-xs font-bold dark:text-white focus:ring-2 focus:ring-primary/20"
                           value={editForm.location}
                           onChange={e => setEditForm({...editForm, location: e.target.value})}
                        />
                     </div>
                  </div>
                  <button className="w-full py-4 bg-primary text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20">
                     Update Identity
                  </button>
               </form>
            </motion.div>
          )}
        </div>

        {/* Right Column: Preivous Records */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-lg overflow-hidden flex flex-col h-full"
          >
            <div className="px-8 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
               <div>
                  <h2 className="text-lg font-black dark:text-white uppercase tracking-tight">Diagnostic Archive</h2>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{records.length} Historical Units</p>
               </div>
               <Activity className="text-primary" size={20} />
            </div>

            <div className="p-4 overflow-y-auto max-h-[500px] scrollbar-hide hover:scrollbar-default transition-all">
              <div className="space-y-3">
                {records.map((r, idx) => (
                  <motion.div 
                    key={r._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + (idx * 0.03) }}
                    className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-md ${
                        r.risk_level === 'High' ? 'bg-red-500/10 text-red-500' : r.risk_level === 'Medium' ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'
                      }`}>
                        <Activity size={18} />
                      </div>
                      <div>
                        <h3 className="text-xs font-black dark:text-white uppercase tracking-tight">{r.disease} Unit</h3>
                        <div className="flex items-center gap-3 mt-0.5">
                           <p className="text-[9px] font-bold text-slate-400 flex items-center gap-1 uppercase tracking-widest">
                              <Calendar size={10} /> {new Date(r.timestamp).toLocaleDateString()}
                           </p>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                       <p className={`text-[8px] font-black uppercase tracking-[0.2em] mb-0.5 ${
                          r.risk_level === 'High' ? 'text-red-500' : r.risk_level === 'Medium' ? 'text-amber-500' : 'text-emerald-500'
                       }`}>
                          {r.risk_level}
                       </p>
                       <p className="text-[10px] font-bold dark:text-white">
                          {r.prediction_text}
                       </p>
                    </div>

                    <div className="ml-6 p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-400 opacity-0 group-hover:opacity-100 transition-all">
                       <ExternalLink size={14} />
                    </div>
                  </motion.div>
                ))}
                
                {records.length === 0 && (
                  <div className="py-16 text-center">
                    <Activity size={48} className="mx-auto text-slate-100 dark:text-slate-800 mb-4" />
                    <p className="text-[8px] font-black uppercase text-slate-400 tracking-[0.2em]">Record buffer empty.</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>

  );
};

export default Profile;
