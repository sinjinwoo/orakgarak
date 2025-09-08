import { useUIStore } from '../stores/uiStore';
import { useCallback } from 'react';

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

// 확인 모달을 위한 훅
export function useConfirmModal() {
  const { showModal, hideModal } = useModal();
  
  const confirm = useCallback((
    title: string,
    message: string,
    onConfirm?: () => void,
    onCancel?: () => void
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      const ConfirmModal = ({ onClose }: { onClose: () => void }) => {
        const handleConfirm = () => {
          onConfirm?.();
          onClose();
          resolve(true);
        };
        
        const handleCancel = () => {
          onCancel?.();
          onClose();
          resolve(false);
        };
        
        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-2">{title}</h3>
              <p className="text-gray-600 mb-4">{message}</p>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  취소
                </button>
                <button
                  onClick={handleConfirm}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  확인
                </button>
              </div>
            </div>
          </div>
        );
      };
      
      const modalId = showModal(ConfirmModal, { onClose: () => hideModal(modalId) });
    });
  }, [showModal, hideModal]);
  
  return { confirm };
}

// 알림 모달을 위한 훅
export function useAlertModal() {
  const { showModal, hideModal } = useModal();
  
  const alert = useCallback((
    title: string,
    message: string,
    onClose?: () => void
  ): Promise<void> => {
    return new Promise((resolve) => {
      const AlertModal = ({ onClose: () => void }) => {
        const handleClose = () => {
          onClose?.();
          onClose();
          resolve();
        };
        
        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-2">{title}</h3>
              <p className="text-gray-600 mb-4">{message}</p>
              <div className="flex justify-end">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  확인
                </button>
              </div>
            </div>
          </div>
        );
      };
      
      const modalId = showModal(AlertModal, { onClose: () => hideModal(modalId) });
    });
  }, [showModal, hideModal]);
  
  return { alert };
}

// 로딩 모달을 위한 훅
export function useLoadingModal() {
  const { showModal, hideModal } = useModal();
  
  const showLoading = useCallback((
    message: string = '로딩 중...'
  ): string => {
    const LoadingModal = () => (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">{message}</p>
        </div>
      </div>
    );
    
    return showModal(LoadingModal);
  }, [showModal]);
  
  const hideLoading = useCallback((modalId: string) => {
    hideModal(modalId);
  }, [hideModal]);
  
  return { showLoading, hideLoading };
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
