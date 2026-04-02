import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, 
  CheckCircle2, 
  Brain, 
  Activity, 
  ShieldCheck, 
  Globe,
  Zap,
  Layout,
  PlayCircle,
  Stethoscope,
  TrendingUp,
  Award,
  Shield,
  Search,
  Bell,
  Menu
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/layout/Footer';

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f6f6f8] dark:bg-[#111621] font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {/* Sticky Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-primary/10 bg-white/80 dark:bg-[#111621]/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
              <Activity size={20} />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">HealthAI</h2>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a className="text-sm font-medium hover:text-primary transition-colors" href="#features">Platform</a>
            <a className="text-sm font-medium hover:text-primary transition-colors" href="#solutions">Solutions</a>
            <a className="text-sm font-medium hover:text-primary transition-colors" href="#accuracy">Accuracy</a>
          </nav>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/login')}
              className="text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-primary px-4 py-2 transition-colors"
            >
              Login
            </button>
            <button 
              onClick={() => navigate('/predict')}
              className="rounded-lg bg-primary px-5 py-2 text-sm font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-16 pb-24 md:pt-24 md:pb-32">
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute -top-[10%] -left-[10%] h-[400px] w-[400px] rounded-full bg-primary/10 blur-[100px]"></div>
            <div className="absolute top-[20%] -right-[5%] h-[300px] w-[300px] rounded-full bg-primary/5 blur-[80px]"></div>
          </div>
          <div className="container mx-auto px-4 md:px-6 text-center">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-auto mb-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 backdrop-blur-sm"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
              </span>
              <span className="text-xs font-semibold tracking-wide text-primary uppercase">v2.0 Pulse Engine Active</span>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mx-auto max-w-4xl text-4xl font-black leading-tight tracking-tight text-slate-900 dark:text-white md:text-6xl lg:text-7xl"
            >
              Predict Disease Risk with <span className="text-primary italic">AI Intelligence</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mx-auto mt-6 max-w-2xl text-lg text-slate-600 dark:text-slate-400 md:text-xl leading-relaxed"
            >
              Data-driven early diagnosis powered by machine learning models trained on over 1.2 billion clinical data points.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
            >
              <button 
                onClick={() => navigate('/predict')}
                className="flex h-14 min-w-[200px] items-center justify-center gap-2 rounded-xl bg-primary px-8 text-base font-bold text-white shadow-xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-95"
              >
                Start Free Prediction <ArrowRight size={20} />
              </button>
            </motion.div>

          </div>
        </section>


        {/* Feature Section */}
        <section id="features" className="py-24 bg-white dark:bg-slate-950 transition-colors duration-300">
          <div className="container mx-auto px-4 md:px-6">
            <div className="mb-16 flex flex-col items-start gap-4 md:flex-row md:items-end md:justify-between">
              <div className="max-w-2xl">
                <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white md:text-4xl">Advanced AI Diagnostic Tools</h2>
                <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">Empowering healthcare providers through high-fidelity machine learning and real-time biometric analysis.</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="group relative flex flex-col gap-4 rounded-2xl border border-slate-100 bg-[#f6f6f8] p-8 transition-all hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                  <Brain size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">AI Accuracy Engine</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">High-precision neural models refined through billions of validated clinical cases.</p>
                </div>
              </div>
              
              <div className="group relative flex flex-col gap-4 rounded-2xl border border-slate-100 bg-[#f6f6f8] p-8 transition-all hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                  <TrendingUp size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Real-Time Risk</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">Instant feedback on health indicators with millisecond processing latency.</p>
                </div>
              </div>

              <div className="group relative flex flex-col gap-4 rounded-2xl border border-slate-100 bg-[#f6f6f8] p-8 transition-all hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Secure Data</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">Enterprise-grade AES-256 encryption and HIPAA-compliant data storage protocols.</p>
                </div>
              </div>

              <div className="group relative flex flex-col gap-4 rounded-2xl border border-slate-100 bg-[#f6f6f8] p-8 transition-all hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                  <Award size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Smart Insights</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">Personalized health recommendations tailored to individual genetic markers.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Trust & Stats Section */}
        <section id="accuracy" className="py-24 bg-[#f6f6f8] dark:bg-[#111621] transition-colors duration-300">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col gap-16 lg:flex-row lg:items-center">
              <div className="lg:w-1/2">
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-200 dark:bg-slate-800 px-3 py-1 mb-6">
                  <CheckCircle2 size={16} className="text-primary" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Clinically Validated</span>
                </div>
                <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white md:text-5xl lg:leading-tight">
                  Industry-Leading <br/><span className="text-primary">Medical Accuracy</span>
                </h2>
                <p className="mt-6 text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
                  Our platform adheres to the highest medical standards, using a WHO-style reference layout for data validation and cross-referencing against global health benchmarks.
                </p>
                <div className="mt-10 flex flex-wrap gap-8">
                  <div className="flex flex-col gap-1">
                    <span className="text-3xl font-black text-primary">99.8%</span>
                    <span className="text-sm font-medium text-slate-500">Model Accuracy</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-3xl font-black text-primary">1.2B+</span>
                    <span className="text-sm font-medium text-slate-500">Data Points Analyzed</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-3xl font-black text-primary">500+</span>
                    <span className="text-sm font-medium text-slate-500">Partner Clinics</span>
                  </div>
                </div>
              </div>
              
              <div className="lg:w-1/2">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white bg-white/60 p-6 shadow-sm backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/60">
                    <div className="mb-4 flex items-center justify-between">
                      <TrendingUp className="text-primary" />
                      <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">+0.2%</span>
                    </div>
                    <h4 className="text-slate-500 text-sm font-medium">Diagnostic Precision</h4>
                    <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">99.85%</p>
                    <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div className="h-full w-[99%] bg-primary"></div>
                    </div>
                  </div>
                  
                  <div className="rounded-2xl border border-white bg-white/60 p-6 shadow-sm backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/60">
                    <div className="mb-4 flex items-center justify-between">
                      <Activity className="text-primary" />
                      <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">+15%</span>
                    </div>
                    <h4 className="text-slate-500 text-sm font-medium">Dataset Expansion</h4>
                    <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">1.24B</p>
                    <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div className="h-full w-[85%] bg-primary"></div>
                    </div>
                  </div>

                  <div className="sm:col-span-2 rounded-2xl border border-white bg-white/60 p-6 shadow-sm backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/60">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                          <Stethoscope size={24} className="text-primary" />
                        </div>
                        <div>
                          <h4 className="text-slate-500 text-sm font-medium">Global Network</h4>
                          <p className="text-xl font-bold text-slate-900 dark:text-white">528 Partner Clinics</p>
                        </div>
                      </div>
                      <div className="flex -space-x-3 overflow-hidden">
                        {[1, 2, 3].map((i) => (
                          <img 
                            key={i}
                            className="inline-block h-10 w-10 rounded-full ring-2 ring-white" 
                            src={`https://i.pravatar.cc/100?img=${i+10}`}
                            alt="Clinic Logo"
                          />
                        ))}
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-xs font-bold ring-2 ring-white">+50</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section id="solutions" className="py-20 bg-white dark:bg-slate-950 transition-colors duration-300">
          <div className="container mx-auto px-4 md:px-6">
            <div className="relative overflow-hidden rounded-3xl bg-primary px-8 py-16 text-center text-white md:px-16 md:py-20 shadow-2xl shadow-primary/20">
              <div className="absolute inset-0 opacity-10">
                <svg className="h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                  <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                    <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5"></path>
                  </pattern>
                  <rect width="100" height="100" fill="url(#grid)"></rect>
                </svg>
              </div>
              <div className="relative z-10">
                <h2 className="text-3xl font-bold md:text-5xl">Ready to enhance your diagnostics?</h2>
                <p className="mx-auto mt-6 max-w-2xl text-lg text-blue-100 opacity-90">
                  Join over 500 clinical centers using our platform to save lives through early detection.
                </p>
                <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                  <button 
                    onClick={() => navigate('/predict')}
                    className="flex h-12 items-center justify-center rounded-lg bg-white px-8 text-sm font-bold text-primary transition-all hover:bg-slate-100"
                  >
                    Get Started Now
                  </button>
                  <button className="flex h-12 items-center justify-center rounded-lg border border-white/30 bg-white/10 px-8 text-sm font-bold backdrop-blur-sm transition-all hover:bg-white/20">
                    Contact Sales
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Landing;
