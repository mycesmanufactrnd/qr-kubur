import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink, httpLink, splitLink } from '@trpc/client';
import type { AppRouter } from '../../backend/src/routers/appRouter';

export const trpc = createTRPCReact<AppRouter>();

const getHeaders = () => {
  const token = sessionStorage.getItem('token') || localStorage.getItem('token');

  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    'ngrok-skip-browser-warning': 'true',
  };
};

const ngrokLink = "https://08a9-2001-e68-58d7-4c00-d049-7863-f940-9a12.ngrok-free.app/trpc";

export const trpcClient = trpc.createClient({
  links: [
    splitLink({
      condition(op) {
        return op.context.skipBatch === true;
      },
      true: httpLink({
        // url: 'http://localhost:8000/trpc',
        url: ngrokLink,
        headers: getHeaders,
      }),
      false: httpBatchLink({
        // url: 'http://localhost:8000/trpc',
        url: ngrokLink,
        headers: getHeaders,
      }),
    }),
  ],
});
 
