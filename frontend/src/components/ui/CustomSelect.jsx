import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CustomSelect = ({ 
  name, 
  value, 
  onChange, 
  options, 
  placeholder = "Select Option...", 
  className = "",
  containerClassName = "",
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  const handleSelect = (selectedValue) => {
    if (onChange) {
       onChange({ target: { name, value: selectedValue } });
    }
    setIsOpen(false);
  };

  return (
    <div className={`relative w-full ${containerClassName}`} ref={containerRef}>
      <div 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`${className} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} flex items-center justify-between select-none ${isOpen ? 'ring-4 ring-primary/20 border-primary shadow-sm' : ''} transition-all duration-300`}
      >
        <span className={`block truncate font-bold text-sm tracking-wide ${selectedOption ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <div className={`p-1 rounded-full transition-colors ${isOpen ? 'bg-primary/10 text-primary' : 'text-slate-400 bg-transparent'}`}>
           <ChevronDown 
             size={16} 
             className={`shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
           />
        </div>
      </div>

      <AnimatePresence>
        {isOpen && !disabled && (
          <motion.div 
            initial={{ opacity: 0, y: 15, scale: 0.95, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: 10, scale: 0.95, filter: "blur(10px)" }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="absolute z-50 w-full mt-3 bg-white/70 dark:bg-[#0B0F1A]/70 backdrop-blur-3xl border border-white/50 dark:border-slate-800/60 rounded-[2rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.15)] dark:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6)] overflow-hidden origin-top"
          >
            <div className="p-3">
               <ul className="max-h-[260px] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 dark:[&::-webkit-scrollbar-thumb]:bg-slate-700/50 [&::-webkit-scrollbar-thumb]:rounded-full pr-1">
                 {options.map((opt, idx) => {
                   const isSelected = opt.value === value;
                   return (
                     <motion.li 
                       key={opt.value}
                       initial={{ opacity: 0, x: -20 }}
                       animate={{ opacity: 1, x: 0 }}
                       transition={{ delay: idx * 0.04, type: "spring", stiffness: 400, damping: 30 }}
                       whileHover={!isSelected ? { scale: 0.98, x: 2 } : { scale: 0.98 }}
                       onClick={() => handleSelect(opt.value)}
                       className={`relative flex items-center justify-between px-4 py-3 mb-1.5 last:mb-0 rounded-2xl text-[11px] font-black uppercase tracking-widest cursor-pointer transition-all duration-300 ${
                         isSelected 
                           ? 'bg-gradient-to-r from-primary to-blue-500 text-white shadow-lg shadow-primary/30' 
                           : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                       }`}
                     >
                       <span className={`block truncate ${isSelected ? 'ml-1' : ''} transition-all`}>{opt.label}</span>
                       {isSelected && (
                         <motion.div 
                           initial={{ scale: 0, rotate: -45 }}
                           animate={{ scale: 1, rotate: 0 }}
                           className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-white/20 backdrop-blur-md rounded-full text-white shadow-inner"
                         >
                            <Check size={14} strokeWidth={4} />
                         </motion.div>
                       )}
                     </motion.li>
                   );
                 })}
                 {options.length === 0 && (
                    <li className="px-4 py-8 text-xs text-center font-black uppercase tracking-[0.2em] text-slate-400 bg-slate-50/50 dark:bg-slate-800/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                       Data Stream Empty
                    </li>
                 )}
               </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomSelect;
