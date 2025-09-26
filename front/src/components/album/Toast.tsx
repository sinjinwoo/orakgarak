/**
 * Toast Component with aria-live support
 * 접근성을 고려한 토스트 알림 컴포넌트
 */

import React, { useEffect, useState } from 'react';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

interface ToastProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

const ToastItem: React.FC<ToastProps> = ({ toast, onRemove }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 컴포넌트 마운트 시 애니메이션 시작
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // 자동 제거 타이머
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onRemove(toast.id), 300);
      }, toast.duration);
      return () => clearTimeout(timer);
    }
  }, [toast.id, toast.duration, onRemove]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onRemove(toast.id), 300);
  };

  const getToastStyles = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-green-900/90 border-green-500/50 text-green-100';
      case 'error':
        return 'bg-red-900/90 border-red-500/50 text-red-100';
      case 'warning':
        return 'bg-yellow-900/90 border-yellow-500/50 text-yellow-100';
      default:
        return 'bg-blue-900/90 border-blue-500/50 text-blue-100';
    }
  };

  const getIcon = () => {
    const iconClass = 'w-4 h-4';
    switch (toast.type) {
      case 'success':
        return <CheckCircle2 className={iconClass} />;
      case 'error':
        return <AlertCircle className={iconClass} />;
      case 'warning':
        return <AlertTriangle className={iconClass} />;
      default:
        return <Info className={iconClass} />;
    }
  };

  return (
    <div
      className={`flex items-center gap-2 p-3 rounded-lg border backdrop-blur-xl shadow-lg transition-all duration-300 ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
      } ${getToastStyles()}`}
      role="alert"
      aria-live="polite"
    >
      {/* 아이콘 */}
      <div className="flex-shrink-0">{getIcon()}</div>

      {/* 메시지 */}
      <p className="flex-1 text-xs font-medium">{toast.message}</p>

      {/* 닫기 버튼 */}
      <button
        onClick={handleClose}
        className="flex-shrink-0 p-1 hover:bg-white/10 rounded-md transition-colors duration-200"
        aria-label="알림 닫기"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
};

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-20 left-4 right-4 z-50 space-y-2 max-w-sm mx-auto"
      aria-live="polite"
      aria-label="알림"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
};

export default ToastContainer;