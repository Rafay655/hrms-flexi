/**
 * types/engageboard-celebrations.types.ts
 *
 * Mirrors backend/app/Http/Resources/EngageBoard/Celebrations/TeamEventResource.php.
 * Rows are computed live (CelebrationService::computeUpcoming()) — never
 * pre-persisted `team_events` rows — so there is no numeric/uuid primary key
 * to rely on for a React list key; callers should key off
 * `${employee.id}-${event_type}-${event_date}` instead (see
 * components/engageboard/CelebrationCard.tsx).
 */

export type CelebrationEventType = "birthday" | "work_anniversary";

export interface TeamEvent {
  uuid: string | null;
  employee: { id: number; name: string } | null;
  event_type: CelebrationEventType;
  event_date: string | null;
  years_of_service: number | null;
  celebration_card_template: string | null;
  custom_message: string | null;
}
