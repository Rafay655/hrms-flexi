/**
 * lib/stores/connect-central/sessionStore.ts
 * RTK slice — ConnectCentral session state.
 *
 * Tracks the current session UUID (written to localStorage after login so the
 * CC axios interceptor can attach X-Session-UUID), plus the live active session
 * count for display in the nav badge.
 */

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "@/store/store";

type CCSessionState = {
  /** UUID of the current browser session — sourced from UserSession after login. */
  currentSessionUuid: string | null;
  /** Live count of active sessions for this user (badge display). */
  activeSessionCount: number;
  /** ISO timestamp of last time session list was refreshed. */
  lastRefreshedAt: string | null;
};

const initialState: CCSessionState = {
  currentSessionUuid:
    typeof window !== "undefined"
      ? localStorage.getItem("cc_session_uuid")
      : null,
  activeSessionCount: 0,
  lastRefreshedAt: null,
};

const ccSessionSlice = createSlice({
  name: "ccSession",
  initialState,
  reducers: {
    setCurrentSessionUuid(state, action: PayloadAction<string | null>) {
      state.currentSessionUuid = action.payload;
      // Persist so the axios interceptor can read it without React context.
      if (typeof window !== "undefined") {
        if (action.payload) {
          localStorage.setItem("cc_session_uuid", action.payload);
        } else {
          localStorage.removeItem("cc_session_uuid");
        }
      }
    },
    setActiveSessionCount(state, action: PayloadAction<number>) {
      state.activeSessionCount = action.payload;
      state.lastRefreshedAt = new Date().toISOString();
    },
    clearCCSession(state) {
      state.currentSessionUuid = null;
      state.activeSessionCount = 0;
      state.lastRefreshedAt = null;
      if (typeof window !== "undefined") {
        localStorage.removeItem("cc_session_uuid");
      }
    },
  },
});

export const { setCurrentSessionUuid, setActiveSessionCount, clearCCSession } =
  ccSessionSlice.actions;

export default ccSessionSlice.reducer;

// ── Selectors ─────────────────────────────────────────────────────────────────

export const selectCurrentSessionUuid = (state: RootState) =>
  state.ccSession.currentSessionUuid;

export const selectActiveSessionCount = (state: RootState) =>
  state.ccSession.activeSessionCount;

export const selectSessionLastRefreshed = (state: RootState) =>
  state.ccSession.lastRefreshedAt;
