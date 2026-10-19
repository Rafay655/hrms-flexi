import { MilestoneManager } from "@/components/projectedge/MilestoneManager";

export default async function ProjectMilestonesPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ milestone?: string }>;
}) {
  const { projectId } = await params;
  const { milestone } = await searchParams;
  return (
    <MilestoneManager
      projectId={Number(projectId)}
      initialMilestoneId={milestone ? Number(milestone) : undefined}
    />
  );
}
