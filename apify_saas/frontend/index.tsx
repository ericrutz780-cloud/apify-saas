import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css'; // WICHTIG: Styles laden

console.log("🚀 App is initializing...");

const container = document.getElementById('root');

if (container) {
  try {
    const root = createRoot(container);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log("✅ App rendered successfully.");
  } catch (error) {
    console.error("🔥 Critical Error rendering App:", error);
    // Zeigt den Fehler direkt auf dem Bildschirm an, statt nur weiß zu bleiben
    container.innerHTML = `<div style="padding: 20px; color: red; font-family: sans-serif;">
      <h1>Critical Error</h1>
      <p>The application failed to start.</p>
      <pre>${error instanceof Error ? error.message : JSON.stringify(error)}</pre>
    </div>`;
  }
} else {
  console.error("❌ Root element with id 'root' not found in index.html");
  document.body.innerHTML = "<h1 style='color:red'>Fatal Error: Root element missing</h1>";
}