import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
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

const PublicRoute = ({ children }) => {
  const { user, token, loading } = useAuth();
  if (loading) return <div className="h-screen w-screen bg-[#F6F6F8] dark:bg-[#111621] flex items-center justify-center text-primary font-black uppercase tracking-[0.3em] animate-pulse">Initializing Secure Node...</div>;
  
  if (user && token) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

const AuthenticatedLayout = () => {
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
      <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 h-full">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-6 lg:p-10 scrollbar-hide relative">
          <AnimatePresence mode="wait">
             <motion.div
               key={location.key}
               initial={{ opacity: 0, scale: 0.98 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 1.02 }}
               transition={{ duration: 0.3, ease: 'easeInOut' }}
               className="min-h-full"
             >
               <Outlet />
             </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

const AdminLayout = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user?.role !== 'admin') {
      return <Navigate to="/dashboard" replace />;
  }
  return <Outlet />;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<PublicRoute><Auth /></PublicRoute>} />
      
      {/* Protected UI Cluster */}
      <Route element={<AuthenticatedLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/predict" element={<Predict />} /> 
        <Route path="/roles" element={<Roles />} />
        <Route path="/profile" element={<Profile />} />
        
        {/* Admin Tier */}
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<Admin />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
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
