"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast, Toaster } from "sonner";
import {
  ChevronLeft, ChevronRight, Plus, X, Calendar, Users,
  Clock, Briefcase, Star, Sun, Moon, Sunset, MapPin,
  AlertCircle, CheckCircle2, Coffee, GraduationCap,
  Building2, Filter, Search, LayoutGrid, Rows3,
} from "lucide-react";
import {
  format, addMonths, subMonths, startOfMonth, endOfMonth,
  startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay,
  isToday, parseISO, addWeeks, subWeeks, startOfWeek as startOfWeekFn,
  getDay, differenceInCalendarDays,
} from "date-fns";

// ─── TYPES ─────────────────────────────────────────────────────────
type EventType = "leave" | "holiday" | "meeting" | "training" | "shift_swap" | "birthday" | "deadline";
type ViewMode  = "month" | "week";

interface CalEvent {
  id: string;
  title: string;
  date: string;          // YYYY-MM-DD
  endDate?: string;
  type: EventType;
  empId?: string;
  empName?: string;
  empInitials?: string;
  empColor?: string;
  note?: string;
  allDay?: boolean;
  time?: string;
}

interface Employee {
  id: string; name: string; initials: string; color: string; role: string;
}

// ─── BRAND PALETTE ─────────────────────────────────────────────────
const B = {
  navy:   "#322E53",
  dark:   "#322E53",
  sage:   "#49426E",
  rose:   "#F3AB9D",
  gold:   "#EEC293",
  peach:  "#F3AB9D",
  sand:   "#f7c9b9",
  cream:  "#F5E6D0",
  white:  "#FFFFFF",
  gray:   "#9CA3AF",
  lightgray: "#F5F5F5",
};

// ─── EVENT TYPE CONFIG ──────────────────────────────────────────────
const EVENT_CFG: Record<EventType, { label:string; bg:string; text:string; border:string; icon:React.ReactNode; dot:string }> = {
  leave:      { label:"Leave",      bg:"#EFF6FF", text:"#1E40AF", border:"#93C5FD", dot:"#3B82F6", icon:<Briefcase size={11}/> },
  holiday:    { label:"Holiday",    bg:"#F0FDF4", text:"#166534", border:"#86EFAC", dot:"#22C55E", icon:<Star size={11}/> },
  meeting:    { label:"Meeting",    bg:"#FFFBEB", text:"#92400E", border:"#FCD34D", dot:"#F59E0B", icon:<Users size={11}/> },
  training:   { label:"Training",   bg:"#FAF5FF", text:"#6B21A8", border:"#D8B4FE", dot:"#A855F7", icon:<GraduationCap size={11}/> },
  shift_swap: { label:"Shift Swap", bg:"#FFF7ED", text:"#9A3412", border:"#FDBA74", dot:"#F97316", icon:<Clock size={11}/> },
  birthday:   { label:"Birthday",   bg:"#FDF2F8", text:"#9D174D", border:"#F9A8D4", dot:"#EC4899", icon:<Coffee size={11}/> },
  deadline:   { label:"Deadline",   bg:"#FEF2F2", text:"#991B1B", border:"#FCA5A5", dot:"#EF4444", icon:<AlertCircle size={11}/> },
};

// ─── TEAM DATA ──────────────────────────────────────────────────────
const TEAM: Employee[] = [
  { id:"E001", name:"Rafay Ahmed",      initials:"RA", color:B.dark,  role:"Sr. Software Engineer" },
  { id:"E002", name:"Yousaf Khan",      initials:"YK", color:B.sage,  role:"Software Engineer" },
  { id:"E003", name:"Humza Ali",        initials:"HA", color:B.gold,  role:"Frontend Developer" },
  { id:"E004", name:"Shaban Akhtar",    initials:"SA", color:B.rose,  role:"Backend Developer" },
  { id:"E005", name:"Fatima Tariq",     initials:"FT", color:B.peach, role:"QA Engineer" },
  { id:"E006", name:"Ali Raza",         initials:"AR", color:"#6B7280",role:"DevOps Engineer" },
  { id:"E007", name:"Zainab Malik",     initials:"ZM", color:B.dark,  role:"Product Manager" },
  { id:"E008", name:"Bilal Hussain",    initials:"BH", color:B.sage,  role:"Data Engineer" },
  { id:"E009", name:"Ayesha Siddiqui", initials:"AS", color:B.gold,  role:"UX Designer" },
  { id:"E010", name:"Usman Ghani",      initials:"UG", color:B.rose,  role:"Security Engineer" },
];

// ─── CALENDAR EVENTS ───────────────────────────────────────────────
const INITIAL_EVENTS: CalEvent[] = [
  // Holidays
  { id:"H1", title:"Pakistan Day",          date:"2025-03-23", type:"holiday", allDay:true, note:"National holiday — offices closed" },
  { id:"H2", title:"Eid ul-Fitr (Day 1)",   date:"2025-03-30", type:"holiday", allDay:true, note:"Public holiday" },
  { id:"H3", title:"Eid ul-Fitr (Day 2)",   date:"2025-03-31", type:"holiday", allDay:true, note:"Public holiday" },
  { id:"H4", title:"Eid ul-Fitr (Day 3)",   date:"2025-04-01", type:"holiday", allDay:true, note:"Public holiday" },
  { id:"H5", title:"Labour Day",            date:"2025-05-01", type:"holiday", allDay:true, note:"National holiday" },

  // Leaves
  { id:"L1", title:"Fatima Tariq — Medical Leave", date:"2025-03-25", endDate:"2025-03-28", type:"leave", empId:"E005", empName:"Fatima Tariq", empInitials:"FT", empColor:B.peach, note:"Approved medical leave" },
  { id:"L2", title:"Ali Raza — Annual Leave",      date:"2025-03-26", endDate:"2025-03-27", type:"leave", empId:"E006", empName:"Ali Raza",     empInitials:"AR", empColor:"#6B7280", note:"Annual leave" },
  { id:"L3", title:"Humza Ali — Casual Leave",     date:"2025-04-03", type:"leave", empId:"E003", empName:"Humza Ali", empInitials:"HA", empColor:B.gold },
  { id:"L4", title:"Yousaf Khan — Annual Leave",   date:"2025-04-10", endDate:"2025-04-11", type:"leave", empId:"E002", empName:"Yousaf Khan", empInitials:"YK", empColor:B.sage },
  { id:"L5", title:"Kamran Saeed — Sick Leave",    date:"2025-04-14", type:"leave", empId:"E008", empName:"Bilal Hussain", empInitials:"BH", empColor:B.sage },

  // Meetings
  { id:"M1", title:"Q2 Sprint Planning",      date:"2025-03-27", type:"meeting", time:"10:00 AM", note:"All hands — Google Meet" },
  { id:"M2", title:"Product Roadmap Review",  date:"2025-04-02", type:"meeting", time:"02:00 PM", note:"Zainab leading — Conf Room A" },
  { id:"M3", title:"Team Retrospective",      date:"2025-04-07", type:"meeting", time:"11:00 AM", note:"End of sprint retro" },
  { id:"M4", title:"1-on-1: Rafay & Lead",    date:"2025-04-09", type:"meeting", time:"03:00 PM", empId:"E001", empName:"Rafay Ahmed", empInitials:"RA", empColor:B.dark },
  { id:"M5", title:"Security Audit Kickoff",  date:"2025-04-15", type:"meeting", time:"09:00 AM", note:"With Usman Ghani" },
  { id:"M6", title:"Client Demo — Lahore",    date:"2025-04-22", type:"meeting", time:"02:30 PM", note:"On-site client presentation" },

  // Training
  { id:"T1", title:"AWS Certification Training", date:"2025-04-05", endDate:"2025-04-06", type:"training", note:"Shaban + Usman attending" },
  { id:"T2", title:"React 19 Workshop",           date:"2025-04-17", type:"training", time:"10:00 AM", note:"Online — Humza facilitating" },
  { id:"T3", title:"Figma Advanced Course",       date:"2025-04-24", type:"training", empId:"E009", empName:"Ayesha Siddiqui", empInitials:"AS", empColor:B.gold },

  // Shift Swaps
  { id:"SS1", title:"Shift Swap: Shaban ↔ Yousaf", date:"2025-03-28", type:"shift_swap", empId:"E004", empName:"Shaban Akhtar", empInitials:"SA", empColor:B.rose, note:"Night shift covered by Yousaf" },
  { id:"SS2", title:"Shift Swap: Usman ↔ Ali",     date:"2025-04-18", type:"shift_swap", note:"Night shift rescheduled" },

  // Birthdays
  { id:"B1", title:"🎂 Zainab Malik's Birthday",   date:"2025-04-04", type:"birthday", empId:"E007", empName:"Zainab Malik", empInitials:"ZM", empColor:B.dark },
  { id:"B2", title:"🎂 Bilal Hussain's Birthday",  date:"2025-04-19", type:"birthday", empId:"E008", empName:"Bilal Hussain", empInitials:"BH", empColor:B.sage },

  // Deadlines
  { id:"D1", title:"Q1 Report Submission",  date:"2025-03-31", type:"deadline", note:"Finance + Analytics team" },
  { id:"D2", title:"Sprint 12 Delivery",    date:"2025-04-11", type:"deadline", note:"All engineers" },
  { id:"D3", title:"Design System Freeze",  date:"2025-04-25", type:"deadline", empId:"E009", empName:"Ayesha Siddiqui", empInitials:"AS", empColor:B.gold },
];

// ─── SMALL COMPONENTS ──────────────────────────────────────────────
function Avatar({ initials, color, size = 24 }: { initials:string; color:string; size?:number }) {
  return (
    <div style={{
      width:size, height:size, borderRadius:"50%",
      background:`linear-gradient(135deg, ${color}dd, ${color}88)`,
      display:"flex", alignItems:"center", justifyContent:"center",
      fontSize:size*0.32, fontWeight:700, color:"#fff", flexShrink:0,
      border:`1.5px solid ${color}44`, fontFamily:"League Spartan, sans-serif",
    }}>{initials}</div>
  );
}

function EventPill({ event, compact = false }: { event:CalEvent; compact?:boolean }) {
  const cfg = EVENT_CFG[event.type];
  return (
    <div style={{
      display:"flex", alignItems:"center", gap:4,
      background:cfg.bg, color:cfg.text, border:`1px solid ${cfg.border}`,
      borderRadius:5, padding: compact ? "1px 5px" : "2px 7px",
      fontSize: compact ? 9 : 10, fontWeight:700, lineHeight:1.4,
      overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis",
      cursor:"pointer", fontFamily:"League Spartan, sans-serif",
      maxWidth:"100%",
    }}>
      <span style={{ width:5, height:5, borderRadius:"50%", background:cfg.dot, flexShrink:0, display:"inline-block" }}/>
      <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
        {compact ? (event.empInitials || event.title.slice(0,12)) : event.title}
      </span>
    </div>
  );
}

// ─── ADD EVENT MODAL ───────────────────────────────────────────────
function AddEventModal({ defaultDate, onClose, onAdd }: {
  defaultDate: Date; onClose: ()=>void; onAdd: (e:CalEvent)=>void;
}) {
  const [form, setForm] = useState({
    title:"", date: format(defaultDate,"yyyy-MM-dd"),
    endDate:"", type:"meeting" as EventType,
    empId:"", time:"", note:"", allDay:true,
  });

  const emp = TEAM.find(t => t.id === form.empId);

  const handleSubmit = () => {
    if (!form.title.trim()) { toast.error("Please add a title"); return; }
    const newEv: CalEvent = {
      id: `EV-${Date.now()}`, title:form.title,
      date:form.date, endDate:form.endDate || undefined,
      type:form.type,
      empId:emp?.id, empName:emp?.name, empInitials:emp?.initials, empColor:emp?.color,
      note:form.note || undefined,
      time:form.allDay ? undefined : form.time,
      allDay:form.allDay,
    };
    onAdd(newEv);
    toast.success(`"${form.title}" added to calendar`);
    onClose();
  };

  const inputStyle: React.CSSProperties = {
    width:"100%", background:"#FAFAFA", border:"1px solid #F5E6D0",
    borderRadius:10, padding:"9px 12px", fontSize:13, color:B.navy,
    fontFamily:"League Spartan, sans-serif", outline:"none",
  };

  const labelStyle: React.CSSProperties = {
    fontSize:10, color:B.gray, fontWeight:700, letterSpacing:"0.07em",
    textTransform:"uppercase", display:"block", marginBottom:5,
  };

  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      onClick={onClose}
      style={{ position:"fixed", inset:0, background:"rgba(30,29,56,0.6)", zIndex:1000,
        display:"flex", alignItems:"center", justifyContent:"center", padding:24, backdropFilter:"blur(6px)" }}>
      <motion.div initial={{ scale:0.88, y:20 }} animate={{ scale:1, y:0 }} exit={{ scale:0.88, y:20 }}
        transition={{ type:"spring", stiffness:280, damping:22 }}
        onClick={e=>e.stopPropagation()}
        style={{ background:"#fff", borderRadius:24, width:"100%", maxWidth:460,
          boxShadow:"0 32px 80px rgba(30,29,56,0.3)", border:"1px solid #F5E6D0" }}>

        {/* Header */}
        <div style={{ padding:"22px 24px 16px", borderBottom:"1px solid #F5E6D0", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div>
            <div style={{ fontSize:16, fontWeight:700, color:B.navy }}>Add Calendar Event</div>
            <div style={{ fontSize:11, color:B.gray, marginTop:2 }}>{format(defaultDate, "EEEE, d MMMM yyyy")}</div>
          </div>
          <button onClick={onClose} style={{ background:"rgba(30,29,56,0.07)", border:"none", borderRadius:8, padding:7, cursor:"pointer", display:"flex" }}>
            <X size={15} color={B.navy}/>
          </button>
        </div>

        {/* Body */}
        <div style={{ padding:"20px 24px", display:"flex", flexDirection:"column", gap:14 }}>
          <div>
            <label style={labelStyle}>Event Title *</label>
            <input style={inputStyle} placeholder="e.g. Sprint Planning, Fatima Leave…"
              value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))}/>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div>
              <label style={labelStyle}>Start Date</label>
              <input type="date" style={inputStyle} value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/>
            </div>
            <div>
              <label style={labelStyle}>End Date (optional)</label>
              <input type="date" style={inputStyle} value={form.endDate} onChange={e=>setForm(f=>({...f,endDate:e.target.value}))}/>
            </div>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div>
              <label style={labelStyle}>Event Type</label>
              <select style={inputStyle} value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value as EventType}))}>
                {(Object.keys(EVENT_CFG) as EventType[]).map(t=>(
                  <option key={t} value={t}>{EVENT_CFG[t].label}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Team Member (optional)</label>
              <select style={inputStyle} value={form.empId} onChange={e=>setForm(f=>({...f,empId:e.target.value}))}>
                <option value="">— All Team —</option>
                {TEAM.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"auto 1fr", gap:12, alignItems:"center" }}>
            <label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer" }}>
              <input type="checkbox" checked={!form.allDay} onChange={e=>setForm(f=>({...f,allDay:!e.target.checked}))}
                style={{ accentColor:B.gold, width:14, height:14 }}/>
              <span style={{ fontSize:12, color:B.navy, fontWeight:600 }}>Set time</span>
            </label>
            {!form.allDay && (
              <input type="time" style={inputStyle} value={form.time} onChange={e=>setForm(f=>({...f,time:e.target.value}))}/>
            )}
          </div>

          <div>
            <label style={labelStyle}>Notes (optional)</label>
            <textarea style={{ ...inputStyle, resize:"none", minHeight:60, lineHeight:1.5 }}
              placeholder="Additional details…"
              value={form.note} onChange={e=>setForm(f=>({...f,note:e.target.value}))}/>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding:"16px 24px", borderTop:"1px solid #F5E6D0", display:"flex", gap:10 }}>
          <button onClick={onClose} style={{
            flex:1, background:"#F5F5F5", border:"1px solid #E5E7EB",
            borderRadius:12, padding:"11px 0", color:B.gray,
            fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"League Spartan, sans-serif",
          }}>Cancel</button>
          <button onClick={handleSubmit} style={{
            flex:2, background:`linear-gradient(135deg, ${B.navy}, ${B.dark})`,
            border:"none", borderRadius:12, padding:"11px 0", color:"#F5E6D0",
            fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"League Spartan, sans-serif",
            boxShadow:"0 4px 16px rgba(30,29,56,0.25)",
          }}>Add Event →</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── EVENT DETAIL PANEL ────────────────────────────────────────────
function EventDetail({ event, onClose, onDelete }: { event:CalEvent; onClose:()=>void; onDelete:(id:string)=>void }) {
  const cfg = EVENT_CFG[event.type];
  return (
    <motion.div initial={{ opacity:0, x:16 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:16 }}
      style={{ background:"#fff", border:"1px solid #F5E6D0", borderRadius:18,
        boxShadow:"0 4px 24px rgba(30,29,56,0.1)", overflow:"hidden" }}>
      <div style={{ background:cfg.bg, borderBottom:`2px solid ${cfg.border}`, padding:"16px 18px", display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}>
            <span style={{ background:cfg.dot, borderRadius:"50%", width:8, height:8, display:"inline-block" }}/>
            <span style={{ fontSize:10, fontWeight:700, color:cfg.text, letterSpacing:"0.07em", textTransform:"uppercase" }}>{cfg.label}</span>
          </div>
          <div style={{ fontSize:14, fontWeight:700, color:B.navy, lineHeight:1.3 }}>{event.title}</div>
        </div>
        <button onClick={onClose} style={{ background:"rgba(30,29,56,0.06)", border:"none", borderRadius:8, padding:6, cursor:"pointer", display:"flex" }}>
          <X size={13} color={B.navy}/>
        </button>
      </div>

      <div style={{ padding:"14px 18px", display:"flex", flexDirection:"column", gap:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, fontSize:12, color:B.gray }}>
          <Calendar size={13} color={B.gold}/>
          <span>{format(parseISO(event.date), "EEEE, d MMMM yyyy")}{event.endDate && ` → ${format(parseISO(event.endDate),"d MMM")}`}</span>
        </div>

        {event.time && (
          <div style={{ display:"flex", alignItems:"center", gap:8, fontSize:12, color:B.gray }}>
            <Clock size={13} color={B.gold}/>
            <span>{event.time}</span>
          </div>
        )}

        {event.empName && (
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <Avatar initials={event.empInitials!} color={event.empColor!} size={22}/>
            <span style={{ fontSize:12, color:B.navy, fontWeight:600 }}>{event.empName}</span>
          </div>
        )}

        {event.note && (
          <div style={{ background:"#FAFAFA", borderRadius:10, padding:"9px 12px", fontSize:11, color:"#6B7280", lineHeight:1.5 }}>
            {event.note}
          </div>
        )}

        <button onClick={() => { onDelete(event.id); onClose(); toast.success("Event removed"); }}
          style={{ marginTop:4, background:"#FEF2F2", border:"1px solid #FCA5A5", borderRadius:10, padding:"8px 0",
            color:"#991B1B", fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"League Spartan, sans-serif" }}>
          Delete Event
        </button>
      </div>
    </motion.div>
  );
}

// ─── MAIN CALENDAR ─────────────────────────────────────────────────
export default function TeamCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date(2025, 2, 26)); // March 26 2025
  const [viewMode, setViewMode]       = useState<ViewMode>("month");
  const [selectedDay, setSelectedDay] = useState<Date | null>(new Date(2025, 2, 26));
  const [events, setEvents]           = useState<CalEvent[]>(INITIAL_EVENTS);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalDate, setAddModalDate] = useState<Date>(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalEvent | null>(null);
  const [filterType, setFilterType]   = useState<EventType | "all">("all");
  const [filterEmp, setFilterEmp]     = useState<string>("all");
  const [searchQ, setSearchQ]         = useState("");

  // ── Filtered events ──
  const filteredEvents = useMemo(() => events.filter(e => {
    if (filterType !== "all" && e.type !== filterType) return false;
    if (filterEmp  !== "all" && e.empId !== filterEmp)  return false;
    if (searchQ && !e.title.toLowerCase().includes(searchQ.toLowerCase())) return false;
    return true;
  }), [events, filterType, filterEmp, searchQ]);

  // ── Events for a specific date ──
  const eventsForDate = useCallback((date: Date) => {
    const ds = format(date, "yyyy-MM-dd");
    return filteredEvents.filter(e => {
      if (!e.endDate) return e.date === ds;
      return ds >= e.date && ds <= e.endDate;
    });
  }, [filteredEvents]);

  // ── Calendar grid days ──
  const calDays = useMemo(() => {
    const mStart = startOfMonth(currentDate);
    const mEnd   = endOfMonth(currentDate);
    const start  = startOfWeek(mStart, { weekStartsOn: 1 });
    const end    = endOfWeek(mEnd,   { weekStartsOn: 1 });
    const days: Date[] = [];
    let cur = start;
    while (cur <= end) { days.push(cur); cur = addDays(cur, 1); }
    return days;
  }, [currentDate]);

  // ── Week grid days ──
  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    return Array.from({ length:7 }, (_, i) => addDays(start, i));
  }, [currentDate]);

  const selectedDayEvents = selectedDay ? eventsForDate(selectedDay) : [];

  const upcomingEvents = useMemo(() =>
    filteredEvents
      .filter(e => parseISO(e.date) >= new Date(2025,2,26))
      .sort((a,b) => a.date.localeCompare(b.date))
      .slice(0,8),
  [filteredEvents]);

  const nav = (dir: 1|-1) => {
    if (viewMode === "month") setCurrentDate(dir === 1 ? addMonths(currentDate,1) : subMonths(currentDate,1));
    else setCurrentDate(dir === 1 ? addWeeks(currentDate,1)  : subWeeks(currentDate,1));
  };

  const addEvent = (e:CalEvent) => setEvents(ev => [...ev, e]);
  const deleteEvent = (id:string) => {
    setEvents(ev => ev.filter(e => e.id !== id));
    if (selectedEvent?.id === id) setSelectedEvent(null);
  };

  const weekdayHeaders = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

  // Type legend
  const typeSummary = useMemo(() => {
    const m = {} as Record<EventType, number>;
    filteredEvents.forEach(e => { m[e.type] = (m[e.type]||0)+1; });
    return m;
  }, [filteredEvents]);

  return (
    <>
     

      <div className="border" style={{ minHeight:"100vh" }}>

        {/* ── TOPBAR ── */}
        <div style={{ background:B.navy, borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ maxWidth:1400, margin:"0 auto", padding:"14px 28px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:16, flexWrap:"wrap" }}>

            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ width:36, height:36, borderRadius:10, background:`linear-gradient(135deg, ${B.gold}, ${B.sand})`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                <Calendar size={18} color={B.navy}/>
              </div>
              <div>
                <div style={{ fontSize:15, fontWeight:700, color:B.cream }}>Team Calendar</div>
                <div style={{ fontSize:10, color:"rgba(245,230,208,0.4)", letterSpacing:"0.08em" }}>HRMS FLEXI · LAHORE HQ</div>
              </div>
            </div>

            {/* Nav */}
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <button onClick={()=>nav(-1)} style={{ background:"rgba(245,230,208,0.08)", border:"1px solid rgba(245,230,208,0.1)", borderRadius:9, padding:"7px 10px", color:B.cream, cursor:"pointer", display:"flex" }}>
                <ChevronLeft size={16}/>
              </button>
              <div style={{ fontSize:15, fontWeight:700, color:B.cream, minWidth:160, textAlign:"center" }}>
                {viewMode==="month" ? format(currentDate,"MMMM yyyy") : `${format(weekDays[0],"d MMM")} – ${format(weekDays[6],"d MMM yyyy")}`}
              </div>
              <button onClick={()=>nav(1)} style={{ background:"rgba(245,230,208,0.08)", border:"1px solid rgba(245,230,208,0.1)", borderRadius:9, padding:"7px 10px", color:B.cream, cursor:"pointer", display:"flex" }}>
                <ChevronRight size={16}/>
              </button>
              <button onClick={()=>{ setCurrentDate(new Date(2025,2,26)); setSelectedDay(new Date(2025,2,26)); }}
                style={{ background:"rgba(245,230,208,0.08)", border:"1px solid rgba(245,230,208,0.1)", borderRadius:9, padding:"7px 12px", color:"rgba(245,230,208,0.6)", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"League Spartan, sans-serif" }}>
                Today
              </button>
            </div>

            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              {/* View Toggle */}
              <div style={{ display:"flex", background:"rgba(245,230,208,0.08)", borderRadius:10, padding:3, border:"1px solid rgba(245,230,208,0.1)" }}>
                {([["month","Month",<LayoutGrid size={13}/>],["week","Week",<Rows3 size={13}/>]] as const).map(([v,l,ic])=>(
                  <button key={v} onClick={()=>setViewMode(v as ViewMode)} style={{
                    display:"flex", alignItems:"center", gap:5, padding:"6px 12px",
                    borderRadius:8, border:"none", cursor:"pointer",
                    background: viewMode===v ? B.gold : "transparent",
                    color: viewMode===v ? B.navy : "rgba(245,230,208,0.5)",
                    fontSize:12, fontWeight:700, fontFamily:"League Spartan, sans-serif", transition:"all 0.2s",
                  }}>{ic}{l}</button>
                ))}
              </div>

              <button onClick={()=>{ setAddModalDate(selectedDay||new Date()); setShowAddModal(true); }} style={{
                background:`linear-gradient(135deg, ${B.gold}, ${B.sand})`,
                border:"none", borderRadius:10, padding:"9px 18px",
                color:B.navy, fontWeight:700, fontSize:13, cursor:"pointer",
                display:"flex", alignItems:"center", gap:6,
                fontFamily:"League Spartan, sans-serif",
                boxShadow:"0 4px 16px rgba(200,155,90,0.35)",
              }}>
                <Plus size={14}/> Add Event
              </button>
            </div>
          </div>

          {/* ── FILTER BAR ── */}
          <div style={{ borderTop:"1px solid rgba(255,255,255,0.05)", padding:"10px 28px", maxWidth:1400, margin:"0 auto", display:"flex", gap:10, flexWrap:"wrap", alignItems:"center" }}>
            {/* Search */}
            <div style={{ position:"relative" }}>
              <Search size={12} style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:"rgba(245,230,208,0.4)" }}/>
              <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="Search events…"
                style={{ paddingLeft:28, paddingRight:12, paddingTop:7, paddingBottom:7, borderRadius:9, background:"rgba(245,230,208,0.07)", border:"1px solid rgba(245,230,208,0.1)", color:B.cream, fontSize:12, fontFamily:"League Spartan, sans-serif", outline:"none", width:180 }}/>
            </div>

            {/* Type filter */}
            <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
              <button onClick={()=>setFilterType("all")} style={{
                padding:"5px 12px", borderRadius:99, border:`1px solid ${filterType==="all"?"rgba(245,230,208,0.4)":"rgba(245,230,208,0.1)"}`,
                background: filterType==="all" ? "rgba(245,230,208,0.15)" : "transparent",
                color: filterType==="all" ? B.cream : "rgba(245,230,208,0.4)",
                fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"League Spartan, sans-serif",
              }}>All</button>
              {(Object.keys(EVENT_CFG) as EventType[]).map(t => (
                <button key={t} onClick={()=>setFilterType(filterType===t?"all":t)} style={{
                  display:"flex", alignItems:"center", gap:4,
                  padding:"5px 10px", borderRadius:99,
                  border:`1px solid ${filterType===t?EVENT_CFG[t].dot:"rgba(245,230,208,0.1)"}`,
                  background: filterType===t ? `${EVENT_CFG[t].dot}22` : "transparent",
                  color: filterType===t ? EVENT_CFG[t].dot : "rgba(245,230,208,0.4)",
                  fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"League Spartan, sans-serif",
                }}>
                  <span style={{ width:5, height:5, borderRadius:"50%", background:EVENT_CFG[t].dot, display:"inline-block" }}/>
                  {EVENT_CFG[t].label}
                  {typeSummary[t] && <span style={{ opacity:0.6 }}>({typeSummary[t]})</span>}
                </button>
              ))}
            </div>

            {/* Employee filter */}
            <select value={filterEmp} onChange={e=>setFilterEmp(e.target.value)}
              style={{ marginLeft:"auto", background:"rgba(245,230,208,0.07)", border:"1px solid rgba(245,230,208,0.1)", borderRadius:9, padding:"7px 12px", color:filterEmp==="all"?"rgba(245,230,208,0.5)":B.cream, fontSize:12, fontFamily:"League Spartan, sans-serif", outline:"none", cursor:"pointer" }}>
              <option value="all">All Members</option>
              {TEAM.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        </div>

        {/* ── MAIN BODY ── */}
        <div style={{ maxWidth:1400, margin:"0 auto", padding:"24px 28px", display:"flex", gap:20 }}>

          {/* ── CALENDAR GRID ── */}
          <div style={{ flex:1, minWidth:0 }}>

            {/* Month View */}
            {viewMode === "month" && (
              <motion.div key="month" initial={{ opacity:0 }} animate={{ opacity:1 }}
                style={{ background:"#fff", borderRadius:20, border:"1px solid #F5E6D0", overflow:"hidden", boxShadow:"0 1px 3px rgba(30,29,56,0.06)" }}>

                {/* Day headers */}
                <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", borderBottom:"2px solid #322E53" }}>
                  {weekdayHeaders.map(d=>(
                    <div key={d} style={{ padding:"12px 8px", textAlign:"center", fontSize:11, fontWeight:700, color:B.navy, letterSpacing:"0.07em", background:"#FAFAFA" }}>
                      {d}
                    </div>
                  ))}
                </div>

                {/* Days grid */}
                <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)" }}>
                  {calDays.map((day, i) => {
                    const dayEvs = eventsForDate(day);
                    const isCurrentMonth = isSameMonth(day, currentDate);
                    const isSelected = selectedDay && isSameDay(day, selectedDay);
                    const isTodayDate = isToday(day);
                    const isSunday = getDay(day) === 0;
                    const isSaturday = getDay(day) === 6;
                    const isWeekend = isSunday || isSaturday;
                    const isHoliday = dayEvs.some(e=>e.type==="holiday");

                    return (
                      <div key={i}
                        onClick={()=>{ setSelectedDay(day); setSelectedEvent(null); }}
                        style={{
                          minHeight:110, padding:"8px 8px 6px",
                          borderRight: (i+1)%7!==0 ? "1px solid #F5E6D0" : "none",
                          borderBottom: i < calDays.length-7 ? "1px solid #F5E6D0" : "none",
                          background: isSelected ? "#FFFBF2" : isHoliday ? "#F0FDF4" : isWeekend && isCurrentMonth ? "#FAFAFA" : "#fff",
                          cursor:"pointer", transition:"background 0.15s",
                          position:"relative",
                        }}
                        onMouseEnter={e=>{ if(!isSelected) (e.currentTarget as HTMLElement).style.background="#FFFBF5"; }}
                        onMouseLeave={e=>{ if(!isSelected) (e.currentTarget as HTMLElement).style.background=isHoliday?"#F0FDF4":isWeekend&&isCurrentMonth?"#FAFAFA":"#fff"; }}
                      >
                        {/* Selected indicator */}
                        {isSelected && <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:B.gold }}/>}

                        {/* Date number */}
                        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:4 }}>
                          <span style={{
                            width:26, height:26, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center",
                            fontSize:12, fontWeight: isTodayDate ? 800 : 600,
                            background: isTodayDate ? B.navy : "transparent",
                            color: isTodayDate ? B.cream : isCurrentMonth ? (isWeekend?"#9CA3AF":B.navy) : "#D1D5DB",
                          }}>{format(day,"d")}</span>
                          {dayEvs.length > 0 && !isTodayDate && (
                            <span style={{ fontSize:9, color:B.gray, fontWeight:700 }}>
                              {dayEvs.length > 1 ? `${dayEvs.length}` : ""}
                            </span>
                          )}
                        </div>

                        {/* Events */}
                        <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
                          {dayEvs.slice(0,3).map(e=>(
                            <div key={e.id} onClick={ev=>{ ev.stopPropagation(); setSelectedDay(day); setSelectedEvent(e); }}>
                              <EventPill event={e} compact/>
                            </div>
                          ))}
                          {dayEvs.length > 3 && (
                            <div style={{ fontSize:9, color:B.gray, fontWeight:700, paddingLeft:2 }}>+{dayEvs.length-3} more</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Week View */}
            {viewMode === "week" && (
              <motion.div key="week" initial={{ opacity:0 }} animate={{ opacity:1 }}
                style={{ background:"#fff", borderRadius:20, border:"1px solid #F5E6D0", overflow:"hidden", boxShadow:"0 1px 3px rgba(30,29,56,0.06)" }}>

                <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", borderBottom:"2px solid #322E53" }}>
                  {weekDays.map((day,i)=>{
                    const isSelected = selectedDay && isSameDay(day,selectedDay);
                    const isTodayDate = isToday(day);
                    return (
                      <div key={i} onClick={()=>{ setSelectedDay(day); setSelectedEvent(null); }}
                        style={{ padding:"14px 12px", borderRight:i<6?"1px solid #F5E6D0":"none", cursor:"pointer",
                          background: isSelected ? "#FFFBF2" : isTodayDate ? "#FAFAFA" : "#FAFAFA",
                          borderBottom: isSelected ? `2px solid ${B.gold}` : "none", position:"relative" }}>
                        <div style={{ fontSize:10, color:B.gray, fontWeight:700, letterSpacing:"0.07em", marginBottom:4 }}>{format(day,"EEE").toUpperCase()}</div>
                        <div style={{ width:30, height:30, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center",
                          background: isTodayDate ? B.navy : "transparent",
                          fontSize:14, fontWeight:700, color: isTodayDate ? B.cream : B.navy }}>
                          {format(day,"d")}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", minHeight:480 }}>
                  {weekDays.map((day,i)=>{
                    const dayEvs = eventsForDate(day);
                    const isSelected = selectedDay && isSameDay(day,selectedDay);
                    return (
                      <div key={i} onClick={()=>{ setSelectedDay(day); setSelectedEvent(null); }}
                        style={{ padding:"10px 8px", borderRight:i<6?"1px solid #F5E6D0":"none", cursor:"pointer",
                          background: isSelected ? "#FFFBF2" : "#fff", transition:"background 0.15s",
                          display:"flex", flexDirection:"column", gap:6 }}>
                        <button onClick={ev=>{ ev.stopPropagation(); setAddModalDate(day); setShowAddModal(true); }}
                          style={{ alignSelf:"flex-end", width:20, height:20, borderRadius:6, background:"#F5E6D0", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", opacity:0.5 }}>
                          <Plus size={10} color={B.navy}/>
                        </button>
                        {dayEvs.map(e=>(
                          <div key={e.id} onClick={ev=>{ ev.stopPropagation(); setSelectedDay(day); setSelectedEvent(e); }}>
                            <EventPill event={e}/>
                          </div>
                        ))}
                        {dayEvs.length===0 && (
                          <div style={{ fontSize:10, color:"#D1D5DB", textAlign:"center", marginTop:20 }}>—</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* ── TEAM AVAILABILITY STRIP ── */}
            <div style={{ marginTop:20, background:"#fff", borderRadius:20, border:"1px solid #F5E6D0", padding:"16px 20px", boxShadow:"0 1px 3px rgba(30,29,56,0.06)" }}>
              <div style={{ fontSize:12, fontWeight:700, color:B.navy, marginBottom:12 }}>Team Availability — {selectedDay ? format(selectedDay,"d MMM") : "Today"}</div>
              <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
                {TEAM.map(emp => {
                  const dayEv = selectedDay ? eventsForDate(selectedDay).find(e=>e.empId===emp.id) : null;
                  const onLeave = dayEv?.type === "leave";
                  return (
                    <div key={emp.id} style={{ display:"flex", alignItems:"center", gap:6, background: onLeave?"#ad4848":"#FAFAFA", borderRadius:10, padding:"6px 10px", border:`1px solid ${onLeave?"#FCA5A5":"#F5E6D0"}` }}>
                      <Avatar initials={emp.initials} color={emp.color} size={22}/>
                      <div>
                        <div style={{ fontSize:11, fontWeight:700, color: onLeave?"#fff":B.navy }}>{emp.name.split(" ")[0]}</div>
                        <div style={{ fontSize:9, color: onLeave?"#fff":B.gray }}>
                          {onLeave ? "On Leave" : "Available"}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── RIGHT SIDEBAR ── */}
          <div style={{ width:300, flexShrink:0, display:"flex", flexDirection:"column", gap:16 }}>

            {/* Selected day detail */}
            <AnimatePresence mode="wait">
              {selectedDay && (
                <motion.div key={selectedDay.toISOString()} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}>

                  {/* Day header card */}
                  <div style={{ background:B.navy, borderRadius:18, padding:"18px 18px 14px", marginBottom:14, position:"relative", overflow:"hidden" }}>
                    <div style={{ position:"absolute", top:-20, right:-20, width:100, height:100, borderRadius:"50%", background:B.gold, opacity:0.08, filter:"blur(25px)" }}/>
                    <div style={{ fontSize:11, color:"rgba(245,230,208,0.4)", fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:4 }}>
                      {format(selectedDay,"EEEE")}
                    </div>
                    <div style={{ fontSize:28, fontWeight:700, color:B.cream, lineHeight:1, fontFamily:"League Spartan, sans-serif" }}>
                      {format(selectedDay,"d")}
                    </div>
                    <div style={{ fontSize:13, color:"rgba(245,230,208,0.6)", marginTop:2 }}>
                      {format(selectedDay,"MMMM yyyy")}
                    </div>

                    <div style={{ display:"flex", gap:8, marginTop:14 }}>
                      <div style={{ background:"rgba(245,230,208,0.08)", borderRadius:10, padding:"7px 12px", flex:1, textAlign:"center" }}>
                        <div style={{ fontSize:18, fontWeight:700, color:B.cream }}>{selectedDayEvents.length}</div>
                        <div style={{ fontSize:9, color:"rgba(245,230,208,0.4)", textTransform:"uppercase", letterSpacing:"0.07em" }}>Events</div>
                      </div>
                      <div style={{ background:"rgba(245,230,208,0.08)", borderRadius:10, padding:"7px 12px", flex:1, textAlign:"center" }}>
                        <div style={{ fontSize:18, fontWeight:700, color:B.cream }}>
                          {EMPLOYEES_ON_LEAVE_COUNT(selectedDay, events)}
                        </div>
                        <div style={{ fontSize:9, color:"rgba(245,230,208,0.4)", textTransform:"uppercase", letterSpacing:"0.07em" }}>On Leave</div>
                      </div>
                    </div>

                    <button onClick={()=>{ setAddModalDate(selectedDay); setShowAddModal(true); }}
                      style={{ marginTop:12, width:"100%", background:`linear-gradient(135deg, ${B.gold}, ${B.sand})`,
                        border:"none", borderRadius:10, padding:"9px 0", color:B.navy,
                        fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"League Spartan, sans-serif",
                        display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                      <Plus size={13}/> Add Event on This Day
                    </button>
                  </div>

                  {/* Day events */}
                  <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    <AnimatePresence>
                      {selectedDayEvents.length === 0 && (
                        <div style={{ textAlign:"center", padding:"20px 0", color:B.gray, fontSize:12,
                          background:"#fff", borderRadius:14, border:"1px solid #F5E6D0" }}>
                          No events this day
                        </div>
                      )}
                      {selectedDayEvents.map(ev=>(
                        <motion.div key={ev.id} layout initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                          onClick={()=>setSelectedEvent(ev)}>
                          {selectedEvent?.id === ev.id
                            ? <EventDetail event={ev} onClose={()=>setSelectedEvent(null)} onDelete={deleteEvent}/>
                            : (
                              <div style={{ background:"#fff", border:"1px solid #F5E6D0", borderRadius:14, padding:"12px 14px", cursor:"pointer", transition:"all 0.15s" }}
                                onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background="#FFFBF5"}
                                onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background="#fff"}>
                                <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:5 }}>
                                  <span style={{ width:7, height:7, borderRadius:"50%", background:EVENT_CFG[ev.type].dot, display:"inline-block" }}/>
                                  <span style={{ fontSize:10, fontWeight:700, color:EVENT_CFG[ev.type].text, letterSpacing:"0.06em", textTransform:"uppercase" }}>{EVENT_CFG[ev.type].label}</span>
                                </div>
                                <div style={{ fontSize:13, fontWeight:700, color:B.navy, marginBottom:4 }}>{ev.title}</div>
                                <div style={{ display:"flex", alignItems:"center", gap:8, fontSize:11, color:B.gray }}>
                                  {ev.time && <><Clock size={10}/>{ev.time}</>}
                                  {ev.empName && (
                                    <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                                      <Avatar initials={ev.empInitials!} color={ev.empColor!} size={16}/>
                                      {ev.empName.split(" ")[0]}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )
                          }
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── UPCOMING EVENTS ── */}
            <div style={{ background:"#fff", borderRadius:18, border:"1px solid #F5E6D0", padding:"16px 18px", boxShadow:"0 1px 3px rgba(30,29,56,0.06)" }}>
              <div style={{ fontSize:12, fontWeight:700, color:B.navy, marginBottom:12, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                Upcoming Events
                <span style={{ fontSize:10, color:B.gray, fontWeight:600 }}>{upcomingEvents.length} events</span>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {upcomingEvents.map(ev=>{
                  const cfg = EVENT_CFG[ev.type];
                  const daysAway = differenceInCalendarDays(parseISO(ev.date), new Date(2025,2,26));
                  return (
                    <div key={ev.id} onClick={()=>{ setSelectedDay(parseISO(ev.date)); setSelectedEvent(ev); setCurrentDate(parseISO(ev.date)); }}
                      style={{ display:"flex", gap:10, cursor:"pointer", padding:"8px 10px", borderRadius:10, transition:"background 0.15s" }}
                      onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background="#FAFAFA"}
                      onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background="transparent"}>
                      <div style={{ width:36, height:36, borderRadius:10, background:cfg.bg, border:`1px solid ${cfg.border}`,
                        display:"flex", alignItems:"center", justifyContent:"center", color:cfg.text, flexShrink:0 }}>
                        {cfg.icon}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:11, fontWeight:700, color:B.navy, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{ev.title}</div>
                        <div style={{ fontSize:10, color:B.gray, marginTop:2 }}>
                          {format(parseISO(ev.date),"d MMM")}
                          {ev.endDate && ` – ${format(parseISO(ev.endDate),"d MMM")}`}
                        </div>
                      </div>
                      <div style={{ flexShrink:0, textAlign:"right" }}>
                        <span style={{ fontSize:9, fontWeight:700, color: daysAway===0?"#166534":daysAway<=3?"#92400E":B.gray,
                          background: daysAway===0?"#F0FDF4":daysAway<=3?"#FFFBEB":"#F5F5F5",
                          padding:"2px 7px", borderRadius:99 }}>
                          {daysAway===0?"Today":daysAway===1?"Tmrw":`+${daysAway}d`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── LEGEND ── */}
            <div style={{ background:"#fff", borderRadius:18, border:"1px solid #F5E6D0", padding:"14px 18px", boxShadow:"0 1px 3px rgba(30,29,56,0.06)" }}>
              <div style={{ fontSize:12, fontWeight:700, color:B.navy, marginBottom:10 }}>Legend</div>
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {(Object.keys(EVENT_CFG) as EventType[]).map(t=>{
                  const cfg = EVENT_CFG[t];
                  return (
                    <div key={t} style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <div style={{ width:22, height:22, borderRadius:7, background:cfg.bg, border:`1px solid ${cfg.border}`,
                        display:"flex", alignItems:"center", justifyContent:"center", color:cfg.text }}>
                        {cfg.icon}
                      </div>
                      <span style={{ fontSize:12, color:B.navy, flex:1 }}>{cfg.label}</span>
                      <span style={{ fontSize:11, fontWeight:700, color:B.gray }}>
                        {typeSummary[t]||0}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── ADD EVENT MODAL ── */}
      <AnimatePresence>
        {showAddModal && (
          <AddEventModal defaultDate={addModalDate} onClose={()=>setShowAddModal(false)} onAdd={addEvent}/>
        )}
      </AnimatePresence>
    </>
  );
}

// ── Helper ──
function EMPLOYEES_ON_LEAVE_COUNT(day: Date, events: CalEvent[]): number {
  const ds = format(day, "yyyy-MM-dd");
  return events.filter(e => e.type==="leave" && e.empId && ds>=e.date && ds<=(e.endDate||e.date)).length;
}