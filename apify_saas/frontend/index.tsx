import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
// Styles (falls vorhanden, sonst erstellt Vite eine leere Datei im Build)
import './index.css'; 

console.log("🚀 Booting App...");

const container = document.getElementById('root');

if (container) {
  try {
    const root = createRoot(container);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log("✅ App mounted.");
  } catch (err) {
    console.error("🔥 Mount Error:", err);
    container.innerHTML = `<div style="padding:20px;color:red"><h1>Failed to mount App</h1><pre>${err}</pre></div>`;
  }
} else {
  console.error("❌ Fatal: #root element missing in index.html");
}