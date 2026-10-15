// components/IntegrationConfigDrawer.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
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
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Save, RotateCcw, Link2, Key, Globe, Clock, AlertCircle } from "lucide-react";

interface IntegrationConfigDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  integrationId: string | null;
}

// Mock configuration templates per integration
const getDefaultConfig = (integrationId: string | null) => {
  // Treat empty string as null
  const id = integrationId?.trim() || null;
  switch (id) {
    case "timesync":
      return {
        apiKey: "ts_live_••••••••••••••••",
        endpoint: "https://api.timesync.flexi.com/v2",
        syncFrequency: "realtime",
        webhookEnabled: true,
        webhookUrl: "https://leaveease.flexi.com/webhooks/timesync",
      };
    case "payedge":
      return {
        apiKey: "pe_sk_••••••••••••••••",
        endpoint: "https://api.payedge.flexi.com/v1",
        syncFrequency: "daily",
        webhookEnabled: false,
        webhookUrl: "",
      };
    case "peoplehub":
      return {
        apiKey: "ph_••••••••••••••••",
        endpoint: "https://api.peoplehub.flexi.com/v3",
        syncFrequency: "hourly",
        webhookEnabled: true,
        webhookUrl: "https://leaveease.flexi.com/webhooks/peoplehub",
      };
    case "performpro":
      return {
        apiKey: "pp_••••••••••••••••",
        endpoint: "https://api.performpro.flexi.com/v1",
        syncFrequency: "daily",
        webhookEnabled: false,
        webhookUrl: "",
      };
    default:
      return {
        apiKey: "",
        endpoint: "",
        syncFrequency: "daily",
        webhookEnabled: false,
        webhookUrl: "",
      };
  }
};

const getIntegrationName = (id: string | null) => {
  const map: Record<string, string> = {
    timesync: "TimeSync",
    payedge: "PayEdge",
    peoplehub: "PeopleHub",
    performpro: "PerformPro",
  };
  const validId = id?.trim() || "";
  return map[validId] || "Integration";
};

export const IntegrationConfigDrawer: React.FC<IntegrationConfigDrawerProps> = ({
  isOpen,
  onClose,
  integrationId,
}) => {
  const [config, setConfig] = useState(() => getDefaultConfig(integrationId));
  const [isSaving, setIsSaving] = useState(false);

  // Reset form when integration changes or drawer opens
  useEffect(() => {
    if (isOpen) {
      setConfig(getDefaultConfig(integrationId));
    }
  }, [isOpen, integrationId]);

  const handleSave = () => {
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      toast.success("Configuration saved", {
        description: `${getIntegrationName(integrationId)} settings have been updated.`,
      });
      setIsSaving(false);
      onClose();
    }, 800);
  };

  const handleReset = () => {
    setConfig(getDefaultConfig(integrationId));
    toast.info("Reset to defaults", {
      description: "Configuration values restored to recommended settings.",
    });
  };

  const integrationName = getIntegrationName(integrationId);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md border-gray-200 p-0 flex flex-col">
        {/* Header */}
        <div className="bg-brand-900 px-6 py-5 text-white">
          <SheetHeader>
            <SheetTitle className="text-white text-lg font-semibold flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              Configure {integrationName}
            </SheetTitle>
            <SheetDescription className="text-brand-200 text-sm">
              Manage API credentials, sync frequency, and webhook settings.
            </SheetDescription>
          </SheetHeader>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* API Credentials */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-brand-900 flex items-center gap-2">
              <Key className="h-4 w-4 text-brand-700" />
              API Credentials
            </h3>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="apiKey" className="text-brand-800">
                  API Key
                </Label>
                <Input
                  id="apiKey"
                  type="password"
                  value={config.apiKey}
                  onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                  placeholder="Enter API key"
                  className="border-gray-200 focus:border-brand-800 text-brand-900"
                />
                <p className="text-xs text-brand-700">
                  Your secret key for authenticating with {integrationName}.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="endpoint" className="text-brand-800">
                  API Endpoint
                </Label>
                <Input
                  id="endpoint"
                  value={config.endpoint}
                  onChange={(e) => setConfig({ ...config, endpoint: e.target.value })}
                  placeholder="https://api.example.com"
                  className="border-gray-200 focus:border-brand-800 text-brand-900"
                />
              </div>
            </div>
          </div>

          <Separator className="bg-gray-200" />

          {/* Sync Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-brand-900 flex items-center gap-2">
              <Clock className="h-4 w-4 text-brand-700" />
              Synchronization
            </h3>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="frequency" className="text-brand-800">
                  Sync Frequency
                </Label>
                <Select
                  value={config.syncFrequency}
                  onValueChange={(value) => setConfig({ ...config, syncFrequency: value })}
                >
                  <SelectTrigger className="border-gray-200 text-brand-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="realtime">Real‑time</SelectItem>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="manual">Manual only</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-brand-700">
                  How often data is synchronized between systems.
                </p>
              </div>
            </div>
          </div>

          <Separator className="bg-gray-200" />

          {/* Webhook Configuration */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-brand-900 flex items-center gap-2">
              <Globe className="h-4 w-4 text-brand-700" />
              Webhooks
            </h3>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="webhookEnabled" className="text-brand-800">
                  Enable Webhooks
                </Label>
                <p className="text-xs text-brand-700">
                  Receive real‑time event notifications.
                </p>
              </div>
              <Switch
                id="webhookEnabled"
                checked={config.webhookEnabled}
                onCheckedChange={(checked) =>
                  setConfig({ ...config, webhookEnabled: checked })
                }
                className="data-[state=checked]:bg-brand-800"
              />
            </div>
            {config.webhookEnabled && (
              <div className="space-y-1.5">
                <Label htmlFor="webhookUrl" className="text-brand-800">
                  Webhook URL
                </Label>
                <Input
                  id="webhookUrl"
                  value={config.webhookUrl}
                  onChange={(e) => setConfig({ ...config, webhookUrl: e.target.value })}
                  placeholder="https://your-app.com/webhook"
                  className="border-gray-200 focus:border-brand-800 text-brand-900"
                />
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="bg-brand-50 border border-brand-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="h-4 w-4 text-brand-800 shrink-0 mt-0.5" />
            <p className="text-xs text-brand-800 leading-relaxed">
              Changes to credentials may interrupt synchronization. Test the connection
              after saving to ensure proper configuration.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <SheetFooter className="border-t border-gray-200 px-6 py-4 bg-brand-50/30 flex-row justify-end gap-3">
          <Button
            variant="outline"
            onClick={handleReset}
            className="border-gray-200 text-brand-800 hover:bg-brand-100"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
            className="border-gray-200 text-brand-800 hover:bg-brand-100"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-brand-800 hover:bg-brand-900 text-white"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};