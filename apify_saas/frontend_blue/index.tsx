import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// WICHTIG: Kein import './index.css', da wir Tailwind via CDN nutzen!

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);