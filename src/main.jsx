import ReactDOM from 'react-dom/client';
import App from '@/App.jsx';
import '@/index.css';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { trpc, trpcClient } from '@/utils/trpc';

// ✅ Add Sentry
import * as Sentry from "@sentry/react";

// ✅ Initialize Sentry BEFORE rendering
Sentry.init({
  dsn: "https://5a7c34e38f15887e618432aa8004637d@o4511261315039232.ingest.de.sentry.io/4511261317922896",
  sendDefaultPii: true,
  enableLogs: true,
  integrations: [
    Sentry.browserTracingIntegration(),
  ],
  tracesSampleRate: 1.0, // adjust in production (e.g. 0.1)
});

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')).render(
  <QueryClientProvider client={queryClient}>
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <App />
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