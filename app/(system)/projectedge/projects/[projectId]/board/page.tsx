import { ProjectEdgeKanbanBoard } from "@/components/projectedge/KanbanBoard";

export default async function ProjectBoardPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ task?: string }>;
}) {
  const { projectId } = await params;
  const { task } = await searchParams;
  return (
    <ProjectEdgeKanbanBoard
      projectId={Number(projectId)}
      initialTaskId={
        task && Number.isInteger(Number(task)) ? Number(task) : null
      }
    />
  );
}
