export default function PageLoadingComponent() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 pointer-events-auto">
      <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-emerald-500"></div>
    </div>
  );
}
