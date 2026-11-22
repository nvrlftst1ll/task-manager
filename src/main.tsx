// ============================================================
// [START: Точка входа renderer-процесса]
// ============================================================
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/global.css';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Не найден корневой элемент #root');
}

ReactDOM.createRoot(container).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
// ============================================================
// [END: Точка входа renderer-процесса]
// ============================================================
