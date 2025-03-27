import React from 'react';
import { createRoot } from 'react-dom/client'; // Use named import for createRoot

import App from './App';

import './index.css';
import './editor.css';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
