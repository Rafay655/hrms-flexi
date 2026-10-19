import { BudgetDashboard } from "@/components/projectedge/BudgetDashboard";
export default async function ProjectBudgetPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  return <BudgetDashboard projectId={Number(projectId)} />;
}
