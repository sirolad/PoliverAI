import React, { StrictMode } from 'react';
import App from './App';
import { ReduxProvider } from '@poliverai/intl';

export default function MainWeb() {
  return (
    <StrictMode>
      <ReduxProvider>
        <App />
      </ReduxProvider>
    </StrictMode>
  );
}
