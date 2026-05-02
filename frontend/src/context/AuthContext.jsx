import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = sessionStorage.getItem('user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch { return null; }
  });

  const [token, setToken] = useState(() => sessionStorage.getItem('token') || null);
  const [loading, setLoading] = useState(!sessionStorage.getItem('token')); // Only load if we don't have a token to verify
  const [notifications, setNotifications] = useState([]);

  const fetchNotifications = async (currentToken) => {
    try {
      const activeToken = currentToken || token;
      if (!activeToken) return;

      const res = await fetch('https://healthcare-multi-disease-prediction.onrender.com/api/notifications', {
        headers: { 'Authorization': `Bearer ${activeToken}` }
      });
      if (res.status === 401) {
        console.warn("Session expired or invalid token - logging out.");
        logout();
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error("Failed to fetch node alerts", err);
    }
  };

  useEffect(() => {
    // Load user from local storage if token exists
    try {
      const storedUser = sessionStorage.getItem('user');
      const storedToken = sessionStorage.getItem('token');
      
      if (storedUser && storedToken) {
        try {
          setUser(JSON.parse(storedUser));
          setToken(storedToken);
          fetchNotifications(storedToken);
        } catch (parseErr) {
          console.warn("Session data corrupted, resetting node.");
          sessionStorage.removeItem('user');
          sessionStorage.removeItem('token');
        }
      }
    } catch (err) {
      console.error("Critical: Failed to synchronize neural session", err);
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  }, []);

  // Periodic Refresh for alerts
  useEffect(() => {
    if (token) {
      const interval = setInterval(() => fetchNotifications(), 60000); // Every 1 min
      return () => clearInterval(interval);
    }
  }, [token]);

  const login = (userData, jwtToken) => {
    const sessionUser = { ...userData, session_start: new Date().toISOString() };
    setUser(sessionUser);
    setToken(jwtToken);
    sessionStorage.setItem('user', JSON.stringify(sessionUser));
    sessionStorage.setItem('token', jwtToken);
    fetchNotifications(jwtToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setNotifications([]);
    sessionStorage.clear(); 
  };

  const updateRole = (role) => {
    setUser(prev => {
       const updated = { ...prev, role };
       sessionStorage.setItem('user', JSON.stringify(updated));
       return updated;
    });
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      login, 
      logout, 
      notifications, 
      fetchNotifications, 
      updateRole, 
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
