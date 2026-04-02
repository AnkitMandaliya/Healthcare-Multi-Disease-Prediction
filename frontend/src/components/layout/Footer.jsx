import React from 'react';
import { Microscope, Activity, Github, Twitter, Linkedin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-white dark:bg-[#111621] border-t border-slate-200 dark:border-slate-800 py-12 transition-colors duration-300">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-3 text-primary mb-6">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <Microscope size={24} />
              </div>
              <h2 className="font-bold text-xl tracking-tight dark:text-white">HealthAI</h2>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed max-w-xs">
              Pioneering the future of predictive healthcare through ethical AI and clinical excellence.
            </p>
            <div className="flex gap-4 mt-6">
              {[Twitter, Github, Linkedin].map((Icon, i) => (
                <a key={i} href="#" className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all">
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-900 dark:text-white mb-6">Platform</h3>
            <ul className="space-y-4">
              {['Risk Assessment', 'Neural Hub', 'Clinical Accuracy', 'Security'].map(item => (
                <li key={item}>
                  <a href="#" className="text-sm text-slate-500 hover:text-primary transition-colors">{item}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-900 dark:text-white mb-6">Resources</h3>
            <ul className="space-y-4">
              {['Documentation', 'API Reference', 'Medical Board', 'Whitepapers'].map(item => (
                <li key={item}>
                  <a href="#" className="text-sm text-slate-500 hover:text-primary transition-colors">{item}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-900 dark:text-white mb-6">Support</h3>
            <ul className="space-y-4">
              {['Help Center', 'System Status', 'Privacy Policy', 'Terms of Service'].map(item => (
                <li key={item}>
                  <a href="#" className="text-sm text-slate-500 hover:text-primary transition-colors">{item}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-slate-400">© 2026 HealthAI Intelligence Platform. HIPAA Compliant.</p>
          <div className="flex gap-8">
            <a href="#" className="text-xs text-slate-400 hover:text-primary transition-colors">Security</a>
            <a href="#" className="text-xs text-slate-400 hover:text-primary transition-colors">Privacy</a>
            <a href="#" className="text-xs text-slate-400 hover:text-primary transition-colors">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
