import { Construction } from "lucide-react";

export function ProjectEdgeFeaturePlaceholder({ title, description }: { title: string; description: string }) {
  return (
    <section className="pe-card border p-8 text-center">
      <Construction aria-hidden="true" className="mx-auto size-8 text-indigo-600" />
      <h2 className="mt-4 text-lg font-semibold text-slate-950">{title}</h2>
      <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-600">{description}</p>
    </section>
  );
}
