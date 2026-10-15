import { Check, Users, ClipboardCheck, Layers } from "lucide-react";

export function BatchWorkflow({ step }: { step: 1 | 2 | 3 }) {
  return <ol aria-label="Batch generation steps" className="grid gap-3 sm:grid-cols-3">{[
    { title: "Select employees", description: "Choose a letter type and cohort", icon: Users },
    { title: "Review eligibility", description: "Check eligible and skipped employees", icon: ClipboardCheck },
    { title: "Generate letters", description: "Commit and follow each outcome", icon: Layers },
  ].map((item, index) => <li key={item.title} aria-current={step === index + 1 ? "step" : undefined} className={`flex items-center gap-3 rounded-xl border p-4 ${step === index + 1 ? "border-brand-500 bg-brand-100/60" : "border-brand-200 bg-white"}`}><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${step >= index + 1 ? "bg-brand-800 text-white" : "bg-brand-100 text-brand-700"}`}>{step > index + 1 ? <Check className="h-4 w-4" /> : <item.icon className="h-4 w-4" />}</span><div><p className="text-sm font-semibold text-brand-900">{index + 1}. {item.title}</p><p className="mt-1 text-xs text-muted-foreground">{item.description}</p></div></li>)}</ol>;
}
