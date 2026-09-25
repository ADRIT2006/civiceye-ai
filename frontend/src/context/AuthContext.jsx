import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const PRESET_USERS = {
  citizen: {
    id: 1,
    name: 'Priya Sharma',
    role: 'citizen',
    email: 'citizen.priya@civiceye.in',
    ward: 'Ward 12 - Indiranagar',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    title: 'Verified Resident (Level 3 Verifier)',
    dashboardPath: '/citizen/dashboard',
    badge: 'Resident'
  },
  worker: {
    id: 2,
    name: 'Rajesh Kumar',
    role: 'worker',
    email: 'worker.rajesh@civiceye.in',
    department: 'Roads & Public Infrastructure',
    ward: 'Ward 12 - Indiranagar',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    title: 'Senior Road Maintenance Crew Lead',
    dashboardPath: '/worker/dashboard',
    badge: 'Field Ops'
  },
  admin: {
    id: 3,
    name: 'Dr. Arvind Verma',
    role: 'admin',
    email: 'commissioner@citycorp.gov.in',
    department: 'Office of the Municipal Commissioner',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
    title: 'Municipal Commissioner (IAS)',
    dashboardPath: '/admin/dashboard',
    badge: 'Authority'
  }
};

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentRole, setCurrentRole] = useState(() => {
    return localStorage.getItem('civiceye_role') || 'citizen';
  });
  const [toasts, setToasts] = useState([]);
  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const user = PRESET_USERS[currentRole] || PRESET_USERS.citizen;

  // Sync role to localStorage
  useEffect(() => {
    localStorage.setItem('civiceye_role', currentRole);
    loadNotifications(currentRole);
  }, [currentRole]);

  const loadNotifications = async (role) => {
    try {
      const data = await api.getRoleNotifications(role);
      setNotifications(data || []);
    } catch (err) {
      console.warn('Failed to load notifications:', err);
    }
  };

  const markNotificationRead = async (id) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const switchRole = (newRole, navigate = null) => {
    if (newRole === currentRole) return;
    setCurrentRole(newRole);
    localStorage.setItem('civiceye_role', newRole);

    const targetUser = PRESET_USERS[newRole] || PRESET_USERS.citizen;
    showToast(`Viewing as ${targetUser.role.toUpperCase()}: ${targetUser.name}`, 'info');

    // Auto-redirect to appropriate dashboard without full reload
    if (navigate) {
      navigate(targetUser.dashboardPath);
    }
  };

  const showToast = (message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <AuthContext.Provider
      value={{
        currentRole,
        user,
        switchRole,
        showToast,
        toasts,
        removeToast,
        emergencyModalOpen,
        openEmergencyModal: () => setEmergencyModalOpen(true),
        closeEmergencyModal: () => setEmergencyModalOpen(false),
        notifications,
        unreadCount,
        refreshNotifications: () => loadNotifications(currentRole),
        markNotificationRead
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
