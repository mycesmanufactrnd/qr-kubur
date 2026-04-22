import { useState, useMemo, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  ChevronDown,
  ChevronRight,
  Edit2,
  Trash2,
  BarChart3,
  Calendar,
  Download,
  FileSpreadsheet,
  Image,
} from "lucide-react";
import BackNavigation from "@/components/BackNavigation";
import { format, addDays, addWeeks, parseISO } from "date-fns";
import html2canvas from "html2canvas";
import { useAdminAccess } from "@/utils/auth";
import AccessDeniedComponent from "@/components/AccessDeniedComponent";
import { trpc } from "@/utils/trpc";

const PROJECT_COLORS = [
  {
    id: "emerald",
    bg: "bg-emerald-500",
    light: "bg-emerald-50",
    dot: "#10b981",
  },
  { id: "teal", bg: "bg-teal-500", light: "bg-teal-50", dot: "#14b8a6" },
  { id: "blue", bg: "bg-blue-500", light: "bg-blue-50", dot: "#3b82f6" },
  { id: "purple", bg: "bg-purple-500", light: "bg-purple-50", dot: "#a855f7" },
  { id: "amber", bg: "bg-amber-500", light: "bg-amber-50", dot: "#f59e0b" },
  { id: "rose", bg: "bg-rose-500", light: "bg-rose-50", dot: "#f43f5e" },
];

const STATUS_CONFIG = {
  done: { barBg: "bg-emerald-500", text: "text-white" },
  "in-progress": { barBg: "bg-blue-500", text: "text-white" },
  upcoming: { barBg: "bg-slate-400", text: "text-white" },
};

const ROW_H = 44;
const SIDEBAR_W = 240;

function getColor(colorId) {
  return PROJECT_COLORS.find((c) => c.id === colorId) ?? PROJECT_COLORS[0];
}

function buildHeaders(viewStart, totalWeeks, granularity) {
  if (granularity === "week") {
    return Array.from({ length: totalWeeks }, (_, i) => {
      const d = addWeeks(viewStart, i);
      return { label: format(d, "dd MMM"), subLabel: null, date: d };
    });
  }
  const totalDays = totalWeeks * 7;
  return Array.from({ length: totalDays }, (_, i) => {
    const d = addDays(viewStart, i);
    return {
      label: format(d, "d"),
      subLabel: format(d, "MMM"),
      date: d,
      isFirst:
        i === 0 || format(d, "M") !== format(addDays(viewStart, i - 1), "M"),
    };
  });
}

function barProps(task, viewStart, cellWidth, granularity) {
  const start = parseISO(task.startDate).getTime();
  const end = parseISO(task.endDate).getTime();
  const vs = viewStart.getTime();
  const ms = granularity === "week" ? 7 * 86400000 : 86400000;
  return {
    left: ((start - vs) / ms) * cellWidth,
    width: Math.max(((end - start) / ms) * cellWidth, cellWidth * 0.5),
  };
}

function ProjectDialog({ open, onClose, onSave, initial }) {
  const blank = {
    title: "",
    colorId: "emerald",
    startDate: format(new Date(), "yyyy-MM-dd"),
    durationWeeks: 12,
  };
  const [form, setForm] = useState(blank);

  useEffect(() => {
    if (open)
      setForm(
        initial
          ? {
              title: initial.title,
              colorId: initial.colorId,
              startDate: initial.startDate,
              durationWeeks: initial.durationWeeks,
            }
          : blank,
      );
  }, [open]);

  const set = (k) => (e) =>
    setForm((f) => ({ ...f, [k]: e.target ? e.target.value : e }));

  const save = () => {
    if (!form.title.trim()) return;
    onSave({ ...form, durationWeeks: Number(form.durationWeeks) });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Project" : "New Project"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-1">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Title</label>
            <Input
              value={form.title}
              onChange={set("title")}
              placeholder="e.g. Phase 1"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Start Date</label>
              <Input
                type="date"
                value={form.startDate}
                onChange={set("startDate")}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Weeks</label>
              <Input
                type="number"
                min={1}
                max={260}
                value={form.durationWeeks}
                onChange={set("durationWeeks")}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Color</label>
            <div className="flex gap-2">
              {PROJECT_COLORS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setForm((f) => ({ ...f, colorId: c.id }))}
                  className={`w-7 h-7 rounded-full ${c.bg} transition-transform ${form.colorId === c.id ? "ring-2 ring-offset-1 ring-slate-400 scale-110" : "hover:scale-105"}`}
                />
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            className="bg-emerald-500 hover:bg-emerald-600 text-white"
            onClick={save}
          >
            {initial ? "Save" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TaskDialog({ open, onClose, onSave, initial }) {
  const blank = {
    title: "",
    startDate: format(new Date(), "yyyy-MM-dd"),
    endDate: format(addWeeks(new Date(), 2), "yyyy-MM-dd"),
    status: "upcoming",
  };
  const [form, setForm] = useState(blank);

  useEffect(() => {
    if (open)
      setForm(
        initial
          ? {
              title: initial.title,
              startDate: initial.startDate,
              endDate: initial.endDate,
              status: initial.status,
            }
          : blank,
      );
  }, [open]);

  const set = (k) => (e) =>
    setForm((f) => ({ ...f, [k]: e.target ? e.target.value : e }));

  const save = () => {
    if (!form.title.trim()) return;
    onSave(form);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Task" : "New Task"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-1">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Title</label>
            <Input
              value={form.title}
              onChange={set("title")}
              placeholder="e.g. Build feature X"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Start</label>
              <Input
                type="date"
                value={form.startDate}
                onChange={set("startDate")}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">End</label>
              <Input
                type="date"
                value={form.endDate}
                onChange={set("endDate")}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Status</label>
            <Select
              value={form.status}
              onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="done">Done</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            className="bg-emerald-500 hover:bg-emerald-600 text-white"
            onClick={save}
          >
            {initial ? "Save" : "Add Task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function GanttChartScheduling() {
  const { isSuperAdmin } = useAdminAccess();

  const { data: projects = [], refetch } = trpc.ganttchart.getAll.useQuery();
  const createMutation = trpc.ganttchart.create.useMutation({ onSuccess: () => refetch() });
  const updateMutation = trpc.ganttchart.update.useMutation({ onSuccess: () => refetch() });
  const deleteMutation = trpc.ganttchart.delete.useMutation({ onSuccess: () => refetch() });

  const [viewStartStr, setViewStartStr] = useState(
    format(new Date(), "yyyy-MM-dd"),
  );
  const [totalWeeks, setTotalWeeks] = useState(52);
  const [granularity, setGranularity] = useState("week");
  const [expanded, setExpanded] = useState({});
  const [exporting, setExporting] = useState(false);

  const [projDlg, setProjDlg] = useState({ open: false, initial: null });
  const [taskDlg, setTaskDlg] = useState({
    open: false,
    projectId: null,
    initial: null,
  });

  const chartRef = useRef(null);
  const ganttRef = useRef(null);

  const cellWidth = granularity === "week" ? 80 : 28;
  const viewStart = useMemo(() => parseISO(viewStartStr), [viewStartStr]);
  const headers = useMemo(
    () => buildHeaders(viewStart, totalWeeks, granularity),
    [viewStart, totalWeeks, granularity],
  );
  const totalWidth = headers.length * cellWidth;

  const todayLeft = useMemo(() => {
    const ms = granularity === "week" ? 7 * 86400000 : 86400000;
    return ((Date.now() - viewStart.getTime()) / ms) * cellWidth;
  }, [viewStart, granularity, cellWidth]);

  const stats = useMemo(() => {
    let done = 0,
      inP = 0,
      up = 0;
    projects.forEach((p) =>
      p.tasks.forEach((t) => {
        if (t.status === "done") done++;
        else if (t.status === "in-progress") inP++;
        else up++;
      }),
    );
    return { done, inP, up, total: done + inP + up };
  }, [projects]);

  const addProject = (data) => {
    createMutation.mutate({ ...data, tasks: [] }, {
      onSuccess: (p) => setExpanded((e) => ({ ...e, [p.id]: true })),
    });
  };
  const editProject = (id, data) => {
    const project = projects.find((p) => p.id === id);
    if (project) updateMutation.mutate({ id, data: { ...project, ...data } });
  };
  const deleteProject = (id) => {
    if (confirm("Delete this project and all its tasks?"))
      deleteMutation.mutate(id);
  };

  const addTask = (pid, taskData) => {
    const project = projects.find((p) => p.id === pid);
    if (!project) return;
    updateMutation.mutate({ id: pid, data: { ...project, tasks: [...project.tasks, { id: `t${Date.now()}`, ...taskData }] } });
  };
  const editTask = (pid, tid, taskData) => {
    const project = projects.find((p) => p.id === pid);
    if (!project) return;
    updateMutation.mutate({ id: pid, data: { ...project, tasks: project.tasks.map((t) => (t.id === tid ? { ...t, ...taskData } : t)) } });
  };
  const deleteTask = (pid, tid) => {
    const project = projects.find((p) => p.id === pid);
    if (!project) return;
    updateMutation.mutate({ id: pid, data: { ...project, tasks: project.tasks.filter((t) => t.id !== tid) } });
  };

  const scrollToToday = () => {
    if (chartRef.current)
      chartRef.current.scrollLeft = Math.max(0, todayLeft - 300);
  };

  const exportImage = async () => {
    if (!ganttRef.current || exporting) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(ganttRef.current, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
        scrollX: 0,
        scrollY: 0,
        width: ganttRef.current.scrollWidth,
        windowWidth: ganttRef.current.scrollWidth,
      });
      const link = document.createElement("a");
      link.download = `gantt-chart-${format(new Date(), "yyyy-MM-dd")}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } finally {
      setExporting(false);
    }
  };

  const exportExcel = () => {
    const rows = [
      [
        "Project",
        "Task",
        "Start Date",
        "End Date",
        "Status",
        "Duration (days)",
      ],
    ];
    projects.forEach((p) => {
      if (p.tasks.length === 0) {
        rows.push([p.title, "", p.startDate, "", "", p.durationWeeks * 7]);
      } else {
        p.tasks.forEach((t) => {
          const days = Math.round(
            (parseISO(t.endDate) - parseISO(t.startDate)) / 86400000,
          );
          rows.push([p.title, t.title, t.startDate, t.endDate, t.status, days]);
        });
      }
    });
    const csv = rows
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    link.download = `gantt-chart-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
  };

  if (!isSuperAdmin) {
    return <AccessDeniedComponent />;
  }

  return (
    <div className="min-h-screen">
      <BackNavigation title="Gantt Chart" />

      <div className="px-4 pb-6 space-y-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-slate-800">
                  Project Gantt Chart
                </h1>
                <p className="text-xs text-slate-400">
                  {stats.total} tasks · {projects.length} projects
                </p>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {projects.length > 0 && (
                <>
                  <Button
                    variant="outline"
                    onClick={exportExcel}
                    className="h-9 text-xs gap-1.5 text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" /> Export Excel
                  </Button>
                  <Button
                    variant="outline"
                    onClick={exportImage}
                    disabled={exporting}
                    className="h-9 text-xs gap-1.5 text-blue-700 border-blue-200 hover:bg-blue-50"
                  >
                    <Image className="w-3.5 h-3.5" />
                    {exporting ? "Capturing..." : "Export Image"}
                  </Button>
                </>
              )}
              <Button
                onClick={() => setProjDlg({ open: true, initial: null })}
                className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs h-9 gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> New Project
              </Button>
            </div>
          </div>

          {stats.total > 0 && (
            <div className="flex gap-2 flex-wrap">
              <span className="flex items-center gap-1.5 bg-emerald-50 rounded-xl px-3 py-1 text-xs font-semibold text-emerald-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                {stats.done} Done
              </span>
              <span className="flex items-center gap-1.5 bg-blue-50 rounded-xl px-3 py-1 text-xs font-semibold text-blue-700">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                {stats.inP} In Progress
              </span>
              <span className="flex items-center gap-1.5 bg-slate-100 rounded-xl px-3 py-1 text-xs font-semibold text-slate-600">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                {stats.up} Upcoming
              </span>
            </div>
          )}

          <div className="flex flex-wrap gap-3 items-end">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500">
                Start Date
              </label>
              <Input
                type="date"
                value={viewStartStr}
                onChange={(e) => setViewStartStr(e.target.value)}
                className="h-8 text-xs w-36"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500">
                Total Weeks
              </label>
              <Input
                type="number"
                min={4}
                max={520}
                value={totalWeeks}
                onChange={(e) => setTotalWeeks(Number(e.target.value))}
                className="h-8 text-xs w-24"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500">
                View By
              </label>
              <Select value={granularity} onValueChange={setGranularity}>
                <SelectTrigger className="h-8 text-xs w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Weekly</SelectItem>
                  <SelectItem value="day">Daily</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              onClick={scrollToToday}
              className="h-8 text-xs gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5" /> Today
            </Button>
          </div>
        </div>

        {projects.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center">
              <BarChart3 className="w-7 h-7 text-slate-300" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-600">
                No projects yet
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Create your first project to start planning
              </p>
            </div>
            <Button
              onClick={() => setProjDlg({ open: true, initial: null })}
              className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs h-9 gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> New Project
            </Button>
          </div>
        ) : (
          <div
            ref={ganttRef}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
          >
            <div className="flex">
              <div
                className="flex-shrink-0 border-r border-slate-100 z-10"
                style={{ width: SIDEBAR_W }}
              >
                <div className="h-10 bg-slate-50 border-b border-slate-100 flex items-center px-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Project / Task
                  </span>
                </div>

                {projects.map((project) => {
                  const color = getColor(project.colorId);
                  const isOpen = expanded[project.id];
                  return (
                    <div key={project.id}>
                      <div
                        className={`flex items-center gap-1 px-2 border-b border-slate-100 ${color.light} group`}
                        style={{ height: ROW_H }}
                      >
                        <button
                          onClick={() =>
                            setExpanded((e) => ({
                              ...e,
                              [project.id]: !e[project.id],
                            }))
                          }
                          className="p-0.5 rounded hover:bg-black/5 flex-shrink-0"
                        >
                          {isOpen ? (
                            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                          )}
                        </button>
                        <span
                          className={`w-2 h-2 rounded-full ${color.bg} flex-shrink-0`}
                        />
                        <span className="text-xs font-bold text-slate-700 flex-1 truncate min-w-0">
                          {project.title}
                        </span>
                        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 flex-shrink-0">
                          <button
                            onClick={() =>
                              setTaskDlg({
                                open: true,
                                projectId: project.id,
                                initial: null,
                              })
                            }
                            className="p-1 rounded hover:bg-emerald-100 text-emerald-600"
                            title="Add task"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() =>
                              setProjDlg({ open: true, initial: project })
                            }
                            className="p-1 rounded hover:bg-slate-200 text-slate-500"
                            title="Edit"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => deleteProject(project.id)}
                            className="p-1 rounded hover:bg-red-100 text-red-400"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {isOpen &&
                        project.tasks.map((task) => (
                          <div
                            key={task.id}
                            className="flex items-center gap-1.5 px-3 border-b border-slate-50 bg-white hover:bg-slate-50 group"
                            style={{ height: ROW_H }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-200 flex-shrink-0 ml-3" />
                            <span className="text-xs text-slate-600 flex-1 truncate min-w-0">
                              {task.title}
                            </span>
                            <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 flex-shrink-0">
                              <button
                                onClick={() =>
                                  setTaskDlg({
                                    open: true,
                                    projectId: project.id,
                                    initial: task,
                                  })
                                }
                                className="p-1 rounded hover:bg-slate-200 text-slate-500"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => deleteTask(project.id, task.id)}
                                className="p-1 rounded hover:bg-red-100 text-red-400"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  );
                })}
              </div>

              <div className="flex-1 overflow-x-auto" ref={chartRef}>
                <div style={{ width: totalWidth, minWidth: totalWidth }}>
                  <div
                    className="h-10 bg-slate-50 border-b border-slate-100 flex"
                    style={{ width: totalWidth }}
                  >
                    {headers.map((h, i) => (
                      <div
                        key={i}
                        className="flex-shrink-0 flex flex-col items-center justify-center border-r border-slate-100 text-slate-500"
                        style={{ width: cellWidth }}
                      >
                        {granularity === "day" && h.isFirst && (
                          <span className="text-[8px] font-bold uppercase tracking-wide text-slate-400 leading-none">
                            {h.subLabel}
                          </span>
                        )}
                        <span className="text-[10px] font-medium leading-none">
                          {h.label}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="relative" style={{ width: totalWidth }}>
                    {headers.map((_, i) => (
                      <div
                        key={i}
                        className="absolute top-0 bottom-0 border-r border-slate-50"
                        style={{ left: (i + 1) * cellWidth }}
                      />
                    ))}
                    {todayLeft > 0 && todayLeft < totalWidth && (
                      <div
                        className="absolute top-0 bottom-0 z-20"
                        style={{
                          left: todayLeft,
                          width: 1.5,
                          background: "rgba(239,68,68,0.7)",
                        }}
                      />
                    )}

                    {projects.map((project) => {
                      const color = getColor(project.colorId);
                      const isOpen = expanded[project.id];
                      const projStartMs = parseISO(project.startDate).getTime();
                      const projEndMs = addWeeks(
                        parseISO(project.startDate),
                        project.durationWeeks,
                      ).getTime();
                      const ms =
                        granularity === "week" ? 7 * 86400000 : 86400000;
                      const projLeft =
                        ((projStartMs - viewStart.getTime()) / ms) * cellWidth;
                      const projWidth =
                        ((projEndMs - projStartMs) / ms) * cellWidth;

                      return (
                        <div key={project.id}>
                          <div
                            className={`${color.light} border-b border-slate-100 relative`}
                            style={{ height: ROW_H }}
                          >
                            <div
                              className={`absolute top-1/2 -translate-y-1/2 rounded-full opacity-25 ${color.bg}`}
                              style={{
                                left: Math.max(0, projLeft),
                                width: Math.max(projWidth, 16),
                                height: 8,
                              }}
                            />
                          </div>

                          {isOpen &&
                            project.tasks.map((task) => {
                              const { left, width } = barProps(
                                task,
                                viewStart,
                                cellWidth,
                                granularity,
                              );
                              const sc =
                                STATUS_CONFIG[task.status] ??
                                STATUS_CONFIG.upcoming;
                              const visible =
                                left + width > 0 && left < totalWidth;
                              return (
                                <div
                                  key={task.id}
                                  className="relative border-b border-slate-50 bg-white"
                                  style={{ height: ROW_H }}
                                >
                                  {visible && (
                                    <div
                                      className={`absolute top-1/2 -translate-y-1/2 ${sc.barBg} rounded-full flex items-center px-2 cursor-pointer hover:brightness-90 transition-all shadow-sm`}
                                      style={{
                                        left: Math.max(0, left),
                                        width: Math.max(width, 16),
                                        height: 22,
                                      }}
                                      onClick={() =>
                                        setTaskDlg({
                                          open: true,
                                          projectId: project.id,
                                          initial: task,
                                        })
                                      }
                                      title={`${task.title} · ${task.startDate} → ${task.endDate}`}
                                    >
                                      {width > 55 && (
                                        <span
                                          className={`text-[10px] font-medium truncate ${sc.text}`}
                                        >
                                          {task.title}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <ProjectDialog
        open={projDlg.open}
        onClose={() => setProjDlg({ open: false, initial: null })}
        onSave={(data) =>
          projDlg.initial
            ? editProject(projDlg.initial.id, data)
            : addProject(data)
        }
        initial={projDlg.initial}
      />
      <TaskDialog
        open={taskDlg.open}
        onClose={() =>
          setTaskDlg({ open: false, projectId: null, initial: null })
        }
        onSave={(data) =>
          taskDlg.initial
            ? editTask(taskDlg.projectId, taskDlg.initial.id, data)
            : addTask(taskDlg.projectId, data)
        }
        initial={taskDlg.initial}
      />
    </div>
  );
}
