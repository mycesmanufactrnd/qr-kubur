import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink, httpLink, splitLink } from '@trpc/client';
import type { AppRouter } from '../../backend/src/routers/appRouter';

export const trpc = createTRPCReact<AppRouter>();

const getHeaders = () => {
  const accessToken =
    sessionStorage.getItem('accessToken') ||
    localStorage.getItem('accessToken');

  const cleanedAccessToken =
    accessToken && accessToken !== "undefined" && accessToken !== "null"
      ? accessToken
      : null;

  return {
    ...(cleanedAccessToken ? { Authorization: `Bearer ${cleanedAccessToken}` } : {}),
    'ngrok-skip-browser-warning': 'true',
  };
};

const ngrokLink = "https://gbfcq-2001-e68-58d7-4c00-490-9521-41fc-1abf.run.pinggy-free.link/trpc";

export const trpcClient = trpc.createClient({
  links: [
    splitLink({
      condition(op) {
        return op.context.skipBatch === true;
      },
      true: httpLink({
        url: 'http://localhost:8000/trpc',
        // url: ngrokLink,
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
        url: 'http://localhost:8000/trpc',
        // url: ngrokLink,
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
 
