import { ProjectEdgePageHeader } from "@/components/projectedge/PageHeader";
import { ResourceHeatmap } from "@/components/projectedge/ResourceHeatmap";
export default function ResourcesPage() {
  return (
    <div className="space-y-5">
      <ProjectEdgePageHeader
        breadcrumbs={[{ label: "Resources" }]}
        description="Company capacity, allocations, and overload signals."
        title="Resources"
      />
      <ResourceHeatmap />
    </div>
  );
}
