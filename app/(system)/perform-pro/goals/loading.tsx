export default function PerformProGoalsLoading() {
  return (
    <main className="min-h-screen bg-gray-50/70 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl" aria-busy="true" aria-label="Loading goals and OKRs">
        <div className="h-64 animate-pulse rounded-3xl border border-brand-100 bg-white motion-reduce:animate-none" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-36 animate-pulse rounded-2xl border border-gray-200 bg-white motion-reduce:animate-none"
            />
          ))}
        </div>
        <div className="mt-6 h-20 animate-pulse rounded-2xl border border-gray-200 bg-white motion-reduce:animate-none" />
        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          {[0, 1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-72 animate-pulse rounded-2xl border border-gray-200 bg-white motion-reduce:animate-none"
            />
          ))}
        </div>
      </div>
    </main>
  );
}
