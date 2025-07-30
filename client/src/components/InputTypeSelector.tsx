import React from 'react';
import { Box, ToggleButton, ToggleButtonGroup } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import MicIcon from '@mui/icons-material/Mic';

interface InputTypeSelectorProps {
  inputType: 'text' | 'audio';
  onInputTypeChange: (inputType: 'text' | 'audio') => void;
  disabled: boolean;
}

const InputTypeSelector: React.FC<InputTypeSelectorProps> = ({
  inputType,
  onInputTypeChange,
  disabled
}) => {
  return (
    <Box display="flex" justifyContent="center" alignItems="center" mb={3} gap={2}>
      <ToggleButtonGroup
        value={inputType}
        exclusive
        onChange={(_, newInputType) => newInputType && onInputTypeChange(newInputType)}
        aria-label="input type"
        disabled={disabled}
      >
        <ToggleButton value="text" aria-label="text input">
          <EditIcon sx={{ mr: 1 }} />Text Input
        </ToggleButton>
        <ToggleButton value="audio" aria-label="audio input">
          <MicIcon sx={{ mr: 1 }} />Audio Input
        </ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
};

export default InputTypeSelector;
