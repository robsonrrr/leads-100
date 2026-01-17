import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import App from './App.jsx'
import { store } from './store/store.js'
import { ToastProvider } from './contexts/ToastContext.jsx'
import './index.css'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
})

// Obter base path do ambiente
// VITE_BASE_PATH é definido no build: '/' para leads.internut.com.br, '/leads/modern/' para dev.office
// O basePath é embutido no bundle durante o build
const envBasePath = import.meta.env.VITE_BASE_PATH || '/'
// Remover trailing slash para BrowserRouter basename
const basePath = envBasePath.endsWith('/') && envBasePath.length > 1
  ? envBasePath.slice(0, -1)
  : envBasePath

const rootElement = document.getElementById('root')
if (!rootElement) {
  console.error('Root element not found!')
} else {
  console.log('Rendering app with basePath:', basePath)
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <Provider store={store}>
        <BrowserRouter basename={basePath}>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <ToastProvider>
              <App />
            </ToastProvider>
          </ThemeProvider>
        </BrowserRouter>
      </Provider>
    </React.StrictMode>,
  )
}

// Registrar Service Worker para PWA e Offline
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('SW registered: ', registration);
      })
      .catch(registrationError => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}


