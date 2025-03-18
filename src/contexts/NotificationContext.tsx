
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Notification } from '@/components/ui/notification';
import { createPortal } from 'react-dom';

export type NotificationType = 'default' | 'info' | 'success' | 'warning' | 'danger';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  duration?: number;
  action?: React.ReactNode;
}

interface NotificationContextType {
  notifications: NotificationItem[];
  addNotification: (notification: Omit<NotificationItem, 'id'>) => string;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const DEFAULT_DURATION = 5000; // 5 seconds

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // Create the portal container when the component mounts
    const container = document.createElement('div');
    container.id = 'notification-portal';
    container.style.position = 'fixed';
    container.style.top = '1rem';
    container.style.right = '1rem';
    container.style.zIndex = '9999';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '0.5rem';
    container.style.maxWidth = '100%';
    container.style.width = 'max-content';
    container.style.maxHeight = '100vh';
    container.style.overflowY = 'auto';
    container.style.padding = '1rem';
    container.style.pointerEvents = 'none';

    document.body.appendChild(container);
    setPortalContainer(container);

    // Clean up when unmounting
    return () => {
      document.body.removeChild(container);
    };
  }, []);

  const addNotification = useCallback((notification: Omit<NotificationItem, 'id'>) => {
    const id = uuidv4();
    const newNotification = {
      ...notification,
      id,
      duration: notification.duration || DEFAULT_DURATION,
    };

    setNotifications((prev) => [...prev, newNotification]);

    // Auto-remove notification after duration
    if (newNotification.duration !== Infinity) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }

    return id;
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const value = {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      {portalContainer &&
        createPortal(
          <div className="pointer-events-none">
            {notifications.map((notification) => (
              <div key={notification.id} className="pointer-events-auto mb-3 animate-in slide-in-from-right-5 fade-in duration-300">
                <Notification
                  variant={notification.type}
                  title={notification.title}
                  onClose={() => removeNotification(notification.id)}
                >
                  {notification.message}
                  {notification.action}
                </Notification>
              </div>
            ))}
          </div>,
          portalContainer
        )}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
