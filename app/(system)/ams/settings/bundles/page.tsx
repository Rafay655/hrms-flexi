'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Trash2 } from 'lucide-react';
import { amsService } from '@/services/ams.service';
import { useAppSelector } from '@/store/hooks';
import type { AmsAssetBundle, AmsAssetType } from '@/types/ams.types';

// ── Item-row sub-form types ─────────────────────────────
// Each row tracks the asset type it resolves to plus quantity. The bundle
// item payload only carries { asset_type_uuid, quantity } — asset types are
// listed per-category (there's no flat "all asset types" endpoint, see
// amsService.getAssetTypesForCategory / AssetTypeController::indexForCategory),
// so we build one flat lookup list by fetching types for every active
// category up front, matching the cascade already used in
// app/(system)/ams/assets/new/page.tsx.
interface ItemRow {
  key: number;
  asset_type_uuid: string;
  quantity: string;
}

let rowKeySeq = 0;
const blankRow = (): ItemRow => ({ key: rowKeySeq++, asset_type_uuid: '', quantity: '1' });

interface BundleForm {
  name: string;
  description: string;
  active: boolean;
  items: ItemRow[];
}

const blankForm = (): BundleForm => ({ name: '', description: '', active: true, items: [blankRow()] });

const getStatusBadge = (active: boolean) =>
  active ? (
    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>
  ) : (
    <Badge variant="secondary">Inactive</Badge>
  );

export default function AmsBundlesPage() {
  const queryClient = useQueryClient();

  // Permission-driven UI — mirrors app/(system)/ams/licenses/page.tsx's
  // ams.license.manage gate. Soft client-side gate only; backend policy
  // (AmsAssetBundlePolicy) remains authoritative.
  const permissions = useAppSelector((s) => s.auth.permissions);
  const canManage = permissions.includes('ams.bundle.manage');

  const { data, isLoading } = useQuery({
    queryKey: ['ams', 'bundles'],
    queryFn: () => amsService.getBundles({ per_page: 100 }),
  });
  const bundles = data?.data ?? [];

  // Flat asset-type lookup, built from every active category's type list.
  const { data: categoriesRes } = useQuery({
    queryKey: ['ams', 'categories', 'all'],
    queryFn: () => amsService.getCategories({ active_only: true, per_page: 100 }),
  });
  const categories = categoriesRes?.data ?? [];

  const { data: assetTypesByCategory } = useQuery({
    queryKey: ['ams', 'asset-types', 'all', categories.map((c) => c.uuid)],
    queryFn: async () => {
      const lists = await Promise.all(
        categories.map((c) => amsService.getAssetTypesForCategory(c.uuid)),
      );
      return lists.flat();
    },
    enabled: categories.length > 0,
  });
  const assetTypes: AmsAssetType[] = assetTypesByCategory ?? [];

  // ── Modal state ─────────────────────────────────────
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deactivateItem, setDeactivateItem] = useState<AmsAssetBundle | null>(null);
  const [editUuid, setEditUuid] = useState<string | null>(null);
  const [form, setForm] = useState<BundleForm>(blankForm());

  const resetForm = () => {
    setForm(blankForm());
    setEditUuid(null);
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
  };

  const openCreate = () => {
    setForm(blankForm());
    setEditUuid(null);
    setIsCreateModalOpen(true);
  };

  const openEdit = (bundle: AmsAssetBundle) => {
    setForm({
      name: bundle.name,
      description: bundle.description ?? '',
      active: bundle.active,
      items: bundle.items.length
        ? bundle.items.map((i) => ({ key: rowKeySeq++, asset_type_uuid: i.asset_type_uuid, quantity: String(i.quantity) }))
        : [blankRow()],
    });
    setEditUuid(bundle.uuid);
    setIsEditModalOpen(true);
  };

  const addRow = () => setForm((f) => ({ ...f, items: [...f.items, blankRow()] }));
  const removeRow = (key: number) =>
    setForm((f) => ({ ...f, items: f.items.length > 1 ? f.items.filter((r) => r.key !== key) : f.items }));
  const updateRow = (key: number, patch: Partial<ItemRow>) =>
    setForm((f) => ({ ...f, items: f.items.map((r) => (r.key === key ? { ...r, ...patch } : r)) }));

  const buildPayload = () => ({
    name: form.name,
    description: form.description || undefined,
    active: form.active,
    items: form.items
      .filter((r) => r.asset_type_uuid)
      .map((r) => ({ asset_type_uuid: r.asset_type_uuid, quantity: Number(r.quantity) || 1 })),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['ams', 'bundles'] });

  const createMutation = useMutation({
    mutationFn: () => amsService.createBundle(buildPayload()),
    onSuccess: () => { toast.success('Bundle created.'); invalidate(); resetForm(); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Could not create bundle.'),
  });

  const updateMutation = useMutation({
    mutationFn: () => amsService.updateBundle(editUuid as string, buildPayload()),
    onSuccess: () => { toast.success('Bundle updated.'); invalidate(); resetForm(); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Could not update bundle.'),
  });

  const deactivateMutation = useMutation({
    mutationFn: (uuid: string) => amsService.deactivateBundle(uuid),
    onSuccess: () => { toast.success('Bundle deactivated.'); invalidate(); setDeactivateItem(null); },
    onError: () => toast.error('Could not deactivate bundle.'),
  });

  const handleSave = () => {
    if (!form.name) {
      toast.error('Name is required.');
      return;
    }
    if (!form.items.some((r) => r.asset_type_uuid)) {
      toast.error('Add at least one item.');
      return;
    }
    if (editUuid) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  };

  const renderItemRows = (idPrefix: string) => (
    <div className="grid gap-2">
      <Label className="mb-1">Items</Label>
      {form.items.map((row) => (
        <div key={row.key} className="flex items-center gap-2">
          <Select value={row.asset_type_uuid} onValueChange={(v) => updateRow(row.key, { asset_type_uuid: v })}>
            <SelectTrigger id={`${idPrefix}-item-type-${row.key}`} className="flex-1">
              <SelectValue placeholder="Select asset type" />
            </SelectTrigger>
            <SelectContent>
              {assetTypes.map((t) => (
                <SelectItem key={t.uuid} value={t.uuid}>
                  {t.category ? `${t.category.name} — ${t.name}` : t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="number"
            min={1}
            className="w-24"
            value={row.quantity}
            onChange={(e) => updateRow(row.key, { quantity: e.target.value })}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-red-600 shrink-0"
            disabled={form.items.length <= 1}
            onClick={() => removeRow(row.key)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" className="w-fit" onClick={addRow}>
        Add Item
      </Button>
    </div>
  );

  return (
    <div className="p-3">
      <Card className="border border-gray-100 shadow-sm">
        <CardHeader className="border-b">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900">Onboarding Bundles</CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                {bundles.length.toLocaleString()} bundles • Templates for provisioning new-hire equipment
              </p>
            </div>
            {canManage && (
              <Button className="bg-[#1E1B4B] hover:bg-[#2A2675] gap-2" onClick={openCreate}>
                Add Bundle
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <div className="border border-gray-200 rounded-lg overflow-hidden overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Name</th>
                  <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Description</th>
                  <th className="py-3 px-6 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Items</th>
                  <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                  {canManage && (
                    <th className="py-3 px-6 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {isLoading ? (
                  <tr><td colSpan={canManage ? 5 : 4} className="py-12 text-center text-gray-500">Loading bundles...</td></tr>
                ) : bundles.length === 0 ? (
                  <tr><td colSpan={canManage ? 5 : 4} className="py-12 text-center text-gray-500">No bundles found.</td></tr>
                ) : (
                  bundles.map((bundle) => (
                    <tr key={bundle.uuid} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6 text-sm font-medium text-gray-900">{bundle.name}</td>
                      <td className="py-4 px-6 text-sm text-gray-600">{bundle.description || '—'}</td>
                      <td className="py-4 px-6 text-sm text-right">{bundle.items.length}</td>
                      <td className="py-4 px-6 text-sm">{getStatusBadge(bundle.active)}</td>
                      {canManage && (
                        <td className="py-4 px-6 text-right space-x-2">
                          <Button variant="outline" size="sm" onClick={() => openEdit(bundle)}>Edit</Button>
                          {bundle.active && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => setDeactivateItem(bundle)}
                            >
                              Deactivate
                            </Button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ── Create Modal ──────────────────────────────────── */}
      <Dialog open={isCreateModalOpen} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Bundle</DialogTitle>
            <DialogDescription>Create a new onboarding asset bundle template.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="create-name" className="mb-2">Name</Label>
              <Input
                id="create-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Standard Developer Kit"
              />
            </div>
            <div>
              <Label htmlFor="create-description" className="mb-2">Description (optional)</Label>
              <Textarea
                id="create-description"
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2">
              <Label htmlFor="create-active">Active</Label>
              <Switch
                id="create-active"
                checked={form.active}
                onCheckedChange={(v) => setForm({ ...form, active: v })}
              />
            </div>
            {renderItemRows('create')}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={!form.name || createMutation.isPending}
              className="bg-[#1E1B4B] hover:bg-[#2A2675]"
            >
              {createMutation.isPending ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Modal ────────────────────────────────────── */}
      <Dialog open={isEditModalOpen} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Bundle</DialogTitle>
            <DialogDescription>Update the bundle details and its item list.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="edit-name" className="mb-2">Name</Label>
              <Input
                id="edit-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-description" className="mb-2">Description (optional)</Label>
              <Textarea
                id="edit-description"
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2">
              <Label htmlFor="edit-active">Active</Label>
              <Switch
                id="edit-active"
                checked={form.active}
                onCheckedChange={(v) => setForm({ ...form, active: v })}
              />
            </div>
            {renderItemRows('edit')}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={!form.name || updateMutation.isPending}
              className="bg-[#1E1B4B] hover:bg-[#2A2675]"
            >
              {updateMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Deactivate Confirmation ──────────────────────── */}
      <AlertDialog open={deactivateItem !== null} onOpenChange={(open) => !open && setDeactivateItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Bundle?</AlertDialogTitle>
            <AlertDialogDescription>
              {deactivateItem?.name} will no longer be available for new onboarding applications. Existing
              applications already using it are unaffected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deactivateItem && deactivateMutation.mutate(deactivateItem.uuid)}
              className="bg-red-600 hover:bg-red-700"
            >
              {deactivateMutation.isPending ? 'Deactivating...' : 'Deactivate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
