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
      <Typography
        variant="h6"
        gutterBottom
        sx={{ textAlign: 'center' }}
      >
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
      />
      <Box display="flex" justifyContent="center">
        <Button
          variant="contained"
          color="primary"
          onClick={onSubmit}
          disabled={disabled || pitchText.trim().length < 10}
        >
          Analyze
        </Button>
      </Box>
    </Box>
  );
};

export default TextInput;
