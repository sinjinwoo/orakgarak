import { useCallback } from 'react';
import { useUIStore } from '../stores/uiStore';

export interface ModalOptions {
  onClose?: () => void;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  preventScroll?: boolean;
}

export interface UseModalReturn {
  showModal: (component: React.ComponentType<any>, props?: any, options?: ModalOptions) => string;
  hideModal: (id: string) => void;
  hideAllModals: () => void;
  isModalOpen: (id: string) => boolean;
}

export function useModal(): UseModalReturn {
  const { modals, showModal: showModalStore, hideModal: hideModalStore } = useUIStore();

  const showModal = useCallback((
    component: React.ComponentType<any>,
    props?: any,
    options?: ModalOptions
  ): string => {
    const modalId = showModalStore(component, { ...props, ...options });
    return modalId;
  }, [showModalStore]);

  const hideModal = useCallback((id: string) => {
    hideModalStore(id);
  }, [hideModalStore]);

  const hideAllModals = useCallback(() => {
    modals.forEach(modal => {
      hideModalStore(modal.id);
    });
  }, [modals, hideModalStore]);

  const isModalOpen = useCallback((id: string) => {
    return modals.some(modal => modal.id === id);
  }, [modals]);

  return {
    showModal,
    hideModal,
    hideAllModals,
    isModalOpen,
  };
}

// 특정 모달을 위한 훅
export function useModalState(modalId: string) {
  const { modals, hideModal } = useUIStore();
  
  const modal = modals.find(m => m.id === modalId);
  const isOpen = !!modal;
  
  const close = useCallback(() => {
    hideModal(modalId);
  }, [hideModal, modalId]);
  
  return {
    isOpen,
    modal,
    close,
  };
}

// 모달 스택 관리를 위한 훅
export function useModalStack() {
  const { modals, hideModal } = useUIStore();
  
  const getTopModal = useCallback(() => {
    return modals[modals.length - 1] || null;
  }, [modals]);
  
  const closeTopModal = useCallback(() => {
    const topModal = getTopModal();
    if (topModal) {
      hideModal(topModal.id);
    }
  }, [getTopModal, hideModal]);
  
  const closeAllModals = useCallback(() => {
    modals.forEach(modal => hideModal(modal.id));
  }, [modals, hideModal]);
  
  return {
    modals,
    getTopModal,
    closeTopModal,
    closeAllModals,
    stackSize: modals.length,
  };
}