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
        url: 'https://ccfd-2001-e68-5419-3914-859-7ed0-f3be-8b53.ngrok-free.app/trpc',
        headers: getHeaders,
      }),
      false: httpBatchLink({
        // url: 'http://localhost:8000/trpc',
        url: 'https://ccfd-2001-e68-5419-3914-859-7ed0-f3be-8b53.ngrok-free.app/trpc',
        headers: getHeaders,
      }),
    }),
  ],
});
 
