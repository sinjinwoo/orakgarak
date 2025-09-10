import React from 'react';
import { Stepper, Step, StepLabel, Box, Typography } from '@mui/material';

interface StepperProgressProps {
  activeStep: number;
  steps: string[];
  orientation?: 'horizontal' | 'vertical';
}

const StepperProgress: React.FC<StepperProgressProps> = ({
  activeStep,
  steps,
  orientation = 'horizontal',
}) => {
  return (
    <Box sx={{ width: '100%', mb: 4 }}>
      <Stepper activeStep={activeStep} orientation={orientation}>
        {steps.map((label, index) => (
          <Step key={label}>
            <StepLabel>
              <Typography variant="body2" color={index <= activeStep ? 'primary' : 'text.secondary'}>
                {label}
              </Typography>
            </StepLabel>
          </Step>
        ))}
      </Stepper>
      
      {orientation === 'horizontal' && (
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            {activeStep + 1} / {steps.length} 단계
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default StepperProgress;
