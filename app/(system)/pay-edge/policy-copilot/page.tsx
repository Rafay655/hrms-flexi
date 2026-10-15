"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  Bot,
  Calculator,
  CheckCircle2,
  ChevronRight,
  Download,
  FileText,
  FlaskConical,
  History as HistoryIcon,
  Save,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  User,
  X,
  Zap,
} from "lucide-react";

interface Message {
  id: string;
  type: "user" | "ai";
  text: string;
  kind?: "text" | "policy" | "impact" | "compliance" | "tests";
  data?: any;
}

const SUGGESTED_PROMPTS = [
  "Create a maternity leave policy for Pakistan",
  "What if we increase casual leave to 12 days?",
  "Compare our policy with industry standards",
  "Generate test cases for sandwich rule",
];

const INITIAL_MESSAGE: Message = {
  id: "1",
  type: "ai",
  text: "Hello. I’m PolicyCopilot. I can help generate leave types, simulate policy changes, verify compliance, and create test scenarios. How can I assist you today?",
  kind: "text",
};

function buildCopilotResponse(text: string): Message {
  const query = text.toLowerCase();

  if (query.includes("maternity") || query.includes("create")) {
    return {
      id: `${Date.now()}-ai`,
      type: "ai",
      text: "I drafted a maternity leave policy aligned with Pakistan labor requirements. Here is the proposed setup:",
      kind: "policy",
      data: {
        compliant: true,
        fields: [
          { label: "Code", value: "MAT_PK" },
          { label: "Duration", value: "90 Days" },
          { label: "Type", value: "Paid (100%)" },
          { label: "Accrual", value: "On Event" },
        ],
      },
    };
  }

  if (query.includes("12 days") || query.includes("increase")) {
    return {
      id: `${Date.now()}-ai`,
      type: "ai",
      text: "I analyzed the impact of increasing casual leave from 10 to 12 days:",
      kind: "impact",
      data: {
        employeesAffected: 450,
        annualVolume: "+900 days",
        estimatedCost: "PKR 4.5M / Year",
      },
    };
  }

  if (query.includes("compliant") || query.includes("industry") || query.includes("compare")) {
    return {
      id: `${Date.now()}-ai`,
      type: "ai",
      text: "Here is a quick compliance and policy review summary:",
      kind: "compliance",
      data: {
        items: [
          {
            tone: "success",
            title: "Maternity Benefit Coverage",
            detail: "Your 90-day maternity policy meets the current provincial baseline requirement.",
          },
          {
            tone: "warning",
            title: "Documentation Control",
            detail: "You should tighten medical and proof-of-birth requirements for better audit coverage.",
          },
        ],
      },
    };
  }

  if (query.includes("test case") || query.includes("sandwich")) {
    return {
      id: `${Date.now()}-ai`,
      type: "ai",
      text: "I generated 4 test scenarios for the sandwich rule simulator:",
      kind: "tests",
      data: {
        tests: [
          "Friday + Monday leave should deduct 4 days",
          "Thursday + Friday leave should deduct 2 days",
          "Friday leave + Public Holiday Monday should check override logic",
          "Mid-week leave spanning Public Holiday should validate boundary behavior",
        ],
      },
    };
  }

  return {
    id: `${Date.now()}-ai`,
    type: "ai",
    text: "I can help with policy drafting, impact analysis, compliance checks, and simulator test cases. Ask for a specific policy or scenario and I’ll structure it for you.",
    kind: "text",
  };
}

export default function PolicyCopilot() {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const totalUserMessages = useMemo(
    () => messages.filter((m) => m.type === "user").length,
    [messages]
  );

  const totalAiMessages = useMemo(
    () => messages.filter((m) => m.type === "ai").length,
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

    const userMessage: Message = {
      id: `${Date.now()}-user`,
      type: "user",
      text: trimmed,
      kind: "text",
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setSelectedPrompt(trimmed);
    setIsTyping(true);

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);

    typingTimerRef.current = setTimeout(() => {
      setMessages((prev) => [...prev, buildCopilotResponse(trimmed)]);
      setIsTyping(false);
    }, 900);
  };

  const handleReset = () => {
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
                  PolicyCopilot
                </h2>
                <p className="mt-0.5 text-sm text-brand-700">
                  Draft, simulate, and review leave and policy rules
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden text-right lg:block">
                <p className="text-[11px] text-brand-700">Context Active</p>
                <p className="text-sm font-semibold text-brand-900">
                  Pakistan Labor Law 2025
                </p>
              </div>

              <button
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-brand-800 transition hover:bg-brand-100"
                title="History"
              >
                <HistoryIcon className="h-4 w-4" />
              </button>

              <button
                onClick={handleReset}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-brand-800 transition hover:bg-brand-100"
                title="Reset"
              >
                <X className="h-4 w-4" />
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
                  Suggested Prompts
                </h3>

                <div className="mt-4 space-y-2">
                  {SUGGESTED_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => handleSend(prompt)}
                      className={
                        selectedPrompt === prompt
                          ? "flex w-full items-center justify-between rounded-lg border border-brand-800 bg-brand-100 px-3 py-3 text-left text-sm font-semibold text-brand-900"
                          : "flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-3 text-left text-sm font-semibold text-brand-800 transition hover:bg-brand-100"
                      }
                    >
                      <span className="pr-3">{prompt}</span>
                      <ChevronRight className="h-4 w-4 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100">
                    <Sparkles className="h-4 w-4 text-brand-800" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-brand-900">
                      Active Capability
                    </h4>
                    <p className="mt-1 text-sm text-brand-700">
                      Policy drafting, simulation, compliance review, and test-case generation.
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
                    AI replies:{" "}
                    <span className="font-semibold text-brand-900">
                      {totalAiMessages}
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
                    msg.type === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {msg.type === "ai" && (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-800 text-white">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}

                  <div className={`max-w-[88%] space-y-3 ${msg.type === "user" ? "text-right" : ""}`}>
                    <div
                      className={
                        msg.type === "ai"
                          ? "inline-block rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm leading-6 text-brand-900 shadow-sm"
                          : "inline-block rounded-xl border border-brand-800 bg-brand-800 px-4 py-3 text-sm leading-6 text-white shadow-sm"
                      }
                    >
                      {msg.text}
                    </div>

                    {msg.kind === "policy" && msg.data?.fields && (
                      <div className="max-w-md rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                        <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                          <h4 className="text-sm font-semibold text-brand-900">
                            New Leave Type
                          </h4>
                          <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                            Compliant
                          </span>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-4">
                          {msg.data.fields.map((field: any) => (
                            <div key={field.label}>
                              <p className="text-[11px] text-brand-700">{field.label}</p>
                              <p className="mt-1 text-sm font-semibold text-brand-900">
                                {field.value}
                              </p>
                            </div>
                          ))}
                        </div>

                        <div className="mt-4 flex gap-2">
                          <button className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-brand-800 px-4 text-sm font-semibold text-white transition hover:bg-brand-900">
                            <Save className="h-4 w-4" />
                            Apply
                          </button>
                          <button className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-sm font-semibold text-brand-800 transition hover:bg-brand-100">
                            <Download className="h-4 w-4" />
                            Export
                          </button>
                        </div>
                      </div>
                    )}

                    {msg.kind === "impact" && msg.data && (
                      <div className="max-w-md rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100">
                            <Calculator className="h-4 w-4 text-brand-800" />
                          </div>
                          <h4 className="text-sm font-semibold text-brand-900">
                            Impact Summary
                          </h4>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-[11px] text-brand-700">Employees Affected</p>
                            <p className="mt-1 text-xl font-bold text-brand-900">
                              {msg.data.employeesAffected}
                            </p>
                          </div>
                          <div>
                            <p className="text-[11px] text-brand-700">Annual Volume</p>
                            <p className="mt-1 text-xl font-bold text-brand-900">
                              {msg.data.annualVolume}
                            </p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-[11px] text-brand-700">Estimated Cost</p>
                            <p className="mt-1 text-lg font-semibold text-brand-900">
                              {msg.data.estimatedCost}
                            </p>
                          </div>
                        </div>

                        <button className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-sm font-semibold text-brand-800 transition hover:bg-brand-100">
                          <FlaskConical className="h-4 w-4" />
                          Create Simulation Scenario
                        </button>
                      </div>
                    )}

                    {msg.kind === "compliance" && msg.data?.items && (
                      <div className="max-w-md space-y-3">
                        {msg.data.items.map((item: any, index: number) => (
                          <div
                            key={`${msg.id}-compliance-${index}`}
                            className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                          >
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5">
                                {item.tone === "success" ? (
                                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                ) : (
                                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-brand-900">
                                  {item.title}
                                </p>
                                <p className="mt-1 text-sm leading-6 text-brand-700">
                                  {item.detail}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {msg.kind === "tests" && msg.data?.tests && (
                      <div className="max-w-md space-y-2">
                        {msg.data.tests.map((test: string, index: number) => (
                          <div
                            key={`${msg.id}-test-${index}`}
                            className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand-100 text-[11px] font-semibold text-brand-900">
                                {index + 1}
                              </div>
                              <p className="text-sm text-brand-900">{test}</p>
                            </div>
                          </div>
                        ))}

                        <button className="mt-2 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-brand-800 px-4 text-sm font-semibold text-white transition hover:bg-brand-900">
                          <BarChart3 className="h-4 w-4" />
                          Run All Tests in Simulator
                        </button>
                      </div>
                    )}
                  </div>

                  {msg.type === "user" && (
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
              <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleSend(prompt)}
                    className="whitespace-nowrap rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-brand-800 transition hover:bg-brand-100"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              <div className="relative">
                <Zap className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-700" />
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend(input)}
                  placeholder="Ask Copilot to generate, analyze, or audit a policy..."
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

              <p className="mt-3 inline-flex items-center gap-2 text-[11px] text-brand-700">
                <ShieldCheck className="h-4 w-4 text-brand-800" />
                AI suggestions are logged for compliance audit trail.
              </p>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}