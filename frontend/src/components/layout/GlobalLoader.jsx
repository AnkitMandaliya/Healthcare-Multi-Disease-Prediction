import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLoading } from '../../context/LoadingContext';

const GlobalLoader = () => {
    const { isLoading } = useLoading();

    return (
        <AnimatePresence>
            {isLoading && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white/10 dark:bg-slate-950/20 backdrop-blur-xl transition-colors duration-500"
                >
                    <div className="relative">
                        {/* Outer rotating ring */}
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            className="w-32 h-32 md:w-48 md:h-48 rounded-full border-2 border-primary/10 border-t-primary shadow-[0_0_20px_rgba(36,99,235,0.2)]"
                        />
                        
                        {/* Inner pulsing logo */}
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0.5 }}
                            animate={{ 
                                scale: [0.8, 1.1, 0.8],
                                opacity: [0.5, 1, 0.5],
                                filter: ["blur(0px)", "blur(2px)", "blur(0px)"]
                            }}
                            transition={{ 
                                duration: 2, 
                                repeat: Infinity, 
                                ease: "easeInOut" 
                            }}
                            className="absolute inset-0 flex items-center justify-center"
                        >
                            <img 
                                src="/logo1.png" 
                                alt="HealthAI Logo" 
                                className="w-16 h-16 md:w-24 md:h-24 object-contain drop-shadow-[0_0_15px_rgba(36,99,235,0.4)]"
                            />
                        </motion.div>
                    </div>

                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="mt-8 flex flex-col items-center gap-2"
                    >
                        <h2 className="text-lg md:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-[0.3em] animate-pulse">
                            Neural <span className="text-primary">Syncing</span>
                        </h2>
                        <div className="flex gap-1">
                            {[0, 1, 2].map((i) => (
                                <motion.div
                                    key={i}
                                    animate={{ 
                                        scale: [1, 1.5, 1],
                                        opacity: [0.3, 1, 0.3]
                                    }}
                                    transition={{ 
                                        duration: 1, 
                                        repeat: Infinity, 
                                        delay: i * 0.2 
                                    }}
                                    className="w-1.5 h-1.5 bg-primary rounded-full"
                                />
                            ))}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default GlobalLoader;
