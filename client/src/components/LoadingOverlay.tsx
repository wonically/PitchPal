import React from 'react';
import { Box, CircularProgress, Typography, useTheme } from '@mui/material';

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
  const theme = useTheme();
  if (!show) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: theme.palette.background.default + 'F2', // ~95% opacity
        color: theme.palette.text.primary,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
        backdropFilter: 'blur(5px)',
        boxShadow: theme.shadows[8],
      }}
    >
      <CircularProgress size={80} thickness={4} sx={{ mb: 3, color: theme.palette.primary.main }} />
      <Typography variant="h5" sx={{ textAlign: 'center', mb: 1, color: theme.palette.text.primary }}>
        {title}
      </Typography>
      <Typography variant="body1" sx={{ textAlign: 'center', maxWidth: 400, color: theme.palette.text.secondary }}>
        {message}
      </Typography>
    </Box>
  );
};

export default LoadingOverlay;
