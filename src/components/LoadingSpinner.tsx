import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'blue' | 'gray' | 'white';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  color = 'blue',
  className = '' 
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return 'w-4 h-4';
      case 'lg': return 'w-8 h-8';
      case 'md':
      default: return 'w-6 h-6';
    }
  };

  const getColorClasses = () => {
    switch (color) {
      case 'gray': return 'text-gray-500';
      case 'white': return 'text-white';
      case 'blue':
      default: return 'text-blue-500';
    }
  };

  return (
    <svg
      className={`animate-spin ${getSizeClasses()} ${getColorClasses()} ${className}`}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
};

// 全屏加载组件
interface LoadingOverlayProps {
  message?: string;
  visible: boolean;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ 
  message = '加载中...', 
  visible 
}) => {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 flex flex-col items-center space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-gray-700 text-sm">{message}</p>
      </div>
    </div>
  );
};

// 按钮加载状态组件
interface LoadingButtonProps {
  loading: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  type?: 'button' | 'submit';
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  loading,
  disabled,
  children,
  onClick,
  className = '',
  type = 'button'
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={loading || disabled}
      className={`relative flex items-center justify-center ${className} ${
        loading || disabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      {loading && (
        <LoadingSpinner 
          size="sm" 
          color="white" 
          className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2" 
        />
      )}
      <span className={loading ? 'opacity-0' : 'opacity-100'}>
        {children}
      </span>
    </button>
  );
};
