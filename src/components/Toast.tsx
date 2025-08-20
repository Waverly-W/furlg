import React, { useState, useEffect } from 'react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

interface ToastProps {
  message: ToastMessage;
  onClose: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ message, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 显示动画
    const showTimer = setTimeout(() => setIsVisible(true), 10);
    
    // 自动关闭
    const duration = message.duration || 3000;
    const hideTimer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose(message.id), 300); // 等待动画完成
    }, duration);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [message, onClose]);

  const getIcon = () => {
    switch (message.type) {
      case 'success':
        return (
          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'info':
      default:
        return (
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getClasses = () => {
    switch (message.type) {
      case 'success': return 'border-green-200/80 bg-green-50';
      case 'error': return 'border-red-200/80 bg-red-50';
      case 'warning': return 'border-yellow-200/80 bg-yellow-50';
      case 'info':
      default: return 'border-blue-200/80 bg-blue-50';
    }
  };

  return (
    <div
      className={`fixed top-4 right-4 max-w-sm w-full border-l-4 ${getClasses()} rounded-lg shadow-lg transform transition-all duration-300 z-50 ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-gray-900">
              {message.title}
            </h3>
            {message.message && (
              <p className="mt-1 text-sm text-gray-600">
                {message.message}
              </p>
            )}
          </div>
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(() => onClose(message.id), 300);
            }}
            className="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

// Toast 容器组件
interface ToastContainerProps {
  messages: ToastMessage[];
  onRemove: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ messages, onRemove }) => {
  return (
    <div className="fixed top-0 right-0 z-50 p-4 space-y-2">
      {messages.map((message) => (
        <Toast key={message.id} message={message} onClose={onRemove} />
      ))}
    </div>
  );
};

// Toast Hook
export const useToast = () => {
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setMessages(prev => [...prev, { ...toast, id }]);
  };

  const removeToast = (id: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== id));
  };

  const showSuccess = (title: string, message?: string) => {
    addToast({ type: 'success', title, message });
  };

  const showError = (title: string, message?: string) => {
    addToast({ type: 'error', title, message, duration: 5000 });
  };

  const showWarning = (title: string, message?: string) => {
    addToast({ type: 'warning', title, message });
  };

  const showInfo = (title: string, message?: string) => {
    addToast({ type: 'info', title, message });
  };

  return {
    messages,
    removeToast,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
};
