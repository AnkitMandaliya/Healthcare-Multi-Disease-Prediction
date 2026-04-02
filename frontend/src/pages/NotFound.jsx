import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, ArrowLeft, Home, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#f6f6f8] dark:bg-[#111621] flex items-center justify-center p-6 transition-colors duration-300">
            <div className="max-w-2xl w-full text-center">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                    className="mb-10 inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-red-500/10 text-red-500 shadow-inner"
                >
                    <ShieldAlert size={48} />
                </motion.div>

                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                >
                    <h1 className="text-8xl font-black text-slate-900 dark:text-white mb-4 tracking-tighter">404</h1>
                    <h2 className="text-2xl font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-6">Route Decommissioned or Not Found</h2>
                    <p className="text-slate-500 dark:text-slate-400 mb-10 max-w-md mx-auto">
                        The clinical node you are attempting to reach is either restricted or does not exist in our current neural mapping.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-4"
                >
                    <button
                        onClick={() => navigate(-1)}
                        className="w-full sm:w-auto px-8 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold flex items-center justify-center gap-2 hover:bg-white dark:hover:bg-slate-900 transition-all"
                    >
                        <ArrowLeft size={18} /> Previous Sector
                    </button>
                    <button
                        onClick={() => navigate('/')}
                        className="w-full sm:w-auto px-8 py-3 rounded-xl bg-primary text-white font-bold flex items-center justify-center gap-2 hover:bg-blue-700 shadow-xl shadow-primary/20 transition-all"
                    >
                        <Home size={18} /> Return to Hub
                    </button>
                </motion.div>

                {/* Decorative Search Graphic */}
                <div className="mt-20 opacity-10 flex justify-center">
                   <div className="relative">
                      <Search size={160} className="text-slate-400" />
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-primary rounded-full blur-[80px]"></div>
                   </div>
                </div>
            </div>
        </div>
    );
};

export default NotFound;
