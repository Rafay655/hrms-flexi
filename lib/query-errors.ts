import { MutationCache, QueryCache } from "@tanstack/react-query";
import { markApiErrorHandled, showApiError } from "./error-toast";

// Call only after React Query has exhausted its existing retry policy.
// Local callbacks still run; object identity suppresses a second notification.
export function createErrorCaches() {
  const failingQueries = new WeakSet<object>();
  return {
    queryCache: new QueryCache({ onError: (error, query) => {
      if (query.meta?.silentError === true || failingQueries.has(query)) { markApiErrorHandled(error); return; }
      failingQueries.add(query);
      showApiError(error, { id: `query:${query.queryHash}` });
    }, onSuccess: (_data, query) => { failingQueries.delete(query); } }),
    mutationCache: new MutationCache({ onError: (error, _variables, _context, mutation) => {
      if (mutation.meta?.silentError === true) { markApiErrorHandled(error); return; }
      showApiError(error);
    } }),
  };
}
