"use client";

import React, { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { MetaActions, MetaAction } from "@/components/flexi-meta/meta-actions";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";

type GradeTemplateRow = {
  id: number;
  code: string;
  name: string;
  components: number;
  applicable_to: string;
  is_active: boolean;
};

const NAME_OPTIONS = ["Executive Band A", "Executive Band B", "Manager I", "Manager II", "Senior Staff", "Staff", "Operations"];
const APPLICABLE_TO_OPTIONS = ["All", "Permanent Only", "Contract Only", "Management"];

function makeDummyRows(count = 40): GradeTemplateRow[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    code: "CODE" + String(i + 1).padStart(3, "0"),
    name: NAME_OPTIONS[i % NAME_OPTIONS.length],
    components: 110 + (i % 20) * 500,
    applicable_to: APPLICABLE_TO_OPTIONS[i % APPLICABLE_TO_OPTIONS.length],
    is_active: i % 8 !== 0,
  }));
}

const GradeTemplateListingDummy: React.FC = () => {
  const [rows, setRows] = useState<GradeTemplateRow[]>(() => makeDummyRows());

  const columns: DataTableColumn<GradeTemplateRow>[] = [
    { key: "code", header: "Code", render: (v) => <span className="font-mono text-brand-900">{v as string}</span> },
    { key: "name", header: "Grade Template" },
    { key: "components", header: "Components", render: (v) => (v as number).toLocaleString() },
    { key: "applicable_to", header: "Applicable To" },
    {
      key: "is_active",
      header: "Status",
      render: (v) =>
        v ? (
          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100">
            Active
          </Badge>
        ) : (
          <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100">
            Inactive
          </Badge>
        ),
    },
  ];

  return (
    <DataTable<GradeTemplateRow>
      dialogClassName="sm:max-w-[640px] max-h-[90vh] overflow-y-auto rounded-xl bg-white text-sm text-slate-700 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-slate-900"
      renderRowActions={(_, actions) => <MetaActions><MetaAction label="Edit" onSelect={actions.edit}><Pencil className="h-4 w-4" /></MetaAction><MetaAction label="Delete" onSelect={actions.delete}><Trash2 className="h-4 w-4" /></MetaAction></MetaActions>}
      title="Grade Templates"
      description="Grade structures and component templates"
      columns={columns}
      data={rows}
      searchKeys={["code", "name", "components", "applicable_to"]}
      searchPlaceholder="Search grade template..."
      addLabel="Add Template"
      exportFilename="grade-templates"
      onAdd={() => {}}
      onEdit={() => {}}
      onDelete={(item) => {
        setRows((prev) => prev.filter((r) => r.id !== item.id));
        toast.success("Record deleted");
      }}
      renderForm={(mode, item, onClose) => (
        <RecordForm
          mode={mode}
          initial={item}
          onClose={onClose}
          onSave={(data) => {
            if (item) {
              setRows((prev) =>
                prev.map((r) => (r.id === item.id ? { ...r, ...data } : r))
              );
              toast.success("Record updated");
            } else {
              const newId = Math.max(0, ...rows.map((r) => r.id)) + 1;
              setRows((prev) => [...prev, { id: newId, ...data }]);
              toast.success("Record created");
            }
            onClose?.();
          }}
        />
      )}
    />
  );
};

type FormProps = {
  mode: "create" | "edit";
  initial?: GradeTemplateRow;
  onClose?: () => void;
  onSave: (data: Omit<GradeTemplateRow, "id">) => void;
};

const RecordForm: React.FC<FormProps> = ({ mode, initial, onClose, onSave }) => {
  const [form, setForm] = useState<Omit<GradeTemplateRow, "id">>({
    code: initial?.code ?? "",
    name: initial?.name ?? "",
    components: initial?.components ?? 0,
    applicable_to: initial?.applicable_to ?? "All",
    is_active: initial?.is_active ?? true,
  });

  const submit = () => {
    // Basic validation
    onSave(form);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="block text-sm font-medium text-slate-700">Code</Label>
          <Input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} />
        </div>
        <div className="space-y-1.5">
          <Label className="block text-sm font-medium text-slate-700">Grade Template</Label>
          <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        </div>
        <div className="space-y-1.5">
          <Label className="block text-sm font-medium text-slate-700">Components</Label>
          <Input type="number" value={form.components} onChange={(e) => setForm((f) => ({ ...f, components: Number(e.target.value || 0) }))} />
        </div>
        <div className="space-y-1.5">
          <Label className="block text-sm font-medium text-slate-700">Applicable To</Label>
          <Select value={form.applicable_to} onValueChange={(v) => setForm((f) => ({ ...f, applicable_to: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent className="bg-white">
              {APPLICABLE_TO_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="block text-sm font-medium text-slate-700">Status</Label>
          <Select
            value={form.is_active ? "active" : "inactive"}
            onValueChange={(v) =>
              setForm((f) => ({ ...f, is_active: v === "active" }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
        <Button
          variant="outline"
          onClick={onClose}
          className="border-gray-200 text-brand-800 hover:bg-brand-100"
        >
          Cancel
        </Button>
        <Button
          onClick={submit}
          className="bg-brand-800 hover:bg-brand-900 text-white"
        >
          {mode === "create" ? "Create" : "Save Changes"}
        </Button>
      </div>
    </div>
  );
};

export default GradeTemplateListingDummy;
