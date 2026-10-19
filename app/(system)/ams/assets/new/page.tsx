'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { amsService } from '@/services/ams.service';

export default function AddAssetPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: categoriesRes } = useQuery({
    queryKey: ['ams', 'categories', 'all'],
    queryFn: () => amsService.getCategories({ active_only: true, per_page: 100 }),
  });
  const categories = categoriesRes?.data ?? [];

  const [categoryUuid, setCategoryUuid] = useState('');
  const { data: assetTypes } = useQuery({
    queryKey: ['ams', 'asset-types', categoryUuid],
    queryFn: () => amsService.getAssetTypesForCategory(categoryUuid),
    enabled: !!categoryUuid,
  });

  const { data: vendorsRes } = useQuery({
    queryKey: ['ams', 'vendors', 'all'],
    queryFn: () => amsService.getVendors({ per_page: 100 }),
  });
  const vendors = vendorsRes?.data ?? [];

  const [form, setForm] = useState({
    category_uuid: '', asset_type_uuid: '', vendor_uuid: '', name: '', make: '', model: '',
    serial_number: '', purchase_date: '', purchase_price: '', invoice_number: '', warranty_expiry: '',
  });

  const mutation = useMutation({
    mutationFn: () => amsService.createAsset({
      ...form,
      purchase_price: form.purchase_price ? Number(form.purchase_price) : undefined,
    }),
    onSuccess: (asset) => {
      toast.success(`Asset ${asset.asset_tag} registered.`);
      queryClient.invalidateQueries({ queryKey: ['ams', 'assets'] });
      router.push(`/ams/assets/${asset.uuid}`);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Could not register asset.'),
  });

  return (
    <div className="p-3 max-w-3xl">
      <Card>
        <CardHeader><CardTitle>Register New Asset</CardTitle></CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="mb-2">Category</Label>
              <Select value={categoryUuid} onValueChange={(uuid) => {
                setCategoryUuid(uuid);
                setForm((f) => ({ ...f, category_uuid: uuid, asset_type_uuid: '' }));
              }}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => <SelectItem key={c.uuid} value={c.uuid}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-2">Asset Type</Label>
              <Select
                value={form.asset_type_uuid}
                onValueChange={(uuid) => setForm((f) => ({ ...f, asset_type_uuid: uuid }))}
                disabled={!categoryUuid}
              >
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {(assetTypes ?? []).map((t) => <SelectItem key={t.uuid} value={t.uuid}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="mb-2">Asset Name</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Dell Latitude 5440" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div><Label className="mb-2">Make</Label><Input value={form.make} onChange={(e) => setForm({ ...form, make: e.target.value })} /></div>
            <div><Label className="mb-2">Model</Label><Input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} /></div>
          </div>

          <div>
            <Label className="mb-2">Serial Number</Label>
            <Input value={form.serial_number} onChange={(e) => setForm({ ...form, serial_number: e.target.value })} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div><Label className="mb-2">Vendor</Label>
              <Select value={form.vendor_uuid} onValueChange={(uuid) => setForm({ ...form, vendor_uuid: uuid })}>
                <SelectTrigger><SelectValue placeholder="Select vendor" /></SelectTrigger>
                <SelectContent>
                  {vendors.map((v) => <SelectItem key={v.uuid} value={v.uuid}>{v.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label className="mb-2">Invoice #</Label><Input value={form.invoice_number} onChange={(e) => setForm({ ...form, invoice_number: e.target.value })} /></div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div><Label className="mb-2">Purchase Date</Label><Input type="date" value={form.purchase_date} onChange={(e) => setForm({ ...form, purchase_date: e.target.value })} /></div>
            <div><Label className="mb-2">Purchase Price (PKR)</Label><Input type="number" value={form.purchase_price} onChange={(e) => setForm({ ...form, purchase_price: e.target.value })} /></div>
          </div>

          <div>
            <Label className="mb-2">Warranty Expiry</Label>
            <Input type="date" value={form.warranty_expiry} onChange={(e) => setForm({ ...form, warranty_expiry: e.target.value })} />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => router.push('/ams/assets')}>Cancel</Button>
            <Button
              className="bg-[#1E1B4B] hover:bg-[#2A2675]"
              disabled={!form.category_uuid || !form.asset_type_uuid || !form.name || mutation.isPending}
              onClick={() => mutation.mutate()}
            >
              {mutation.isPending ? 'Registering...' : 'Register Asset'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
