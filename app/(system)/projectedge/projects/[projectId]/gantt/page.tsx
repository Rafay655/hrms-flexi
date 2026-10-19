import { ProjectEdgeGanttChart } from "@/components/projectedge/GanttChart";

export default async function ProjectGanttPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  return <ProjectEdgeGanttChart projectId={Number(projectId)} />;
}
