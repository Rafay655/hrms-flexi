"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  EmployeeShiftAssignment,
  ModuleData,
  Roster,
  RosterEntry,
  RosterTemplate,
  Shift,
  ShiftSwapRequest,
} from "./types";
import { employees, initialData } from "./seed";
import {
  computeIsCrossDay,
  computeWorkingMinutes,
  CURRENT_MANAGER,
  CURRENT_USER,
  dayNumber,
  enumerateDates,
  formatDateTimeNow,
  getAssignmentPriority,
  holidayCalendar,
  isDateWithin,
  nextId,
  rangesOverlap,
  STORAGE_KEY,
} from "./utils";

type ToastState = { type: "success" | "error"; message: string } | null;

type ContextType = {
  data: ModuleData;
  toast: ToastState;
  clearToast: () => void;
  resetDemoData: () => void;
  exportSnapshot: () => void;

  getEmployee: (id: number) => (typeof employees)[number] | undefined;
  getShift: (id: number | null) => Shift | undefined;
  getTemplate: (id: number | null) => RosterTemplate | undefined;
  getRoster: (id: number) => Roster | undefined;
  getEntry: (id: number) => RosterEntry | undefined;
  getBestAssignment: (employeeId: number, date: string) => EmployeeShiftAssignment | undefined;

  saveShift: (payload: Shift) => boolean;
  deleteShift: (shiftId: number) => void;
  duplicateShift: (shiftId: number) => void;
  toggleShift: (shiftId: number) => void;

  saveTemplate: (payload: RosterTemplate) => boolean;
  deleteTemplate: (templateId: number) => void;
  cloneTemplate: (templateId: number) => void;
  toggleTemplate: (templateId: number) => void;

  saveRoster: (payload: Roster, autoGenerateEntries?: boolean) => boolean;
  generateEntriesForRoster: (rosterId: number) => void;
  publishRoster: (rosterId: number) => void;
  lockRoster: (rosterId: number) => void;
  reopenRoster: (rosterId: number) => void;
  deleteRoster: (rosterId: number) => void;

  saveEntry: (payload: RosterEntry) => boolean;
  deleteEntry: (entryId: number) => void;

  saveSwap: (payload: ShiftSwapRequest, isEdit?: boolean) => boolean;
  cancelSwap: (swapId: number) => void;
  targetAcceptSwap: (swapId: number) => void;
  rejectSwap: (swapId: number, reason: string, stage: "target" | "manager") => void;
  approveSwap: (swapId: number) => void;

  saveAssignment: (payload: EmployeeShiftAssignment) => boolean;
  deleteAssignment: (assignmentId: number) => void;
};

const HrmsContext = createContext<ContextType | null>(null);

export function HrmsShiftProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<ModuleData>(initialData);
  const [toast, setToast] = useState<ToastState>(null);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      setData({ ...initialData, ...parsed });
    } catch {
      setData(initialData);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const notify = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
  };

  const clearToast = () => setToast(null);

  const getEmployee = (id: number) => employees.find((employee) => employee.id === id);
  const getShift = (id: number | null) => data.shifts.find((shift) => shift.id === id);
  const getTemplate = (id: number | null) => data.templates.find((template) => template.id === id);
  const getRoster = (id: number) => data.rosters.find((roster) => roster.id === id);
  const getEntry = (id: number) => data.entries.find((entry) => entry.id === id);

  const getBestAssignment = (employeeId: number, date: string) => {
    const matches = data.assignments
      .filter(
        (assignment) =>
          assignment.employee_id === employeeId &&
          isDateWithin(date, assignment.valid_from, assignment.valid_to || "9999-12-31")
      )
      .sort((a, b) => getAssignmentPriority(b.assignment_type) - getAssignmentPriority(a.assignment_type));
    return matches[0];
  };

  const resetDemoData = () => {
    setData(initialData);
    notify("Module reset to demo data.");
  };

  const exportSnapshot = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "hrms-shift-roster-snapshot.json";
    link.click();
    URL.revokeObjectURL(url);
    notify("Snapshot exported successfully.");
  };

  const saveShift = (payload: Shift) => {
    if (!payload.shift_code.trim() || !payload.shift_name.trim()) {
      notify("Shift code and shift name are required.", "error");
      return false;
    }
    if (payload.working_days.some((day) => payload.weekly_off_days.includes(day))) {
      notify("Working days and weekly off days cannot overlap.", "error");
      return false;
    }
    if (Number(payload.paid_break_minutes) + Number(payload.unpaid_break_minutes) !== Number(payload.break_minutes)) {
      notify("Paid break and unpaid break must equal total break minutes.", "error");
      return false;
    }
    const duplicate = data.shifts.find(
      (item) => item.shift_code.toLowerCase() === payload.shift_code.toLowerCase() && item.id !== payload.id
    );
    if (duplicate) {
      notify("Shift code must be unique.", "error");
      return false;
    }

    const normalized: Shift = {
      ...payload,
      id: payload.id || nextId(data.shifts),
      is_cross_day: computeIsCrossDay(payload.start_time, payload.end_time),
      working_minutes: computeWorkingMinutes(payload.start_time, payload.end_time, Number(payload.break_minutes)),
      max_ot_minutes: payload.overtime_allowed ? Number(payload.max_ot_minutes || 0) : null,
      night_premium_rate: payload.night_premium_applicable ? Number(payload.night_premium_rate || 1.25) : null,
    };

    setData((current) => ({
      ...current,
      shifts: payload.id
        ? current.shifts.map((shift) => (shift.id === normalized.id ? normalized : shift))
        : [...current.shifts, normalized],
    }));
    notify(payload.id ? "Shift updated successfully." : "Shift created successfully.");
    return true;
  };

  const deleteShift = (shiftId: number) => {
    const usedInTemplates = data.templates.some((template) => template.pattern.some((day) => day.shift_id === shiftId));
    const usedInEntries = data.entries.some((entry) => entry.shift_id === shiftId);
    const usedInAssignments = data.assignments.some((assignment) => assignment.shift_id === shiftId);
    if (usedInTemplates || usedInEntries || usedInAssignments) {
      notify("This shift is already in use and cannot be deleted.", "error");
      return;
    }
    setData((current) => ({ ...current, shifts: current.shifts.filter((shift) => shift.id !== shiftId) }));
    notify("Shift deleted successfully.");
  };

  const duplicateShift = (shiftId: number) => {
    const shift = getShift(shiftId);
    if (!shift) return;
    let code = `${shift.shift_code}-COPY`;
    let count = 2;
    while (data.shifts.some((item) => item.shift_code === code)) {
      code = `${shift.shift_code}-COPY-${count}`;
      count += 1;
    }
    const cloned = { ...shift, id: nextId(data.shifts), shift_code: code, shift_name: `${shift.shift_name} Copy` };
    setData((current) => ({ ...current, shifts: [...current.shifts, cloned] }));
    notify("Shift duplicated successfully.");
  };

  const toggleShift = (shiftId: number) => {
    setData((current) => ({
      ...current,
      shifts: current.shifts.map((shift) => (shift.id === shiftId ? { ...shift, is_active: !shift.is_active } : shift)),
    }));
    notify("Shift status updated.");
  };

  const saveTemplate = (payload: RosterTemplate) => {
    if (!payload.template_name.trim()) {
      notify("Template name is required.", "error");
      return false;
    }
    if (payload.pattern.length !== Number(payload.rotation_cycle_days)) {
      notify("Pattern length must match cycle length.", "error");
      return false;
    }

    const normalized: RosterTemplate = {
      ...payload,
      id: payload.id || nextId(data.templates),
      pattern: payload.pattern.map((row, index) => ({ day: index + 1, shift_id: row.shift_id ? Number(row.shift_id) : null })),
    };

    setData((current) => ({
      ...current,
      templates: payload.id
        ? current.templates.map((template) => (template.id === normalized.id ? normalized : template))
        : [...current.templates, normalized],
    }));
    notify(payload.id ? "Template updated successfully." : "Template created successfully.");
    return true;
  };

  const deleteTemplate = (templateId: number) => {
    const used = data.rosters.some((roster) => roster.template_id === templateId);
    if (used) {
      notify("This template is already linked with a roster.", "error");
      return;
    }
    setData((current) => ({ ...current, templates: current.templates.filter((template) => template.id !== templateId) }));
    notify("Template deleted successfully.");
  };

  const cloneTemplate = (templateId: number) => {
    const template = getTemplate(templateId);
    if (!template) return;
    const cloned: RosterTemplate = {
      ...template,
      id: nextId(data.templates),
      template_name: `${template.template_name} Copy`,
      pattern: template.pattern.map((row) => ({ ...row })),
    };
    setData((current) => ({ ...current, templates: [...current.templates, cloned] }));
    notify("Template cloned successfully.");
  };

  const toggleTemplate = (templateId: number) => {
    setData((current) => ({
      ...current,
      templates: current.templates.map((template) =>
        template.id === templateId ? { ...template, is_active: !template.is_active } : template
      ),
    }));
    notify("Template status updated.");
  };

  const buildRosterEntries = (roster: Roster) => {
    const template = getTemplate(roster.template_id);
    const dates = enumerateDates(roster.start_date, roster.end_date);
    const nextEntries: RosterEntry[] = [];
    let entryId = nextId(data.entries);

    employees
      .filter((employee) => employee.is_active)
      .forEach((employee) => {
        dates.forEach((date, index) => {
          const holiday = holidayCalendar.some((item) => item.date === date);
          let shiftId: number | null = null;

          if (template) {
            const cycleIndex = (index % template.rotation_cycle_days) + 1;
            shiftId = template.pattern.find((row) => row.day === cycleIndex)?.shift_id ?? null;
          } else {
            shiftId = getBestAssignment(employee.id, date)?.shift_id ?? null;
          }

          const shift = getShift(shiftId);
          const weeklyOff = shift ? shift.weekly_off_days.includes(dayNumber(date)) : false;
          nextEntries.push({
            id: entryId++,
            roster_id: roster.id,
            employee_id: employee.id,
            roster_date: date,
            shift_id: holiday ? null : shiftId,
            is_weekly_off: holiday ? false : weeklyOff || shiftId === null,
            is_holiday: holiday,
            notes: holiday ? "Public holiday" : shiftId ? "Generated entry" : "Off day",
          });
        });
      });

    return nextEntries;
  };

  const saveRoster = (payload: Roster, autoGenerateEntries = true) => {
    if (!payload.roster_name.trim()) {
      notify("Roster name is required.", "error");
      return false;
    }
    if (!payload.start_date || !payload.end_date || payload.end_date < payload.start_date) {
      notify("Roster dates are invalid.", "error");
      return false;
    }

    const normalized: Roster = {
      ...payload,
      id: payload.id || nextId(data.rosters),
      total_employees: employees.filter((employee) => employee.is_active).length,
    };

    const nextRosters = payload.id
      ? data.rosters.map((roster) => (roster.id === normalized.id ? normalized : roster))
      : [...data.rosters, normalized];

    let nextEntries = data.entries;
    if (autoGenerateEntries) {
      nextEntries = [...data.entries.filter((entry) => entry.roster_id !== normalized.id), ...buildRosterEntries(normalized)];
    }

    setData((current) => ({ ...current, rosters: nextRosters, entries: nextEntries }));
    notify(payload.id ? "Roster updated successfully." : "Roster created successfully.");
    return true;
  };

  const generateEntriesForRoster = (rosterId: number) => {
    const roster = getRoster(rosterId);
    if (!roster) return;
    if (roster.status === "locked") {
      notify("Locked roster cannot be regenerated.", "error");
      return;
    }
    const generated = buildRosterEntries(roster);
    setData((current) => ({
      ...current,
      entries: [...current.entries.filter((entry) => entry.roster_id !== rosterId), ...generated],
    }));
    notify("Roster entries generated successfully.");
  };

  const publishRoster = (rosterId: number) => {
    const hasEntries = data.entries.some((entry) => entry.roster_id === rosterId);
    if (!hasEntries) {
      notify("Generate entries before publishing the roster.", "error");
      return;
    }
    setData((current) => ({
      ...current,
      rosters: current.rosters.map((roster) =>
        roster.id === rosterId
          ? { ...roster, status: "published", published_at: formatDateTimeNow(), published_by: CURRENT_USER }
          : roster
      ),
    }));
    notify("Roster published successfully.");
  };

  const lockRoster = (rosterId: number) => {
    const hasEntries = data.entries.some((entry) => entry.roster_id === rosterId);
    if (!hasEntries) {
      notify("Cannot lock an empty roster.", "error");
      return;
    }
    setData((current) => ({
      ...current,
      rosters: current.rosters.map((roster) => (roster.id === rosterId ? { ...roster, status: "locked" } : roster)),
    }));
    notify("Roster locked successfully.");
  };

  const reopenRoster = (rosterId: number) => {
    setData((current) => ({
      ...current,
      rosters: current.rosters.map((roster) => (roster.id === rosterId ? { ...roster, status: "draft" } : roster)),
    }));
    notify("Roster reopened as draft.");
  };

  const deleteRoster = (rosterId: number) => {
    const roster = getRoster(rosterId);
    if (roster?.status === "locked") {
      notify("Locked roster cannot be deleted.", "error");
      return;
    }
    setData((current) => ({
      ...current,
      rosters: current.rosters.filter((rosterRow) => rosterRow.id !== rosterId),
      entries: current.entries.filter((entry) => entry.roster_id !== rosterId),
      swaps: current.swaps.filter((swap) => swap.roster_id !== rosterId),
    }));
    notify("Roster deleted successfully.");
  };

  const saveEntry = (payload: RosterEntry) => {
    const roster = getRoster(payload.roster_id);
    if (!roster) {
      notify("Selected roster does not exist.", "error");
      return false;
    }
    if (roster.status === "locked") {
      notify("Locked roster entries cannot be modified.", "error");
      return false;
    }
    const duplicate = data.entries.find(
      (entry) =>
        entry.roster_id === payload.roster_id &&
        entry.employee_id === payload.employee_id &&
        entry.roster_date === payload.roster_date &&
        entry.id !== payload.id
    );
    if (duplicate) {
      notify("Duplicate roster entry for the same employee and date.", "error");
      return false;
    }

    const normalized: RosterEntry = {
      ...payload,
      id: payload.id || nextId(data.entries),
      shift_id: payload.is_holiday || payload.is_weekly_off ? null : payload.shift_id,
    };

    setData((current) => ({
      ...current,
      entries: payload.id
        ? current.entries.map((entry) => (entry.id === normalized.id ? normalized : entry))
        : [...current.entries, normalized],
    }));
    notify(payload.id ? "Roster entry updated successfully." : "Roster entry created successfully.");
    return true;
  };

  const deleteEntry = (entryId: number) => {
    const entry = getEntry(entryId);
    const roster = entry ? getRoster(entry.roster_id) : null;
    if (roster?.status === "locked") {
      notify("Entry cannot be deleted from a locked roster.", "error");
      return;
    }
    setData((current) => ({
      ...current,
      entries: current.entries.filter((entry) => entry.id !== entryId),
      swaps: current.swaps.filter((swap) => swap.requester_entry_id !== entryId && swap.target_entry_id !== entryId),
    }));
    notify("Entry deleted successfully.");
  };

  const saveSwap = (payload: ShiftSwapRequest, isEdit = false) => {
    const roster = getRoster(payload.roster_id);
    if (roster?.status === "locked") {
      notify("Locked roster swap requests cannot be created.", "error");
      return false;
    }
    if (payload.requester_entry_id === payload.target_entry_id) {
      notify("Requester and target entries must be different.", "error");
      return false;
    }
    const requesterEntry = getEntry(payload.requester_entry_id);
    const targetEntry = getEntry(payload.target_entry_id);
    if (!requesterEntry || !targetEntry) {
      notify("Selected entries are invalid.", "error");
      return false;
    }
    if (requesterEntry.roster_date !== targetEntry.roster_date || requesterEntry.roster_date !== payload.swap_date) {
      notify("Both entries must belong to the same date.", "error");
      return false;
    }
    if (requesterEntry.shift_id === targetEntry.shift_id) {
      notify("Both entries already have the same shift.", "error");
      return false;
    }

    const normalized: ShiftSwapRequest = {
      ...payload,
      id: payload.id || nextId(data.swaps),
      status: isEdit ? payload.status : "pending_target",
      target_response_at: isEdit ? payload.target_response_at : null,
      manager_id: isEdit ? payload.manager_id : null,
      manager_response_at: isEdit ? payload.manager_response_at : null,
      rejection_reason: isEdit ? payload.rejection_reason : "",
    };

    setData((current) => ({
      ...current,
      swaps: payload.id
        ? current.swaps.map((swap) => (swap.id === normalized.id ? normalized : swap))
        : [...current.swaps, normalized],
    }));
    notify(payload.id ? "Swap request updated successfully." : "Swap request created successfully.");
    return true;
  };

  const cancelSwap = (swapId: number) => {
    setData((current) => ({
      ...current,
      swaps: current.swaps.map((swap) => (swap.id === swapId ? { ...swap, status: "cancelled" } : swap)),
    }));
    notify("Swap cancelled.");
  };

  const targetAcceptSwap = (swapId: number) => {
    setData((current) => ({
      ...current,
      swaps: current.swaps.map((swap) =>
        swap.id === swapId ? { ...swap, status: "pending_manager", target_response_at: formatDateTimeNow() } : swap
      ),
    }));
    notify("Target accepted. Waiting for manager approval.");
  };

  const rejectSwap = (swapId: number, reason: string, stage: "target" | "manager") => {
    setData((current) => ({
      ...current,
      swaps: current.swaps.map((swap) =>
        swap.id === swapId
          ? {
              ...swap,
              status: "rejected",
              rejection_reason: reason,
              target_response_at: stage === "target" ? formatDateTimeNow() : swap.target_response_at,
              manager_response_at: stage === "manager" ? formatDateTimeNow() : swap.manager_response_at,
              manager_id: stage === "manager" ? CURRENT_MANAGER : swap.manager_id,
            }
          : swap
      ),
    }));
    notify("Swap rejected.");
  };

  const approveSwap = (swapId: number) => {
    const swap = data.swaps.find((item) => item.id === swapId);
    if (!swap) return;
    const requesterEntry = getEntry(swap.requester_entry_id);
    const targetEntry = getEntry(swap.target_entry_id);
    if (!requesterEntry || !targetEntry) {
      notify("Swap entries not found.", "error");
      return;
    }
    const requesterShift = requesterEntry.shift_id;
    const targetShift = targetEntry.shift_id;
    setData((current) => ({
      ...current,
      entries: current.entries.map((entry) => {
        if (entry.id === requesterEntry.id) return { ...entry, shift_id: targetShift, notes: `${entry.notes} | swap approved` };
        if (entry.id === targetEntry.id) return { ...entry, shift_id: requesterShift, notes: `${entry.notes} | swap approved` };
        return entry;
      }),
      swaps: current.swaps.map((item) =>
        item.id === swapId
          ? { ...item, status: "approved", manager_id: CURRENT_MANAGER, manager_response_at: formatDateTimeNow() }
          : item
      ),
    }));
    notify("Swap approved and entries exchanged.");
  };

  const saveAssignment = (payload: EmployeeShiftAssignment) => {
    const overlap = data.assignments.find(
      (assignment) =>
        assignment.employee_id === payload.employee_id &&
        assignment.id !== payload.id &&
        rangesOverlap(
          assignment.valid_from,
          assignment.valid_to || "9999-12-31",
          payload.valid_from,
          payload.valid_to || "9999-12-31"
        )
    );
    if (overlap) {
      notify("This employee already has an overlapping shift assignment.", "error");
      return false;
    }

    const normalized: EmployeeShiftAssignment = {
      ...payload,
      id: payload.id || nextId(data.assignments),
    };

    setData((current) => ({
      ...current,
      assignments: payload.id
        ? current.assignments.map((assignment) => (assignment.id === normalized.id ? normalized : assignment))
        : [...current.assignments, normalized],
    }));
    notify(payload.id ? "Assignment updated successfully." : "Assignment created successfully.");
    return true;
  };

  const deleteAssignment = (assignmentId: number) => {
    setData((current) => ({
      ...current,
      assignments: current.assignments.filter((assignment) => assignment.id !== assignmentId),
    }));
    notify("Assignment deleted successfully.");
  };

  const value = useMemo<ContextType>(
    () => ({
      data,
      toast,
      clearToast,
      resetDemoData,
      exportSnapshot,
      getEmployee,
      getShift,
      getTemplate,
      getRoster,
      getEntry,
      getBestAssignment,
      saveShift,
      deleteShift,
      duplicateShift,
      toggleShift,
      saveTemplate,
      deleteTemplate,
      cloneTemplate,
      toggleTemplate,
      saveRoster,
      generateEntriesForRoster,
      publishRoster,
      lockRoster,
      reopenRoster,
      deleteRoster,
      saveEntry,
      deleteEntry,
      saveSwap,
      cancelSwap,
      targetAcceptSwap,
      rejectSwap,
      approveSwap,
      saveAssignment,
      deleteAssignment,
    }),
    [data, toast]
  );

  return <HrmsContext.Provider value={value}>{children}</HrmsContext.Provider>;
}

export function useHrmsShiftModule() {
  const context = useContext(HrmsContext);
  if (!context) throw new Error("useHrmsShiftModule must be used inside HrmsShiftProvider");
  return context;
}
