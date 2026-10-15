import { parseApiError } from "@/lib/api-error";

export function ApiFieldErrors({ error }: { error: unknown }) {
  const { fieldErrors, hint } = parseApiError(error);
  if (!Object.keys(fieldErrors).length) return null;
  return <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"><p className="font-medium">Please check these fields:</p><ul className="mt-2 list-inside list-disc space-y-1">{Object.entries(fieldErrors).map(([field, messages]) => <li key={field}><span className="font-medium">{field.replaceAll("_", " ").replaceAll(".", " › ")}: </span>{messages.join(" ")}</li>)}</ul>{hint && <p className="mt-2">{hint}</p>}</div>;
}
