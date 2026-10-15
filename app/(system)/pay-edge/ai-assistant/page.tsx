"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  Bot,
  Bookmark,
  ChevronRight,
  Database,
  RefreshCw,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Terminal,
  User,
  X,
} from "lucide-react";

type MessageType = "text" | "analysis" | "alert" | "table";

interface Message {
  id: string;
  role: "assistant" | "user";
  content: string;
  type?: MessageType;
  data?: {
    breakdown?: Array<{ label: string; impact: string; perc: number }>;
    issues?: Array<{ severity: "CRITICAL" | "WARNING"; title: string; detail: string }>;
    headers?: string[];
    rows?: string[][];
  };
}

const SUGGESTIONS = [
  "Why is January payroll higher than December?",
  "Find employees with >20% salary changes",
  "What is the total tax liability for Engineering?",
  "Compare last 3 months payroll trends",
  "Identify anomalies in bank details",
];

const INITIAL_MESSAGE: Message = {
  id: "1",
  role: "assistant",
  content:
    "Hello. I’m your PayEdge Intelligence Assistant. I have indexed the Jan 2025 payroll cycle. How can I help you analyze the data today?",
  type: "text",
};

function buildAssistantResponse(text: string): Message {
  const lowerText = text.toLowerCase();

  if (lowerText.includes("higher") || lowerText.includes("increase")) {
    return {
      id: `${Date.now()}-assistant`,
      role: "assistant",
      content:
        "January payroll is 3.1% higher than December. The main drivers are below:",
      type: "analysis",
      data: {
        breakdown: [
          { label: "New Joiners (13)", impact: "+625,000", perc: 52 },
          { label: "Annual Increments", impact: "+450,000", perc: 37 },
          { label: "Karachi OT Spike", impact: "+125,000", perc: 11 },
        ],
      },
    };
  }

  if (lowerText.includes("anomaly") || lowerText.includes("issue") || lowerText.includes("bank")) {
    return {
      id: `${Date.now()}-assistant`,
      role: "assistant",
      content:
        "I found 3 items that need review in the current run:",
      type: "alert",
      data: {
        issues: [
          {
            severity: "CRITICAL",
            title: "Invalid IBAN",
            detail: "EMP-1102 IBAN checksum failed SCB verification.",
          },
          {
            severity: "CRITICAL",
            title: "Negative Payout",
            detail: "EMP-1089 deductions exceed gross by PKR 5,400.",
          },
          {
            severity: "WARNING",
            title: "Missing NTN",
            detail: "EMP-1256 is missing NTN for Annex-C filing.",
          },
        ],
      },
    };
  }

  if (lowerText.includes("tax") || lowerText.includes("liability")) {
    return {
      id: `${Date.now()}-assistant`,
      role: "assistant",
      content:
        "The projected Jan 2025 tax liability by department is below:",
      type: "table",
      data: {
        headers: ["Department", "Taxable Gross", "WHT Amount"],
        rows: [
          ["Engineering", "18.5M", "1.85M"],
          ["Operations", "12.2M", "0.95M"],
          ["Human Resources", "2.8M", "0.22M"],
        ],
      },
    };
  }

  if (lowerText.includes("trend") || lowerText.includes("compare")) {
    return {
      id: `${Date.now()}-assistant`,
      role: "assistant",
      content:
        "The latest trend shows a controlled increase across the last three payroll cycles, with the strongest movement coming from headcount additions and overtime exposure.",
      type: "text",
    };
  }

  return {
    id: `${Date.now()}-assistant`,
    role: "assistant",
    content:
      "I analyzed the request against the Jan 2025 payroll index. I can break this down by department, cost center, employee changes, tax exposure, or anomaly flags.",
    type: "text",
  };
}

export default function PayEdgeAIChat() {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [pinnedTitle] = useState("Tax Projection Q1");
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const totalUserMessages = useMemo(
    () => messages.filter((message) => message.role === "user").length,
    [messages]
  );

  const totalAssistantMessages = useMemo(
    () => messages.filter((message) => message.role === "assistant").length,
    [messages]
  );

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  useEffect(() => {
    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, []);

  const handleSend = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;

    const userMsg: Message = {
      id: `${Date.now()}-user`,
      role: "user",
      content: trimmed,
      type: "text",
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSelectedPrompt(trimmed);
    setIsTyping(true);

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);

    typingTimerRef.current = setTimeout(() => {
      setMessages((prev) => [...prev, buildAssistantResponse(trimmed)]);
      setIsTyping(false);
    }, 900);
  };

  const handleResetChat = () => {
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    setMessages([INITIAL_MESSAGE]);
    setInput("");
    setIsTyping(false);
    setSelectedPrompt(null);
  };

  return (
    <div className="min-h-screen bg-white p-3">
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-800">
                <Bot className="h-5 w-5 text-white" />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-brand-900">
                  PayEdge AI Assistant
                </h2>
                <p className="mt-0.5 text-sm text-brand-700">
                  Ask payroll questions and review indexed insights for Jan 2025
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleResetChat}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-brand-800 transition hover:bg-brand-100"
                title="Reset chat"
              >
                <RefreshCw className="h-4 w-4" />
              </button>

              <button
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-brand-800 transition hover:bg-brand-100"
                title="Settings"
              >
                <Settings className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="grid min-h-[720px] grid-cols-1 xl:grid-cols-[300px_1fr]">
          <aside className="hidden border-r border-gray-200 bg-white xl:block">
            <div className="space-y-6 p-5">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-800">
                  Suggested Queries
                </h3>

                <div className="mt-4 space-y-2">
                  {SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => handleSend(suggestion)}
                      className={
                        selectedPrompt === suggestion
                          ? "flex w-full items-center justify-between rounded-lg border border-brand-800 bg-brand-100 px-3 py-3 text-left text-sm font-semibold text-brand-900"
                          : "flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-3 text-left text-sm font-semibold text-brand-800 transition hover:bg-brand-100"
                      }
                    >
                      <span className="pr-3">{suggestion}</span>
                      <ChevronRight className="h-4 w-4 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100">
                    <Bookmark className="h-4 w-4 text-brand-800" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-brand-900">
                      Pinned Analysis
                    </h4>
                    <p className="mt-1 text-sm text-brand-700">{pinnedTitle}</p>
                    <p className="mt-1 text-[11px] text-brand-700">
                      Auto-updated after the latest closure snapshot.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="text-xs font-semibold uppercase tracking-wider text-brand-800">
                  Session Summary
                </div>
                <div className="mt-3 space-y-2 text-sm text-brand-700">
                  <div>
                    User messages:{" "}
                    <span className="font-semibold text-brand-900">
                      {totalUserMessages}
                    </span>
                  </div>
                  <div>
                    Assistant replies:{" "}
                    <span className="font-semibold text-brand-900">
                      {totalAssistantMessages}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <main className="flex min-h-0 flex-col bg-white">
            <div
              ref={scrollRef}
              className="flex-1 space-y-6 overflow-y-auto px-5 py-5 md:px-6"
            >
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {msg.role === "assistant" && (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-800 text-white">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[88%] space-y-3 ${
                      msg.role === "user" ? "items-end text-right" : ""
                    }`}
                  >
                    <div
                      className={
                        msg.role === "assistant"
                          ? "inline-block rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm leading-6 text-brand-900 shadow-sm"
                          : "inline-block rounded-xl border border-brand-800 bg-brand-800 px-4 py-3 text-sm leading-6 text-white shadow-sm"
                      }
                    >
                      {msg.content}
                    </div>

                    {msg.type === "analysis" && msg.data?.breakdown && (
                      <div className="grid grid-cols-1 gap-3">
                        {msg.data.breakdown.map((item, index) => (
                          <div
                            key={`${msg.id}-analysis-${index}`}
                            className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                          >
                            <div className="flex items-center justify-between gap-4">
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-brand-800">
                                  {item.label}
                                </p>
                                <p className="mt-1 text-sm font-semibold text-brand-900">
                                  {item.impact}
                                </p>
                              </div>

                              <div className="min-w-[90px] text-right">
                                <p className="text-sm font-semibold text-brand-900">
                                  {item.perc}%
                                </p>
                                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-brand-100">
                                  <div
                                    className="h-full rounded-full bg-brand-800"
                                    style={{ width: `${item.perc}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {msg.type === "alert" && msg.data?.issues && (
                      <div className="space-y-3">
                        {msg.data.issues.map((issue, index) => (
                          <div
                            key={`${msg.id}-issue-${index}`}
                            className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                          >
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5">
                                {issue.severity === "CRITICAL" ? (
                                  <AlertTriangle className="h-4 w-4 text-red-600" />
                                ) : (
                                  <AlertCircle className="h-4 w-4 text-amber-600" />
                                )}
                              </div>

                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={
                                      issue.severity === "CRITICAL"
                                        ? "inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700"
                                        : "inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700"
                                    }
                                  >
                                    {issue.severity}
                                  </span>
                                  <span className="text-sm font-semibold text-brand-900">
                                    {issue.title}
                                  </span>
                                </div>

                                <p className="mt-2 text-sm leading-6 text-brand-700">
                                  {issue.detail}
                                </p>
                              </div>

                              <button className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-brand-800 transition hover:bg-brand-100">
                                <ChevronRight className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {msg.type === "table" && msg.data?.headers && msg.data?.rows && (
                      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                        <table className="w-full">
                          <thead className="border-b border-gray-200">
                            <tr>
                              {msg.data.headers.map((header) => (
                                <th
                                  key={`${msg.id}-${header}`}
                                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800"
                                >
                                  {header}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-brand-300/50">
                            {msg.data.rows.map((row, rowIndex) => (
                              <tr
                                key={`${msg.id}-row-${rowIndex}`}
                                className="transition-colors hover:bg-brand-100"
                              >
                                {row.map((cell, cellIndex) => (
                                  <td
                                    key={`${msg.id}-cell-${rowIndex}-${cellIndex}`}
                                    className={
                                      cellIndex === 0
                                        ? "px-4 py-3 text-sm font-semibold text-brand-900"
                                        : "px-4 py-3 text-sm text-brand-900"
                                    }
                                  >
                                    {cell}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {msg.role === "user" && (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-700">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              ))}

              {isTyping && (
                <div className="flex gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-800 text-white">
                    <Bot className="h-4 w-4" />
                  </div>

                  <div className="inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-300" />
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-300" />
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-300" />
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 bg-white px-5 py-4 md:px-6">
              <div className="relative">
                <Sparkles className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-700" />
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend(input)}
                  placeholder="Ask about Jan 2025 payroll..."
                  className="h-12 w-full rounded-xl border border-gray-200 bg-white pl-11 pr-14 text-sm text-brand-900 outline-none transition focus:border-brand-800"
                />
                {input && (
                  <button
                    onClick={() => setInput("")}
                    className="absolute right-12 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-brand-700 transition hover:bg-brand-100"
                    title="Clear"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => handleSend(input)}
                  disabled={!input.trim() || isTyping}
                  className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg bg-brand-800 text-white transition hover:bg-brand-900 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>

              <p className="mt-3 text-[11px] text-brand-700">
                PayEdge AI may verify calculations using indexed payroll rules and tax references.
              </p>
            </div>
          </main>
        </div>

        <div className="border-t border-gray-200 bg-white px-6 py-4">
          <div className="flex flex-col gap-2 text-[11px] text-brand-700 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-4">
              <span className="inline-flex items-center gap-1.5">
                <Terminal className="h-4 w-4" />
                Query Latency: 450ms
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Database className="h-4 w-4" />
                4.2M Records Indexed
              </span>
            </div>

            <div className="inline-flex items-center gap-1.5 font-semibold text-brand-900">
              <ShieldCheck className="h-4 w-4" />
              SOC-2 Compliance Verified
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}