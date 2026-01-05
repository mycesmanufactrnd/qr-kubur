import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../../backend/src/routers/appRouter';

export const trpc = createTRPCReact<AppRouter>();

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: 'http://localhost:8000/trpc',
      headers() {
        const token = localStorage.getItem('jwt');
        return token ? { Authorization: `Bearer ${token}` } : {};
      },
    }),
  ],
});
