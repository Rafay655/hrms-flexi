"use client";
import { ProjectEdgeStatePanel } from "@/components/projectedge/StatePanel";
export default function ProjectWorkspaceError({ reset }: { error: Error; reset: () => void }) { return <ProjectEdgeStatePanel action={{ label: "Try again", onClick: reset }} description="The project workspace could not be loaded." kind="error" title="Project unavailable" />; }
