import { ProjectEdgePageHeader } from "@/components/projectedge/PageHeader";
import { Reports } from "@/components/projectedge/Reports";

export default function ReportsPage() {
  return (
    <div className="space-y-5">
      <ProjectEdgePageHeader
        breadcrumbs={[{ label: "Reports" }]}
        title="Reports"
        description="Nine operational reports with explicit sources and access scopes, queued PDF/Excel exports and Gantt snapshots."
      />
      <Reports />
    </div>
  );
}
