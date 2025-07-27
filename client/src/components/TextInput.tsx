import React from 'react';
import { Box, Typography, TextField, Button } from '@mui/material';

interface TextInputProps {
  pitchText: string;
  onTextChange: (text: string) => void;
  onSubmit: () => void;
  disabled: boolean;
}

const TextInput: React.FC<TextInputProps> = ({
  pitchText,
  onTextChange,
  onSubmit,
  disabled
}) => {
  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ color: '#61dafb', textAlign: 'center' }}>
        Enter Your Pitch
      </Typography>
      <TextField
        fullWidth
        multiline
        rows={6}
        placeholder="Enter your business pitch here... (minimum 10 characters)"
        value={pitchText}
        onChange={e => onTextChange(e.target.value)}
        inputProps={{ maxLength: 2000 }}
        sx={{
          mb: 2,
          '& .MuiOutlinedInput-root': {
            backgroundColor: '#1e1e2e',
            color: 'white',
            '& fieldset': { borderColor: '#61dafb' },
            '&:hover fieldset': { borderColor: '#4fc3f7' },
            '&.Mui-focused fieldset': { borderColor: '#61dafb' },
          },
          '& .MuiInputBase-input::placeholder': { color: '#b0bec5', opacity: 1 },
        }}
      />
      <Box display="flex" justifyContent="center">
        <Button
          variant="contained"
          color="primary"
          onClick={onSubmit}
          disabled={disabled || pitchText.trim().length < 10}
          sx={{ backgroundColor: '#61dafb', color: '#1e1e2e', fontWeight: 'bold', '&:hover': { backgroundColor: '#4fc3f7' } }}
        >
          Analyze
        </Button>
      </Box>
    </Box>
  );
};

export default TextInput;
