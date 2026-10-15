/**
 * lib/stores/connect-central/securityStore.ts
 * RTK slice — ConnectCentral security overview cache.
 *
 * Stores the last-fetched SecurityOverview so the dashboard banner and
 * SecurityHealthBadge can display stale data while a fresh fetch is in flight.
 * The server-side cache is 60s; we mirror that TTL client-side.
 */

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { SecurityOverview } from "@/lib/api/connect-central/security";
import type { RootState } from "@/store/store";

type CCSecurityState = {
  overview: SecurityOverview | null;
  /** ISO timestamp of the last client-side fetch. */
  lastFetchedAt: string | null;
  /** Whether a fetch is currently in-flight. */
  isFetching: boolean;
};

const initialState: CCSecurityState = {
  overview: null,
  lastFetchedAt: null,
  isFetching: false,
};

const ccSecuritySlice = createSlice({
  name: "ccSecurity",
  initialState,
  reducers: {
    setOverview(state, action: PayloadAction<SecurityOverview>) {
      state.overview = action.payload;
      state.lastFetchedAt = new Date().toISOString();
      state.isFetching = false;
    },
    setFetching(state, action: PayloadAction<boolean>) {
      state.isFetching = action.payload;
    },
    clearOverview(state) {
      state.overview = null;
      state.lastFetchedAt = null;
      state.isFetching = false;
    },
  },
});

export const { setOverview, setFetching, clearOverview } =
  ccSecuritySlice.actions;

export default ccSecuritySlice.reducer;

// ── Selectors ─────────────────────────────────────────────────────────────────

export const selectSecurityOverview = (state: RootState) =>
  state.ccSecurity.overview;

export const selectHealthScore = (state: RootState) =>
  state.ccSecurity.overview?.health_score.total ?? null;

export const selectSecurityIsFetching = (state: RootState) =>
  state.ccSecurity.isFetching;

/** Returns true if the cached snapshot is older than 60 seconds. */
export const selectIsOverviewStale = (state: RootState): boolean => {
  const ts = state.ccSecurity.lastFetchedAt;
  if (!ts) return true;
  return Date.now() - new Date(ts).getTime() > 60_000;
};
