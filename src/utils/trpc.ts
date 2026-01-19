import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../../backend/src/routers/appRouter';

export const trpc = createTRPCReact<AppRouter>();

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      // url: 'http://localhost:8000/trpc',
      url: 'https://8e9b24e432e8.ngrok-free.app/trpc',
      headers() {
        const token = localStorage.getItem('token');

        return {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'ngrok-skip-browser-warning': 'true',
        };
      },
    }),
  ],
});
 