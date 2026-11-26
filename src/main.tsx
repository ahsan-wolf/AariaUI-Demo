import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { activateDemoLicense } from './demo-license';

// Demo only: activate a throw-away license so the Pro/Enterprise controls run without evaluation limits.
void activateDemoLicense().finally(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});
