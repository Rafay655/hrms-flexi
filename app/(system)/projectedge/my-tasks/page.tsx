import { ProjectEdgePageHeader } from "@/components/projectedge/PageHeader";
import { MyTasks } from "@/components/projectedge/MyTasks";

export default function MyTasksPage() {
  return (
    <div className="space-y-5">
      <ProjectEdgePageHeader
        breadcrumbs={[{ label: "My tasks" }]}
        description="Your assigned work across projects, with priority, schedule and milestone context."
        title="My tasks"
      />
      <MyTasks />
    </div>
  );
}
