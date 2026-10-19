import { ProjectEdgePageHeader } from "@/components/projectedge/PageHeader";
import { Timesheets } from "@/components/projectedge/Timesheets";
export default function TimesheetsPage() {
  return (
    <div className="space-y-5">
      <ProjectEdgePageHeader
        breadcrumbs={[{ label: "Timesheets" }]}
        description="Weekly time entry and approval workspace."
        title="Timesheets"
      />
      <Timesheets />
    </div>
  );
}
