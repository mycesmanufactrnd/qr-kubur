import { AsyncLocalStorage } from "async_hooks";

interface Store {
  userId?: number | null;
}

export const asyncLocalStorage = new AsyncLocalStorage<Store>();

export const getCurrentUserId = () => {
  return asyncLocalStorage.getStore()?.userId;
};
