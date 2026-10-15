"use client";

import React, { useMemo, useRef, useState } from "react";
import {
  Bell,
  Mail,
  Smartphone,
  MessageSquare,
  Save,
  Eye,
  ChevronRight,
  Info,
  Calculator,
  User,
  ShieldAlert,
  Search,
  Filter,
  Terminal,
  Layout,
  Send,
  Globe,
  RefreshCw,
  Settings,
  CheckCircle2,
  X,
} from "lucide-react";

type Channel = "inApp" | "email" | "push" | "sms";
type EventCategory = "PAYROLL" | "EMPLOYEE" | "ADMIN";

interface NotificationEvent {
  id: string;
  name: string;
  category: EventCategory;
  inApp: boolean;
  email: boolean;
  push: boolean;
  sms: boolean;
  templateSubject: string;
  templateBody: string;
}

const INITIAL_EVENTS: NotificationEvent[] = [
  { id: "pay_01", name: "Run Created", category: "PAYROLL", inApp: true, email: false, push: false, sms: false, templateSubject: "Payroll Run Initiated: {{run_id}}", templateBody: "A new payroll run for {{period}} has been created by {{user}}." },
  { id: "pay_02", name: "Critical Exceptions", category: "PAYROLL", inApp: true, email: true, push: true, sms: false, templateSubject: "Action Required: Exceptions in {{run_id}}", templateBody: "High severity exceptions detected in the current run. Please resolve before proceeding." },
  { id: "pay_03", name: "Run Submitted", category: "PAYROLL", inApp: true, email: true, push: false, sms: false, templateSubject: "Payroll Submitted for Approval: {{run_id}}", templateBody: "Run {{run_id}} for {{period}} has been submitted by {{user}} and is awaiting your review." },
  { id: "pay_04", name: "Run Approved", category: "PAYROLL", inApp: true, email: true, push: true, sms: false, templateSubject: "Payroll Approved: {{run_id}}", templateBody: "The payroll run for {{period}} has been approved by {{approver}}." },
  { id: "pay_05", name: "Run Published", category: "PAYROLL", inApp: true, email: true, push: true, sms: true, templateSubject: "Payroll Cycle Finalized: {{period}}", templateBody: "Payroll processing is complete and payslips are now available." },

  { id: "emp_01", name: "Payslip Available", category: "EMPLOYEE", inApp: true, email: true, push: true, sms: false, templateSubject: "Your Payslip for {{month}} {{year}} is Ready", templateBody: "Hello {{emp_name}}, your digital payslip is now available on the ESS portal." },
  { id: "emp_02", name: "Salary Credited", category: "EMPLOYEE", inApp: true, email: false, push: true, sms: true, templateSubject: "Salary Credited", templateBody: "Dear {{emp_name}}, your salary for {{period}} has been transferred to your bank account." },
  { id: "emp_03", name: "Tax Certificate", category: "EMPLOYEE", inApp: true, email: true, push: false, sms: false, templateSubject: "Annual Tax Certificate {{fy}}", templateBody: "Your tax withholding certificate for the assessment year {{fy}} is now available for download." },
  { id: "emp_04", name: "Loan EMI Recovery", category: "EMPLOYEE", inApp: true, email: false, push: true, sms: false, templateSubject: "Loan Installment Recovered", templateBody: "EMI of PKR {{amount}} has been recovered from your salary for Loan ID {{loan_id}}." },

  { id: "adm_01", name: "Period Lock", category: "ADMIN", inApp: true, email: true, push: false, sms: false, templateSubject: "Payroll Period Locked: {{period}}", templateBody: "Governance alert: The payroll period {{period}} has been successfully locked." },
  { id: "adm_02", name: "Statutory Due", category: "ADMIN", inApp: true, email: true, push: true, sms: false, templateSubject: "Deadline Alert: {{statutory_type}} Filing", templateBody: "The filing deadline for {{statutory_type}} for {{period}} is in {{days}} days." },
  { id: "adm_03", name: "Unlock Requested", category: "ADMIN", inApp: true, email: true, push: true, sms: false, templateSubject: "Period Unlock Request: {{period}}", templateBody: "{{user}} has requested to unlock period {{period}}. Justification: {{reason}}" },
];

const TOKENS = ["emp_name", "run_id", "period", "amount", "approver", "lwd", "user", "reason", "fy", "days", "statutory_type", "month", "year", "loan_id"];

export default function PayEdgeNotificationsConfig() {
  const [events, setEvents] = useState<NotificationEvent[]>(INITIAL_EVENTS);
  const [selectedEventId, setSelectedEventId] = useState<string>(INITIAL_EVENTS[0].id);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [testSent, setTestSent] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement | null>(null);

  const selectedEvent = useMemo(
    () => events.find((e) => e.id === selectedEventId) ?? null,
    [events, selectedEventId]
  );

  const filteredEvents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return events;
    return events.filter((e) =>
      [e.name, e.id, e.category, e.templateSubject, e.templateBody]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [events, searchQuery]);

  const updateEvent = (id: string, updater: (event: NotificationEvent) => NotificationEvent) => {
    setEvents((prev) => prev.map((e) => (e.id === id ? updater(e) : e)));
  };

  const handleToggle = (id: string, channel: Channel) => {
    updateEvent(id, (event) => ({ ...event, [channel]: !event[channel] }));
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => setIsSaving(false), 800);
  };

  const handleInsertToken = (token: string) => {
    if (!selectedEvent || !bodyRef.current) return;

    const textarea = bodyRef.current;
    const start = textarea.selectionStart ?? selectedEvent.templateBody.length;
    const end = textarea.selectionEnd ?? selectedEvent.templateBody.length;
    const insertion = `{{${token}}}`;
    const updated =
      selectedEvent.templateBody.slice(0, start) +
      insertion +
      selectedEvent.templateBody.slice(end);

    updateEvent(selectedEvent.id, (event) => ({
      ...event,
      templateBody: updated,
    }));

    requestAnimationFrame(() => {
      textarea.focus();
      const nextPos = start + insertion.length;
      textarea.setSelectionRange(nextPos, nextPos);
    });
  };

  const getCategoryIcon = (cat: EventCategory) => {
    switch (cat) {
      case "PAYROLL":
        return <Calculator className="h-4 w-4" />;
      case "EMPLOYEE":
        return <User className="h-4 w-4" />;
      case "ADMIN":
        return <ShieldAlert className="h-4 w-4" />;
    }
  };

  const renderPreview = (text: string) => {
    if (!selectedEvent) return text;

    const replacements: Record<string, string> = {
      emp_name: "Muqadas Mazhar",
      run_id: "RUN-2025-01-001",
      period: "Jan 2025",
      amount: "25,000",
      approver: "Ayesha Malik",
      lwd: "2025-01-31",
      user: "Bilal Ahmed",
      reason: "Correction required",
      fy: "2024-25",
      days: "5",
      statutory_type: "EOBI",
      month: "January",
      year: "2025",
      loan_id: "LN-1120",
    };

    return text.replace(/\{\{(.*?)\}\}/g, (_, raw) => {
      const key = String(raw).trim();
      return replacements[key] ?? `{{${key}}}`;
    });
  };

  return (
    <div className="min-h-screen bg-white p-3">
      <div className="space-y-4">
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-800">
                  <Bell className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-brand-900">
                    Communication Settings
                  </h2>
                  <p className="mt-0.5 text-sm text-brand-700">
                    Configure multi-channel alerts and automated payroll notifications
                  </p>
                </div>
              </div>

              <button
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-brand-800 px-4 text-sm font-semibold text-white transition hover:bg-brand-900 disabled:opacity-60"
              >
                {isSaving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Configuration
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-8">
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="flex flex-col gap-4 border-b border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-700" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search events..."
                      className="h-10 w-56 rounded-lg border border-gray-200 bg-white pl-10 pr-3 text-sm text-brand-900 outline-none transition focus:border-brand-800"
                    />
                  </div>
                  <button className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-brand-800 transition hover:bg-brand-100">
                    <Filter className="h-4 w-4" />
                  </button>
                </div>

                <span className="text-xs font-semibold uppercase tracking-wider text-brand-800">
                  Notification Matrix
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-gray-200">
                    <tr>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                        Event Detail
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-brand-800">
                        In-App
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-brand-800">
                        Email
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-brand-800">
                        Push
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-brand-800">
                        SMS
                      </th>
                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-brand-800">
                        Template
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-brand-300/50 bg-white">
                    {(["PAYROLL", "EMPLOYEE", "ADMIN"] as EventCategory[]).map((cat) => {
                      const categoryEvents = filteredEvents.filter((e) => e.category === cat);
                      if (categoryEvents.length === 0) return null;

                      return (
                        <React.Fragment key={cat}>
                          <tr className="bg-brand-100/40">
                            <td colSpan={6} className="px-5 py-2.5">
                              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand-800">
                                {getCategoryIcon(cat)}
                                {cat} Events
                              </div>
                            </td>
                          </tr>

                          {categoryEvents.map((event) => (
                            <tr
                              key={event.id}
                              className={
                                selectedEventId === event.id
                                  ? "bg-brand-100 transition-colors"
                                  : "transition-colors hover:bg-brand-100"
                              }
                            >
                              <td className="px-5 py-3.5 text-sm">
                                <div>
                                  <div className="font-semibold text-brand-900">{event.name}</div>
                                  <div className="text-[11px] text-brand-700">{event.id}</div>
                                </div>
                              </td>

                              <td className="px-4 py-3.5 text-center">
                                <ChannelToggle active={event.inApp} icon={Globe} onClick={() => handleToggle(event.id, "inApp")} />
                              </td>
                              <td className="px-4 py-3.5 text-center">
                                <ChannelToggle active={event.email} icon={Mail} onClick={() => handleToggle(event.id, "email")} />
                              </td>
                              <td className="px-4 py-3.5 text-center">
                                <ChannelToggle active={event.push} icon={Smartphone} onClick={() => handleToggle(event.id, "push")} />
                              </td>
                              <td className="px-4 py-3.5 text-center">
                                <ChannelToggle active={event.sms} icon={MessageSquare} onClick={() => handleToggle(event.id, "sms")} />
                              </td>

                              <td className="px-5 py-3.5 text-right">
                                <button
                                  onClick={() => setSelectedEventId(event.id)}
                                  className={
                                    selectedEventId === event.id
                                      ? "inline-flex h-9 w-9 items-center justify-center rounded-lg bg-brand-800 text-white"
                                      : "inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-brand-800 transition hover:bg-brand-100"
                                  }
                                >
                                  <ChevronRight className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="space-y-4 lg:col-span-4">
            {selectedEvent ? (
              <div className="flex min-h-[620px] flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-200 bg-brand-900 px-5 py-4 text-white">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
                        <Layout className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold">Template Editor</h4>
                        <p className="text-[11px] text-white/70">{selectedEvent.name}</p>
                      </div>
                    </div>
                    <button className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 transition hover:bg-white/20">
                      <Settings className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 space-y-5 p-5">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-brand-800">
                      Notification Subject
                    </label>
                    <input
                      type="text"
                      value={selectedEvent.templateSubject}
                      onChange={(e) =>
                        updateEvent(selectedEvent.id, (event) => ({
                          ...event,
                          templateSubject: e.target.value,
                        }))
                      }
                      className="h-11 w-full rounded-lg border border-gray-200 bg-white px-4 text-sm text-brand-900 outline-none transition focus:border-brand-800"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-brand-800">
                      Template Body
                    </label>
                    <textarea
                      ref={bodyRef}
                      rows={10}
                      value={selectedEvent.templateBody}
                      onChange={(e) =>
                        updateEvent(selectedEvent.id, (event) => ({
                          ...event,
                          templateBody: e.target.value,
                        }))
                      }
                      className="min-h-[220px] w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm leading-6 text-brand-900 outline-none transition focus:border-brand-800"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand-800">
                      <Terminal className="h-4 w-4" />
                      Available Data Tokens
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {TOKENS.map((token) => (
                        <button
                          key={token}
                          onClick={() => handleInsertToken(token)}
                          className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-brand-800 transition hover:bg-brand-100"
                        >
                          {token}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100">
                        <Info className="h-4 w-4 text-brand-800" />
                      </div>
                      <div>
                        <h5 className="text-sm font-semibold text-brand-900">
                          Channel Routing Rule
                        </h5>
                        <p className="mt-1 text-sm leading-6 text-brand-700">
                          SMS alerts should only be routed for critical events or explicitly enabled wallet disbursement notifications.
                        </p>
                      </div>
                    </div>
                  </div>

                  {testSent && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-700" />
                        <div>
                          <div className="text-sm font-semibold text-emerald-900">
                            Test notification sent
                          </div>
                          <div className="mt-1 text-sm text-emerald-700">
                            A sample notification was generated using the current template.
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-200 bg-white px-5 py-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsPreviewOpen(true)}
                      className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-sm font-semibold text-brand-800 transition hover:bg-brand-100"
                    >
                      <Eye className="h-4 w-4" />
                      Preview
                    </button>
                    <button
                      onClick={() => {
                        setTestSent(true);
                        setTimeout(() => setTestSent(false), 1800);
                      }}
                      className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-brand-800 px-4 text-sm font-semibold text-white transition hover:bg-brand-900"
                    >
                      <Send className="h-4 w-4" />
                      Test Send
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex min-h-[500px] flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white p-10 text-center">
                <Bell className="mb-3 h-10 w-10 text-brand-300" />
                <p className="text-sm font-semibold text-brand-900">
                  Select an event to edit its template
                </p>
                <p className="mt-1 text-sm text-brand-700">
                  Choose any notification event from the matrix.
                </p>
              </div>
            )}
          </div>
        </div>

        {isPreviewOpen && selectedEvent && (
          <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/50" onClick={() => setIsPreviewOpen(false)} />
            <div className="relative w-full max-w-xl rounded-xl border border-gray-200 bg-white shadow-2xl">
              <div className="border-b border-gray-200 px-6 py-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-brand-900">Template Preview</h3>
                    <p className="mt-1 text-sm text-brand-700">{selectedEvent.name}</p>
                  </div>
                  <button
                    onClick={() => setIsPreviewOpen(false)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-brand-800 transition hover:bg-brand-100"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-4 p-6">
                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Subject
                  </p>
                  <p className="mt-2 text-sm font-semibold text-brand-900">
                    {renderPreview(selectedEvent.templateSubject)}
                  </p>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Body
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-brand-900">
                    {renderPreview(selectedEvent.templateBody)}
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-200 px-6 py-4">
                <button
                  onClick={() => setIsPreviewOpen(false)}
                  className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-brand-800 px-4 text-sm font-semibold text-white transition hover:bg-brand-900"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ChannelToggle({
  active,
  icon: Icon,
  onClick,
}: {
  active: boolean;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={
        active
          ? "relative mx-auto inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-brand-100 text-brand-800 transition hover:bg-brand-200"
          : "relative mx-auto inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-400 transition hover:bg-brand-100 hover:text-brand-800"
      }
    >
      <Icon className="h-4 w-4" />
      {active && (
        <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
      )}
    </button>
  );
}