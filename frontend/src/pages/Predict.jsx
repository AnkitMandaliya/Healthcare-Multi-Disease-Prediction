import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, 
  ArrowLeft, 
  BrainCircuit, 
  Activity, 
  Info, 
  CheckCircle2, 
  Download, 
  UserPlus,
  Loader2,
  AlertTriangle,
  Heart,
  Wind,
  Stethoscope,
  ChevronDown,
  X,
  Phone,
  Calendar,
  ShieldCheck,
  Search,
  Zap,
  Layout,
  PlayCircle,
  TrendingUp,
  Award,
  Shield,
  Bell,
  Menu,
  Scale,
  Users,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import CustomSelect from '../components/ui/CustomSelect';
import { predictRisk, fetchAIAdvice } from '../services/api';
import { exportToPDF, generateHealthReport } from '../services/pdfService';

const diseases = [
  { 
    id: 'diabetes', 
    name: 'Diabetes', 
    icon: Activity, 
    color: '#2463EB',
    fields: [
      { name: 'Gender', label: 'Gender Identification', type: 'select', options: [{label: 'Male', value: 'M'}, {label: 'Female', value: 'F'}] },
      { name: 'Pregnancies', label: 'Pregnancies', type: 'number', placeholder: 'e.g. 2', step: 1 },
      { name: 'Glucose', label: 'Glucose Level', type: 'number', placeholder: 'e.g. 120' },
      { name: 'BloodPressure', label: 'Blood Pressure', type: 'number', placeholder: 'e.g. 80' },
      { name: 'SkinThickness', label: 'Skin Thickness', type: 'number', placeholder: 'e.g. 20' },
      { name: 'Insulin', label: 'Insulin Level', type: 'number', placeholder: 'e.g. 85' },
      { name: 'BMI', label: 'BMI', type: 'number', placeholder: 'e.g. 22.5', step: 0.1 },
      { name: 'DiabetesPedigreeFunction', label: 'DPF Score', type: 'number', placeholder: 'e.g. 0.47', step: 0.001 },
      { name: 'Age', label: 'Patient Age', type: 'number', placeholder: 'e.g. 45' },
    ]
  },
  { 
    id: 'heart', 
    name: 'Heart Disease', 
    icon: Heart, 
    color: '#EF4444',
    fields: [
      { name: 'age', label: 'Age', type: 'number', placeholder: 'e.g. 52' },
      { name: 'sex', label: 'Gender', type: 'select', options: [{label: 'Male', value: 'M'}, {label: 'Female', value: 'F'}] },
      { name: 'cp', label: 'Chest Pain Type', type: 'select', options: [
        {label: 'Typical Angina', value: '0'}, 
        {label: 'Atypical Angina', value: '1'}, 
        {label: 'Non-anginal Pain', value: '2'}, 
        {label: 'Asymptomatic', value: '3'}
      ]},
      { name: 'trestbps', label: 'Resting BP', type: 'number', placeholder: 'e.g. 125' },
      { name: 'chol', label: 'Cholesterol', type: 'number', placeholder: 'e.g. 212' },
      { name: 'fbs', label: 'Fasting Blood Sugar > 120', type: 'select', options: [{label: 'True', value: '1'}, {label: 'False', value: '0'}] },
      { name: 'restecg', label: 'Resting ECG', type: 'select', options: [{label: 'Normal', value: '0'}, {label: 'ST-T Abnormality', value: '1'}, {label: 'LV Hypertrophy', value: '2'}] },
      { name: 'thalach', label: 'Max Heart Rate', type: 'number', placeholder: 'e.g. 168' },
      { name: 'exang', label: 'Exercise Induced Angina', type: 'select', options: [{label: 'Yes', value: '1'}, {label: 'No', value: '0'}] },
      { name: 'oldpeak', label: 'ST Depression', type: 'number', placeholder: 'e.g. 1.0', step: 0.1 },
      { name: 'slope', label: 'Peak ST Slope', type: 'select', options: [{label: 'Upsloping', value: '0'}, {label: 'Flat', value: '1'}, {label: 'Downsloping', value: '2'}] },
      { name: 'ca', label: 'Major Vessels (0-3)', type: 'number', placeholder: 'e.g. 0', min: 0, max: 3 },
      { name: 'thal', label: 'Thalassemia', type: 'select', options: [{label: 'Normal', value: '1'}, {label: 'Fixed Defect', value: '2'}, {label: 'Reversible Defect', value: '3'}] },
    ]
  },
  { 
    id: 'lung', 
    name: 'Lung Cancer', 
    icon: Wind, 
    color: '#10B981',
    fields: [
      { name: 'GENDER', label: 'Gender', type: 'select', options: [{label: 'Male', value: 'M'}, {label: 'Female', value: 'F'}] },
      { name: 'AGE', label: 'Age', type: 'number', placeholder: 'e.g. 64' },
      { name: 'SMOKING', label: 'Smoking Status', type: 'select', options: [{label: 'Yes', value: 'YES'}, {label: 'No', value: 'NO'}] },
      { name: 'YELLOW_FINGERS', label: 'Yellow Fingers', type: 'select', options: [{label: 'Yes', value: 'YES'}, {label: 'No', value: 'NO'}] },
      { name: 'ANXIETY', label: 'Anxiety', type: 'select', options: [{label: 'Yes', value: 'YES'}, {label: 'No', value: 'NO'}] },
      { name: 'PEER_PRESSURE', label: 'Peer Pressure', type: 'select', options: [{label: 'Yes', value: 'YES'}, {label: 'No', value: 'NO'}] },
      { name: 'CHRONIC DISEASE', label: 'Chronic Disease', type: 'select', options: [{label: 'Yes', value: 'YES'}, {label: 'No', value: 'NO'}] },
      { name: 'FATIGUE ', label: 'Fatigue', type: 'select', options: [{label: 'Yes', value: 'YES'}, {label: 'No', value: 'NO'}] },
      { name: 'ALLERGY ', label: 'Allergy', type: 'select', options: [{label: 'Yes', value: 'YES'}, {label: 'No', value: 'NO'}] },
      { name: 'WHEEZING', label: 'Wheezing', type: 'select', options: [{label: 'Yes', value: 'YES'}, {label: 'No', value: 'NO'}] },
      { name: 'ALCOHOL CONSUMING', label: 'Alcohol Consuming', type: 'select', options: [{label: 'Yes', value: 'YES'}, {label: 'No', value: 'NO'}] },
      { name: 'COUGHING', label: 'Coughing', type: 'select', options: [{label: 'Yes', value: 'YES'}, {label: 'No', value: 'NO'}] },
      { name: 'SHORTNESS OF BREATH', label: 'Shortness of Breath', type: 'select', options: [{label: 'Yes', value: 'YES'}, {label: 'No', value: 'NO'}] },
      { name: 'SWALLOWING DIFFICULTY', label: 'Swallowing Difficulty', type: 'select', options: [{label: 'Yes', value: 'YES'}, {label: 'No', value: 'NO'}] },
      { name: 'CHEST PAIN', label: 'Chest Pain', type: 'select', options: [{label: 'Yes', value: 'YES'}, {label: 'No', value: 'NO'}] },
    ]
  },
];

const steps = ['Model Select', 'Clinical Data', 'AI Analysis'];

const Predict = () => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedDisease, setSelectedDisease] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiAdvice, setAiAdvice] = useState({ quick: null, detailed: null });
  const [loadingAdvice, setLoadingAdvice] = useState(false);
  const [adviceLevel, setAdviceLevel] = useState('flash'); 
  const formRef = useRef(null);

  useEffect(() => {
    console.log("Diagnostic Hub Active: Session #AI-INIT-99");
    if (!diseases || diseases.length === 0) {
       console.error("Critical: Neural disease registry empty or corrupted.");
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateStep = () => {
    if (currentStep === 1 && selectedDisease) {
      const newErrors = {};
      selectedDisease.fields.forEach(field => {
        // Clinical Bypass for Pregnancy Logic
        if (selectedDisease.id === 'diabetes' && field.name === 'Pregnancies' && formData.Gender === 'M') return;
        
        const val = formData[field.name];
        if (!val && val !== 0) {
          newErrors[field.name] = 'Clinical requirement missing';
        } else if (field.type === 'number' && isNaN(val)) {
          newErrors[field.name] = 'Metric must be numerical';
        } else if (field.min !== undefined && val < field.min) {
           newErrors[field.name] = `Value below safe limit (${field.min})`;
        } else if (field.max !== undefined && val > field.max) {
           newErrors[field.name] = `Value exceeds safe limit (${field.max})`;
        }
      });
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    }
    return true;
  };

  const handleNext = () => {
    if (currentStep === 0 && !selectedDisease) return;
    if (currentStep === 1 && !validateStep()) return;
    setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
    if (currentStep === 2) setResult(null);
  };

  const runInference = async () => {
    if (!validateStep()) return;
    setLoading(true);
    setResult(null);
    
    try {
      const res = await predictRisk(selectedDisease.id, formData);
      
      if (res && res.status !== 'error') {
        setResult(res);
        setCurrentStep(2);
      } else {
        throw new Error(res?.error || 'Inference Node Failure');
      }
    } catch (err) {
      console.error(err);
      setErrors({ global: err.message });
    } finally {
      setLoading(false);
    }
  };

  const getClinicalAdvice = async (isDetailed = false) => {
    // If we already have the data, just switch view
    if (aiAdvice.quick && aiAdvice.detailed) {
      setAdviceLevel(isDetailed ? 'detailed' : 'flash');
      setShowAIModal(true);
      return;
    }

    setLoadingAdvice(true);
    setShowAIModal(true);
    setAdviceLevel(isDetailed ? 'detailed' : 'flash');
    try {
      const response = await fetchAIAdvice({
        disease: selectedDisease.name,
        inputs: formData,
        risk_level: result.risk_level,
        probability: result.probability,
        prediction: result.prediction
      });
      
      const rawText = response.combined_advice || "";
      const parts = rawText.split('---ROADMAP_START---');
      
      setAiAdvice({
        quick: parts[0]?.replace(/\*/g, '').replace('PART 1: QUICK ADVISORY', '').trim() || "No quick insights generated.",
        detailed: parts[1]?.replace(/\*/g, '').replace('PART 2: DETAILED ROADMAP', '').trim() || "Full roadmap processing pending node recovery."
      });
    } catch (err) {
      console.error(err);
      setAiAdvice({
        quick: "Failed to connect to the Gemini Neural Network.",
        detailed: "Verify your environment variables and API Key quota."
      });
    } finally {
      setLoadingAdvice(false);
    }
  };

  const handleDownload = () => {
    generateHealthReport({
      userName: user?.name,
      disease: selectedDisease.name,
      prediction: result.prediction,
      riskLevel: result.risk_level,
      probability: result.probability,
      explanation: result.explanation,
      aiAdvice: aiAdvice, // Pass the whole object { quick, detailed }
      inputs: formData
    });
  };


  if (!user) return <div className="h-screen w-full flex items-center justify-center text-slate-400 font-bold uppercase tracking-widest bg-[#F6F6F8] dark:bg-[#111621]">Unauthorized Access Node... Returning to HQ.</div>;

  return (
    <div className="max-w-3xl mx-auto w-full px-4 py-8 font-sans scroll-smooth">
      {/* Header Info */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase">AI Diagnostic Suite</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">Precision neural inference for clinical risk assessment.</p>
      </div>

      {/* Progress Stepper (Stitch Style) */}
      <div className="mb-12 relative px-4">
        <div className="flex items-center justify-between relative z-10">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 dark:bg-slate-800 -translate-y-1/2 z-0"></div>
          <motion.div 
            className="absolute top-1/2 left-0 h-0.5 bg-primary -translate-y-1/2 z-0 transition-all duration-500"
            initial={{ width: '0%' }}
            animate={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
          />
          {steps.map((step, i) => (
            <div key={step} className="relative z-10 flex flex-col items-center gap-2">
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-500 ${
                  i <= currentStep 
                    ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-110' 
                    : 'bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-400'
                }`}
              >
                {i < currentStep ? <CheckCircle2 size={18} /> : i + 1}
              </div>
              <span className={`text-[10px] uppercase font-black tracking-widest ${
                i <= currentStep ? 'text-primary' : 'text-slate-400'
              }`}>{step}</span>
            </div>
          ))}
        </div>
      </div>

      <div id="prediction-form" ref={formRef} className="glass-panel bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/20 dark:border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden transition-all duration-500">
        <AnimatePresence mode="wait">
          {/* Step 0: Module Selection */}
          {currentStep === 0 && (
            <motion.div 
              key="step0"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="space-y-2">
                <h2 className="text-xl font-bold dark:text-white">Choose Diagnostic Focus</h2>
                <p className="text-sm text-slate-500 leading-relaxed">Select the clinical model cluster specialized for your analysis goals.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {diseases.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setSelectedDisease(d)}
                    className={`p-6 rounded-2xl border-2 transition-all text-left flex flex-col items-center justify-center gap-4 group ${
                      selectedDisease?.id === d.id 
                        ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10' 
                        : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 bg-white/50 dark:bg-slate-800/50'
                    }`}
                  >
                    <div className="w-16 h-16 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 shadow-inner" style={{backgroundColor: `${d.color}15`, color: d.color}}>
                      <d.icon size={32} />
                    </div>
                    <div className="text-center">
                      <h4 className="font-bold dark:text-white text-lg">{d.name}</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Verified v1.0</p>
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex justify-end pt-4">
                <button 
                  onClick={handleNext}
                  disabled={!selectedDisease}
                  className="px-10 py-4 rounded-xl bg-primary text-white font-bold flex items-center gap-2 hover:bg-blue-700 disabled:opacity-50 transition-all shadow-xl shadow-primary/20"
                >
                  Continue <ArrowRight size={20} />
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 1: Clinical Data Entry (Stitch Style Inputs) */}
          {currentStep === 1 && selectedDisease && (
            <motion.div 
              key="step-form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="flex items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
                <div className="p-4 bg-primary/10 text-primary rounded-2xl shadow-inner">
                   <selectedDisease.icon size={28} />
                </div>
                <div>
                   <h3 className="text-2xl font-black dark:text-white tracking-tight uppercase">{selectedDisease.name} Biometrics</h3>
                   <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Session Protocol #AI-HEALTH-99</p>
                </div>
              </div>

              {errors.global && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold border border-red-100 dark:border-red-900/30 flex items-center gap-3 animate-shake">
                  <AlertTriangle size={18} /> {errors.global}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                 {selectedDisease.fields.map((field) => {
                    // Clinical logic to hide Pregnancy for Males
                    if (selectedDisease.id === 'diabetes' && field.name === 'Pregnancies' && formData.Gender === 'M') return null;
                    return (
                    <div key={field.name} className="space-y-2">
                       <label className="text-xs font-bold flex items-center gap-2 text-slate-700 dark:text-slate-300">
                          {field.name.toLowerCase().includes('age') ? <Calendar size={14} className="text-primary" /> : field.name.toLowerCase().includes('gender') || field.name.toLowerCase().includes('sex') ? <Users size={14} className="text-primary" /> : <Stethoscope size={14} className="text-primary" />}
                          {field.label}
                       </label>
                       
                       {field.type === 'select' ? (
                          <CustomSelect
                             name={field.name}
                             value={formData[field.name] || ''}
                             onChange={handleInputChange}
                             options={field.options}
                             placeholder="Select Option..."
                             className={`w-full bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent rounded-xl p-4 focus:ring-4 focus:ring-primary/10 focus:border-primary dark:text-white outline-none transition-all ${errors[field.name] ? 'border-red-500/50 bg-red-50/5' : ''}`}
                          />
                       ) : (
                          <div className="relative group">
                            <input 
                               name={field.name} 
                               type={field.type} 
                               step={field.step}
                               min={field.min}
                               max={field.max}
                               value={formData[field.name] || ''} 
                               onChange={handleInputChange} 
                               placeholder={field.placeholder} 
                               className={`w-full bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent rounded-xl p-4 focus:ring-4 focus:ring-primary/10 focus:border-primary dark:text-white outline-none transition-all ${errors[field.name] ? 'border-red-500/50 bg-red-50/5' : ''}`} 
                            />
                            {field.name.toLowerCase() === 'bmi' && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase text-slate-400">Index</span>}
                          </div>
                       )}
                       {errors[field.name] && <p className="text-[10px] text-red-500 font-black uppercase tracking-widest pl-1 mt-1 animate-pulse">{errors[field.name]}</p>}
                    </div>
                    )
                  })}
              </div>

              <div className="flex gap-4 pt-10 border-t border-slate-100 dark:border-slate-800">
                <button onClick={handleBack} className="flex-1 h-14 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-white font-bold flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                   <ArrowLeft size={18} /> Back
                </button>
                <button 
                  onClick={runInference}
                  disabled={loading}
                  className="flex-[2] h-14 rounded-xl bg-primary text-white font-bold flex items-center justify-center gap-3 hover:bg-blue-700 transition-all shadow-xl shadow-primary/30 disabled:opacity-50 relative overflow-hidden group"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      <span className="uppercase tracking-widest text-xs">Processing Neural State...</span>
                    </>
                  ) : (
                    <>
                      <span className="uppercase tracking-widest text-xs">Confirm & Run Analysis</span>
                      <BrainCircuit size={20} className="group-hover:rotate-12 transition-transform" />
                    </>
                  )}
                  {loading && (
                    <motion.div 
                      className="absolute bottom-0 left-0 h-1 bg-white/40"
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 2 }}
                    />
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Results (Stitch Style Result Panel) */}
          {currentStep === 2 && result && (
            <motion.div 
              id="result-panel"
              key="step-result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-10"
            >
              <div className="text-center relative">
                 <motion.div 
                    initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 20 }}
                    className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-emerald-500/20 shadow-inner"
                 >
                    <CheckCircle2 size={40} />
                 </motion.div>
                 <span className="px-5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-[0.3em] border border-emerald-500/20">Analysis Complete</span>
                 <h2 className="text-3xl font-black dark:text-white uppercase tracking-tight mt-6 leading-none">{result.prediction}</h2>
              </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start px-4">
                 {/* Circular Gauge */}
                 <div className="flex flex-col items-center justify-center relative py-4">
                    <div className="relative w-48 h-48">
                       <svg className="w-full h-full transform -rotate-90">
                          <circle cx="96" cy="96" r="88" strokeWidth="12" fill="transparent" className="text-slate-100 dark:text-slate-800 stroke-current" />
                          <motion.circle 
                             cx="96" cy="96" r="88" strokeWidth="12" fill="transparent" strokeLinecap="round"
                             className={`${result.risk_level === 'High' ? 'text-red-500' : result.risk_level === 'Medium' ? 'text-amber-500' : 'text-emerald-500'} stroke-current`}
                             initial={{ strokeDasharray: "553", strokeDashoffset: "553" }}
                             animate={{ strokeDashoffset: 553 - (553 * (result.probability || 0.45)) }}
                             transition={{ duration: 1.5, ease: "easeOut" }}
                          />
                       </svg>
                       <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-4xl font-black dark:text-white">{(result.probability * 100).toFixed(0)}%</span>
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">AI Confidence</span>
                       </div>
                    </div>
                    <div className="mt-8 flex items-center gap-3 px-6 py-2 rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 shadow-xl shadow-slate-200/50 dark:shadow-none">
                       <AlertTriangle size={20} className={result.risk_level === 'High' ? 'text-red-500' : 'text-amber-500'} />
                       <span className="text-sm font-black uppercase tracking-widest dark:text-white">{result.risk_level} Health Risk</span>
                    </div>
                 </div>

                 {/* Insights List */}
                 <div className="space-y-6">
                    <h4 className="text-sm font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                       <TrendingUp size={16} /> Neural Interpretations
                    </h4>
                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                       {result.explanation?.map((item, i) => (
                          <motion.div 
                             key={i} 
                             initial={{ opacity: 0, x: 10 }}
                             animate={{ opacity: 1, x: 0 }}
                             transition={{ delay: i * 0.1 }}
                             className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/50 flex flex-col gap-3"
                          >
                             <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black dark:text-white uppercase tracking-tight">{item.feature}</span>
                                <span className={`text-[10px] font-mono font-bold ${item.impact > 0 ? 'text-primary' : 'text-emerald-500'}`}>
                                   {item.impact > 0 ? '+' : '-'}{Math.abs(item.impact).toFixed(2)}
                                </span>
                             </div>
                             <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                <motion.div initial={{ width: 0 }} animate={{ width: `${Math.pow(Math.abs(item.impact), 1/2) * 100}%` }} className={`h-full ${item.impact > 0 ? 'bg-primary' : 'bg-emerald-500'}`} />
                             </div>
                          </motion.div>
                       ))}
                    </div>
                 </div>
              </div>

              {/* Actions */}
               <div className="flex flex-col gap-4 pt-10 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex gap-4">
                    <button 
                    onClick={handleDownload}
                    className="flex-1 h-14 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-3 hover:scale-[1.02] shadow-xl transition-all uppercase tracking-widest text-xs"
                    >
                        <Download size={18} /> Download Diagnostic Report
                    </button>
                    <button 
                    onClick={() => getClinicalAdvice(false)}
                    className="flex-1 h-14 border-2 border-emerald-500 text-emerald-500 rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-emerald-500/5 transition-all uppercase tracking-widest text-xs"
                    >
                        <Sparkles size={18} /> Quick Advice
                    </button>
                  </div>
                  <div className="flex gap-4">
                    <button 
                    onClick={() => getClinicalAdvice(true)}
                    className="w-full h-14 border-2 border-primary text-primary rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-primary/5 transition-all uppercase tracking-widest text-xs"
                    >
                        <Layout size={18} /> Detailed Roadmap
                    </button>
                  </div>
               </div>

              <div className="text-center">
                 <button 
                    onClick={() => { setCurrentStep(0); setResult(null); setFormData({}); }}
                    className="text-slate-400 text-[10px] font-black uppercase tracking-widest hover:text-primary transition-colors underline underline-offset-8"
                 >
                    Launch New Analysis Session
                 </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* AI Advisory Modal */}
      <AnimatePresence>
        {showAIModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/10 flex flex-col max-h-[90vh]"
            >
              <div className="px-10 py-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center shadow-inner">
                    <Sparkles size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black dark:text-white uppercase tracking-tight">Gemini AI Advisory</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis">Analyzing Health Metric Trajectory</p>
                  </div>
                </div>
                <button onClick={() => setShowAIModal(false)} className="p-3 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors shrink-0">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

              <div className="p-10 flex-1 overflow-y-auto custom-scrollbar">
                {loadingAdvice ? (
                  <div className="flex flex-col items-center justify-center h-40 space-y-4 text-primary">
                    <Loader2 size={40} className="animate-spin" />
                    <p className="text-xs font-black uppercase tracking-[0.2em] animate-pulse">Neural Genesis Active...</p>
                  </div>
                ) : (
                  <div className="prose prose-sm dark:prose-invert max-w-none font-medium leading-relaxed prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tight prose-a:text-primary">
                      {(adviceLevel === 'flash' ? aiAdvice.quick : aiAdvice.detailed)?.split('\n').map((line, index) => {
                        if (line.trim().startsWith('##')) {
                         return <h3 key={index} className="text-lg font-black uppercase tracking-tight mt-6 mb-3 text-primary dark:text-white">{line.replace('##', '').trim()}</h3>;
                        }
                        return <p key={index} className="mb-2 dark:text-white/90">{line.replace(/\*\*(.*?)\*\*/g, '$1')}</p>;
                      })}
                  </div>
                )}
              </div>

              <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex flex-col items-center gap-6">
                 <div className="flex w-full gap-4">
                    {!loadingAdvice && adviceLevel === 'flash' && (
                       <button 
                         onClick={() => getClinicalAdvice(true)}
                         className="flex-1 py-4 rounded-2xl bg-primary text-white text-[11px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-primary/20"
                       >
                         Explore Detailed Roadmap
                       </button>
                    )}
                    <button 
                      onClick={() => setShowAIModal(false)}
                      className="flex-1 py-4 rounded-2xl border-2 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-[11px] font-black uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                    >
                      Dismiss Advisory
                    </button>
                 </div>
                 
                 <div className="flex justify-center text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">
                   <ShieldCheck size={14} className="text-emerald-500 mr-2" /> Powered by Google Gemini AI
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Background Decorative Elements */}
      <div className="fixed top-0 left-0 -z-10 w-full h-full overflow-hidden opacity-30 pointer-events-none">
         <motion.div 
            animate={{ scale: [1, 1.2, 1], x: [0, 50, 0], y: [0, 30, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px]" 
         />
         <motion.div 
            animate={{ scale: [1, 1.1, 1], x: [0, -40, 0], y: [0, -20, 0] }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-blue-400/10 blur-[150px]" 
         />
      </div>
    </div>
  );
};

export default Predict;
