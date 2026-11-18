import { parseApiError } from '@/lib/api-error';
export function ImportErrorFeedback({error}:{error:unknown}){
  if(!error)return null;
  const parsed=parseApiError(error);
  return <div role="alert" className="space-y-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"><p>{parsed.message}</p>{Object.entries(parsed.fieldErrors).map(([field,messages])=><p key={field} className="text-xs">{field}: {messages.join(' ')}</p>)}{parsed.requestId&&<p className="text-xs">Support reference: {parsed.requestId}</p>}</div>;
}
