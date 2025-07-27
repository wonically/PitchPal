import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

interface LoadingOverlayProps {
  show: boolean;
  title?: string;
  message?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  show,
  title = "Analyzing your pitch...",
  message = "Our AI is carefully reviewing your pitch and preparing detailed feedback"
}) => {
  if (!show) return null;

  return (
    <Box 
      sx={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        width: '100vw', 
        height: '100vh', 
        backgroundColor: 'rgba(30, 30, 46, 0.95)', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        alignItems: 'center', 
        zIndex: 9999, 
        backdropFilter: 'blur(5px)' 
      }}
    >
      <CircularProgress size={80} thickness={4} sx={{ color: '#61dafb', mb: 3 }} />
      <Typography variant="h5" sx={{ color: '#61dafb', fontWeight: 'bold', textAlign: 'center', mb: 1 }}>
        {title}
      </Typography>
      <Typography variant="body1" sx={{ color: '#b0bec5', textAlign: 'center', maxWidth: 400 }}>
        {message}
      </Typography>
    </Box>
  );
};

export default LoadingOverlay;
