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
        // url: 'https://a891-2001-e68-58d7-4c00-c0fb-cfec-8967-642b.ngrok-free.app/trpc',
        headers: getHeaders,
      }),
      false: httpBatchLink({
        url: 'http://localhost:8000/trpc',
        // url: 'https://a891-2001-e68-58d7-4c00-c0fb-cfec-8967-642b.ngrok-free.app/trpc',
        headers: getHeaders,
      }),
    }),
  ],
});
 
