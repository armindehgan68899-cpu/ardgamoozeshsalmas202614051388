import React, { useEffect, useState } from 'react';
import { NotificationType } from '../types';

interface Props {
  notification: NotificationType | null;
  onClose: () => void;
}

const Notification: React.FC<Props> = ({ notification, onClose }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (notification) {
      setVisible(true);
      const timer = setTimeout(() => {
        handleClose();
      }, 5000); 
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleClose = () => {
      setVisible(false);
      setTimeout(onClose, 300);
  };

  if (!notification && !visible) return null;

  const styles = {
      error: 'bg-red-500/10 border-red-500 text-red-200 shadow-red-500/20',
      success: 'bg-green-500/10 border-green-500 text-green-200 shadow-green-500/20',
      info: 'bg-blue-500/10 border-blue-500 text-blue-200 shadow-blue-500/20',
      warning: 'bg-yellow-500/10 border-yellow-500 text-yellow-200 shadow-yellow-500/20'
  };

  return (
    <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-[200] transition-all duration-300 ${visible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
        <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl backdrop-blur-xl border ${notification ? styles[notification.type] : ''} shadow-xl min-w-[300px]`}>
            <span className="text-2xl">
                {notification?.type === 'error' && '🛑'}
                {notification?.type === 'success' && '✅'}
                {notification?.type === 'info' && 'ℹ️'}
            </span>
            <p className="text-sm font-medium">{notification?.message}</p>
            <button onClick={handleClose} className="mr-auto opacity-50 hover:opacity-100">✕</button>
        </div>
    </div>
  );
};

export default Notification;
