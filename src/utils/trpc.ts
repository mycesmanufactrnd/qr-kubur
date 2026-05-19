// @ts-nocheck
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

const trpcUrl = '/trpc';

export const trpcClient = trpc.createClient({
  links: [
    splitLink({
      condition(op) {
        return op.context.skipBatch === true;
      },
      true: httpLink({
        url: trpcUrl,
        headers: getHeaders,
        fetch(url, options) {
          return fetch(url, {
            ...options,
            credentials: 'include',
          });
        },
      }),
      false: httpBatchLink({
        url: trpcUrl,
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
