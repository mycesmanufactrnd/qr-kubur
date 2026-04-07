import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink, httpLink, splitLink } from '@trpc/client';
import type { AppRouter } from '../../backend/src/routers/appRouter';

export const trpc = createTRPCReact<AppRouter>();

const getHeaders = () => {
  const token = sessionStorage.getItem('token');

  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    'ngrok-skip-browser-warning': 'true',
  };
};

export const trpcClient = trpc.createClient({
  links: [
    splitLink({
      condition(op) {
        return op.context.skipBatch === true;
      },
      true: httpLink({
        // url: 'http://localhost:8000/trpc',
        url: 'https://e87e-2001-e68-58d7-4c00-e0c3-c0fc-cd47-d404.ngrok-free.app/trpc',
        headers: getHeaders,
      }),
      false: httpBatchLink({
        // url: 'http://localhost:8000/trpc',
        url: 'https://e87e-2001-e68-58d7-4c00-e0c3-c0fc-cd47-d404.ngrok-free.app/trpc',
        headers: getHeaders,
      }),
    }),
  ],
});
 
