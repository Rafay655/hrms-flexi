import { Skeleton } from "@/components/ui/skeleton";

export default function SelfReviewsLoading() {
  return (
    <main className="min-h-screen bg-[#f7f8fa] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1480px] space-y-6">
        <Skeleton className="h-52 rounded-3xl" />
        <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          <Skeleton className="h-96 rounded-3xl" />
          <div className="space-y-5">
            <Skeleton className="h-52 rounded-3xl" />
            <Skeleton className="h-96 rounded-3xl" />
          </div>
        </div>
      </div>
    </main>
  );
}
