import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);

  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);

  const fetchNotifications = async (currentToken) => {
    try {
      const activeToken = currentToken || token;
      if (!activeToken) return;

      const res = await fetch('/api/notifications', {
        headers: { 'Authorization': `Bearer ${activeToken}` }
      });
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
     const storedUser = localStorage.getItem('user');
     const storedToken = localStorage.getItem('token');
     
     if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
        fetchNotifications(storedToken);
     }
     setLoading(false);
  }, []);

  // Periodic Refresh for alerts
  useEffect(() => {
    if (token) {
      const interval = setInterval(() => fetchNotifications(), 60000); // Every 1 min
      return () => clearInterval(interval);
    }
  }, [token]);

  const login = (userData, jwtToken) => {
    setUser(userData);
    setToken(jwtToken);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', jwtToken);
    fetchNotifications(jwtToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setNotifications([]);
    localStorage.clear(); 
  };

  const updateRole = (role) => {
    setUser(prev => {
       const updated = { ...prev, role };
       localStorage.setItem('user', JSON.stringify(updated));
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
