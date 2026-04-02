import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import Navbar from './components/layout/Navbar';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Predict from './pages/Predict';
import Auth from './pages/Auth';
import Roles from './pages/Roles';
import Admin from './pages/Admin';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const SharedLayout = ({ children }) => {
  const { user, token, loading } = useAuth();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  if (loading) {
    return <div className="h-screen w-screen bg-[#F6F6F8] dark:bg-[#111621] flex items-center justify-center text-primary font-black uppercase tracking-[0.3em] animate-pulse">Initializing Secure Node...</div>;
  }

  // If user is authenticated, show the full dashboard layout
  if (user && token) {
    return (
      <div className="flex h-screen bg-[#F6F6F8] dark:bg-[#111621] transition-colors duration-300 overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 h-full">
          <Navbar onMenuClick={() => setSidebarOpen(!isSidebarOpen)} />
          <main className="flex-1 overflow-y-auto p-6 lg:p-10 scrollbar-hide">
            <AnimatePresence mode="wait">
               <motion.div
                 key={location.pathname}
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: -10 }}
                 transition={{ duration: 0.3 }}
               >
                 {children}
               </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    );
  }

  // If guest, show just the content (e.g. for landing page "Free Prediction" flow)
  return (
    <div className="min-h-screen bg-[#f6f6f8] dark:bg-[#111621] transition-colors duration-300">
      <main className="p-4 md:p-10">
        <AnimatePresence mode="wait">
           <motion.div
             key={location.pathname}
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             exit={{ opacity: 0, y: -10 }}
             transition={{ duration: 0.3 }}
           >
             <div className="flex justify-start mb-6">
                <button 
                  onClick={() => window.location.href = '/'} 
                  className="px-6 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 font-bold text-xs uppercase tracking-widest hover:text-primary transition-all shadow-sm"
                >
                  Return to Hub
                </button>
             </div>
             {children}
           </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

const AuthenticatedLayout = ({ children }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { user, token, loading } = useAuth();
  
  if (loading) {
    return <div className="h-screen w-screen bg-[#F6F6F8] dark:bg-[#111621] flex items-center justify-center text-primary font-black uppercase tracking-[0.3em] animate-pulse">Initializing Secure Node...</div>;
  }

  if (!user || !token) {
     return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return (
    <div className="flex h-screen bg-[#F6F6F8] dark:bg-[#111621] transition-colors duration-300 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 h-full">
        <Navbar onMenuClick={() => setSidebarOpen(!isSidebarOpen)} />
        <main className="flex-1 overflow-y-auto p-6 lg:p-10 scrollbar-hide">
          <AnimatePresence mode="wait">
             <motion.div
               key={location.pathname}
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -10 }}
               transition={{ duration: 0.3 }}
             >
               {children}
             </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

const AdminLayout = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user?.role !== 'admin') {
      return <Navigate to="/dashboard" replace />;
  }
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Auth />} />
      <Route path="/dashboard" element={<AuthenticatedLayout><Dashboard /></AuthenticatedLayout>} />
      <Route path="/predict" element={<AuthenticatedLayout><Predict /></AuthenticatedLayout>} /> 
      <Route path="/roles" element={<AuthenticatedLayout><Roles /></AuthenticatedLayout>} />
      <Route path="/profile" element={<AuthenticatedLayout><Profile /></AuthenticatedLayout>} />
      <Route path="/admin" element={<AdminLayout><Admin /></AdminLayout>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
