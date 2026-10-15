// app/flexi-hq/notifications/templates/page.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Mail,
  MessageSquare,
  Smartphone,
  Zap,
  Search,
  ChevronRight,
  Save,
  RotateCcw,
  Send,
  Info,
  Eye,
  Layout,
  List,
  Database,
  CheckSquare,
  Settings,
  Type,
  Bold,
  Italic,
  Link,
  Code,
  History as HistoryIcon,
  Check,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

// ----------------------------------------------------------------------
// Types & Constants
// ----------------------------------------------------------------------

interface TemplateEvent {
  id: string;
  label: string;
  description: string;
  defaultRecipients: string;
  status: "configured" | "default";
}

interface Category {
  id: string;
  label: string;
  icon: React.ElementType;
  events: TemplateEvent[];
}

// Custom Calendar icon (kept from original)
const CalendarIcon = ({ size }: { size: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const CATEGORIES: Category[] = [
  {
    id: "requests",
    label: "Leave Requests",
    icon: CalendarIcon,
    events: [
      {
        id: "leave.submitted",
        label: "Request Submitted",
        description: "Triggered when a new leave application is created.",
        defaultRecipients: "Manager",
        status: "configured",
      },
      {
        id: "leave.approved",
        label: "Request Approved",
        description: "Sent when leave request is approved.",
        defaultRecipients: "Requester",
        status: "configured",
      },
      {
        id: "leave.rejected",
        label: "Request Rejected",
        description: "Sent when leave request is denied.",
        defaultRecipients: "Requester",
        status: "default",
      },
      {
        id: "leave.cancelled",
        label: "Request Cancelled",
        description: "Triggered upon cancellation by requester or admin.",
        defaultRecipients: "Approver, HR",
        status: "default",
      },
    ],
  },
  {
    id: "balances",
    label: "Balances",
    icon: Database,
    events: [
      {
        id: "balance.low",
        label: "Low Balance Warning",
        description: "Triggered when balance falls below threshold.",
        defaultRecipients: "Employee",
        status: "default",
      },
      {
        id: "balance.expiry",
        label: "Balance Expiry Alert",
        description: "Sent before carry-forward days expire.",
        defaultRecipients: "Employee",
        status: "configured",
      },
    ],
  },
  {
    id: "approvals",
    label: "Approvals",
    icon: CheckSquare,
    events: [
      {
        id: "approval.reminder",
        label: "SLA Reminder",
        description: "Sent to approver when request is near SLA breach.",
        defaultRecipients: "Approver",
        status: "configured",
      },
      {
        id: "approval.escalation",
        label: "SLA Escalation",
        description: "Sent when request breaches SLA time.",
        defaultRecipients: "Manager of Approver, HR",
        status: "default",
      },
    ],
  },
  {
    id: "compoff",
    label: "Comp-Off",
    icon: Zap,
    events: [
      {
        id: "co.credited",
        label: "Credit Awarded",
        description: "Sent when extra work is verified as credit.",
        defaultRecipients: "Employee",
        status: "configured",
      },
    ],
  },
];

const VARIABLES = [
  "{{employee_name}}",
  "{{leave_type}}",
  "{{start_date}}",
  "{{end_date}}",
  "{{duration}}",
  "{{balance}}",
  "{{approver_name}}",
  "{{request_id}}",
];

type ChannelKey = "Email" | "In-App" | "Push" | "SMS";

// ----------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------

export default function LeaveNotificationTemplates() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEventId, setSelectedEventId] = useState("leave.approved");
  const [activeChannel, setActiveChannel] = useState<ChannelKey>("Email");
  const [channels, setChannels] = useState<Record<ChannelKey, boolean>>({
    "In-App": true,
    Push: true,
    Email: true,
    SMS: false,
  });
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [emailSubject, setEmailSubject] = useState(
    "Your {{leave_type}} request has been approved"
  );
  const [bodyContent, setBodyContent] = useState(
    `Dear {{employee_name}},\n\nYour request for {{leave_type}} from {{start_date}} to {{end_date}} ({{duration}}) has been approved by {{approver_name}}.\n\nYour remaining balance is now {{balance}} days.\n\nBest regards,\nFlexi HR System`
  );

  const bodyTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Filter events by search query
  const filteredCategories = CATEGORIES.map((cat) => ({
    ...cat,
    events: cat.events.filter(
      (e) =>
        e.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.id.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter((cat) => cat.events.length > 0);

  const selectedEvent = CATEGORIES.flatMap((c) => c.events).find(
    (e) => e.id === selectedEventId
  );

  // Toggle channel enabled state
  const toggleChannel = (channel: ChannelKey) => {
    setChannels((prev) => ({ ...prev, [channel]: !prev[channel] }));
  };

  // Insert variable at cursor position in body textarea
  const insertVariable = (variable: string) => {
    const textarea = bodyTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = bodyContent;
    const newText = text.substring(0, start) + variable + text.substring(end);
    setBodyContent(newText);

    // Restore cursor position after React re-render
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + variable.length, start + variable.length);
    }, 0);
  };

  // Handlers for actions
  const handleSave = () => {
    toast.success("Template saved", {
      description: `Changes to ${selectedEvent?.label} have been saved.`,
    });
    // In a real app, you'd persist to backend here
  };

  const handleReset = () => {
    // Reset to default values based on selected event (mock)
    setEmailSubject("Your {{leave_type}} request has been approved");
    setBodyContent(
      `Dear {{employee_name}},\n\nYour request for {{leave_type}} from {{start_date}} to {{end_date}} ({{duration}}) has been approved by {{approver_name}}.\n\nYour remaining balance is now {{balance}} days.\n\nBest regards,\nFlexi HR System`
    );
    toast.info("Reset to default", {
      description: "Template content has been restored.",
    });
  };

  const handleTestSend = () => {
    toast.success("Test notification sent", {
      description: `A test ${activeChannel} was sent to your account.`,
    });
  };

  // Rich text toolbar actions (simulated)
  const applyFormat = (command: string) => {
    toast.info(`Format "${command}" applied`, {
      description: "Rich text formatting simulated.",
    });
    // In production you'd integrate a real rich text editor
  };

  // --------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------
  return (
    <div className="flex h-full bg-white font-sans overflow-hidden">
      {/* Sidebar - Events List */}
      <aside className="w-80 bg-white border-r border-gray-200 flex flex-col shrink-0">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-brand-900">Event Library</h2>
          <div className="relative mt-4">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-700"
              size={14}
            />
            <Input
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 border-gray-200 focus:border-brand-800 focus:ring-brand-800 text-brand-900"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scroll">
          {filteredCategories.map((cat) => (
            <div key={cat.id} className="space-y-2">
              <div className="flex items-center gap-2 px-2 text-[10px] font-bold text-brand-700 uppercase tracking-widest">
                <cat.icon size={12} /> {cat.label} ({cat.events.length})
              </div>
              <div className="space-y-1">
                {cat.events.map((event) => (
                  <button
                    key={event.id}
                    onClick={() => setSelectedEventId(event.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg transition-all group relative flex items-center justify-between ${
                      selectedEventId === event.id
                        ? "bg-brand-50 text-brand-900 border border-brand-200"
                        : "text-brand-800 hover:bg-brand-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          event.status === "configured"
                            ? "bg-brand-800"
                            : "bg-gray-300"
                        }`}
                        title={event.status}
                      />
                      <span className="text-xs font-medium">{event.label}</span>
                    </div>
                    <ChevronRight
                      size={14}
                      className={`text-brand-700 group-hover:translate-x-0.5 transition-transform ${
                        selectedEventId === event.id ? "opacity-100" : "opacity-0"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
          ))}
          {filteredCategories.length === 0 && (
            <div className="text-center py-8 text-brand-700 text-sm">
              No events match your search.
            </div>
          )}
        </div>
      </aside>

      {/* Editor Panel */}
      <main className="flex-1 overflow-y-auto flex flex-col relative bg-brand-50/30">
        {selectedEvent ? (
          <>
            {/* Header */}
            <header className="bg-white px-10 py-6 border-b border-gray-200 flex items-center justify-between sticky top-0 z-10 shadow-sm">
              <div className="flex items-center gap-6">
                <div className="p-4 bg-brand-100 text-brand-900 rounded-xl">
                  <Bell size={32} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-brand-900">
                    {selectedEvent.label}
                  </h1>
                  <p className="text-sm text-brand-700 mt-1">
                    ID: {selectedEvent.id} • {selectedEvent.description}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant={isPreviewMode ? "default" : "outline"}
                  onClick={() => setIsPreviewMode(!isPreviewMode)}
                  className={
                    isPreviewMode
                      ? "bg-brand-800 hover:bg-brand-900 text-white"
                      : "border-gray-200 text-brand-800 hover:bg-brand-100"
                  }
                >
                  <Eye className="h-4 w-4 mr-2" />
                  {isPreviewMode ? "Edit Mode" : "Preview Result"}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-brand-700 hover:text-brand-900 hover:bg-brand-100"
                >
                  <Settings className="h-5 w-5" />
                </Button>
              </div>
            </header>

            <div className="p-8 flex gap-8 flex-1">
              <div className="flex-1 space-y-6">
                {/* Channel Selector */}
                <Card className="border-gray-200 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-bold text-brand-700 uppercase tracking-wider">
                      Delivery Channels
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    {Object.entries(channels).map(([name, enabled]) => (
                      <div
                        key={name}
                        onClick={() => setActiveChannel(name as ChannelKey)}
                        className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                          activeChannel === name
                            ? "border-brand-800 bg-brand-50"
                            : "border-gray-100 hover:border-gray-200"
                        }`}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleChannel(name as ChannelKey);
                          }}
                          className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-all ${
                            enabled
                              ? "bg-brand-800 border-brand-800 text-white"
                              : "border-gray-300 bg-white"
                          }`}
                        >
                          {enabled && <Check className="h-3 w-3" />}
                        </button>
                        <div className="flex items-center gap-3">
                          {name === "Email" ? (
                            <Mail size={18} />
                          ) : name === "Push" ? (
                            <Smartphone size={18} />
                          ) : name === "In-App" ? (
                            <Zap size={18} />
                          ) : (
                            <MessageSquare size={18} />
                          )}
                          <span className="text-sm font-medium text-brand-900">
                            {name}
                          </span>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Editor Surface */}
                <Card className="border-gray-200 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-gray-200 bg-brand-50/30 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge className="bg-brand-800 text-white">
                        {activeChannel} Template
                      </Badge>
                      <p className="text-xs text-brand-700">
                        Editing default version for all staff
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleReset}
                        className="text-brand-700 hover:text-brand-900 hover:bg-brand-100"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleSave}
                        className="text-brand-700 hover:text-brand-900 hover:bg-brand-100"
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <CardContent className="p-6 space-y-6">
                    {activeChannel === "Email" && (
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-brand-700 uppercase tracking-wider">
                          Email Subject
                        </label>
                        <Input
                          value={emailSubject}
                          onChange={(e) => setEmailSubject(e.target.value)}
                          className="border-gray-200 focus:border-brand-800 text-brand-900"
                          disabled={isPreviewMode}
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-brand-700 uppercase tracking-wider">
                        Notification Body
                      </label>
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        {/* Rich Text Toolbar */}
                        <div className="px-4 py-2 border-b border-gray-200 bg-white flex items-center gap-4">
                          <div className="flex gap-1 border-r pr-4 border-gray-200">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => applyFormat("bold")}
                              className="text-brand-700 hover:text-brand-900"
                            >
                              <Bold className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => applyFormat("italic")}
                              className="text-brand-700 hover:text-brand-900"
                            >
                              <Italic className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => applyFormat("link")}
                              className="text-brand-700 hover:text-brand-900"
                            >
                              <Link className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => applyFormat("heading")}
                              className="text-brand-700 hover:text-brand-900"
                            >
                              <Type className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => applyFormat("list")}
                              className="text-brand-700 hover:text-brand-900"
                            >
                              <List className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => applyFormat("code")}
                              className="text-brand-700 hover:text-brand-900"
                            >
                              <Code className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <Textarea
                          ref={bodyTextareaRef}
                          value={bodyContent}
                          onChange={(e) => setBodyContent(e.target.value)}
                          className="w-full p-6 min-h-[240px] border-0 focus-visible:ring-0 text-sm leading-relaxed text-brand-900 resize-y"
                          placeholder="Write your message here..."
                          disabled={isPreviewMode}
                        />
                      </div>
                    </div>
                  </CardContent>

                  {/* Variables Cloud */}
                  <div className="p-6 border-t border-gray-200 bg-white">
                    <div className="flex items-center gap-2 mb-4">
                      <Info className="h-4 w-4 text-brand-700" />
                      <span className="text-xs font-bold text-brand-700 uppercase tracking-wider">
                        Click to insert variables
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {VARIABLES.map((v) => (
                        <Button
                          key={v}
                          variant="outline"
                          size="sm"
                          onClick={() => insertVariable(v)}
                          className="bg-brand-50 hover:bg-brand-800 hover:text-white text-brand-800 text-xs font-medium border-brand-200"
                          disabled={isPreviewMode}
                        >
                          {v}
                        </Button>
                      ))}
                    </div>
                  </div>
                </Card>

                {/* Footer Actions */}
                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    onClick={handleReset}
                    className="flex-1 border-gray-200 text-brand-800 hover:bg-brand-100"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset to Default
                  </Button>
                  <Button
                    onClick={handleSave}
                    className="flex-1 bg-brand-800 hover:bg-brand-900 text-white"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Template
                  </Button>
                  <Button
                    onClick={handleTestSend}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Test Send
                  </Button>
                </div>
              </div>

              {/* Right Sidebar */}
              <div className="w-80 space-y-6 shrink-0">
                <Card className="bg-brand-900 text-white border-0 shadow-lg">
                  <CardContent className="p-6 space-y-4">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-brand-200 flex items-center gap-2">
                      <Zap className="h-4 w-4" /> Auto-Recipient
                    </h4>
                    <div className="bg-white/10 p-4 rounded-lg border border-white/20">
                      <p className="text-[10px] font-bold uppercase text-brand-200 mb-1">
                        Send to
                      </p>
                      <p className="text-sm font-medium">
                        {selectedEvent.defaultRecipients}
                      </p>
                    </div>
                    <p className="text-xs text-brand-200 leading-relaxed">
                      Dynamic mapping based on request ownership and hierarchical
                      structures.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-gray-200 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-bold text-brand-700 uppercase tracking-wider flex items-center gap-2">
                      <HistoryIcon className="h-4 w-4" /> Recent Modifications
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      {
                        user: "Sarah Admin",
                        time: "2h ago",
                        action: "Updated Email Subject",
                      },
                      {
                        user: "System",
                        time: "Jan 15",
                        action: "Draft Created",
                      },
                    ].map((log, i) => (
                      <div key={i} className="relative pl-4">
                        <div className="absolute left-0 top-1.5 w-2 h-2 rounded-full bg-brand-800" />
                        <p className="text-sm font-medium text-brand-900">
                          {log.action}
                        </p>
                        <p className="text-xs text-brand-700">
                          {log.user} • {log.time}
                        </p>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <div className="p-4 bg-brand-50 rounded-lg border border-brand-200 flex items-start gap-3">
                  <Info className="h-4 w-4 text-brand-800 shrink-0 mt-0.5" />
                  <p className="text-xs text-brand-800 leading-relaxed">
                    Templates support localization. Add Pakistan/Urdu translations
                    in Language Settings.
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-6">
            <div className="w-24 h-24 bg-white rounded-xl border border-gray-200 shadow-sm flex items-center justify-center text-brand-300">
              <Layout size={48} />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-brand-900">
                Select an Event
              </h3>
              <p className="text-sm text-brand-700 max-w-xs mx-auto mt-2">
                Choose an event from the library on the left to configure its
                notification triggers and templates.
              </p>
            </div>
          </div>
        )}
      </main>

   
    </div>
  );
}