"use client";
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, Zap } from "lucide-react";
import { toast } from "sonner";

interface IntegrationConfigDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  integration?: { name: string; type: string; status: string };
  integrationId?: string;
}

export function IntegrationConfigDrawer({ isOpen, onClose, integration, integrationId }: IntegrationConfigDrawerProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [form, setForm] = useState({ endpoint: "", authType: "Bearer Token", apiKey: "", syncFreq: "On Event", enabled: true });

  const handleTest = async () => {
    setIsTesting(true);
    await new Promise(r => setTimeout(r, 1200));
    setIsTesting(false);
    toast.success("Connection successful — API responded in 142ms");
  };

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 800));
    setIsSaving(false);
    toast.success(`${integration?.name || "Integration"} configuration saved`);
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[420px]">
        <SheetHeader>
          <SheetTitle>Configure Integration{integration ? ` — ${integration.name}` : ""}</SheetTitle>
        </SheetHeader>
        <div className="space-y-5 mt-6 px-6">
          <div><Label>API Endpoint</Label><Input value={form.endpoint} onChange={e => setForm(f => ({...f, endpoint: e.target.value}))} placeholder="https://api.example.com/leave" className="mt-1" /></div>
          <div><Label>Authentication</Label>
            <Select value={form.authType} onValueChange={v => setForm(f => ({...f, authType: v}))}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="Bearer Token">Bearer Token</SelectItem><SelectItem value="API Key">API Key</SelectItem><SelectItem value="OAuth2">OAuth 2.0</SelectItem><SelectItem value="Basic Auth">Basic Auth</SelectItem></SelectContent>
            </Select>
          </div>
          <div><Label>API Key / Token</Label><Input type="password" value={form.apiKey} onChange={e => setForm(f => ({...f, apiKey: e.target.value}))} placeholder="••••••••••••" className="mt-1" /></div>
          <div><Label>Sync Frequency</Label>
            <Select value={form.syncFreq} onValueChange={v => setForm(f => ({...f, syncFreq: v}))}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="Real-time">Real-time</SelectItem><SelectItem value="On Event">On Event</SelectItem><SelectItem value="Hourly">Hourly</SelectItem><SelectItem value="Daily">Daily</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-3 p-3 bg-brand-100/30 rounded-lg">
            <Switch checked={form.enabled} onCheckedChange={v => setForm(f => ({...f, enabled: v}))} />
            <Label>Integration Enabled</Label>
            {form.enabled && <Badge className="bg-green-100 text-green-800 ml-auto">Active</Badge>}
          </div>
          <Button variant="outline" className="w-full" onClick={handleTest} disabled={isTesting}>
            {isTesting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Testing...</> : <><Zap className="h-4 w-4 mr-2" />Test Connection</>}
          </Button>
        </div>
        <SheetFooter className="mt-6">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving} className="bg-brand-800 text-white hover:bg-brand-700">
            {isSaving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : "Save Configuration"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
