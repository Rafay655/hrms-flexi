import { ProjectTasks } from "@/components/projectedge/ProjectTasks";

export default async function ProjectTasksPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ create?: string }>;
}) {
  const { projectId } = await params;
  const { create } = await searchParams;
  return (
    <ProjectTasks
      projectId={Number(projectId)}
      initialCreate={create === "1"}
    />
  );
}
