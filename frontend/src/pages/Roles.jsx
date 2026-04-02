import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Plus, Check, X, ShieldAlert, Key, Edit2, Trash2, Command, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const ALL_PERMISSIONS = [
  { id: 'predict', label: 'Access Neural Predict', desc: 'Can submit patient data to AI diagnostic pipelines' },
  { id: 'view_stats', label: 'Monitor Diagnostics Stats', desc: 'Can view enterprise risk stratifications and scatter plots' },
  { id: 'manage_roles', label: 'System Protocol Management', desc: 'Ultimate control. Can create/edit platform roles' }
];

const Roles = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Create / Edit State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [formData, setFormData] = useState({ name: '', permissions: [] });

  useEffect(() => {
    if (!user?.permissions?.includes('manage_roles')) {
       navigate('/dashboard');
    } else {
       fetchRoles();
    }
  }, [user]);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://127.0.0.1:5000/api/roles', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setRoles(data.roles);
      else setError(data.error);
    } catch (err) {
      setError('Failed to connect to the intelligence node.');
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (permId) => {
    setFormData(prev => {
      if (prev.permissions.includes(permId)) {
        return { ...prev, permissions: prev.permissions.filter(p => p !== permId) };
      } else {
        return { ...prev, permissions: [...prev.permissions, permId] };
      }
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name) return;
    
    const isEdit = !!editingRole;
    const url = isEdit ? `http://127.0.0.1:5000/api/roles/${editingRole.name}` : `http://127.0.0.1:5000/api/roles`;
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
         setIsFormOpen(false);
         setEditingRole(null);
         setFormData({ name: '', permissions: [] });
         fetchRoles();
      } else {
         const data = await res.json();
         setError(data.error);
      }
    } catch (err) {
      setError('Failed to process role configuration.');
    }
  };

  const handleDelete = async (roleName) => {
     if (!window.confirm(`Are you sure you want to permanently delete the ${roleName} role and downgrade associated users to patient?`)) return;
     try {
        const res = await fetch(`http://127.0.0.1:5000/api/roles/${roleName}`, {
           method: 'DELETE',
           headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) fetchRoles();
        else {
           const data = await res.json();
           setError(data.error);
        }
     } catch (e) {
        setError('Failed to delete role.');
     }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white uppercase flex items-center gap-3">
             <Shield className="text-primary" size={32} />
             Access Control
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 font-medium">Manage enterprise roles and granular diagnostic permissions.</p>
        </div>
        <button 
          onClick={() => {
            setEditingRole(null);
            setFormData({ name: '', permissions: [] });
            setIsFormOpen(true);
          }}
          className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95"
        >
          <Plus size={18} /> New Role
        </button>
      </div>

      {error && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-600 dark:text-red-400">
           <AlertCircle size={20} />
           <p className="font-bold text-sm tracking-tight">{error}</p>
        </motion.div>
      )}

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
         
         {/* Roles List */}
         <div className="lg:col-span-2 space-y-4">
            {loading ? (
               <div className="p-10 flex justify-center"><div className="w-8 h-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin"></div></div>
            ) : (
               roles.map(role => (
                 <motion.div 
                   key={role.name}
                   initial={{ opacity: 0, scale: 0.98 }}
                   animate={{ opacity: 1, scale: 1 }}
                   className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group"
                 >
                    <div className="flex justify-between items-start mb-4">
                       <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                            <Key size={20} />
                         </div>
                         <div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white capitalize">{role.name}</h3>
                            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mt-1">Tier Level Access</p>
                         </div>
                       </div>
                       
                       <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                             onClick={() => {
                                setEditingRole(role);
                                setFormData({ name: role.name, permissions: role.permissions });
                                setIsFormOpen(true);
                             }}
                             className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg hover:text-primary dark:hover:text-primary transition-colors"
                          >
                             <Edit2 size={16} />
                          </button>
                          {!['admin', 'patient'].includes(role.name.toLowerCase()) && (
                             <button 
                               onClick={() => handleDelete(role.name)}
                               className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors"
                             >
                                <Trash2 size={16} />
                             </button>
                          )}
                       </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-4">
                       {role.permissions.map(perm => (
                          <span key={perm} className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-lg uppercase tracking-tight">
                             {perm.replace('_', ' ')}
                          </span>
                       ))}
                       {role.permissions.length === 0 && (
                          <span className="text-xs text-slate-400 italic">No operational permissions granted</span>
                       )}
                    </div>
                 </motion.div>
               ))
            )}
         </div>

         {/* Form Panel */}
         <AnimatePresence>
           {isFormOpen && (
             <motion.div 
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: 20 }}
               className="bg-white dark:bg-slate-900 rounded-3xl border border-primary/20 shadow-2xl p-6 lg:sticky lg:top-32"
             >
                <div className="flex items-center justify-between mb-6">
                   <h3 className="font-bold text-lg text-slate-900 dark:text-white uppercase tracking-tight">
                      {editingRole ? 'Modify Protocol' : 'Create Protocol'}
                   </h3>
                   <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                     <X size={20} />
                   </button>
                </div>

                <form onSubmit={handleSave} className="space-y-6">
                   <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Role Name</label>
                     <input 
                       type="text" 
                       required
                       disabled={!!editingRole}
                       value={formData.name}
                       onChange={(e) => setFormData({...formData, name: e.target.value})}
                       className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all disabled:opacity-50 text-slate-900 dark:text-white uppercase"
                       placeholder="e.g. Cardiologist"
                     />
                     {editingRole && <p className="text-[10px] text-slate-400 mt-1 italic">Role identifiers cannot be modified after compilation.</p>}
                   </div>

                   <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Clearance Flags</label>
                     <div className="space-y-3">
                        {ALL_PERMISSIONS.map(perm => {
                           const isChecked = formData.permissions.includes(perm.id);
                           return (
                             <div 
                               key={perm.id} 
                               onClick={() => togglePermission(perm.id)}
                               className={`flex items-start gap-4 p-3 rounded-xl border cursor-pointer transition-all ${
                                 isChecked 
                                   ? 'bg-primary/5 border-primary/30 dark:bg-primary/10 dark:border-primary/50' 
                                   : 'bg-transparent border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                               }`}
                             >
                                <div className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center transition-colors ${
                                   isChecked ? 'bg-primary text-white' : 'bg-slate-200 dark:bg-slate-700'
                                }`}>
                                   {isChecked && <Check size={14} strokeWidth={4} />}
                                </div>
                                <div>
                                   <p className={`font-bold text-sm tracking-tight ${isChecked ? 'text-primary dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'}`}>
                                      {perm.label}
                                   </p>
                                   <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">{perm.desc}</p>
                                </div>
                             </div>
                           );
                        })}
                     </div>
                   </div>

                   <button type="submit" className="w-full bg-primary text-white font-bold py-3.5 rounded-xl flex justify-center items-center gap-2 hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/30">
                      <Command size={18} /> Compile Protocol
                   </button>
                </form>
             </motion.div>
           )}
         </AnimatePresence>
      </div>
    </div>
  );
};

export default Roles;
