import { create } from 'zustand';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

interface Modal {
  id: string;
  component: React.ComponentType<any>;
  props?: any;
}

interface UIStore {
  // Toast
  toasts: Toast[];
  showToast: (message: string, type?: Toast['type'], duration?: number) => void;
  hideToast: (id: string) => void;
  
  // Modal
  modals: Modal[];
  showModal: (component: React.ComponentType<any>, props?: any) => string;
  hideModal: (id: string) => void;
  
  // Loading
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
}

export const useUIStore = create<UIStore>((set, get) => ({
  // Toast
  toasts: [],
  showToast: (message, type = 'info', duration = 3000) => {
    const id = Math.random().toString(36).substr(2, 9);
    const toast: Toast = { id, message, type, duration };
    
    set((state) => ({
      toasts: [...state.toasts, toast]
    }));
    
    // Auto hide after duration
    setTimeout(() => {
      get().hideToast(id);
    }, duration);
  },
  
  hideToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter(toast => toast.id !== id)
    }));
  },
  
  // Modal
  modals: [],
  showModal: (component, props) => {
    const id = Math.random().toString(36).substr(2, 9);
    const modal: Modal = { id, component, props };
    
    set((state) => ({
      modals: [...state.modals, modal]
    }));
    
    return id;
  },
  
  hideModal: (id) => {
    set((state) => ({
      modals: state.modals.filter(modal => modal.id !== id)
    }));
  },
  
  // Loading
  isLoading: false,
  setLoading: (loading) => set({ isLoading: loading }),
}));
