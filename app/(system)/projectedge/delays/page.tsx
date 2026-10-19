import { ProjectEdgePageHeader } from "@/components/projectedge/PageHeader";
import { DelayTracker } from "@/components/projectedge/DelayTracker";
export default function DelaysPage() {
  return (
    <div className="space-y-5">
      <ProjectEdgePageHeader
        breadcrumbs={[{ label: "Delay tracker" }]}
        description="Submit, review, and resolve delivery-date changes."
        title="Delay tracker"
      />
      <DelayTracker />
    </div>
  );
}
