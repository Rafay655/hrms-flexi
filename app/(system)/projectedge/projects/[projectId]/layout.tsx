import type { ReactNode } from "react";
import { ProjectEdgeProjectWorkspaceShell } from "@/components/projectedge/ProjectWorkspaceShell";

export default async function ProjectWorkspaceLayout({ children, params }: { children: ReactNode; params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  return <ProjectEdgeProjectWorkspaceShell projectId={Number(projectId)}>{children}</ProjectEdgeProjectWorkspaceShell>;
}
