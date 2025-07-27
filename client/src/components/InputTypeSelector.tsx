import React from 'react';
import { Box, ToggleButton, ToggleButtonGroup, Button } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import MicIcon from '@mui/icons-material/Mic';
import HistoryIcon from '@mui/icons-material/History';

interface InputTypeSelectorProps {
  inputType: 'text' | 'audio';
  onInputTypeChange: (inputType: 'text' | 'audio') => void;
  currentTab: number;
  onTabChange: (tab: number) => void;
  historyCount: number;
  disabled: boolean;
}

const InputTypeSelector: React.FC<InputTypeSelectorProps> = ({
  inputType,
  onInputTypeChange,
  currentTab,
  onTabChange,
  historyCount,
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
        sx={{
          '& .MuiToggleButton-root': {
            color: '#b0bec5',
            borderColor: '#61dafb',
            '&.Mui-selected': {
              backgroundColor: '#61dafb',
              color: '#1e1e2e',
              '&:hover': { backgroundColor: '#4fc3f7' },
            },
          },
        }}
      >
        <ToggleButton value="text" aria-label="text input">
          <EditIcon sx={{ mr: 1 }} />Text Input
        </ToggleButton>
        <ToggleButton value="audio" aria-label="audio input">
          <MicIcon sx={{ mr: 1 }} />Audio Input
        </ToggleButton>
      </ToggleButtonGroup>
      <Button
        variant={currentTab === 1 ? 'contained' : 'outlined'}
        onClick={() => onTabChange(currentTab === 1 ? 0 : 1)}
        startIcon={<HistoryIcon />}
        disabled={disabled}
        sx={{
          borderColor: '#61dafb',
          color: currentTab === 1 ? '#1e1e2e' : '#61dafb',
          backgroundColor: currentTab === 1 ? '#61dafb' : 'transparent',
          fontWeight: 'bold',
          '&:hover': {
            backgroundColor: currentTab === 1 ? '#4fc3f7' : 'rgba(97, 218, 251, 0.1)',
            borderColor: '#4fc3f7',
          },
          '&:disabled': {
            borderColor: '#555',
            color: '#999',
          },
        }}
      >
        History {historyCount > 0 ? `(${historyCount})` : ''}
      </Button>
    </Box>
  );
};

export default InputTypeSelector;
