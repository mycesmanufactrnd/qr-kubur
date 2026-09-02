// @ts-nocheck
import { useState } from "react";
import { Users, Plus, Pencil, Trash2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { translate } from "@/utils/translations";
import {
  useGetMosqueOrganisationChartByMosqueId,
  useMosqueOrganisationChartMutations,
} from "@/mutations/useMosqueOrganisationChartMutations";

const NEW_TEAM_VALUE = "__new_team__";

const emptyForm = { team: "", name: "", phoneno: "", designation: "" };

export default function MosqueOrganisationChartSection({ mosqueId }) {
  const { data: chartList = [] } =
    useGetMosqueOrganisationChartByMosqueId(mosqueId);
  const { createChart, updateChart, deleteChart } =
    useMosqueOrganisationChartMutations();

  const [form, setForm] = useState(emptyForm);
  const [newTeamName, setNewTeamName] = useState("");
  const [editingId, setEditingId] = useState(null);

  const existingTeams = [...new Set(chartList.map((c) => c.team))];

  const groupedByTeam = chartList.reduce((acc, entry) => {
    if (!acc[entry.team]) acc[entry.team] = [];
    acc[entry.team].push(entry);
    return acc;
  }, {});

  if (!mosqueId) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 px-4 py-3 text-sm text-gray-500 dark:text-slate-400">
        {translate("Save the mosque first to manage the organisation chart.")}
      </div>
    );
  }

  const resetForm = () => {
    setForm(emptyForm);
    setNewTeamName("");
    setEditingId(null);
  };

  const handleSubmit = () => {
    const team =
      form.team === NEW_TEAM_VALUE ? newTeamName.trim() : form.team.trim();
    const name = form.name.trim();

    if (!team || !name) return;

    const data = {
      mosque: { id: mosqueId },
      team,
      name,
      phoneno: form.phoneno.trim() || null,
      designation: form.designation.trim() || null,
    };

    if (editingId) {
      updateChart.mutate({ id: editingId, data }, { onSuccess: resetForm });
    } else {
      createChart.mutate(data, { onSuccess: resetForm });
    }
  };

  const handleEdit = (entry) => {
    setEditingId(entry.id);
    setForm({
      team: entry.team,
      name: entry.name,
      phoneno: entry.phoneno ?? "",
      designation: entry.designation ?? "",
    });
    setNewTeamName("");
  };

  const handleDelete = (id) => {
    deleteChart.mutate(id);
    if (editingId === id) resetForm();
  };

  const isSaving = createChart.isPending || updateChart.isPending;

  return (
    <div className="space-y-3">
      <div className="space-y-2 border border-gray-200 dark:border-slate-700 rounded-lg p-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label className="text-xs">{translate("Team")}</Label>
            <Select
              value={form.team}
              onValueChange={(value) => setForm((f) => ({ ...f, team: value }))}
            >
              <SelectTrigger className="h-9 dark:border-slate-600 dark:bg-slate-700">
                <SelectValue placeholder={translate("Select team")} />
              </SelectTrigger>
              <SelectContent>
                {existingTeams.map((team) => (
                  <SelectItem key={team} value={team}>
                    {team}
                  </SelectItem>
                ))}
                <SelectItem value={NEW_TEAM_VALUE}>
                  {`+ ${translate("Add Team")}`}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{translate("Designation")}</Label>
            <Input
              value={form.designation}
              onChange={(e) =>
                setForm((f) => ({ ...f, designation: e.target.value }))
              }
              placeholder={translate("e.g. Ketua Pasukan")}
              className="h-9 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
            />
          </div>
        </div>

        {form.team === NEW_TEAM_VALUE && (
          <Input
            value={newTeamName}
            onChange={(e) => setNewTeamName(e.target.value)}
            placeholder={translate("e.g. Jenazah Team")}
            className="h-9 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
          />
        )}

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label className="text-xs">{translate("Name")}</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder={translate("Full name")}
              className="h-9 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{translate("Phone No.")}</Label>
            <Input
              value={form.phoneno}
              onChange={(e) =>
                setForm((f) => ({ ...f, phoneno: e.target.value }))
              }
              placeholder="0123456789"
              className="h-9 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            onClick={handleSubmit}
            disabled={isSaving}
            className="bg-violet-600 hover:bg-violet-700 text-white"
          >
            <Plus className="w-4 h-4 mr-1" />
            {editingId ? translate("Update") : translate("Add")}
          </Button>
          {editingId && (
            <Button type="button" size="sm" variant="outline" onClick={resetForm}>
              {translate("Cancel")}
            </Button>
          )}
        </div>
      </div>

      {Object.keys(groupedByTeam).length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-slate-500 text-center py-2">
          {translate("No organisation chart members added yet.")}
        </p>
      ) : (
        <div className="space-y-3">
          {Object.entries(groupedByTeam).map(([team, members]) => (
            <div key={team} className="space-y-1.5">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <Users className="w-3 h-3" />
                {team}
              </p>
              {members.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between gap-2 text-sm bg-gray-50 dark:bg-slate-700/50 rounded px-3 py-1.5"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-gray-800 dark:text-slate-100 truncate">
                      {entry.name}
                      {entry.designation && (
                        <span className="text-gray-400 dark:text-slate-400 font-normal">
                          {" "}
                          — {entry.designation}
                        </span>
                      )}
                    </p>
                    {entry.phoneno && (
                      <p className="text-xs text-gray-500 dark:text-slate-400">
                        {entry.phoneno}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleEdit(entry)}
                      className="text-sky-600 hover:text-sky-800 dark:text-sky-400 p-1"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(entry.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
