import type {ImportScope} from '@/services/import-studio.service';
export function availableImportScopes(scopes:ImportScope[]):ImportScope[]{return scopes.flatMap(scope=>scope.destinations?.length?[scope,...scope.destinations]:[scope]);}
