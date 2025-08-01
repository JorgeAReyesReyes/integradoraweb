import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { AuthProvider } from './modulos/auth/AuthContext';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error("No se encontró el elemento root");

createRoot(rootElement).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);