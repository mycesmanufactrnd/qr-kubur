import { useMemo, useState } from "react";
import { Plus, Trash2, Check, X } from "lucide-react";
import { trpc } from "@/utils/trpc";
import BackNavigation from "@/components/BackNavigation";
import ConfirmDialog from "@/components/ConfirmDialog";
import { showApiError, showApiSuccess } from "@/components/ToastrNotification";
import { translate } from "@/utils/translations";

export default function PaymentComparison() {
  const { data: items = [], refetch } = trpc.paymentComparison.getAll.useQuery();

  const addMutation = trpc.paymentComparison.addItem.useMutation();
  const updateMutation = trpc.paymentComparison.updateItem.useMutation();
  const deleteItemMutation = trpc.paymentComparison.deleteItem.useMutation();
  const deleteGatewayMutation = trpc.paymentComparison.deleteGateway.useMutation();

  const [localEdits, setLocalEdits] = useState({});
  const [newGateway, setNewGateway] = useState("");
  const [addingGateway, setAddingGateway] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteKind, setDeleteKind] = useState(null);
  const [gatewayToDelete, setGatewayToDelete] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);

  const gateways = useMemo(() => [...new Set(items.map((i) => i.gateway))], [
    items,
  ]);

  const columns = useMemo(() => {
    return Object.fromEntries(
      gateways.map((gateway) => [
        gateway,
        items.filter((i) => i.gateway === gateway),
      ]),
    );
  }, [items, gateways]);

  const handleChange = (id, value) =>
    setLocalEdits((edits) => ({ ...edits, [id]: value }));

  const handleSave = async (id) => {
    const value = localEdits[id];
    if (value === undefined) return;

    try {
      await updateMutation.mutateAsync({ id, content: value });
      await refetch();
      setLocalEdits((edits) => {
        const next = { ...edits };
        delete next[id];
        return next;
      });
    } catch (error) {
      showApiError(error);
    }
  };

  const handleAddGateway = async () => {
    const name = newGateway.trim();
    if (!name) return;

    try {
      const created = await addMutation.mutateAsync({
        gateway: name,
        content: "",
      });

      if (created?.id != null) {
        setLocalEdits((edits) => ({ ...edits, [created.id]: "" }));
      }

      setNewGateway("");
      setAddingGateway(false);
      await refetch();
      showApiSuccess("create");
    } catch (error) {
      showApiError(error);
    }
  };

  const handleAddItem = async (gateway) => {
    try {
      const created = await addMutation.mutateAsync({ gateway, content: "" });

      if (created?.id != null) {
        setLocalEdits((edits) => ({ ...edits, [created.id]: "" }));
      }

      await refetch();
      showApiSuccess("create");
    } catch (error) {
      showApiError(error);
    }
  };

  const requestDeleteGateway = (gateway) => {
    setDeleteKind("gateway");
    setGatewayToDelete(gateway);
    setItemToDelete(null);
    setDeleteDialogOpen(true);
  };

  const requestDeleteItem = (item) => {
    setDeleteKind("item");
    setItemToDelete(item);
    setGatewayToDelete(null);
    setDeleteDialogOpen(true);
  };

  const handleDeleteDialogOpenChange = (nextOpen) => {
    setDeleteDialogOpen(nextOpen);
    if (!nextOpen) {
      setDeleteKind(null);
      setGatewayToDelete(null);
      setItemToDelete(null);
    }
  };

  const confirmDelete = async () => {
    try {
      if (deleteKind === "gateway" && gatewayToDelete) {
        await deleteGatewayMutation.mutateAsync(gatewayToDelete);
        setLocalEdits((edits) => {
          const next = { ...edits };
          for (const i of items) {
            if (i.gateway === gatewayToDelete) delete next[i.id];
          }
          return next;
        });
      } else if (deleteKind === "item" && itemToDelete) {
        await deleteItemMutation.mutateAsync(itemToDelete.id);
        setLocalEdits((edits) => {
          if (edits[itemToDelete.id] === undefined) return edits;
          const next = { ...edits };
          delete next[itemToDelete.id];
          return next;
        });
      } else {
        return;
      }

      await refetch();
      showApiSuccess("delete");
    } catch (error) {
      showApiError(error);
    } finally {
      handleDeleteDialogOpenChange(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto space-y-4">
        <BackNavigation title="Payment Gateway Comparison" />

        <div className="flex items-end justify-between flex-wrap gap-3">
          <p className="text-sm text-slate-500">{gateways.length} gateways</p>

          {addingGateway ? (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:border-emerald-400 w-40"
                placeholder="Gateway name..."
                value={newGateway}
                onChange={(e) => setNewGateway(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddGateway();
                  if (e.key === "Escape") setAddingGateway(false);
                }}
              />
              <button
                onClick={handleAddGateway}
                className="p-1.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  setAddingGateway(false);
                  setNewGateway("");
                }}
                className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAddingGateway(true)}
              className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Gateway
            </button>
          )}
        </div>

        {gateways.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center py-16 gap-3">
            <p className="text-sm font-semibold text-slate-500">
              No gateways yet
            </p>
            <p className="text-xs text-slate-400">
              Click "Add Gateway" to create your first comparison column
            </p>
          </div>
        ) : (
          <div
            className="grid gap-4"
            style={{
              gridTemplateColumns: `repeat(${Math.min(gateways.length, 3)}, 1fr)`,
            }}
          >
            {gateways.map((gateway) => (
              <div
                key={gateway}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-slate-800">{gateway}</h2>
                  <button
                    onClick={() => requestDeleteGateway(gateway)}
                    className="p-1 rounded hover:bg-red-50 text-slate-300 hover:text-red-400"
                    title="Delete gateway"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <ul className="space-y-2">
                  {columns[gateway]
                    .filter(
                      (i) => i.content !== "" || localEdits[i.id] !== undefined,
                    )
                    .map((item) => (
                      <li key={item.id} className="flex items-start gap-2">
                        <span className="mt-2.5 w-1.5 h-1.5 rounded-full bg-slate-400 flex-shrink-0" />
                        <input
                          className="flex-1 text-sm text-slate-700 border-b border-transparent hover:border-slate-200 focus:border-slate-400 outline-none py-1 bg-transparent"
                          value={localEdits[item.id] ?? item.content}
                          placeholder="Add info..."
                          onChange={(e) =>
                            handleChange(item.id, e.target.value)
                          }
                        />
                        {localEdits[item.id] !== undefined && (
                          <button
                            onClick={() => handleSave(item.id)}
                            className="mt-1.5 p-0.5 text-emerald-500 hover:text-emerald-700 flex-shrink-0"
                            title="Save"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => requestDeleteItem(item)}
                          className="mt-1.5 p-0.5 text-slate-300 hover:text-red-400 flex-shrink-0"
                          title="Delete item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </li>
                    ))}
                </ul>

                <button
                  onClick={() => handleAddItem(gateway)}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-600 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Add item
                </button>
              </div>
            ))}
          </div>
        )}

        <ConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={handleDeleteDialogOpenChange}
          title={
            deleteKind === "gateway"
              ? translate("Delete Gateway")
              : translate("Delete Item")
          }
          description={
            deleteKind === "gateway"
              ? `${translate("Are you sure you want to delete")} "${gatewayToDelete ?? ""}"? ${translate("This will delete all items under this gateway.")}`
              : `${translate("Are you sure you want to delete")} "${itemToDelete?.content || translate("this item")}"?`
          }
          onConfirm={confirmDelete}
          isDelete
          variant="destructive"
        />
      </div>
    </div>
  );
}

