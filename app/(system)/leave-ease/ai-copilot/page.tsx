"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Cpu,
  Send,
  Bot,
  User,
  Zap,
  ShieldCheck,
  BarChart3,
  Settings2,
  CheckCircle2,
  Sparkles,
  Target,
  History,
  Clock,
  Layers,
  TrendingUp,
} from "lucide-react";

interface PolicyMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  type?: "text" | "policy_draft" | "suggestion" | "benchmark";
  data?: any;
}

const SUGGESTIONS = [
  "Create a factory attendance policy",
  "What grace period is standard?",
  "How to handle frequent lates?",
  "Optimize my current policy",
];

export default function AIPolicyCopilot() {
  const [messages, setMessages] = useState<PolicyMessage[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Hello! I'm your AI Policy Copilot. I can help you design high-performance attendance policies, optimize existing ones, or benchmark against industry standards. How can I assist today?",
      type: "text",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: PolicyMessage = {
      id: Date.now().toString(),
      role: "user",
      content: text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      let aiMsg: PolicyMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "",
        type: "text",
      };

      const query = text.toLowerCase();

      if (query.includes("factory")) {
        aiMsg.content =
          "Based on industrial standards for multi-shift factory environments, I've drafted a balanced policy focusing on strict punctuality and safety compliance:";
        aiMsg.type = "policy_draft";
        aiMsg.data = {
          name: "Factory Ops - Performance V1",
          thresholds: "9h Present / 5h Half Day",
          grace: "5 Minutes (Strict)",
          penalty: "Proportional Salary Deduct",
          impact: "Predicted 12% reduction in early exits.",
        };
      } else if (query.includes("standard") || query.includes("grace")) {
        aiMsg.content =
          "For IT and Service sectors, a 15-minute grace period is standard. However, I recommend a cumulative monthly grace model to discourage repetitive micro-tardiness.";
        aiMsg.type = "benchmark";
        aiMsg.data = {
          industry: "92% of Tech Orgs",
          metric: "15m Daily Grace",
          recommendation:
            'Enable "Quota based grace" (3 uses/month) instead of unlimited daily grace.',
        };
      } else if (query.includes("optimize") || query.includes("missing")) {
        aiMsg.content =
          "I noticed 24% of your current Engineering regularizations are for missing out punches on Fridays.";
        aiMsg.type = "suggestion";
        aiMsg.data = {
          issue: "High Friday Regularizations",
          rootCause: "Shift ends at 6:30 PM (Special Jummah timing)",
          fix: "Enable Auto-Out at 6:30 PM for employees with an active In punch on Fridays.",
          benefit: "Reduces manual HR workload by ~40%.",
        };
      } else {
        aiMsg.content =
          "I'm analyzing your request. I can generate complete policy JSONs or provide data-backed suggestions. Try asking about factory policies or industry benchmarks.";
      }

      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1200);
  };

  return (
    <div className="flex h-[calc(100vh-120px)] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-brand-800 text-white">
            <Cpu className="h-5 w-5" />
            <div className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-violet-500">
              <Sparkles className="h-2 w-2 text-white" />
            </div>
          </div>

          <div>
            <h2 className="text-lg font-bold text-brand-900">Policy Copilot</h2>
            <div className="mt-1 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-violet-500" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">
                Logic Generation Engine
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="rounded-lg border border-gray-200 bg-white p-2 text-brand-800 transition hover:bg-brand-100">
            <History className="h-4 w-4" />
          </button>
          <button className="rounded-lg border border-gray-200 bg-white p-2 text-brand-800 transition hover:bg-brand-100">
            <Settings2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Chat area */}
      <div
        ref={scrollRef}
        className="flex-1 space-y-6 overflow-y-auto bg-gray-50/40 px-6 py-6"
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`flex max-w-[85%] gap-3 ${
                msg.role === "user" ? "flex-row-reverse" : ""
              }`}
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  msg.role === "user"
                    ? "bg-brand-100 text-brand-900"
                    : "bg-brand-800 text-white"
                }`}
              >
                {msg.role === "user" ? (
                  <User className="h-5 w-5" />
                ) : (
                  <Bot className="h-5 w-5" />
                )}
              </div>

              <div className="space-y-3">
                <div
                  className={`rounded-2xl border px-4 py-3 shadow-sm ${
                    msg.role === "user"
                      ? "border-brand-800 bg-brand-800 text-white"
                      : "border-gray-200 bg-white text-brand-900"
                  }`}
                >
                  <p className="text-sm leading-6">{msg.content}</p>
                </div>

                {msg.type === "policy_draft" && (
                  <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="mb-5 flex items-center gap-3">
                      <div className="rounded-lg bg-orange-50 p-2 text-orange-600">
                        <Layers className="h-4 w-4" />
                      </div>
                      <h4 className="text-sm font-semibold uppercase tracking-wider text-brand-900">
                        {msg.data.name}
                      </h4>
                    </div>

                    <div className="space-y-3">
                      {[
                        {
                          label: "Thresholds",
                          val: msg.data.thresholds,
                          icon: <Target className="h-3.5 w-3.5" />,
                        },
                        {
                          label: "Grace Period",
                          val: msg.data.grace,
                          icon: <Clock className="h-3.5 w-3.5" />,
                        },
                        {
                          label: "Deduction Rule",
                          val: msg.data.penalty,
                          icon: <ShieldCheck className="h-3.5 w-3.5" />,
                        },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3"
                        >
                          <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-brand-700">
                            {item.icon}
                            {item.label}
                          </span>
                          <span className="text-[11px] font-semibold text-brand-900">
                            {item.val}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-5 rounded-lg border border-emerald-100 bg-emerald-50 p-4">
                      <div className="flex items-start gap-2">
                        <Zap className="mt-0.5 h-4 w-4 text-emerald-600" />
                        <p className="text-sm text-emerald-700">{msg.data.impact}</p>
                      </div>
                    </div>

                    <button className="mt-5 w-full rounded-lg bg-brand-800 px-4 py-3 text-sm font-medium text-white transition hover:bg-brand-900">
                      Apply to Policy Builder
                    </button>
                  </div>
                )}

                {msg.type === "suggestion" && (
                  <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-brand-900 p-5 text-white shadow-sm">
                    <div className="mb-4 flex items-center gap-2 text-brand-100">
                      <Sparkles className="h-4 w-4" />
                      <h4 className="text-xs font-semibold uppercase tracking-wider">
                        Efficiency Suggestion
                      </h4>
                    </div>

                    <h5 className="text-sm font-semibold">{msg.data.issue}</h5>
                    <p className="mt-2 text-sm text-brand-100 italic">
                      Root: {msg.data.rootCause}
                    </p>

                    <div className="mt-4 rounded-lg border border-white/10 bg-white/5 p-4">
                      <p className="text-sm leading-6 text-white">{msg.data.fix}</p>
                      <div className="mt-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-emerald-300">
                        <TrendingUp className="h-3.5 w-3.5" />
                        {msg.data.benefit}
                      </div>
                    </div>

                    <button className="mt-5 w-full rounded-lg bg-white px-4 py-3 text-sm font-medium text-brand-900 transition hover:bg-gray-100">
                      Update Shift Rule
                    </button>
                  </div>
                )}

                {msg.type === "benchmark" && (
                  <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="mb-5 flex items-center gap-3">
                      <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
                        <BarChart3 className="h-4 w-4" />
                      </div>
                      <h4 className="text-sm font-semibold uppercase tracking-wider text-brand-900">
                        Industry Benchmark
                      </h4>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">
                          Sector
                        </span>
                        <span className="text-sm font-semibold text-brand-900">
                          {msg.data.industry}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">
                          Standard
                        </span>
                        <span className="text-sm font-semibold text-brand-900">
                          {msg.data.metric}
                        </span>
                      </div>

                      <div className="border-t border-gray-200 pt-4">
                        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-indigo-600">
                          Recommendation
                        </p>
                        <p className="border-l-2 border-indigo-200 pl-4 text-sm leading-6 text-brand-700">
                          {msg.data.recommendation}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="flex gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-800 text-white">
                <Bot className="h-5 w-5" />
              </div>
              <div className="flex items-center gap-1 rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
                <div className="h-1.5 w-1.5 rounded-full bg-gray-300" />
                <div className="h-1.5 w-1.5 rounded-full bg-gray-300" />
                <div className="h-1.5 w-1.5 rounded-full bg-gray-300" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick suggestions */}
      <div className="shrink-0 border-t border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center gap-3 overflow-x-auto">
          <Sparkles className="h-4 w-4 shrink-0 text-violet-500" />
          <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wider text-brand-700">
            I can help you:
          </span>

          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => handleSend(suggestion)}
              className="whitespace-nowrap rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-brand-800 shadow-sm transition hover:bg-brand-100"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      {/* Input bar */}
      <div className="shrink-0 border-t border-gray-200 bg-white px-6 py-5">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(input);
          }}
          className="relative"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Copilot to draft a policy or audit your current logic..."
            className="h-14 w-full rounded-2xl border border-gray-200 bg-white pl-5 pr-16 text-sm text-brand-900 outline-none transition focus:border-brand-800"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl bg-brand-800 text-white transition hover:bg-brand-900 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>

        <div className="mt-4 flex items-center justify-center gap-4">
          <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-brand-700">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            Compliance Verified
          </div>
          <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-brand-700">
            <History className="h-3.5 w-3.5 text-blue-600" />
            Change Logged
          </div>
        </div>
      </div>
    </div>
  );
}