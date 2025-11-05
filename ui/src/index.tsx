import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import 'semantic-ui-css/semantic.min.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { WalletProvider } from './contexts/WalletContext';

const container = document.getElementById('root');
const root = createRoot(container!);

root.render(
  <React.StrictMode>
    <WalletProvider>
      <App />
    </WalletProvider>
  </React.StrictMode>
);

reportWebVitals();