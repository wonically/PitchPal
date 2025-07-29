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
        backdropFilter: 'blur(5px)',
      }}
    >
      <CircularProgress size={80} thickness={4} sx={{ mb: 3 }} />
      <Typography variant="h5" sx={{ textAlign: 'center', mb: 1 }}>
        {title}
      </Typography>
      <Typography variant="body1" sx={{ textAlign: 'center', maxWidth: 400 }}>
        {message}
      </Typography>
    </Box>
  );
};

export default LoadingOverlay;
