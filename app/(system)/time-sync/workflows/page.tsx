"use client";

import React, { useState, useCallback } from "react";
import {
  GitMerge, Plus, Search, ChevronRight, CheckCircle2, Clock, History,
  ShieldCheck, ArrowRight, Eye, Edit3, Copy, Archive, Zap, Info, X,
  Save, Trash2, Settings2, Users, Bot, Layers, Filter, MoreHorizontal,
  Workflow, AlertCircle, Sparkles,
  ChevronLeft, Check, ArrowLeftRight, Calendar , Pencil
} from "lucide-react";

/* ══════════════════════════════════════════════════════════════
   TYPES (unchanged)
══════════════════════════════════════════════════════════════ */
type WorkflowEntity = "Regularization" | "OT Request" | "Shift Swap" | "Manual Punch" | "Roster Publish" | "Retro Correction";
type StepType = "APPROVAL" | "REVIEW" | "AUTO_APPROVE" | "CONDITION";
type WorkflowStatus = "PUBLISHED" | "DRAFT" | "ARCHIVED";

interface WorkflowStep {
  id: string; type: StepType; name: string; approver: string;
  slaHours: number; conditions?: string;
}
interface Workflow {
  id: string; name: string; entity: WorkflowEntity; steps: WorkflowStep[];
  version: string; status: WorkflowStatus; updatedAt: string; avgTime?: string;
}
interface Template {
  id: string; name: string; description: string; entity: WorkflowEntity;
  steps: WorkflowStep[]; accent: string; accentDim: string; icon: React.ReactNode; tag: string;
}

/* ══════════════════════════════════════════════════════════════
   STATIC DATA (unchanged)
══════════════════════════════════════════════════════════════ */
const ENTITY_META: Record<WorkflowEntity, { icon: React.ReactNode; color: string; bg: string; border: string }> = {
  "Regularization":  { icon: <History size={13}/>,        color: "text-violet-600",  bg: "bg-violet-50",  border: "border-violet-100" },
  "OT Request":      { icon: <Clock size={13}/>,           color: "text-amber-600",   bg: "bg-amber-50",   border: "border-amber-100"  },
  "Shift Swap":      { icon: <ArrowLeftRight size={13}/>,  color: "text-sky-600",     bg: "bg-sky-50",     border: "border-sky-100"    },
  "Manual Punch":    { icon: <Zap size={13}/>,             color: "text-rose-600",    bg: "bg-rose-50",    border: "border-rose-100"   },
  "Roster Publish":  { icon: <Calendar size={13}/>,    color: "text-teal-600",    bg: "bg-teal-50",    border: "border-teal-100"   },
  "Retro Correction":{ icon: <ShieldCheck size={13}/>,     color: "text-indigo-600",  bg: "bg-indigo-50",  border: "border-indigo-100" },
};
const STATUS_META: Record<WorkflowStatus, { label: string; dot: string; badge: string; text: string }> = {
  PUBLISHED: { label: "Published", dot: "bg-emerald-400", badge: "bg-emerald-50 border-emerald-100", text: "text-emerald-700" },
  DRAFT:     { label: "Draft",     dot: "bg-amber-400",   badge: "bg-amber-50 border-amber-100",     text: "text-amber-700"   },
  ARCHIVED:  { label: "Archived",  dot: "bg-slate-300",   badge: "bg-slate-50 border-slate-100",     text: "text-slate-500"   },
};

const TEMPLATES: Template[] = [
  { id:"t1", name:"Single-Level Approval", tag:"Simple",     description:"One manager sign-off. Fast and lightweight for routine corrections.",                           entity:"Regularization",   accent:"#6366F1", accentDim:"rgba(99,102,241,0.12)",   icon:<CheckCircle2 size={20}/>,
    steps:[{id:"1",type:"APPROVAL",name:"Manager Review",approver:"Line Manager",slaHours:24}] },
  { id:"t2", name:"Standard OT Auth",       tag:"Popular",    description:"Two-tier approval with budget gating. The most-used pattern across teams.",                    entity:"OT Request",       accent:"#F59E0B", accentDim:"rgba(245,158,11,0.12)",   icon:<Clock size={20}/>,
    steps:[{id:"1",type:"APPROVAL",name:"Manager Review",approver:"Line Manager",slaHours:24},{id:"2",type:"APPROVAL",name:"Budget Sign-off",approver:"Dept Head",slaHours:48}] },
  { id:"t3", name:"Conditional Branch",     tag:"Smart",      description:"AI threshold check auto-routes to HR only when hours exceed policy limits.",                   entity:"OT Request",       accent:"#10B981", accentDim:"rgba(16,185,129,0.12)",   icon:<Zap size={20}/>,
    steps:[{id:"1",type:"APPROVAL",name:"Manager Review",approver:"Line Manager",slaHours:24},{id:"2",type:"CONDITION",name:"Threshold Check",approver:"System AI",slaHours:0,conditions:"IF hours > 4.0 THEN require HR step"},{id:"3",type:"APPROVAL",name:"HR Authorization",approver:"HR Manager",slaHours:48}] },
  { id:"t4", name:"Retro Pay Review",        tag:"Compliance", description:"Full audit trail — Compliance → Finance → Director for pay-impacting changes.",               entity:"Retro Correction",  accent:"#8B5CF6", accentDim:"rgba(139,92,246,0.12)",   icon:<ShieldCheck size={20}/>,
    steps:[{id:"1",type:"REVIEW",name:"Compliance Audit",approver:"Compliance Lead",slaHours:48},{id:"2",type:"APPROVAL",name:"Finance Review",approver:"Payroll Mgr",slaHours:48},{id:"3",type:"APPROVAL",name:"Director Approval",approver:"Finance Director",slaHours:24}] },
  { id:"t5", name:"Shift Swap Flow",         tag:"Bilateral",  description:"Employee acceptance first, then manager confirms. Symmetric bilateral consent.",              entity:"Shift Swap",        accent:"#0EA5E9", accentDim:"rgba(14,165,233,0.12)",   icon:<ArrowLeftRight size={20}/>,
    steps:[{id:"1",type:"REVIEW",name:"Partner Consent",approver:"Target Employee",slaHours:12},{id:"2",type:"APPROVAL",name:"Manager Review",approver:"Line Manager",slaHours:24}] },
  { id:"t6", name:"Blank Canvas",            tag:"Custom",     description:"Start from scratch and build exactly what you need, step by step.",                           entity:"OT Request",        accent:"#64748B", accentDim:"rgba(100,116,139,0.1)",   icon:<Pencil size={20}/>,
    steps:[] },
];

const MOCK_WORKFLOWS: Workflow[] = [
  { id:"WF-001", name:"Standard OT Approval",      entity:"OT Request",       steps:[{id:"1",type:"APPROVAL",name:"Manager Review",approver:"Line Manager",slaHours:24},{id:"2",type:"APPROVAL",name:"Budget Check",approver:"Dept Head",slaHours:48}],                                                                                                           version:"v2.4", status:"PUBLISHED", updatedAt:"Jan 10, 2025", avgTime:"18.2h" },
  { id:"WF-002", name:"Simple Correction",          entity:"Regularization",   steps:[{id:"1",type:"APPROVAL",name:"Manager Review",approver:"Line Manager",slaHours:72}],                                                                                                                                                                                         version:"v1.0", status:"PUBLISHED", updatedAt:"Dec 15, 2024", avgTime:"6.1h"  },
  { id:"WF-003", name:"Critical Field Swap",        entity:"Shift Swap",       steps:[{id:"1",type:"REVIEW",name:"Partner Acceptance",approver:"Target Employee",slaHours:12},{id:"2",type:"APPROVAL",name:"Manager Review",approver:"Line Manager",slaHours:24}],                                                                                                 version:"v3.1", status:"PUBLISHED", updatedAt:"Jan 02, 2025", avgTime:"14.7h" },
  { id:"WF-004", name:"Admin Manual Override",      entity:"Manual Punch",     steps:[{id:"1",type:"APPROVAL",name:"HR Audit",approver:"HR Manager",slaHours:4}],                                                                                                                                                                                                  version:"v1.2", status:"PUBLISHED", updatedAt:"Jan 12, 2025", avgTime:"2.4h"  },
  { id:"WF-005", name:"GOP-Level Roster Audit",     entity:"Roster Publish",   steps:[{id:"1",type:"REVIEW",name:"Coverage Verification",approver:"Ops Director",slaHours:24},{id:"2",type:"APPROVAL",name:"Final Release",approver:"HR VP",slaHours:24}],                                                                                                        version:"v4.0", status:"DRAFT",     updatedAt:"Today",        avgTime:"—"     },
  { id:"WF-006", name:"Retroactive Pay Impact",     entity:"Retro Correction", steps:[{id:"1",type:"REVIEW",name:"Audit Review",approver:"Compliance Lead",slaHours:48},{id:"2",type:"CONDITION",name:"Threshold Check",approver:"System AI",slaHours:0},{id:"3",type:"APPROVAL",name:"Finance Approval",approver:"Finance Director",slaHours:24}],               version:"v2.1", status:"PUBLISHED", updatedAt:"Nov 20, 2024", avgTime:"31.8h" },
  { id:"WF-007", name:"Seasonal Temp Roster",       entity:"Roster Publish",   steps:[{id:"1",type:"APPROVAL",name:"Manager Review",approver:"Floor Mgr",slaHours:24}],                                                                                                                                                                                            version:"v1.0", status:"ARCHIVED",  updatedAt:"Oct 12, 2024", avgTime:"11.0h" },
  { id:"WF-008", name:"Multi-Stage Geo Correction", entity:"Regularization",   steps:[{id:"1",type:"REVIEW",name:"Verification",approver:"Site Lead",slaHours:24},{id:"2",type:"APPROVAL",name:"HR Authorization",approver:"HR Partner",slaHours:24}],                                                                                                             version:"v2.2", status:"PUBLISHED", updatedAt:"Jan 05, 2025", avgTime:"19.3h" },
];

/* ══════════════════════════════════════════════════════════════
   HELPER COMPONENTS (refactored to use Tailwind)
══════════════════════════════════════════════════════════════ */


// PencilIcon
const PencilIcon: React.FC<{ size?: number; className?: string }> = ({ size = 14, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>
  </svg>
);

// ChainPreview
const ChainPreview: React.FC<{ steps: WorkflowStep[]; accent: string }> = ({ steps, accent }) => {
  if (!steps.length) return (
    <div className="flex items-center gap-2 mt-3">
      <div className="w-5 h-5 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center">
        <Plus size={9} className="text-gray-400"/>
      </div>
      <span className="text-[10px] text-gray-400 font-medium">Build from scratch</span>
    </div>
  );
  return (
    <div className="flex items-center gap-1.5 mt-3 flex-wrap">
      <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: accent }}>
        <Zap size={9} className="text-white"/>
      </div>
      {steps.map((s, i) => (
        <React.Fragment key={s.id}>
          <div className="h-px w-3" style={{ background: `${accent}55` }}/>
          <div className="px-2 py-0.5 rounded-md text-[9px] font-bold border" style={{ borderColor:`${accent}40`, background:`${accent}18`, color:accent }}>
            {s.type==="CONDITION" ? "?" : s.type==="AUTO_APPROVE" ? "✓" : i+1}
          </div>
        </React.Fragment>
      ))}
      <div className="h-px w-3" style={{ background: `${accent}55` }}/>
      <div className="w-5 h-5 rounded-full flex items-center justify-center bg-emerald-500/80">
        <Check size={9} className="text-white"/>
      </div>
    </div>
  );
};

// StepProgress (Tailwind only)
const StepProgress: React.FC<{ step: number }> = ({ step }) => (
  <div className="flex items-center gap-3">
    {["Template","Configure","Build"].map((label, i) => {
      const active = i === step, done = i < step;
      return (
        <React.Fragment key={i}>
          <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-300 ${
              done ? "bg-emerald-500 text-white" : active ? "bg-white text-gray-900" : "bg-gray-200 text-gray-400"
            }`}>
              {done ? <Check size={11}/> : i+1}
            </div>
            <span className={`text-[11px] font-bold transition-colors duration-300 ${
              active ? "text-white" : done ? "text-emerald-400" : "text-gray-400"
            }`}>{label}</span>
          </div>
          {i < 2 && <div className="flex-1 h-px max-w-10 bg-gray-300"/>}
        </React.Fragment>
      );
    })}
  </div>
);

// TemplateGallery (Tailwind + dynamic background/border for hover)
const TemplateGallery: React.FC<{ onSelect: (t: Template) => void }> = ({ onSelect }) => {
  const [hovered, setHovered] = useState<string|null>(null);
  return (
    <div className="flex-1 overflow-y-auto px-8 py-6">
      <div className="mb-6">
        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-2">Step 1 · Choose a starting point</p>
        <h2 className="text-2xl font-bold text-gray-800 tracking-tight">What kind of workflow are you building?</h2>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {TEMPLATES.map((t) => (
          <button key={t.id}
            onMouseEnter={() => setHovered(t.id)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => onSelect(t)}
            className="relative text-left rounded-xl p-4 border transition-all duration-200 overflow-hidden group bg-white hover:shadow-lg"
            style={{
              borderColor: hovered===t.id ? t.accent : "#e5e7eb",
              transform: hovered===t.id ? "translateY(-2px)" : "none",
              boxShadow: hovered===t.id ? `0 8px 20px ${t.accent}22` : "none",
            }}>
            <div className="relative">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background:`${t.accent}20`, color:t.accent }}>
                  {t.icon}
                </div>
                <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ background:`${t.accent}20`, color:t.accent }}>{t.tag}</span>
              </div>
              <h3 className="text-sm font-bold text-gray-800 leading-tight">{t.name}</h3>
              <p className="mt-1 text-[11px] text-gray-500 font-medium leading-relaxed">{t.description}</p>
              <ChainPreview steps={t.steps} accent={t.accent}/>
              <p className="mt-2.5 text-[9px] font-bold uppercase tracking-wider text-gray-400">
                {t.steps.length > 0 ? `${t.steps.length} step${t.steps.length!==1?"s":""} · ` : "Custom · "}{t.entity}
              </p>
            </div>
            <div className="absolute bottom-3 right-3 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200"
              style={{ background: hovered===t.id ? t.accent : "transparent", opacity: hovered===t.id?1:0, transform: hovered===t.id?"scale(1)":"scale(0.5)" }}>
              <ArrowRight size={12} className="text-white"/>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

// ConfigureStep (Tailwind + dynamic border color)
const ConfigureStep: React.FC<{
  template: Template; name: string; setName:(v:string)=>void;
  entity: WorkflowEntity; setEntity:(v:WorkflowEntity)=>void;
  description: string; setDescription:(v:string)=>void;
}> = ({ template, name, setName, entity, setEntity, description, setDescription }) => (
  <div className="flex-1 overflow-y-auto px-8 py-6">
    <div className="mb-6">
      <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-2">Step 2 · Basic information</p>
      <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Name your workflow</h2>
    </div>
    <div className="max-w-xl space-y-5">
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold" style={{ background:`${template.accent}18`, color:template.accent, border:`1px solid ${template.accent}30` }}>
        {template.icon} {template.name} template
      </div>
      <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Workflow Name *</label>
        <input autoFocus value={name} onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Critical OT Authorization"
          className="w-full rounded-xl border px-4 py-3 text-base font-bold text-gray-800 outline-none transition placeholder:text-gray-300 bg-gray-50"
          style={{ borderColor: name ? `${template.accent}60` : "#e5e7eb", boxShadow: name ? `0 0 0 3px ${template.accent}15` : "none" }}
        />
      </div>
      <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Entity Type *</label>
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(ENTITY_META) as WorkflowEntity[]).map((e) => {
            const meta = ENTITY_META[e]; const active = entity===e;
            return (
              <button key={e} onClick={() => setEntity(e)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border text-left transition-all duration-150 bg-white"
                style={{ borderColor: active ? `${template.accent}50` : "#e5e7eb", boxShadow: active ? `0 0 0 1px ${template.accent}30` : "none" }}>
                <span style={{ color: active ? template.accent : "#9ca3af" }}>{meta.icon}</span>
                <span className={`text-[11px] font-bold ${active ? "text-gray-800" : "text-gray-400"}`}>{e}</span>
                {active && <div className="ml-auto w-4 h-4 rounded-full flex items-center justify-center" style={{ background: template.accent }}><Check size={9} className="text-white"/></div>}
              </button>
            );
          })}
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Description <span className="text-gray-300 normal-case tracking-normal font-medium">· optional</span></label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
          placeholder="Describe when this workflow applies and who it affects…"
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 outline-none transition placeholder:text-gray-300 resize-none bg-gray-50"
        />
      </div>
    </div>
  </div>
);

// BuilderCanvas (Tailwind + dynamic colors)
const BuilderCanvas: React.FC<{
  steps: WorkflowStep[]; setSteps:(s:WorkflowStep[])=>void;
  activeStepId: string|null; setActiveStepId:(id:string|null)=>void;
  accentColor: string;
}> = ({ steps, setSteps, activeStepId, setActiveStepId, accentColor }) => {
  const addStep = () => {
    const ns: WorkflowStep = { id:Date.now().toString(), type:"APPROVAL", name:`Step ${steps.length+1}`, approver:"Line Manager", slaHours:24 };
    setSteps([...steps, ns]); setActiveStepId(ns.id);
  };
  const TYPE_COLOR: Record<StepType,string> = { APPROVAL:"#818CF8", REVIEW:"#38BDF8", AUTO_APPROVE:"#34D399", CONDITION:"#FBBF24" };

  return (
    <div className="flex-1 overflow-auto p-8 bg-gray-50" style={{ backgroundImage:"radial-gradient(rgba(0,0,0,0.03) 1px, transparent 1px)", backgroundSize:"24px 24px" }}>
      <div className="flex flex-col items-center min-w-max mx-auto">
        {/* trigger node */}
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-full border-2 flex items-center justify-center shadow-md" style={{ borderColor:accentColor, background:`${accentColor}18`, boxShadow:`0 0 16px ${accentColor}35` }}>
            <Zap size={18} style={{ color:accentColor }}/>
          </div>
          <span className="mt-1.5 text-[9px] font-bold uppercase tracking-wider text-gray-400">Trigger</span>
          <div className="mt-2 h-7 w-px bg-gray-200"/>
        </div>

        {/* steps */}
        {steps.map((step, idx) => {
          const active = activeStepId===step.id;
          const tc = TYPE_COLOR[step.type];
          return (
            <div key={step.id} className="flex flex-col items-center">
              <div onClick={() => setActiveStepId(step.id)}
                className="relative w-64 rounded-xl p-4 cursor-pointer transition-all duration-200 bg-white shadow-sm"
                style={{
                  border: `2px solid ${active ? accentColor : "#e5e7eb"}`,
                  boxShadow: active ? `0 0 0 4px ${accentColor}18, 0 8px 20px rgba(0,0,0,0.1)` : "0 1px 2px rgba(0,0,0,0.05)",
                  transform: active ? "scale(1.02)" : "scale(1)",
                }}>
                <div className="absolute -left-3 -top-3 w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-md"
                  style={{ background: active ? accentColor : "#9ca3af" }}>{idx+1}</div>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider" style={{ background:`${tc}20`, color:tc, border:`1px solid ${tc}30` }}>{step.type}</span>
                    <h4 className="mt-2 text-sm font-bold text-gray-800 truncate">{step.name}</h4>
                    <div className="mt-1 flex items-center gap-1 text-[10px] text-gray-500 font-medium">
                      {step.type==="CONDITION"?<Bot size={10}/>:<Users size={10}/>}
                      <span>{step.approver}</span>
                    </div>
                  </div>
                  {step.slaHours>0&&(
                    <div className="text-right shrink-0">
                      <span className="font-mono text-xs font-bold tabular-nums" style={{color:accentColor}}>{step.slaHours}h</span>
                      <p className="text-[8px] text-gray-400 font-bold uppercase">SLA</p>
                    </div>
                  )}
                </div>
              </div>
              {idx<steps.length-1&&(
                <div className="flex flex-col items-center">
                  <div className="h-5 w-px bg-gray-200"/>
                  <div className="w-5 h-5 rounded-full flex items-center justify-center bg-gray-100 border border-gray-200">
                    <ArrowRight size={9} className="text-gray-400"/>
                  </div>
                  <div className="h-4 w-px bg-gray-200"/>
                </div>
              )}
            </div>
          );
        })}

        {/* add button */}
        <div className="mt-4 flex flex-col items-center">
          <button onClick={addStep}
            className="group w-10 h-10 rounded-xl border-2 border-dashed flex items-center justify-center transition-all duration-200 bg-white border-gray-300 hover:border-gray-400">
            <Plus size={16} className="text-gray-400 group-hover:text-gray-600"/>
          </button>
          {/* end node */}
          <div className="mt-5 flex flex-col items-center">
            <div className="h-5 w-px bg-gray-200"/>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-md bg-gradient-to-br from-emerald-600 to-emerald-500">
              <ShieldCheck size={22} className="text-white"/>
            </div>
            <span className="mt-2 text-[9px] font-bold uppercase tracking-wider text-emerald-600">Approved</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// StepConfig (Tailwind + dynamic colors)
const StepConfig: React.FC<{
  step: WorkflowStep|undefined; onChange:(p:Partial<WorkflowStep>)=>void;
  onRemove:()=>void; accentColor:string;
}> = ({ step, onChange, onRemove, accentColor }) => {
  if (!step) return (
    <div className="w-72 shrink-0 border-l border-gray-200 flex flex-col items-center justify-center p-8 text-center bg-gray-50">
      <Layers size={40} className="mb-3 text-gray-300"/>
      <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Select a Step</p>
    </div>
  );
  return (
    <div className="w-72 shrink-0 border-l border-gray-200 flex flex-col bg-white">
      <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
        <p className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-wider text-gray-500">
          <Settings2 size={11}/> Configure Step
        </p>
      </div>
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        <div className="space-y-1.5">
          <label className="text-[9px] font-bold uppercase tracking-wider text-gray-500">Step Name</label>
          <input value={step.name} onChange={(e)=>onChange({name:e.target.value})}
            className="w-full rounded-lg px-3 py-2 text-sm font-bold text-gray-800 outline-none bg-gray-50 border border-gray-200 focus:border-indigo-300"/>
        </div>
        <div className="space-y-1.5">
          <label className="text-[9px] font-bold uppercase tracking-wider text-gray-500">Step Type</label>
          <div className="grid grid-cols-2 gap-1.5">
            {(["APPROVAL","REVIEW","AUTO_APPROVE","CONDITION"] as StepType[]).map((t)=>{
              const active=step.type===t;
              return (
                <button key={t} onClick={()=>onChange({type:t})}
                  className={`py-2 px-2 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all ${
                    active ? "bg-indigo-50 text-indigo-700 border-indigo-200" : "bg-gray-50 text-gray-400 border-gray-200"
                  } border`}>
                  {t.replace("_"," ")}
                </button>
              );
            })}
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-[9px] font-bold uppercase tracking-wider text-gray-500">Approver Role</label>
          <select value={step.approver} onChange={(e)=>onChange({approver:e.target.value})}
            className="w-full rounded-lg px-3 py-2 text-xs font-bold text-gray-800 outline-none bg-gray-50 border border-gray-200">
            {["Line Manager","Dept Head","HR Manager","Payroll Lead","Ops Director","Finance Director","Custom Role"].map((r)=>(
              <option key={r}>{r}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-[9px] font-bold uppercase tracking-wider text-gray-500">SLA Hours</label>
          <div className="relative">
            <input type="number" value={step.slaHours} onChange={(e)=>onChange({slaHours:Number(e.target.value)})}
              className="w-full rounded-lg px-3 py-2 font-mono font-bold text-gray-800 outline-none bg-gray-50 border border-gray-200"/>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">hrs</span>
          </div>
        </div>
        {step.type==="CONDITION"&&(
          <div className="space-y-1.5">
            <label className="text-[9px] font-bold uppercase tracking-wider text-amber-600">Branch Logic</label>
            <textarea value={step.conditions??""} onChange={(e)=>onChange({conditions:e.target.value})} rows={4}
              className="w-full rounded-lg px-3 py-2 font-mono text-[11px] text-gray-700 outline-none resize-none bg-amber-50 border border-amber-200"
              placeholder="IF hours > 4.0 THEN require HR step…"/>
          </div>
        )}
        <div className="space-y-1.5">
          <label className="text-[9px] font-bold uppercase tracking-wider text-gray-500">Auto-Escalate To</label>
          <select className="w-full rounded-lg px-3 py-2 text-xs font-bold text-gray-800 outline-none bg-gray-50 border border-gray-200">
            {["Line Manager +1","Department Head","HR VP"].map((r)=>(
              <option key={r}>{r}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-[9px] font-bold uppercase tracking-wider text-gray-500">Notifications</label>
          {["In-App Push","Email Alert","SMS on Overdue"].map((n)=>(
            <label key={n} className="flex items-center gap-2.5 cursor-pointer">
              <div className="w-4 h-4 rounded border flex items-center justify-center border-indigo-300 bg-indigo-50">
                <Check size={9} className="text-indigo-600"/>
              </div>
              <span className="text-[11px] font-medium text-gray-600">{n}</span>
            </label>
          ))}
        </div>
      </div>
      <div className="p-4 border-t border-gray-100">
        <button onClick={onRemove}
          className="w-full py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100">
          <Trash2 size={12}/> Remove Step
        </button>
      </div>
    </div>
  );
};

// CreationModal (refactored)
const CreationModal: React.FC<{ onClose:()=>void; onSave:(wf:Workflow)=>void; editWorkflow?:Workflow }> = ({ onClose, onSave, editWorkflow }) => {
  const isEdit = !!editWorkflow;
  const [modalStep, setModalStep] = useState(isEdit ? 2 : 0);
  const [selectedTemplate, setSelectedTemplate] = useState<Template|null>(isEdit ? TEMPLATES[0] : null);
  const [wfName, setWfName] = useState(editWorkflow?.name??"");
  const [entity, setEntity] = useState<WorkflowEntity>(editWorkflow?.entity??"OT Request");
  const [description, setDescription] = useState("");
  const [steps, setSteps] = useState<WorkflowStep[]>(editWorkflow?.steps??[]);
  const [activeStepId, setActiveStepId] = useState<string|null>(editWorkflow?.steps?.[0]?.id??null);

  const accentColor = selectedTemplate?.accent??"#6366F1";
  const activeStep = steps.find((s) => s.id===activeStepId);

  const handleTemplateSelect = (t: Template) => {
    setSelectedTemplate(t);
    setEntity(t.entity);
    if (!wfName) setWfName(t.name);
    const cloned = t.steps.map((s) => ({...s, id:Date.now().toString()+s.id}));
    setSteps(cloned);
    setActiveStepId(cloned[0]?.id??null);
    setModalStep(1);
  };

  const updateActiveStep = useCallback((patch: Partial<WorkflowStep>) => {
    if (!activeStepId) return;
    setSteps((prev) => prev.map((s) => s.id===activeStepId ? {...s,...patch} : s));
  }, [activeStepId]);

  const removeActiveStep = () => {
    const remaining = steps.filter((s) => s.id!==activeStepId);
    setSteps(remaining);
    setActiveStepId(remaining[0]?.id??null);
  };

  const handleSave = (publish=false) => {
    const wf: Workflow = {
      id: editWorkflow?.id??`WF-${String(Date.now()).slice(-3)}`,
      name: wfName||selectedTemplate?.name||"Untitled", entity, steps,
      version: isEdit ? editWorkflow!.version : "v1.0",
      status: publish ? "PUBLISHED" : "DRAFT",
      updatedAt: "Today",
    };
    onSave(wf);
  };

  const canProceed = modalStep===0 ? !!selectedTemplate : modalStep===1 ? wfName.trim().length>0 : steps.length>0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-[1080px] h-[680px] rounded-2xl flex flex-col overflow-hidden shadow-2xl bg-white border border-gray-200">
        {/* ambient glow (optional – keep as inline for dynamic color) */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full pointer-events-none opacity-15" style={{ background:`radial-gradient(circle, ${accentColor}, transparent 65%)` }}/>
        <div className="absolute -bottom-16 -right-16 w-64 h-64 rounded-full pointer-events-none opacity-8" style={{ background:`radial-gradient(circle, ${accentColor}, transparent 70%)` }}/>

        {/* header */}
        <div className="relative flex items-center justify-between px-6 py-4 shrink-0 border-b border-gray-100">
          <StepProgress step={modalStep}/>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition">
            <X size={15}/>
          </button>
        </div>

        {/* body */}
        <div className="relative flex-1 flex overflow-hidden">
          {modalStep===0 && <TemplateGallery onSelect={handleTemplateSelect}/>}
          {modalStep===1 && (
            <ConfigureStep template={selectedTemplate!} name={wfName} setName={setWfName}
              entity={entity} setEntity={setEntity} description={description} setDescription={setDescription}/>
          )}
          {modalStep===2 && (
            <div className="flex flex-1 overflow-hidden">
              <BuilderCanvas steps={steps} setSteps={setSteps} activeStepId={activeStepId} setActiveStepId={setActiveStepId} accentColor={accentColor}/>
              <StepConfig step={activeStep} onChange={updateActiveStep} onRemove={removeActiveStep} accentColor={accentColor}/>
            </div>
          )}
        </div>

        {/* footer */}
        <div className="relative flex items-center justify-between px-6 py-4 shrink-0 border-t border-gray-100 bg-gray-50">
          {modalStep>0 ? (
            <button onClick={()=>setModalStep((s)=>s-1)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition">
              <ChevronLeft size={14}/> Back
            </button>
          ) : <div/>}
          <div className="flex items-center gap-2">
            {modalStep<2 ? (
              <button onClick={()=>setModalStep((s)=>s+1)} disabled={!canProceed}
                className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold text-white transition-all disabled:opacity-50"
                style={{ background: canProceed ? accentColor : "#9ca3af", boxShadow: canProceed ? `0 4px 12px ${accentColor}55` : "none" }}>
                Continue <ArrowRight size={14}/>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button onClick={()=>handleSave(false)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider border border-gray-300 bg-white text-gray-600 hover:bg-gray-50">
                  <Save size={13}/> Save Draft
                </button>
                <button onClick={()=>handleSave(true)} disabled={steps.length===0}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold text-white transition-all shadow-md disabled:opacity-50"
                  style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`, boxShadow: `0 4px 14px ${accentColor}55` }}>
                  <Sparkles size={14}/> Publish Workflow
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// StatCard (Tailwind only)
const StatCard: React.FC<{ label:string; value:string; sub:string; icon:React.ReactNode; accent:string }> = ({ label, value, sub, icon, accent }) => (
  <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
    <div className={`absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-lg ${accent}`}>{icon}</div>
    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{label}</p>
    <p className="mt-2 font-mono text-2xl font-bold text-gray-800 tabular-nums">{value}</p>
    <p className="mt-1 text-[10px] font-semibold text-gray-400">{sub}</p>
  </div>
);

/* ══════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════ */
export default function WorkflowManagerPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<WorkflowStatus|"ALL">("ALL");
  const [workflows, setWorkflows] = useState<Workflow[]>(MOCK_WORKFLOWS);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Workflow|undefined>();

  const filtered = workflows.filter((wf) => {
    const m = wf.name.toLowerCase().includes(search.toLowerCase()) ||
              wf.entity.toLowerCase().includes(search.toLowerCase()) ||
              wf.id.toLowerCase().includes(search.toLowerCase());
    return m && (statusFilter==="ALL"||wf.status===statusFilter);
  });

  const handleSave = (wf: Workflow) => {
    setWorkflows((prev) => {
      const exists = prev.find((w)=>w.id===wf.id);
      return exists ? prev.map((w)=>w.id===wf.id?wf:w) : [wf,...prev];
    });
    setModalOpen(false); setEditTarget(undefined);
  };

  const stats = { total:workflows.length, published:workflows.filter((w)=>w.status==="PUBLISHED").length, drafts:workflows.filter((w)=>w.status==="DRAFT").length };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 font-sans">
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 shrink-0">
          <div>
            <h1 className="text-xl font-bold text-gray-800 tracking-tight">Approval Workflows</h1>
            <p className="mt-0.5 text-[11px] font-medium text-gray-400">TimeSync · multi-stage routing & SLA governance</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-[11px] font-bold text-gray-500 shadow-sm hover:border-gray-300">
              <ShieldCheck size={13} className="text-indigo-500"/> Audit Log
            </button>
            <button onClick={()=>{setEditTarget(undefined);setModalOpen(true);}}
              className="group flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold text-white shadow-md transition-all hover:scale-[1.02] active:scale-95"
              style={{ background:"linear-gradient(135deg,#1C1A3A 0%,#3730A3 100%)", boxShadow:"0 2px 10px rgba(99,102,241,0.3)" }}>
              <div className="w-5 h-5 rounded-lg bg-white/15 flex items-center justify-center"><Plus size={12}/></div>
              New Workflow
              <Sparkles size={13} className="opacity-75"/>
            </button>
          </div>
        </header>

        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-5">
          {/* stats */}
          <div className="grid grid-cols-4 gap-4">
            <StatCard label="Total Workflows" value={String(stats.total)} sub="across all entities" icon={<GitMerge size={15} className="text-indigo-600"/>} accent="bg-indigo-50"/>
            <StatCard label="Published" value={String(stats.published)} sub="actively routing" icon={<CheckCircle2 size={15} className="text-emerald-600"/>} accent="bg-emerald-50"/>
            <StatCard label="Drafts" value={String(stats.drafts)} sub="pending review" icon={<AlertCircle size={15} className="text-amber-600"/>} accent="bg-amber-50"/>
            <StatCard label="Avg. Approval Time" value="14.2h" sub="all entities" icon={<Clock size={15} className="text-sky-600"/>} accent="bg-sky-50"/>
          </div>

          {/* search + filters */}
          <div className="flex items-center gap-3">
            <div className="flex flex-1 items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-2 shadow-sm">
              <Search size={14} className="shrink-0 text-gray-400"/>
              <input type="text" placeholder="Search by name, entity, or ID…" value={search} onChange={(e)=>setSearch(e.target.value)}
                className="flex-1 bg-transparent text-sm font-medium text-gray-700 outline-none placeholder:text-gray-400"/>
              {search&&<button onClick={()=>setSearch("")} className="text-gray-300 hover:text-gray-500"><X size={13}/></button>}
            </div>
            <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
              {(["ALL","PUBLISHED","DRAFT","ARCHIVED"] as const).map((s)=>(
                <button key={s} onClick={()=>setStatusFilter(s)}
                  className={`rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition ${statusFilter===s?"bg-gray-800 text-white shadow":"text-gray-400 hover:text-gray-600"}`}>{s}</button>
              ))}
            </div>
            <button className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-[11px] font-bold text-gray-500 shadow-sm hover:text-gray-700">
              <Filter size={13}/> Filters
            </button>
          </div>

          {/* table */}
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80 text-[9px] font-bold uppercase tracking-wider text-gray-400">
                  <th className="px-5 py-3">Workflow</th><th className="px-4 py-3">Entity</th>
                  <th className="px-4 py-3">Approval Chain</th><th className="px-4 py-3 text-center">Steps</th>
                  <th className="px-4 py-3 text-center">Avg Time</th><th className="px-4 py-3">Version</th>
                  <th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((wf) => {
                  const em=ENTITY_META[wf.entity], sm=STATUS_META[wf.status];
                  return (
                    <tr key={wf.id} className="group transition hover:bg-gray-50/60">
                      <td className="px-5 py-4">
                        <span className="text-sm font-bold text-gray-800 group-hover:text-indigo-600 transition">{wf.name}</span>
                        <div className="mt-0.5 flex items-center gap-1.5">
                          <span className="font-mono text-[9px] font-bold text-gray-300">{wf.id}</span>
                          <span className="text-gray-200">·</span>
                          <span className="text-[9px] font-semibold text-gray-400">{wf.updatedAt}</span>
                        </div>
                       </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[10px] font-bold border ${em.color} ${em.bg} ${em.border}`}>
                          {em.icon}{wf.entity}
                        </span>
                       </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap items-center gap-1">
                          {wf.steps.map((s,i)=>(
                            <React.Fragment key={s.id}>
                              <span title={`${s.approver} · ${s.slaHours}h`} className="rounded-lg border border-gray-100 bg-white px-2 py-0.5 text-[9px] font-bold text-gray-500 shadow-sm">{s.name}</span>
                              {i<wf.steps.length-1&&<ChevronRight size={9} className="text-gray-300"/>}
                            </React.Fragment>
                          ))}
                        </div>
                       </td>
                      <td className="px-4 py-4 text-center"><span className="font-mono inline-flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-50 text-[11px] font-bold text-indigo-600">{wf.steps.length}</span></td>
                      <td className="px-4 py-4 text-center"><span className="font-mono text-xs font-bold text-gray-500">{wf.avgTime??"—"}</span></td>
                      <td className="px-4 py-4"><span className="font-mono text-[10px] font-bold text-gray-400">{wf.version}</span></td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${sm.badge} ${sm.text}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${sm.dot}`}/>{sm.label}
                        </span>
                       </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-0.5 opacity-0 transition-all group-hover:opacity-100">
                          <button title="View" className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"><Eye size={14}/></button>
                          <button title="Edit" onClick={()=>{setEditTarget(wf);setModalOpen(true);}} className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-indigo-50 hover:text-indigo-600"><Edit3 size={14}/></button>
                          <button title="Clone" className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-sky-50 hover:text-sky-600"><Copy size={14}/></button>
                          <div className="mx-1 h-4 w-px bg-gray-100"/>
                          <button title="Archive" className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500"><Archive size={14}/></button>
                          <button className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-300 hover:text-gray-500"><MoreHorizontal size={14}/></button>
                        </div>
                       </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length===0&&(
              <div className="flex flex-col items-center py-12 opacity-40">
                <GitMerge size={40} className="mb-3 text-gray-300"/>
                <p className="text-sm font-bold uppercase tracking-wider text-gray-400">No workflows found</p>
              </div>
            )}
            <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/50 px-5 py-3">
              <div className="flex items-center gap-2 rounded-lg border border-sky-100 bg-sky-50 px-3 py-1.5">
                <Info size={11} className="text-sky-500"/>
                <p className="text-[9px] font-bold text-sky-700">Published workflows must be cloned before editing.</p>
              </div>
              <button className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-indigo-600 hover:underline">
                Global Routing Rules <ChevronRight size={12}/>
              </button>
            </div>
          </div>

          {/* compliance note */}
          <div className="flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="w-8 h-8 shrink-0 rounded-lg bg-indigo-50 flex items-center justify-center"><ShieldCheck size={18} className="text-indigo-600"/></div>
            <div className="flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-700">Workflow Compliance Status</p>
              <p className="mt-0.5 text-[11px] font-medium leading-relaxed text-gray-500">
                All published workflows are audited weekly for <span className="font-bold italic text-indigo-600">looping deadlocks</span> and SLA bottlenecks.
                Global average approval time: <span className="font-mono font-bold text-gray-700">14.2h</span>.
              </p>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 shrink-0">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"/>
              <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-700">All Clear</span>
            </div>
          </div>
        </div>
      </main>

      {modalOpen&&(
        <CreationModal
          onClose={()=>{setModalOpen(false);setEditTarget(undefined);}}
          onSave={handleSave}
          editWorkflow={editTarget}
        />
      )}
    </div>
  );
}