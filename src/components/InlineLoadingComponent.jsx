export default function InlineLoadingComponent({
  isTable = false,
  colSpan = 1,
}) {
  return (
    <>
      {isTable ? (
        <tr>
            <td colSpan={colSpan} className="p-10">
                <div className="flex items-center justify-center gap-3 text-gray-500">
                <span className="inline-block w-5 h-5 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin" />
                <span className="text-sm">Loading data…</span>
                </div>
            </td>
        </tr>
      ) : (
        <span className="inline-block w-6 h-6 border-4 border-gray-200 border-t-gray-400 rounded-full animate-spin"></span>
      )}
    </>
  );
}
