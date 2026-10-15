import { Skeleton } from "@/components/ui/skeleton";

export default function ManagerReviewsLoading() {
  return (
    <main className="min-h-screen bg-[#f7f8fa] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1540px] space-y-6">
        <Skeleton className="h-52 rounded-3xl" />
        <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
          <Skeleton className="h-[32rem] rounded-3xl" />
          <div className="space-y-5">
            <Skeleton className="h-56 rounded-3xl" />
            <Skeleton className="h-[34rem] rounded-2xl" />
          </div>
        </div>
      </div>
    </main>
  );
}
