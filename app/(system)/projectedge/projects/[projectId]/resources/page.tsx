import { ResourceHeatmap } from "@/components/projectedge/ResourceHeatmap";
export default async function ProjectResourcesPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  return <ResourceHeatmap projectId={Number(projectId)} />;
}
