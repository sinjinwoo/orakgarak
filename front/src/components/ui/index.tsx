/**
 * UI 컴포넌트들 통합 파일
 * 작은 재사용 가능한 UI 컴포넌트들을 한 곳에 모아 관리합니다.
 */

import React, { useState } from 'react';
import { Box, Typography, Skeleton, Dialog, DialogTitle, DialogContent, DialogActions, Button, IconButton } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

// ===== Loading Components =====

interface LoadingSpinnerProps {
  size?: number;
  color?: string;
  fullScreen?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 40, 
  color = 'primary',
  fullScreen = false 
}) => {
  const spinner = (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div 
        className="animate-spin rounded-full border-2 border-blue-500 border-t-transparent"
        style={{ width: size, height: size }}
      />
    </Box>
  );

  if (fullScreen) {
    return (
      <Box sx={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 9999
      }}>
        {spinner}
      </Box>
    );
  }

  return spinner;
};

interface LoadingModalProps {
  message: string;
  open?: boolean;
}

export const LoadingModal: React.FC<LoadingModalProps> = ({ message, open = true }) => {
  if (!open) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 text-center">
        <LoadingSpinner size={32} />
        <p className="text-gray-600 mt-4">{message}</p>
      </div>
    </div>
  );
};

// ===== Skeleton Components =====

interface SkeletonBoxProps {
  variant?: 'text' | 'rectangular' | 'rounded' | 'circular';
  width?: number | string;
  height?: number | string;
  animation?: 'pulse' | 'wave' | false;
  count?: number;
}

export const SkeletonBox: React.FC<SkeletonBoxProps> = ({
  variant = 'rectangular',
  width = '100%',
  height = 20,
  animation = 'pulse',
  count = 1,
}) => {
  return (
    <Box>
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton
          key={index}
          variant={variant}
          width={width}
          height={height}
          animation={animation}
          sx={{ mb: count > 1 ? 1 : 0 }}
        />
      ))}
    </Box>
  );
};

// ===== Modal Components =====

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
  closeOnOverlayClick?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  children,
  actions,
  maxWidth = 'sm',
  fullWidth = true,
  closeOnOverlayClick = true,
}) => {
  return (
    <Dialog
      open={open}
      onClose={closeOnOverlayClick ? onClose : undefined}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      PaperProps={{
        sx: {
          borderRadius: 2,
        },
      }}
    >
      {title && (
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" component="div">
              {title}
            </Typography>
            <IconButton
              aria-label="close"
              onClick={onClose}
              sx={{ color: 'grey.500' }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
      )}
      
      <DialogContent dividers>
        {children}
      </DialogContent>
      
      {actions && (
        <DialogActions>
          {actions}
        </DialogActions>
      )}
    </Dialog>
  );
};

interface AlertModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  severity?: 'info' | 'warning' | 'error' | 'success';
}

export const AlertModal: React.FC<AlertModalProps> = ({
  open,
  onClose,
  title,
  message,
  confirmText = '확인',
  cancelText = '취소',
  onConfirm,
  severity = 'info'
}) => {
  const handleConfirm = () => {
    onConfirm?.();
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      maxWidth="xs"
      actions={
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button onClick={onClose} variant="outlined">
            {cancelText}
          </Button>
          <Button 
            onClick={handleConfirm} 
            variant="contained"
            color={severity === 'error' ? 'error' : 'primary'}
          >
            {confirmText}
          </Button>
        </Box>
      }
    >
      <Typography>{message}</Typography>
    </Modal>
  );
};

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = '확인',
  cancelText = '취소',
  isDestructive = false
}) => {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      maxWidth="xs"
      actions={
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button onClick={onClose} variant="outlined">
            {cancelText}
          </Button>
          <Button 
            onClick={handleConfirm} 
            variant="contained"
            color={isDestructive ? 'error' : 'primary'}
          >
            {confirmText}
          </Button>
        </Box>
      }
    >
      <Typography>{message}</Typography>
    </Modal>
  );
};

// ===== Stepper Components =====

interface StepperProgressProps {
  steps: string[];
  activeStep: number;
  orientation?: 'horizontal' | 'vertical';
}

export const StepperProgress: React.FC<StepperProgressProps> = ({
  steps,
  activeStep,
  orientation = 'horizontal'
}) => {
  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: orientation === 'horizontal' ? 'row' : 'column',
      gap: 2,
      alignItems: orientation === 'horizontal' ? 'center' : 'flex-start'
    }}>
      {steps.map((step, index) => (
        <Box
          key={index}
          sx={{
            display: 'flex',
            alignItems: 'center',
            color: index <= activeStep ? 'primary.main' : 'text.disabled'
          }}
        >
          <Box
            sx={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              backgroundColor: index <= activeStep ? 'primary.main' : 'grey.300',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.75rem',
              fontWeight: 'bold'
            }}
          >
            {index + 1}
          </Box>
          <Typography variant="body2" sx={{ ml: 1 }}>
            {step}
          </Typography>
        </Box>
      ))}
    </Box>
  );
};


// ===== Image Components =====

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
}

export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({ 
  src, 
  alt, 
  className = "",
  fallbackSrc = "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop"
}) => {
  const [imgSrc, setImgSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);

  const handleError = () => {
    setImgSrc(fallbackSrc);
    setIsLoading(false);
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-lg"></div>
      )}
      <img
        src={imgSrc}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoading ? "opacity-0" : "opacity-100"
        }`}
        onError={handleError}
        onLoad={handleLoad}
      />
    </div>
  );
};
