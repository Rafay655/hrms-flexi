/**
 * types/ess.ts
 * ESS Portal — shared DTOs.
 *
 * Mirrors app/Http/Resources/ESS/EssMeResource.php. Keep the two in step: the resource is
 * the contract, this is the client's view of it.
 */

/** Why an area is or isn't usable. Mirrors EssCapabilityResolver::resolveAll(). */
export type EssCapabilityReason = "available" | "module_not_built" | "not_entitled";

/**
 * One ESS area as resolved by the backend.
 *
 * `available` is authoritative — it already folds in BOTH "is the backing module built"
 * and "does this user hold the permission". The client must never re-derive it, and must
 * never render an area with available === false. See lib/ess.ts.
 */
export type EssCapability = {
  key: string;
  label: string;
  /** App route, e.g. "/ess/leave". */
  route: string;
  /** lucide-react icon name, resolved client-side via the ESS_ICONS map. */
  icon: string;
  /** Chat 28 §2.3 screen IDs this area covers — traceability back to the spec. */
  screens: string[];
  available: boolean;
  reason: EssCapabilityReason;
};

export type EssUser = {
  uuid: string;
  name: string;
  email: string;
  avatar: string | null;
  roles: string[];
};

/**
 * The employee record linked to the signed-in user.
 * `null` is a valid, expected state — an it_admin or a never-onboarded super_admin has no
 * employee record. Areas that need one gate themselves; the shell must not assume it exists.
 */
export type EssEmployee = {
  uuid: string;
  code: string | null;
  display_name: string;
};

/** GET /v1/ess/me — the portal bootstrap payload. */
export type EssMe = {
  user: EssUser;
  employee: EssEmployee | null;
  capabilities: EssCapability[];
};
