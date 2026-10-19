import { Skeleton } from "@/components/ui/skeleton";

export default function ProjectEdgeLoading() {
  return (
    <div aria-busy="true" aria-label="Loading ProjectEdge" className="space-y-5" role="status">
      <span className="sr-only">Loading ProjectEdge</span>
      <Skeleton className="h-40 rounded-2xl" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => <Skeleton className="h-28 rounded-2xl" key={index} />)}
      </div>
      <Skeleton className="h-80 rounded-2xl" />
    </div>
  );
}
