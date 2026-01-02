import { createTRPCReact } from '@trpc/react-query';

/**
 * We only import the TYPE of your router. 
 * This ensures no backend code is accidentally bundled with your frontend.
 */
export const trpc = createTRPCReact();