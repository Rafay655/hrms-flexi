"use client";

import { useEffect } from "react";
import { ProjectEdgeStatePanel } from "@/components/projectedge/StatePanel";

export default function ProjectEdgeError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("ProjectEdge route error", error);
  }, [error]);

  return (
    <ProjectEdgeStatePanel
      action={{ label: "Try again", onClick: reset }}
      description="The ProjectEdge workspace could not be loaded. Check your connection and try again."
      kind="error"
      title="We could not open ProjectEdge"
    />
  );
}
