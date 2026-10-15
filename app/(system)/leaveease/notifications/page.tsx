// app/flexi-hq/notifications/settings/page.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Mail,
  Smartphone,
  Zap,
  MessageSquare,
  Save,
  RotateCcw,
  Moon,
  Sun,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

// ----------------------------------------------------------------------
// Types & Constants
// ----------------------------------------------------------------------

interface NotificationCategory {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

interface ChannelSetting {
  id: string;
  label: string;
  icon: React.ElementType;
  enabled: boolean;
  description: string;
}

// ----------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------

export default function NotificationSettingsPage() {
  const router = useRouter();

  // General master toggle
  const [allNotificationsEnabled, setAllNotificationsEnabled] = useState(true);

  // Category toggles
  const [categories, setCategories] = useState<NotificationCategory[]>([
    {
      id: "leave",
      label: "Leave Requests",
      description: "Updates on submitted, approved, or rejected leave applications",
      enabled: true,
    },
    {
      id: "approvals",
      label: "Approval Tasks",
      description: "Notifications when your approval is required",
      enabled: true,
    },
    {
      id: "balance",
      label: "Balance Alerts",
      description: "Warnings when leave balance is low or about to expire",
      enabled: true,
    },
    {
      id: "system",
      label: "System Announcements",
      description: "Important updates from HR and system administrators",
      enabled: false,
    },
  ]);

  // Channel settings
  const [channels, setChannels] = useState<ChannelSetting[]>([
    {
      id: "email",
      label: "Email",
      icon: Mail,
      enabled: true,
      description: "Receive notifications via email",
    },
    {
      id: "push",
      label: "Push Notifications",
      icon: Smartphone,
      enabled: true,
      description: "Real‑time alerts in your browser",
    },
    {
      id: "inapp",
      label: "In‑App",
      icon: Zap,
      enabled: true,
      description: "Notifications inside the Flexi HRMS dashboard",
    },
    {
      id: "sms",
      label: "SMS",
      icon: MessageSquare,
      enabled: false,
      description: "Text messages (carrier charges may apply)",
    },
  ]);

  // Quiet hours settings
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(false);
  const [quietHoursStart, setQuietHoursStart] = useState("22:00");
  const [quietHoursEnd, setQuietHoursEnd] = useState("07:00");

  // Digest frequency
  const [digestFrequency, setDigestFrequency] = useState("daily");

  // Toggle all notifications
  const handleMasterToggle = (checked: boolean) => {
    setAllNotificationsEnabled(checked);
    setCategories((prev) =>
      prev.map((cat) => ({ ...cat, enabled: checked }))
    );
  };

  // Toggle individual category
  const handleCategoryToggle = (id: string, checked: boolean) => {
    setCategories((prev) =>
      prev.map((cat) => (cat.id === id ? { ...cat, enabled: checked } : cat))
    );
    // If any category is disabled, master toggle should reflect partial state (optional)
  };

  // Toggle channel
  const handleChannelToggle = (id: string, checked: boolean) => {
    setChannels((prev) =>
      prev.map((ch) => (ch.id === id ? { ...ch, enabled: checked } : ch))
    );
  };

  // Save settings
  const handleSave = () => {
    // In a real app, send to API
    toast.success("Settings saved", {
      description: "Your notification preferences have been updated.",
    });
  };

  // Reset to defaults
  const handleReset = () => {
    setAllNotificationsEnabled(true);
    setCategories((prev) =>
      prev.map((cat) => ({ ...cat, enabled: true }))
    );
    setChannels((prev) =>
      prev.map((ch) => ({
        ...ch,
        enabled: ch.id !== "sms", // keep SMS disabled by default
      }))
    );
    setQuietHoursEnabled(false);
    setQuietHoursStart("22:00");
    setQuietHoursEnd("07:00");
    setDigestFrequency("daily");
    toast.info("Reset to defaults", {
      description: "Notification settings have been restored.",
    });
  };

  return (
    <div className="p-6 bg-white min-h-screen space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-800">
            <Bell className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-brand-900">
              Notification Settings
            </h1>
            <p className="text-sm text-brand-700">
              Manage how and when you receive alerts and updates
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleReset}
            className="border-gray-200 text-brand-800 hover:bg-brand-100"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button
            onClick={handleSave}
            className="bg-brand-800 hover:bg-brand-900 text-white"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      {/* Master Toggle */}
      <Card className="border-gray-200 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-brand-900">
                All Notifications
              </h3>
              <p className="text-sm text-brand-700">
                Turn off to pause all notifications from Flexi HRMS
              </p>
            </div>
            <Switch
              checked={allNotificationsEnabled}
              onCheckedChange={handleMasterToggle}
              className="data-[state=checked]:bg-brand-800"
            />
          </div>
        </CardContent>
      </Card>

      {/* Notification Categories */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-brand-900">
            Notification Types
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {categories.map((category) => (
            <div
              key={category.id}
              className="flex items-start justify-between py-2"
            >
              <div className="space-y-1 pr-8">
                <Label
                  htmlFor={`cat-${category.id}`}
                  className="text-base font-medium text-brand-900"
                >
                  {category.label}
                </Label>
                <p className="text-sm text-brand-700">{category.description}</p>
              </div>
              <Switch
                id={`cat-${category.id}`}
                checked={category.enabled}
                onCheckedChange={(checked) =>
                  handleCategoryToggle(category.id, checked)
                }
                disabled={!allNotificationsEnabled}
                className="data-[state=checked]:bg-brand-800"
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Delivery Channels */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-brand-900">
            Delivery Channels
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {channels.map((channel) => {
            const Icon = channel.icon;
            return (
              <div
                key={channel.id}
                className="flex items-center justify-between py-2"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100 text-brand-800">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium text-brand-900">{channel.label}</p>
                    <p className="text-sm text-brand-700">{channel.description}</p>
                  </div>
                </div>
                <Switch
                  checked={channel.enabled}
                  onCheckedChange={(checked) =>
                    handleChannelToggle(channel.id, checked)
                  }
                  className="data-[state=checked]:bg-brand-800"
                />
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Quiet Hours */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-brand-900 flex items-center gap-2">
            <Moon className="h-5 w-5 text-brand-700" />
            Quiet Hours
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-brand-900">Enable Quiet Hours</p>
              <p className="text-sm text-brand-700">
                Pause non‑critical notifications during specified times
              </p>
            </div>
            <Switch
              checked={quietHoursEnabled}
              onCheckedChange={setQuietHoursEnabled}
              className="data-[state=checked]:bg-brand-800"
            />
          </div>
          {quietHoursEnabled && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              <div className="space-y-2">
                <Label className="text-brand-800">Start Time</Label>
                <Select value={quietHoursStart} onValueChange={setQuietHoursStart}>
                  <SelectTrigger className="border-gray-200 text-brand-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => {
                      const hour = i.toString().padStart(2, "0");
                      return (
                        <SelectItem key={hour} value={`${hour}:00`}>
                          {`${hour}:00`}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-brand-800">End Time</Label>
                <Select value={quietHoursEnd} onValueChange={setQuietHoursEnd}>
                  <SelectTrigger className="border-gray-200 text-brand-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => {
                      const hour = i.toString().padStart(2, "0");
                      return (
                        <SelectItem key={hour} value={`${hour}:00`}>
                          {`${hour}:00`}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Digest Settings */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-brand-900 flex items-center gap-2">
            <Clock className="h-5 w-5 text-brand-700" />
            Email Digest
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label className="text-brand-800">Send summary emails</Label>
            <Select value={digestFrequency} onValueChange={setDigestFrequency}>
              <SelectTrigger className="w-full sm:w-[240px] border-gray-200 text-brand-800">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="realtime">Real‑time (as they happen)</SelectItem>
                <SelectItem value="hourly">Hourly digest</SelectItem>
                <SelectItem value="daily">Daily digest</SelectItem>
                <SelectItem value="weekly">Weekly digest</SelectItem>
                <SelectItem value="never">Never (only transactional)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-brand-700 mt-2">
              Choose how often you'd like to receive batched email summaries.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Additional Info / Footer */}
      <div className="text-xs text-brand-700 text-center py-4 border-t border-gray-200">
        Changes are applied immediately. You can unsubscribe from specific
        notifications at any time.
      </div>
    </div>
  );
}