import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App.jsx';
import '@/index.css';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { trpc, trpcClient } from '@/utils/trpc';
import { AudioProvider } from '@/context/AudioContext';

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')).render(
  <QueryClientProvider client={queryClient}>
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <AudioProvider>
        <App />
      </AudioProvider>
    </trpc.Provider>
  </QueryClientProvider>
);

// HMR support for Vite
if (import.meta.hot) {
  import.meta.hot.on('vite:beforeUpdate', () => {
    window.parent?.postMessage({ type: 'sandbox:beforeUpdate' }, '*');
  });
  import.meta.hot.on('vite:afterUpdate', () => {
    window.parent?.postMessage({ type: 'sandbox:afterUpdate' }, '*');
  });
}