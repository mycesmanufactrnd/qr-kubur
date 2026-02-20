import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../../backend/src/routers/appRouter';

export const trpc = createTRPCReact<AppRouter>();

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      // url: 'http://localhost:8000/trpc',
      url: 'https://f36f-2001-e68-58d7-4c00-bc91-34ab-bbb4-6315.ngrok-free.app/trpc',
      headers() {
        const token = sessionStorage.getItem('token');

        return {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'ngrok-skip-browser-warning': 'true',
        };
      },
    }),
  ],
});
 