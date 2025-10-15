import React, { StrictMode, useEffect, useState } from 'react';
// Mount the existing web frontend (Vite app) inside the monorepo
// Use a short splash before mounting so web shows the same entry flow as native
import WebApp from './AppEntry';
import { ReduxProvider } from '@poliverai/intl';
import { Splash } from '@poliverai/shared-ui';

function WebBootstrap() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Use the Splash component's visual rhythm; hide after 1200ms by default.
    const t = setTimeout(() => setShowSplash(false), 1200);
    return () => clearTimeout(t);
  }, []);

  if (showSplash) return <Splash />;

  return <WebApp />;
}

export default function MainWeb() {

  console.log('Web app started');
  
  return (
    <StrictMode>
      <ReduxProvider>
        <WebBootstrap />
      </ReduxProvider>
    </StrictMode>
  );
}
