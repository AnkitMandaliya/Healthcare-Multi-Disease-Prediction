import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
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
import { LoadingProvider, useLoading } from './context/LoadingContext';
import GlobalLoader from './components/layout/GlobalLoader';
import { motion, AnimatePresence } from 'framer-motion';

const PublicRoute = ({ children }) => {
  const { user, token, loading } = useAuth();
  const { startLoading, stopLoading } = useLoading();
  
  React.useEffect(() => {
    if (loading) startLoading();
    else stopLoading();
  }, [loading]);

  if (loading) return null;
  
  if (user && token) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

const AuthenticatedLayout = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { user, token, loading } = useAuth();
  const { startLoading, stopLoading } = useLoading();
  
  React.useEffect(() => {
    if (loading) startLoading();
    else stopLoading();
  }, [loading]);

  if (loading) return null;

  if (!user || !token) {
     return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-[#0B0F1A] transition-colors duration-300 overflow-hidden">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 h-full">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-6 lg:p-10 scrollbar-hide relative">
          <AnimatePresence>
             <motion.div
               key={location.key}
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -10 }}
               transition={{ duration: 0.2 }}
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
      <LoadingProvider>
        <AuthProvider>
          <GlobalLoader />
          <Router>
            <AppRoutes />
          </Router>
        </AuthProvider>
      </LoadingProvider>
    </ThemeProvider>
  );
}

export default App;
