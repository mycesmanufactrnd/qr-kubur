export default function InlineLoadingComponent({
  isTable = false,
  isGrid = false,
  colSpan = 1,
  message = 'Loading data…',
}) {
  const Spinner = (
    <span className="inline-block w-6 h-6 border-4 border-gray-200 border-t-gray-400 rounded-full animate-spin" />
  );

  if (isTable) {
    return (
      <tr>
        <td colSpan={colSpan} className="p-10">
          <div className="flex items-center justify-center gap-3 text-gray-500">
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
        <div className="flex items-center justify-center gap-3 text-gray-500">
          {Spinner}
          <span className="text-sm">{message}</span>
        </div>
      </div>
    );
  }

  return Spinner;
}
