// @ts-nocheck
import { trpc } from '@/utils/trpc';
import { useAdminAccess } from '@/utils/auth';
import { showSuccess, showApiError } from '@/components/ToastrNotification';

// ── Inventory Item ────────────────────────────────────────────────────────────

type GetInventoryItemsPaginatedParams = {
  page?: number;
  pageSize?: number;
  filterName?: string;
  filterCategory?: string;
  filterType?: string;
  filterStatus?: string;
  sortField?: string;
  sortOrder?: 'ASC' | 'DESC';
};

export function useGetInventoryItemsPaginated({
  page,
  pageSize,
  filterName,
  filterCategory,
  filterType,
  filterStatus,
  sortField,
  sortOrder,
}: GetInventoryItemsPaginatedParams) {
  const { hasAdminAccess } = useAdminAccess();

  const { data, isLoading, refetch, error } = trpc.inventoryItem.getPaginated.useQuery(
    { page, pageSize, filterName, filterCategory, filterType, filterStatus, sortField, sortOrder },
    { enabled: hasAdminAccess },
  );

  const itemsList = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / (pageSize ?? 10));

  return { itemsList, total, totalPages, isLoading, refetch, error };
}

export function useGetAllInventoryItems() {
  const { hasAdminAccess } = useAdminAccess();
  const { data, isLoading } = trpc.inventoryItem.getAll.useQuery(undefined, { enabled: hasAdminAccess });
  return { itemsList: data ?? [], isLoading };
}

export function useGetLowStockItems() {
  const { hasAdminAccess } = useAdminAccess();
  const { data, isLoading } = trpc.inventoryItem.getLowStock.useQuery(undefined, { enabled: hasAdminAccess });
  return { lowStockItems: data ?? [], isLoading };
}

export function useInventoryItemMutations() {
  const trpcUtils = trpc.useUtils();

  const invalidateAll = () => {
    trpcUtils.inventoryItem.getPaginated.invalidate();
    trpcUtils.inventoryItem.getAll.invalidate();
    trpcUtils.inventoryItem.getLowStock.invalidate();
    trpcUtils.inventoryTransaction.getDashboardStats.invalidate();
    trpcUtils.inventoryTransaction.getPaginated.invalidate();
  };

  const createItem = trpc.inventoryItem.create.useMutation({
    onSuccess: () => { showSuccess('Item Inventori', 'create'); invalidateAll(); },
    onError: (err) => showApiError(err),
  });

  const updateItem = trpc.inventoryItem.update.useMutation({
    onSuccess: () => { showSuccess('Item Inventori', 'update'); invalidateAll(); },
    onError: (err) => showApiError(err),
  });

  const deleteItem = trpc.inventoryItem.delete.useMutation({
    onSuccess: () => { showSuccess('Item Inventori', 'delete'); invalidateAll(); },
    onError: (err) => showApiError(err),
  });

  const deleteByLocation = trpc.inventoryItem.deleteByLocation.useMutation({
    onSuccess: () => { showSuccess('Lokasi', 'delete'); invalidateAll(); },
    onError: (err) => showApiError(err),
  });

  return { createItem, updateItem, deleteItem, deleteByLocation };
}

// ── Reusable Item Group ───────────────────────────────────────────────────────

export function useGetAllReusableItemGroups() {
  const { hasAdminAccess } = useAdminAccess();
  const { data, isLoading } = trpc.reusableItemGroup.getAll.useQuery(undefined, { enabled: hasAdminAccess });
  return { groups: data ?? [], isLoading };
}

export function useReusableItemGroupMutations() {
  const trpcUtils = trpc.useUtils();

  const createGroup = trpc.reusableItemGroup.create.useMutation({
    onSuccess: () => { trpcUtils.reusableItemGroup.getAll.invalidate(); },
    onError: (err) => showApiError(err),
  });

  return { createGroup };
}

// ── Inventory Package ─────────────────────────────────────────────────────────

type GetInventoryPackagesPaginatedParams = {
  page?: number;
  pageSize?: number;
  filterName?: string;
  filterGender?: string;
  filterStatus?: string;
  sortField?: string;
  sortOrder?: 'ASC' | 'DESC';
};

export function useGetInventoryPackagesPaginated({
  page,
  pageSize,
  filterName,
  filterGender,
  filterStatus,
  sortField,
  sortOrder,
}: GetInventoryPackagesPaginatedParams) {
  const { hasAdminAccess } = useAdminAccess();

  const { data, isLoading, refetch, error } = trpc.inventoryPackage.getPaginated.useQuery(
    { page, pageSize, filterName, filterGender, filterStatus, sortField, sortOrder },
    { enabled: hasAdminAccess },
  );

  const packagesList = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / (pageSize ?? 10));

  return { packagesList, total, totalPages, isLoading, refetch, error };
}

export function useGetAllInventoryPackages() {
  const { hasAdminAccess } = useAdminAccess();
  const { data, isLoading } = trpc.inventoryPackage.getAll.useQuery(undefined, { enabled: hasAdminAccess });
  return { packagesList: data ?? [], isLoading };
}

export function useInventoryPackageMutations() {
  const trpcUtils = trpc.useUtils();

  const invalidateAll = () => {
    trpcUtils.inventoryPackage.getPaginated.invalidate();
    trpcUtils.inventoryPackage.getAll.invalidate();
  };

  const createPackage = trpc.inventoryPackage.create.useMutation({
    onSuccess: () => { showSuccess('Pakej Inventori', 'create'); invalidateAll(); },
    onError: (err) => showApiError(err),
  });

  const updatePackage = trpc.inventoryPackage.update.useMutation({
    onSuccess: () => { showSuccess('Pakej Inventori', 'update'); invalidateAll(); },
    onError: (err) => showApiError(err),
  });

  const deletePackage = trpc.inventoryPackage.delete.useMutation({
    onSuccess: () => { showSuccess('Pakej Inventori', 'delete'); invalidateAll(); },
    onError: (err) => showApiError(err),
  });

  return { createPackage, updatePackage, deletePackage };
}

// ── Inventory Transaction ─────────────────────────────────────────────────────

type GetInventoryTransactionsPaginatedParams = {
  page?: number;
  pageSize?: number;
  filterType?: string;
  filterItemId?: number;
  filterSource?: string;
  dateFrom?: string;
  dateTo?: string;
  sortField?: string;
  sortOrder?: 'ASC' | 'DESC';
};

export function useGetInventoryTransactionsPaginated({
  page,
  pageSize,
  filterType,
  filterItemId,
  filterSource,
  dateFrom,
  dateTo,
  sortField,
  sortOrder,
}: GetInventoryTransactionsPaginatedParams) {
  const { hasAdminAccess } = useAdminAccess();

  const { data, isLoading, refetch, error } = trpc.inventoryTransaction.getPaginated.useQuery(
    { page, pageSize, filterType, filterItemId, filterSource, dateFrom, dateTo, sortField, sortOrder },
    { enabled: hasAdminAccess },
  );

  const transactionsList = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / (pageSize ?? 20));

  return { transactionsList, total, totalPages, isLoading, refetch, error };
}

export function useGetInventoryDashboardStats() {
  const { hasAdminAccess } = useAdminAccess();
  const { data, isLoading, refetch } = trpc.inventoryTransaction.getDashboardStats.useQuery(undefined, {
    enabled: hasAdminAccess,
  });
  return { stats: data ?? null, isLoading, refetch };
}

export function useGetInventoryStockSummary() {
  const { hasAdminAccess } = useAdminAccess();
  const { data, isLoading } = trpc.inventoryTransaction.getStockSummary.useQuery(undefined, {
    enabled: hasAdminAccess,
  });
  return { stockSummary: data ?? [], isLoading };
}

export function useInventoryTransactionMutations() {
  const trpcUtils = trpc.useUtils();

  const invalidateAll = () => {
    trpcUtils.inventoryTransaction.getPaginated.invalidate();
    trpcUtils.inventoryTransaction.getDashboardStats.invalidate();
    trpcUtils.inventoryItem.getPaginated.invalidate();
    trpcUtils.inventoryItem.getLowStock.invalidate();
  };

  const stockIn = trpc.inventoryTransaction.stockIn.useMutation({
    onSuccess: () => { showSuccess('Stok Masuk', 'create'); invalidateAll(); },
    onError: (err) => showApiError(err),
  });

  const stockOut = trpc.inventoryTransaction.stockOut.useMutation({
    onSuccess: () => { showSuccess('Stok Keluar', 'create'); invalidateAll(); },
    onError: (err) => showApiError(err),
  });

  const adjustment = trpc.inventoryTransaction.adjustment.useMutation({
    onSuccess: () => { showSuccess('Pelarasan Stok', 'update'); invalidateAll(); },
    onError: (err) => showApiError(err),
  });

  const processPackage = trpc.inventoryTransaction.processPackage.useMutation({
    onSuccess: () => { showSuccess('Pakej', 'create'); invalidateAll(); },
    onError: (err) => showApiError(err),
  });

  return { stockIn, stockOut, adjustment, processPackage };
}

// ── Inventory Audit ───────────────────────────────────────────────────────────

type GetAuditSessionsPaginatedParams = {
  page?: number;
  pageSize?: number;
  filterStatus?: string;
  filterLocation?: string;
};

export function useGetAuditSessionsPaginated({
  page,
  pageSize,
  filterStatus,
  filterLocation,
}: GetAuditSessionsPaginatedParams) {
  const { hasAdminAccess } = useAdminAccess();

  const { data, isLoading, refetch, error } = trpc.inventoryAudit.getSessions.useQuery(
    { page, pageSize, filterStatus, filterLocation },
    { enabled: hasAdminAccess },
  );

  const sessionsList = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / (pageSize ?? 10));

  return { sessionsList, total, totalPages, isLoading, refetch, error };
}

export function useGetAuditSessionDetails(sessionId: number | null) {
  return trpc.inventoryAudit.getSessionDetails.useQuery(sessionId as number, { enabled: !!sessionId });
}

export function useInventoryAuditMutations() {
  const trpcUtils = trpc.useUtils();

  const invalidateSessions = () => {
    trpcUtils.inventoryAudit.getSessions.invalidate();
  };

  const createSession = trpc.inventoryAudit.createSession.useMutation({
    onSuccess: () => { showSuccess('Sesi Audit', 'create'); invalidateSessions(); },
    onError: (err) => showApiError(err),
  });

  const updateCount = trpc.inventoryAudit.updateCount.useMutation({
    onError: (err) => showApiError(err),
  });

  const updateReusableCount = trpc.inventoryAudit.updateReusableCount.useMutation({
    onError: (err) => showApiError(err),
  });

  const completeSession = trpc.inventoryAudit.completeSession.useMutation({
    onSuccess: () => { showSuccess('Sesi Audit', 'update'); invalidateSessions(); },
    onError: (err) => showApiError(err),
  });

  const reopenSession = trpc.inventoryAudit.reopenSession.useMutation({
    onSuccess: () => { showSuccess('Sesi Audit', 'update'); invalidateSessions(); },
    onError: (err) => showApiError(err),
  });

  return { createSession, updateCount, updateReusableCount, completeSession, reopenSession };
}
