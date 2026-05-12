export default function InlineLoadingComponent({
  isPage = false,
  isTable = false,
  isGrid = false,
  colSpan = 1,
  message = 'Loading data…',
}) {
  const Spinner = (
    <span className="inline-block w-8 h-8 rounded-full border-[3px] border-slate-200 dark:border-slate-700 border-t-emerald-500 dark:border-t-emerald-400 animate-spin" />
  );

  if (isPage) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none z-0">
        {Spinner}
        <span className="text-sm text-slate-400 dark:text-slate-500">{message}</span>
      </div>
    );
  }

  if (isTable) {
    return (
      <tr>
        <td colSpan={colSpan} className="p-10">
          <div className="flex flex-col items-center justify-center gap-3 text-slate-400 dark:text-slate-500">
            {Spinner}
            <span className="text-sm">{message}</span>
          </div>
        </td>
      </tr>
    );
  }

  if (isGrid) {
    return (
      <div className="col-span-full py-10">
        <div className="flex flex-col items-center justify-center gap-3 text-slate-400 dark:text-slate-500">
          {Spinner}
          <span className="text-sm">{message}</span>
        </div>
      </div>
    );
  }

  return Spinner;
}
