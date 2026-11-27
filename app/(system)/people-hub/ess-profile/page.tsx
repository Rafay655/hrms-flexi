"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import toast from "react-hot-toast";
import { Pencil, LockKeyhole, Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AppLoader } from "@/components/ui/app-loader";
import { ApiErrorState } from "@/components/ui/api-error-state";
import {
  Modal,
  Pager,
  Table,
  cell,
  Status,
} from "@/components/shared/directory-ui";
import { useAppSelector } from "@/store/hooks";
import { usePermissions } from "@/hooks/use-permissions";
import {createDemoProfileService, type DemoProfileService} from "./demo-profile";
import { parseApiError } from "@/lib/api-error";
import type { EssField, EssMeta, EssRequest } from "@/types/ess-profile";
import { ProfileSummaries } from "./profile-summaries";

export default function ESSProfilePage() {
  const company = useAppSelector((state) => state.auth.company?.id);
  const user = useAppSelector((state) => state.auth.user?.id);
  return <Profile key={`${company}-${user}`} company={company} user={user} />;
}
function Profile({ company, user }: { company?: string; user?: string }) {
  const client = useQueryClient();
  const { canVisit } = usePermissions();
  const [service] = useState(createDemoProfileService);
  const prefix = ["ess-profile-demo", company, user];
  const [tab, setTab] = useState("overview");
  const [editing, setEditing] = useState<EssField | null>(null);
  const [cancelling, setCancelling] = useState<EssRequest | null>(null);
  const [requestPage, setRequestPage] = useState(1);
  const [documentPage, setDocumentPage] = useState(1);
  const [status, setStatus] = useState("");
  const profile = useQuery({
    queryKey: [...prefix, "profile"],
    queryFn: ({ signal }) => service.profile(signal),
    retry: false,
    staleTime: 0,
    gcTime: 0,
  });
  const history = useQuery({
    queryKey: [...prefix, "requests", requestPage, status],
    queryFn: ({ signal }) =>
      service.requests(
        { page: requestPage, per_page: 15, status: status || undefined },
        signal,
      ),
    enabled: tab === "requests",
    retry: false,
    gcTime: 0,
  });
  const documents = useQuery({
    queryKey: [...prefix, "documents", documentPage],
    queryFn: ({ signal }) =>
      service.documents({ page: documentPage, per_page: 15 }, signal),
    enabled:
      tab === "documents" &&
      profile.data?.capabilities.can_view_documents === true,
    retry: false,
    gcTime: 0,
  });
  async function refresh() {
    await client.invalidateQueries({ queryKey: prefix });
  }
  const download = useMutation({
    mutationFn: service.download,
    onSuccess: ({ blob, filename }) => {
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    },
    onError: async (error) => {
      let issue: unknown = error;
      const response = (
        error as { response?: { data?: unknown; status?: number } }
      )?.response;
      if (response?.data instanceof Blob) {
        try {
          issue = {
            response: {
              ...response,
              data: JSON.parse(await response.data.text()),
            },
          };
        } catch {}
      }
      toast.error(parseApiError(issue).message);
    },
  });
  if (profile.isPending) return <AppLoader label="Loading your profile…" />;
  if (profile.error)
    return (
      <ApiErrorState
        error={profile.error}
        onRetry={() => void profile.refetch()}
      />
    );
  const data = profile.data;
  if (!data)
    return (
      <p className="border bg-white p-8">
        No linked employee profile is available.
      </p>
    );
  const employee = data.employee;
  const name = employee.name;
  const sections =
    tab === "overview"
      ? data.sections.filter((section) =>
          ["employment", "contact"].includes(section.id),
        )
      : data.sections.filter((section) => section.id === tab);
  const tabs = [
    { id: "overview", label: "Overview" },
    ...data.sections.map((section) => ({
      id: section.id,
      label: section.title,
    })),
    ...(data.capabilities.can_view_documents
      ? [{ id: "documents", label: "Documents" }]
      : []),
    { id: "requests", label: "Change requests" },
  ];
  const editable = (field: EssField) =>
    data.capabilities.can_request_change &&
    field.can_request_change &&
    !field.pending_request_uuid &&
    !field.sensitive;
  return (
    <div className="space-y-5 font-sans">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-brand-900">My profile</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Sample profile · Changes are for preview only and reset on reload.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => void refresh()}
          disabled={profile.isFetching}
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </Button>
      </header>
      <section className="rounded-sm border-t-4 border border-t-brand-800 bg-gradient-to-r from-[#322E53]/[0.05] via-white to-[#EEC293]/15 p-5">
        <div className="flex flex-wrap items-center gap-4">
          <Avatar className="h-14 w-14 rounded-sm">
            {employee.avatar_url && (
              <AvatarImage src={employee.avatar_url} alt={name} />
            )}
            <AvatarFallback className="rounded-sm bg-brand-100 text-brand-800">
              {name
                .split(/\s+/)
                .slice(0, 2)
                .map((part) => part[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-semibold text-brand-900">{name}</h2>
            <p className="mt-1 text-sm text-gray-600">
              {employee.designation?.name || "Not provided"} ·{" "}
              {employee.department?.name || "Not provided"}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              {employee.employee_code} ·{" "}
              {employee.branch?.name || "Branch not provided"}
            </p>
          </div>
          <div className="space-y-2 text-xs text-gray-500">
            <Status value={employee.employment_status} />
            <p>{employee.official_email || "Email not provided"}</p>
            <p>Joined {employee.joining_date || "—"}</p>
          </div>
        </div>
      </section>
      <div className="grid items-start gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <section className="rounded-sm border border-[#322E53]/10 bg-[#322E53]/[0.025] p-4">
            <h3 className="text-xs font-semibold">
              Profile completeness{" "}
              <span className="float-right text-brand-800">
                {data.completion.percentage}%
              </span>
            </h3>
            <div
              role="progressbar"
              aria-label="Profile completeness"
              aria-valuenow={data.completion.percentage}
              aria-valuemin={0}
              aria-valuemax={100}
              className="mt-3 h-1.5 bg-brand-100"
            >
              <div
                className="h-full bg-brand-800"
                style={{
                  width: `${Math.max(0, Math.min(100, data.completion.percentage))}%`,
                }}
              />
            </div>
            <p className="mt-2 text-[11px] text-gray-500">
              {data.completion.completed} of {data.completion.total} fields
              completed
            </p>
            {data.completion.missing_fields.map((field) => (
              <button
                key={field.field_key}
                onClick={() => setTab(field.section_id)}
                className="mt-3 block text-left text-xs text-brand-800"
              >
                Complete {field.label}
              </button>
            ))}
          </section>
          <section className="space-y-3 rounded-sm border border-[#EEC293]/40 bg-[#EEC293]/[0.08] p-4">
            <h3 className="text-xs font-semibold">Your workspace</h3>
            {[
              { label: "My attendance", href: "/time-sync/my-timelines" },
              { label: "My schedule", href: "/time-sync/my-schedule" },
              { label: "Leave balances", href: "/leave-ease/my-balance" },
              { label: "Leave requests", href: "/leave-ease/my-requests" },
            ]
              .filter((link) => canVisit(link.href))
              .map((link) => (
                <Link
                  key={link.href}
                  className="block text-xs text-gray-600 hover:text-brand-800"
                  href={link.href}
                >
                  {link.label}
                </Link>
              ))}
          </section>
          <p className="px-1 text-[11px] leading-5 text-gray-500">
            HR reviews corrections before your official record changes.
          </p>
        </aside>
        <div className="min-w-0 space-y-4">
          <nav
            aria-label="Profile sections"
            className="flex overflow-x-auto border-b bg-white"
          >
            {tabs.map((item) => (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                aria-current={tab === item.id ? "page" : undefined}
                className={`shrink-0 border-b-2 px-3 py-3 text-xs ${tab === item.id ? "border-brand-800 font-semibold text-brand-800" : "border-transparent text-gray-500"}`}
              >
                {item.label}
              </button>
            ))}
          </nav>
          {tab === "overview" && (
            <>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  [
                    "Reporting manager",
                    employee.reporting_manager?.name || "Not provided",
                  ],
                  [
                    "Employment",
                    employee.employment_type?.name || "Not provided",
                  ],
                  [
                    "Documents",
                    `${data.documents_summary.verified} verified · ${data.documents_summary.missing} missing`,
                  ],
                ].map(([label, value]) => (
                  <div key={label} className="border border-[#322E53]/10 border-l-2 border-l-[#EEC293] bg-white p-4">
                    <p className="text-[11px] text-gray-500">{label}</p>
                    <p className="mt-2 text-sm font-medium">{value}</p>
                  </div>
                ))}
              </div>
              <ProfileSummaries />
            </>
          )}
          {sections.map((section) => (
            <section key={section.id} className="rounded-sm border bg-white">
              <div className="border-b border-[#322E53]/10 bg-[#322E53]/[0.025] px-4 py-3">
                <h3 className="text-sm font-semibold text-brand-900">
                  {section.title}
                </h3>
                <p className="mt-1 text-[11px] text-gray-500">
                  {section.description}
                </p>
              </div>
              <dl className="grid sm:grid-cols-2">
                {section.fields.map((field) => (
                  <div
                    key={field.field_key}
                    className="flex justify-between gap-3 border-b border-gray-100 px-4 py-3.5"
                  >
                    <div className="min-w-0">
                      <dt className="flex items-center gap-1.5 text-[11px] text-gray-500">
                        {field.label}
                        {field.sensitive && (
                          <LockKeyhole
                            className="h-3 w-3"
                            aria-label="Protected value"
                          />
                        )}
                      </dt>
                      <dd className="mt-1 break-words text-[13px]">
                        {field.display_value ??
                          (field.sensitive
                            ? "Protected"
                            : field.value === null
                              ? "Not provided"
                              : String(field.value))}
                      </dd>
                      {field.pending_request_uuid && (
                        <p className="mt-1 text-[10px] text-amber-700">
                          Change pending review
                        </p>
                      )}
                    </div>
                    {editable(field) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0"
                        aria-label={`Request change to ${field.label}`}
                        onClick={() => setEditing(field)}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
              </dl>
            </section>
          ))}
          {tab === "requests" && (
            <section className="border bg-white">
              <div className="flex items-center justify-between border-b p-4">
                <h3 className="text-sm font-semibold">
                  Profile change requests
                </h3>
                <select
                  aria-label="Request status"
                  value={status}
                  onChange={(event) => {
                    setStatus(event.target.value);
                    setRequestPage(1);
                  }}
                  className="border px-2 py-1 text-xs"
                >
                  {["", "pending", "approved", "rejected", "cancelled"].map(
                    (value) => (
                      <option key={value} value={value}>
                        {value || "All statuses"}
                      </option>
                    ),
                  )}
                </select>
              </div>
              {history.isPending ? (
                <AppLoader label="Loading change requests…" />
              ) : history.error ? (
                <ApiErrorState
                  error={history.error}
                  onRetry={() => void history.refetch()}
                />
              ) : (
                <>
                  <ul className="divide-y">
                    {history.data?.rows.map((row) => (
                      <li key={row.uuid} className="space-y-2 p-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium">
                            {row.field_label}
                          </h4>
                          <Status value={row.status} />
                        </div>
                        <p className="break-words text-xs text-gray-600">
                          {row.previous_display_value ?? "Not provided"} →{" "}
                          {row.requested_display_value ?? "Not provided"}
                        </p>
                        <p className="text-xs text-gray-500">{row.reason}</p>
                        <p className="text-[11px] text-gray-400">
                          Submitted {row.submitted_at}
                        </p>
                        {row.decision_note && (
                          <p className="text-xs text-gray-600">
                            Decision: {row.decision_note}
                          </p>
                        )}
                        {row.can_cancel &&
                                                row.status === "pending" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setCancelling(row)}
                            >
                              Cancel request
                            </Button>
                          )}
                      </li>
                    ))}
                  </ul>
                  {!history.data?.rows.length && (
                    <p className="p-10 text-center text-sm text-gray-500">
                      No change requests found.
                    </p>
                  )}
                  {history.data && (
                    <ListPager
                      meta={history.data.meta}
                      onPage={setRequestPage}
                    />
                  )}
                </>
              )}
            </section>
          )}
          {tab === "documents" && data.capabilities.can_view_documents && (
            <section className="border bg-white">
              {documents.isPending ? (
                <AppLoader label="Loading documents…" />
              ) : documents.error ? (
                <ApiErrorState
                  error={documents.error}
                  onRetry={() => void documents.refetch()}
                />
              ) : (
                <>
                  <Table
                    headers={[
                      "Document",
                      "Category",
                      "Uploaded",
                      "Status",
                      "Actions",
                    ]}
                    empty={!documents.data?.rows.length}
                  >
                    {documents.data?.rows.map((item, index) => (
                      <tr key={item.uuid ?? item.requirement_key ?? index}>
                        <td className={cell}>{item.name}</td>
                        <td className={cell}>{item.category}</td>
                        <td className={cell}>{item.uploaded_at ?? "—"}</td>
                        <td className={cell}>
                          <Status value={item.status} />
                        </td>
                        <td className={cell}>
                          {item.can_view && item.uuid && (
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={download.isPending}
                              onClick={() => download.mutate(item.uuid!)}
                            >
                              <Download className="h-3.5 w-3.5" />
                              Download
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </Table>
                  {documents.data && (
                    <ListPager
                      meta={documents.data.meta}
                      onPage={setDocumentPage}
                    />
                  )}
                </>
              )}
            </section>
          )}
        </div>
      </div>
      {editing && (
        <Correction
          service={service}
          key={editing.field_key}
          field={editing}
          onClose={() => setEditing(null)}
          onRefresh={refresh}
          onSaved={() => {
            setEditing(null);
            setTab("requests");
            setRequestPage(1);
          }}
        />
      )}
      {cancelling && (
        <Cancellation
          service={service}
          request={cancelling}
          onClose={() => setCancelling(null)}
          onRefresh={refresh}
        />
      )}
    </div>
  );
}
function ListPager({
  meta,
  onPage,
}: {
  meta: EssMeta;
  onPage: (page: number) => void;
}) {
  return (
    <Pager
      state={{
        page: meta.current_page,
        pages: Math.max(1, meta.last_page),
        size: meta.per_page,
        total: meta.total,
        first: meta.total ? (meta.current_page - 1) * meta.per_page + 1 : 0,
        last: Math.min(meta.total, meta.current_page * meta.per_page),
        setPage: onPage,
        setSize: () => {},
      }}
    />
  );
}
function Correction({
  service,
  field,
  onClose,
  onRefresh,
  onSaved,
}: {
  service: DemoProfileService;
  field: EssField;
  onClose: () => void;
  onRefresh: () => Promise<void>;
  onSaved: () => void;
}) {
  const [value, setValue] = useState(
    field.value === null ? "" : String(field.value),
  );
  const [reason, setReason] = useState("");
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [conflict, setConflict] = useState(false);
  const mutation = useMutation({
    mutationFn: () =>
      service.submit({
        field_key: field.field_key,
        requested_value: value.trim() || null,
        reason: reason.trim(),
      }),
    retry: false,
    onSuccess: async () => {
      await onRefresh();
      toast.success("Preview request saved");
      onSaved();
    },
    onError: async (error) => {
      const parsed = parseApiError(error);
      setErrors(parsed.fieldErrors);
      if (parsed.status === 409) {
        setConflict(true);
        await onRefresh();
      }
    },
  });
  function submit() {
    if (mutation.isPending || conflict) return;
    const next: Record<string, string[]> = {};
    if (field.required && !value.trim())
      next.requested_value = ["Enter a new value."];
    if (value.trim() === (field.value === null ? "" : String(field.value)))
      next.requested_value = ["Enter a different value."];
    if (value.length > (field.validation?.max_length ?? 5000))
      next.requested_value = ["The value is too long."];
    if (reason.trim().length < 3 || reason.trim().length > 1000)
      next.reason = ["Enter a reason between 3 and 1,000 characters."];
    setErrors(next);
    if (!Object.keys(next).length) mutation.mutate();
  }
  return (
    <Modal
      title="Request a profile change"
      description={field.label}
      onClose={onClose}
      busy={mutation.isPending}
      footer={
        <>
          <Button
            variant="outline"
            disabled={mutation.isPending}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="ess-correction"
            disabled={mutation.isPending || conflict}
          >
            {mutation.isPending ? "Submitting…" : "Submit request"}
          </Button>
        </>
      }
    >
      <form
        id="ess-correction"
        className="space-y-4"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <div>
          <Label htmlFor="ess-value">
            New {field.label} {field.required ? "*" : ""}
          </Label>
          {field.type === "textarea" ? (
            <Textarea
              id="ess-value"
              value={value}
              disabled={mutation.isPending}
              onChange={(event) => setValue(event.target.value)}
              aria-invalid={!!errors.requested_value}
            />
          ) : (
            <Input
              id="ess-value"
              value={value}
              disabled={mutation.isPending}
              onChange={(event) => setValue(event.target.value)}
              aria-invalid={!!errors.requested_value}
            />
          )}
          <FieldErrors rows={errors.requested_value} />
          <FieldErrors rows={errors.field_key} />
        </div>
        <div>
          <Label htmlFor="ess-reason">Reason *</Label>
          <Textarea
            id="ess-reason"
            value={reason}
            maxLength={1000}
            disabled={mutation.isPending}
            onChange={(event) => setReason(event.target.value)}
            aria-invalid={!!errors.reason}
          />
          <FieldErrors rows={errors.reason} />
        </div>
      </form>
      {mutation.error && (
        <p role="alert" className="text-xs text-rose-600">
          {parseApiError(mutation.error).message}
        </p>
      )}
      {conflict && (
        <p className="text-xs text-amber-700">
          The profile was refreshed. Close this dialog and review the latest
          field status before trying again.
        </p>
      )}
    </Modal>
  );
}
function FieldErrors({ rows }: { rows?: string[] }) {
  return rows?.length ? (
    <p role="alert" className="mt-1 text-xs text-rose-600">
      {rows.join(" ")}
    </p>
  ) : null;
}
function Cancellation({
  service,
  request,
  onClose,
  onRefresh,
}: {
  service: DemoProfileService;
  request: EssRequest;
  onClose: () => void;
  onRefresh: () => Promise<void>;
}) {
  const [reason, setReason] = useState("");
  const [conflict, setConflict] = useState(false);
  const mutation = useMutation({
    mutationFn: () => service.cancel(request.uuid, reason.trim() || undefined),
    retry: false,
    onSuccess: async () => {
      await onRefresh();
      toast.success("Request cancelled");
      onClose();
    },
    onError: async (error) => {
      if (parseApiError(error).status === 409) {
        setConflict(true);
        await onRefresh();
      }
    },
  });
  return (
    <Modal
      title="Cancel profile change?"
      description={request.field_label}
      onClose={onClose}
      busy={mutation.isPending}
      footer={
        <>
          <Button
            variant="outline"
            disabled={mutation.isPending}
            onClick={onClose}
          >
            Keep request
          </Button>
          <Button
            disabled={mutation.isPending || conflict}
            onClick={() => {
              if (!mutation.isPending) mutation.mutate();
            }}
          >
            Cancel request
          </Button>
        </>
      }
    >
      <Label htmlFor="ess-cancel-reason">Reason (optional)</Label>
      <Textarea
        id="ess-cancel-reason"
        maxLength={1000}
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        disabled={mutation.isPending}
      />
      {mutation.error && <ApiErrorState error={mutation.error} />}
    </Modal>
  );
}
