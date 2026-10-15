"use client";

import React, { useState } from "react";
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

type DocumentTypeRow = {
  id: number;
  code: string;
  name: string;
  category: string;
  required: string;
  is_active: boolean;
};

const NAME_OPTIONS = ["CNIC", "Passport", "Educational Certificate", "Experience Letter", "Bank Statement", "Medical Certificate", "Police Clearance", "Reference Letter", "Offer Letter", "Appointment Letter"];
const CATEGORY_OPTIONS = ["Identity", "Educational", "Employment", "Medical", "Legal"];
const REQUIRED_OPTIONS = ["Yes", "No", "Conditional"];

function makeDummyRows(count = 40): DocumentTypeRow[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    code: "CODE" + String(i + 1).padStart(3, "0"),
    name: NAME_OPTIONS[i % NAME_OPTIONS.length],
    category: CATEGORY_OPTIONS[i % CATEGORY_OPTIONS.length],
    required: REQUIRED_OPTIONS[i % REQUIRED_OPTIONS.length],
    is_active: i % 8 !== 0,
  }));
}

const DocumentTypeListingDummy: React.FC = () => {
  const [rows, setRows] = useState<DocumentTypeRow[]>(() => makeDummyRows());

  const columns: DataTableColumn<DocumentTypeRow>[] = [
    { key: "code", header: "Code", render: (v) => <span className="font-mono text-brand-900">{v as string}</span> },
    { key: "name", header: "Document" },
    { key: "category", header: "Category" },
    { key: "required", header: "Required" },
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
    <DataTable<DocumentTypeRow>
      title="Document Types"
      description="HR document categories and requirements"
      columns={columns}
      data={rows}
      searchKeys={["code", "name", "category", "required"]}
      searchPlaceholder="Search document type..."
      addLabel="Add Document Type"
      exportFilename="document-types"
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
  initial?: DocumentTypeRow;
  onClose?: () => void;
  onSave: (data: Omit<DocumentTypeRow, "id">) => void;
};

const RecordForm: React.FC<FormProps> = ({ mode, initial, onClose, onSave }) => {
  const [form, setForm] = useState<Omit<DocumentTypeRow, "id">>({
    code: initial?.code ?? "",
    name: initial?.name ?? "",
    category: initial?.category ?? "Identity",
    required: initial?.required ?? "Yes",
    is_active: initial?.is_active ?? true,
  });

  const submit = () => {
    // Basic validation
    onSave(form);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Code</Label>
          <Input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} />
        </div>
        <div className="space-y-1.5">
          <Label>Document</Label>
          <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        </div>
        <div className="space-y-1.5">
          <Label>Category</Label>
          <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent className="bg-white">
              {CATEGORY_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Required</Label>
          <Select value={form.required} onValueChange={(v) => setForm((f) => ({ ...f, required: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent className="bg-white">
              {REQUIRED_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Status</Label>
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

export default DocumentTypeListingDummy;
