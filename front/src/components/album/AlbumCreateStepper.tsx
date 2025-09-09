import React from 'react';
import { Box, Typography, Stepper, Step, StepLabel, StepConnector } from '@mui/material';
import { styled } from '@mui/material/styles';

const steps = [
  { label: '녹음 선택', description: 'Recordings Selection' },
  { label: '커버 선택', description: 'Cover Selection' },
  { label: '앨범 정보', description: 'Album Info' },
  { label: '미리보기', description: 'Preview' },
];

const CustomStepConnector = styled(StepConnector)(({ theme }) => ({
  '&.MuiStepConnector-root': {
    top: 22,
    left: 'calc(-50% + 20px)',
    right: 'calc(50% + 20px)',
  },
  '&.MuiStepConnector-line': {
    borderTopWidth: 3,
    borderRadius: 1,
  },
  '&.Mui-active .MuiStepConnector-line': {
    borderColor: '#2c2c2c',
  },
  '&.Mui-completed .MuiStepConnector-line': {
    borderColor: '#2c2c2c',
  },
  '&.Mui-disabled .MuiStepConnector-line': {
    borderColor: '#e0e0e0',
  },
}));

interface AlbumCreateStepperProps {
  currentStep: number;
}

const AlbumCreateStepper: React.FC<AlbumCreateStepperProps> = ({ currentStep }) => {
  return (
    <Box sx={{ width: '100%', mb: 4 }}>
      <Stepper 
        activeStep={currentStep} 
        connector={<CustomStepConnector />}
        sx={{
          '& .MuiStepLabel-root': {
            padding: 0,
          },
          '& .MuiStepLabel-labelContainer': {
            '& .MuiStepLabel-label': {
              fontSize: '0.875rem',
              fontWeight: 600,
              color: currentStep === 0 ? '#2c2c2c' : '#666',
            },
            '& .MuiStepLabel-label.Mui-active': {
              color: '#2c2c2c',
            },
            '& .MuiStepLabel-label.Mui-completed': {
              color: '#2c2c2c',
            },
          },
        }}
      >
        {steps.map((step, index) => (
          <Step key={step.label}>
            <StepLabel
              StepIconComponent={({ active, completed }) => (
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: completed ? '#2c2c2c' : active ? '#2c2c2c' : '#e0e0e0',
                    color: completed || active ? 'white' : '#666',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                  }}
                >
                  {completed ? '✓' : index + 1}
                </Box>
              )}
            >
              {step.label}
            </StepLabel>
          </Step>
        ))}
      </Stepper>
      <Typography 
        variant="body2" 
        sx={{ 
          textAlign: 'center', 
          mt: 1, 
          color: '#666',
          fontSize: '0.875rem'
        }}
      >
        {currentStep + 1} / {steps.length}
      </Typography>
    </Box>
  );
};

export default AlbumCreateStepper;
