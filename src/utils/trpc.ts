import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink, httpLink, splitLink } from '@trpc/client';
import type { AppRouter } from '../../backend/src/routers/appRouter';

export const trpc = createTRPCReact<AppRouter>();

const getHeaders = () => {
  const accessToken = sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken');

  return {
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    'ngrok-skip-browser-warning': 'true',
  };
};

const ngrokLink = "https://ec2d-2001-e68-58d7-4c00-89b1-93d8-a51d-ef53.ngrok-free.app/trpc";

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
        fetch(url, options) {
          return fetch(url, {
            ...options,
            // Enable credentials for httpOnly cookies
            credentials: 'include',
          });
        },
      }),
      false: httpBatchLink({
        // url: 'http://localhost:8000/trpc',
        url: ngrokLink,
        headers: getHeaders,
         fetch(url, options) {
          return fetch(url, {
            ...options,
            credentials: 'include',
          });
        },
      }),
    }),
  ],
});
 
