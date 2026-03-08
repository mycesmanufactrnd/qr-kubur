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
        url: 'http://localhost:8000/trpc',
        // url: 'https://ca0e-1-9-108-185.ngrok-free.app/trpc',
        headers: getHeaders,
      }),
      false: httpBatchLink({
        url: 'http://localhost:8000/trpc',
        // url: 'https://ca0e-1-9-108-185.ngrok-free.app/trpc',
        headers: getHeaders,
      }),
    }),
  ],
});
 
