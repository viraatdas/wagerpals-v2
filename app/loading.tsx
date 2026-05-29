export default function Loading() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="space-y-5 animate-pulse">
        <div className="h-8 w-56 rounded bg-gray-200" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-28 rounded-lg bg-white border border-gray-200" />
          <div className="h-28 rounded-lg bg-white border border-gray-200" />
          <div className="h-28 rounded-lg bg-white border border-gray-200" />
        </div>
        <div className="h-64 rounded-lg bg-white border border-gray-200" />
      </div>
    </div>
  );
}
