"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { CalendarRange, FolderKanban, Settings2 } from "lucide-react";
import { ProjectEdgePageHeader } from "@/components/projectedge/PageHeader";
import { ProjectEdgeStatePanel } from "@/components/projectedge/StatePanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { departmentService } from "@/services/department.service";
import { employeeService } from "@/services/employee.service";
import { projectEdgeService } from "@/services/projectedge";
import { useAppSelector } from "@/store/hooks";
import type { CreateProjectEdgeProject } from "@/types/projectedge";

const schema = z.object({
  title: z.string().trim().min(2, "Enter a project title").max(255),
  description: z.string().trim().max(5000).optional(),
  department_id: z.coerce.number().int().positive("Choose a department"),
  project_type: z.enum(["internal", "hr_initiative", "audit", "compliance", "it", "other"]),
  manager_id: z.coerce.number().int().positive("Choose a project manager"),
  start_date: z.string().min(1, "Choose a start date"),
  end_date: z.string().optional(),
  status: z.enum(["draft", "active"]),
  priority: z.enum(["low", "medium", "high", "critical"]),
  client_ref: z.string().trim().max(100).optional(),
  tags: z.string().optional(),
  auto_close: z.boolean(),
  is_billable: z.boolean(),
}).refine((values) => !values.end_date || values.end_date >= values.start_date, {
  message: "End date must be on or after the start date",
  path: ["end_date"],
});

type FormInput = z.input<typeof schema>;
type FormValues = z.output<typeof schema>;

const fieldClass = "min-h-11 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export default function CreateProjectPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const canCreate = useAppSelector((state) => state.auth.permissions.includes("projectedge.project.create"));
  const departmentsQuery = useQuery({ queryKey: ["projectedge", "lookups", "departments"], queryFn: () => departmentService.getAll({ per_page: 100 }), enabled: canCreate });
  const employeesQuery = useQuery({ queryKey: ["projectedge", "lookups", "employees"], queryFn: () => employeeService.getAll({ per_page: 100, detailed: 0 }), enabled: canCreate });
  const { register, handleSubmit, formState: { errors } } = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", description: "", project_type: "internal", start_date: new Date().toISOString().slice(0, 10), end_date: "", status: "draft", priority: "medium", client_ref: "", tags: "", auto_close: false, is_billable: false },
  });
  const createMutation = useMutation({
    mutationFn: (payload: CreateProjectEdgeProject) => projectEdgeService.createProject(payload),
    onSuccess: async (project) => {
      await queryClient.invalidateQueries({ queryKey: ["projectedge", "projects"] });
      toast.success("Project created");
      router.push(`/projectedge/projects/${project.id}`);
    },
    onError: (error) => {
      const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
      toast.error(message ?? "The project could not be created.");
    },
  });

  const onSubmit = (values: FormValues) => {
    createMutation.mutate({
      ...values,
      description: values.description || undefined,
      end_date: values.end_date || undefined,
      client_ref: values.client_ref || undefined,
      tags: values.tags?.split(",").map((tag) => tag.trim()).filter(Boolean),
    });
  };

  if (!canCreate) {
    return <ProjectEdgeStatePanel action={{ label: "Back to projects", href: "/projectedge/projects" }} description="Your current role can view projects but cannot create them." kind="access" title="Project creation access required" />;
  }

  if (departmentsQuery.isError || employeesQuery.isError) {
    return <ProjectEdgeStatePanel action={{ label: "Try again", onClick: () => { departmentsQuery.refetch(); employeesQuery.refetch(); } }} description="Department or employee options could not be loaded, so the project cannot be safely assigned yet." kind="error" title="Project setup is unavailable" />;
  }

  return (
    <div className="space-y-5">
      <ProjectEdgePageHeader breadcrumbs={[{ label: "Projects", href: "/projectedge/projects" }, { label: "Create" }]} description="Set the delivery boundaries first. Tasks, milestones, resources, and budget can be added from the project workspace." title="Create project" />
      <form className="space-y-5" noValidate onSubmit={handleSubmit(onSubmit)}>
        <FormSection icon={FolderKanban} title="Project identity" description="Name and classify the work so it is easy to find.">
          <Field error={errors.title?.message} label="Project title" required><Input aria-invalid={Boolean(errors.title)} className="min-h-11" {...register("title")} /></Field>
          <Field label="Project type" required><select className={fieldClass} {...register("project_type")}><option value="internal">Internal</option><option value="hr_initiative">HR initiative</option><option value="audit">Audit</option><option value="compliance">Compliance</option><option value="it">IT</option><option value="other">Other</option></select></Field>
          <Field className="md:col-span-2" label="Description"><textarea className={`${fieldClass} min-h-28 py-3`} {...register("description")} /></Field>
          <Field label="Client reference"><Input className="min-h-11" {...register("client_ref")} /></Field>
          <Field help="Separate tags with commas." label="Tags"><Input className="min-h-11" placeholder="transformation, payroll" {...register("tags")} /></Field>
        </FormSection>

        <FormSection icon={CalendarRange} title="Ownership and timeline" description="Choose the accountable team, manager, and planned dates.">
          <Field error={errors.department_id?.message} label="Department" required><select aria-invalid={Boolean(errors.department_id)} className={fieldClass} defaultValue="" disabled={departmentsQuery.isPending} {...register("department_id")}><option disabled value="">{departmentsQuery.isPending ? "Loading departments…" : "Choose department"}</option>{departmentsQuery.data?.data.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}</select></Field>
          <Field error={errors.manager_id?.message} label="Project manager" required><select aria-invalid={Boolean(errors.manager_id)} className={fieldClass} defaultValue="" disabled={employeesQuery.isPending} {...register("manager_id")}><option disabled value="">{employeesQuery.isPending ? "Loading employees…" : "Choose manager"}</option>{employeesQuery.data?.map((employee) => <option key={employee.id} value={employee.id}>{employee.name} · {employee.employee_code}</option>)}</select></Field>
          <Field error={errors.start_date?.message} label="Start date" required><Input aria-invalid={Boolean(errors.start_date)} className="min-h-11" type="date" {...register("start_date")} /></Field>
          <Field error={errors.end_date?.message} label="End date"><Input aria-invalid={Boolean(errors.end_date)} className="min-h-11" type="date" {...register("end_date")} /></Field>
        </FormSection>

        <FormSection icon={Settings2} title="Delivery settings" description="Select the launch state and operational defaults.">
          <Field label="Initial status" required><select className={fieldClass} {...register("status")}><option value="draft">Draft</option><option value="active">Active</option></select></Field>
          <Field label="Priority" required><select className={fieldClass} {...register("priority")}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option></select></Field>
          <label className="flex min-h-11 items-start gap-3 rounded-xl border border-slate-200 p-4"><input className="mt-1 size-4" type="checkbox" {...register("auto_close")} /><span><span className="block text-sm font-semibold text-slate-900">Auto-close project</span><span className="mt-1 block text-xs leading-5 text-slate-500">Complete the project when all required work reaches its terminal state.</span></span></label>
          <label className="flex min-h-11 items-start gap-3 rounded-xl border border-slate-200 p-4"><input className="mt-1 size-4" type="checkbox" {...register("is_billable")} /><span><span className="block text-sm font-semibold text-slate-900">Billable work</span><span className="mt-1 block text-xs leading-5 text-slate-500">Mark time and delivery costs as client-billable context.</span></span></label>
        </FormSection>

        <div className="pe-card flex flex-col-reverse gap-3 border p-4 sm:flex-row sm:justify-end"><Button className="min-h-11" onClick={() => router.push("/projectedge/projects")} type="button" variant="outline">Cancel</Button><Button className="pe-button-primary min-h-11" disabled={createMutation.isPending || departmentsQuery.isPending || employeesQuery.isPending} type="submit">{createMutation.isPending ? "Creating…" : "Create project"}</Button></div>
      </form>
    </div>
  );
}

function FormSection({ icon: Icon, title, description, children }: { icon: typeof FolderKanban; title: string; description: string; children: React.ReactNode }) {
  return <section className="pe-card border p-5 sm:p-6"><div className="flex items-start gap-3"><span className="grid size-10 place-items-center rounded-xl bg-indigo-50 text-indigo-700"><Icon aria-hidden="true" className="size-5" /></span><div><h2 className="font-semibold text-slate-950">{title}</h2><p className="mt-1 text-sm text-slate-500">{description}</p></div></div><div className="mt-6 grid gap-5 md:grid-cols-2">{children}</div></section>;
}

function Field({ label, required, error, help, className = "", children }: { label: string; required?: boolean; error?: string; help?: string; className?: string; children: React.ReactNode }) {
  return <label className={`block ${className}`}><span className="mb-2 block text-sm font-medium text-slate-800">{label}{required ? <span className="text-rose-600"> *</span> : null}</span>{children}{error ? <span className="mt-1.5 block text-xs font-medium text-rose-700">{error}</span> : help ? <span className="mt-1.5 block text-xs text-slate-500">{help}</span> : null}</label>;
}
