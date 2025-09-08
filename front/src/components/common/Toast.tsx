import React from 'react';
import { Snackbar, Alert, AlertTitle } from '@mui/material';
import { useUIStore } from '../../stores/uiStore';

const Toast: React.FC = () => {
  const { toasts, hideToast } = useUIStore();

  const handleClose = (id: string) => {
    hideToast(id);
  };

  return (
    <>
      {toasts.map((toast) => (
        <Snackbar
          key={toast.id}
          open={true}
          autoHideDuration={toast.duration || 3000}
          onClose={() => handleClose(toast.id)}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert
            onClose={() => handleClose(toast.id)}
            severity={toast.type}
            variant="filled"
            sx={{ width: '100%' }}
          >
            {toast.message}
          </Alert>
        </Snackbar>
      ))}
    </>
  );
};

export default Toast;
