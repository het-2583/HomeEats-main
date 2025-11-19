import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const user = useSelector((state) => state.auth.user);
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Helper to get the right key for notifications
  const getNotifKey = () => {
    if (!user || !user.id) return null;
    if (user.user_type === 'owner') return `owner_notifications_${user.id}`;
    return `customer_notifications_${user.id}`;
  };

  // Load notifications for the current user
  useEffect(() => {
    const notifKey = getNotifKey();
    if (notifKey) {
      const saved = localStorage.getItem(notifKey);
      setNotifications(saved ? JSON.parse(saved) : []);
    } else {
      setNotifications([]); // No user, clear notifications
    }
  }, [user]);

  // Save notifications for the current user
  useEffect(() => {
    const notifKey = getNotifKey();
    if (notifKey) {
      localStorage.setItem(notifKey, JSON.stringify(notifications));
      setUnreadCount(notifications.filter(n => !n.read).length);
    } else {
      setUnreadCount(0);
    }
  }, [notifications, user]);

  const addNotification = (message) => {
    if (!user || !user.id) return; // Only add if user is logged in
    setNotifications(prev => {
      const newNotif = {
        id: Date.now(),
        message,
        timestamp: new Date().toISOString(),
        read: false,
      };
      return [newNotif, ...prev]; // No slice, keep all notifications
    });
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
    const notifKey = getNotifKey();
    if (notifKey) {
      localStorage.removeItem(notifKey);
    }
  };

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, unreadCount, markAllRead, clearNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
}; 