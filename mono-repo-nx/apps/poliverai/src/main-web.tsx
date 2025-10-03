import React from 'react';
import * as ReactDOM from 'react-dom/client';
import MainWeb from './MainWeb';

const rootEl = document.getElementById('root');
if (!rootEl) {
  throw new Error('Missing root element');
}

const root = ReactDOM.createRoot(rootEl as HTMLElement);
if (!root) throw new Error('Root element #root not found');

console.log('Web app started');
root.render(<MainWeb />);
