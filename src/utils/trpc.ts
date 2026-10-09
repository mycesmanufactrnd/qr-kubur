// @ts-nocheck
import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink, httpLink, splitLink } from '@trpc/client';
import { Capacitor } from '@capacitor/core';
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

// Web: relative path, reverse-proxied same-origin ("/trpc").
// Native: the app now bundles its own dist/ instead of loading the live site
// (so push notifications stay fully native), so there's no same-origin
// backend to proxy to — needs the real backend's absolute URL instead.
const trpcUrl = Capacitor.isNativePlatform()
  ? `${import.meta.env.VITE_API_BASE_URL}/trpc`
  : '/trpc';

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
