import React from 'react';
import ReactDOM from 'react-dom/client';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const baseTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#222', // Dark grey
      contrastText: '#fff',
    },
    secondary: {
      main: '#888', // Medium grey
      contrastText: '#fff',
    },
    background: {
      default: '#f6f6f6', // Near white
      paper: '#ededed', // Light grey for cards/accordions
    },
    text: {
      primary: '#232323', // Very dark grey
      secondary: '#888', // Medium grey
      disabled: '#b0b0b0',
    },
    info: {
      main: '#666', // Medium grey for info
    },
    success: {
      main: '#81c784',
    },
    error: {
      main: '#e57373',
    },
    warning: {
      main: '#ffb74d',
    },
  },
});

const SHADOW = '0 0 16px 0 rgba(34,34,34,0.20)';

const theme = createTheme(baseTheme, {
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '999px',
          fontWeight: 'bold',
          fontSize: '1rem',
        },
        outlined: {
          border: 'none',
          color: baseTheme.palette.primary.main,
          backgroundColor: 'transparent',
          boxShadow: SHADOW,
          '&:hover': {
            backgroundColor: 'rgba(34,34,34,0.08)',
            border: 'none',
            boxShadow: SHADOW,
          },
          '&:disabled': {
            border: 'none',
            color: baseTheme.palette.text.disabled,
            boxShadow: 'none',
          },
        },
        contained: {
          backgroundColor: baseTheme.palette.primary.main,
          color: baseTheme.palette.primary.contrastText,
          border: 'none',
          boxShadow: SHADOW,
          '&:hover': {
            backgroundColor: baseTheme.palette.primary.main,
            border: 'none',
            boxShadow: SHADOW,
          },
        },
        containedError: {
          backgroundColor: baseTheme.palette.error.main,
          color: baseTheme.palette.primary.contrastText,
          border: 'none',
          boxShadow: SHADOW,
          '&:hover': {
            backgroundColor: baseTheme.palette.error.main,
            opacity: 0.85,
            border: 'none',
            boxShadow: SHADOW,
          },
        },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          borderRadius: '999px',
          color: baseTheme.palette.text.secondary,
          border: 'none',
          fontWeight: 500,
          fontSize: 16,
          paddingLeft: 24,
          paddingRight: 24,
          paddingTop: 12,
          paddingBottom: 12,
          boxShadow: SHADOW,
          '&.Mui-selected': {
            backgroundColor: baseTheme.palette.primary.main,
            color: baseTheme.palette.primary.contrastText,
            boxShadow: SHADOW,
            '&:hover': {
              backgroundColor: baseTheme.palette.primary.main,
            },
          },
        },
      },
    },
    MuiToggleButtonGroup: {
      styleOverrides: {
        root: {
          borderRadius: '999px',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: baseTheme.palette.background.paper,
          borderRadius: '24px',
          boxShadow: SHADOW,
          border: 'none',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: '24px',
          backgroundColor: baseTheme.palette.background.paper,
          boxShadow: SHADOW,
          border: 'none',
        },
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          borderRadius: '32px',
          backgroundColor: baseTheme.palette.background.paper,
          boxShadow: SHADOW,
          border: 'none',
          '&:before': {
            display: 'none',
          },
          '&:first-of-type': {
            borderTopLeftRadius: '32px',
            borderTopRightRadius: '32px',
          },
          '&:last-of-type': {
            borderBottomLeftRadius: '32px',
            borderBottomRightRadius: '32px',
          },
        },
      },
    },
    MuiAccordionSummary: {
      styleOverrides: {
        root: {
          borderRadius: '32px',
          backgroundColor: baseTheme.palette.background.paper,
        },
      },
    },
    MuiAccordionDetails: {
      styleOverrides: {
        root: {
          borderRadius: '32px',
          backgroundColor: baseTheme.palette.background.paper,
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        h2: {
          fontWeight: 'bold',
          color: baseTheme.palette.primary.main,
        },
        h5: {
          color: baseTheme.palette.primary.main,
        },
        body1: {
          color: baseTheme.palette.text.secondary,
        },
        body2: {
          color: baseTheme.palette.text.disabled,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          marginBottom: 16,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: baseTheme.palette.background.paper,
          color: baseTheme.palette.text.primary,
          borderRadius: 24,
          boxShadow: SHADOW,
          border: 'none',
          '& fieldset': { border: 'none' },
          '&:hover fieldset': { border: 'none' },
          '&.Mui-focused fieldset': { border: 'none' },
        },
        input: {
          color: baseTheme.palette.text.primary,
          '&::placeholder': {
            color: baseTheme.palette.text.disabled,
            opacity: 1,
          },
        },
        multiline: {
          color: baseTheme.palette.text.primary,
          backgroundColor: 'transparent',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: '999px',
          fontWeight: 500,
        },
      },
    },
    MuiCircularProgress: {
      styleOverrides: {
        root: {
          color: baseTheme.palette.primary.main,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          backgroundColor: baseTheme.palette.error.light,
          color: baseTheme.palette.error.dark,
          '& .MuiAlert-icon': { color: baseTheme.palette.error.dark },
        },
        filledSuccess: {
          backgroundColor: baseTheme.palette.success.main,
          color: baseTheme.palette.success.contrastText || '#fff',
        },
        filledError: {
          backgroundColor: baseTheme.palette.error.main,
          color: baseTheme.palette.error.contrastText || '#fff',
        },
        filledInfo: {
          backgroundColor: baseTheme.palette.info.main,
          color: baseTheme.palette.primary.contrastText,
        },
        filledWarning: {
          backgroundColor: baseTheme.palette.warning.main,
          color: baseTheme.palette.primary.contrastText,
        },
      },
    },
  },
});

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
