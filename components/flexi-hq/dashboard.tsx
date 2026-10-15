// app/flexi-hq/dashboard/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TAB_LIST_CLS, TAB_TRIGGER_CLS } from "@/lib/ui-constants";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Building2, MapPin, Layers, Briefcase, GitBranch,
  PlusCircle, Network, DollarSign, BookOpen, ShieldCheck,
  BarChart3, PieChart, TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  Tooltip as UiTooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart as RePieChart, Pie, Cell, Legend,
} from "recharts";
import { useFlexiHQDashboard } from "@/hooks/useFlexiHQDashboard";


interface ApiStats {
  total_companies: number;
  active_branches: number;
  total_departments: number;
  total_positions: number;
  total_divisions: number;
}

interface Division   { id: number; name: string; code: string }
interface Department { id: number; name: string; code: string; division_id: number }
interface Designation{ id: number; title: string; code: string; department_id: number }
interface Branch     { id: number; name: string; branch_type: "head_office" | "branch" }

interface OrgSnapshot {
  company: { id: number; company_name: string; company_code: string; logo_path: string };
  divisions_count:  number;
  dept_count:       number;
  desig_count:      number;
  branches_count:   number;
  divisions:        Division[];
  departments:      Department[];
  designations:     Designation[];
  branches:         Branch[];
}

interface GradeHeadcount {
  grade_id:   number;
  grade_name: string;
  grade_code: string;
  level:      string;
  headcount:  number;
}

interface BranchDistribution {
  type:  string;
  label: string;
  count: number;
}

interface DashboardData {
  stats:                ApiStats;
  org_snapshot:         OrgSnapshot[];
  headcount_by_grade:   GradeHeadcount[];
  branch_distribution:  BranchDistribution[];
}

/* -------------------------------------------------------------------------- */
/*                          CHART COLORS                                      */
/* -------------------------------------------------------------------------- */

const CHART = {
  navy:  "#322E53",
  mid:   "#49426E",
  gold:  "#EEC293",
  rose:  "#F3AB9D",
  sage:  "#7A8C6E",
  sand:  "#E3BA8E",
};

const PIE_COLORS = [CHART.navy, CHART.gold, CHART.rose, CHART.mid, CHART.sage];

const tooltipStyle = {
  fontSize: 12,
  borderRadius: 10,
  border: `1px solid ${CHART.sand}`,
};

const containerVariants = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0  },
};

/* -------------------------------------------------------------------------- */
/*                       HELPER: initials                                     */
/* -------------------------------------------------------------------------- */

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/* -------------------------------------------------------------------------- */
/*                       STAT CARD CONFIG                                     */
/* -------------------------------------------------------------------------- */

function buildStatCards(stats: ApiStats) {
  return [
    {
      title:   "Companies",
      value:   stats.total_companies,
      icon:    Building2,
      href:    "/flexi-hq/companies",
      cardBg:  "bg-gradient-to-br from-[#322E53] to-[#49426E]",
      textColor: "text-white",
      iconColor: "text-white",
    },
    {
      title:   "Active Branches",
      value:   stats.active_branches,
      icon:    MapPin,
      href:    "/flexi-hq/branches",
      cardBg:  "bg-gradient-to-br from-[#49426E] to-[#5c5490]",
      textColor: "text-white",
      iconColor: "text-white",
    },
    {
      title:   "Departments",
      value:   stats.total_departments,
      icon:    Layers,
      href:    "/flexi-hq/departments",
      cardBg:  "bg-[#322E53]",
      textColor: "text-white",
      iconColor: "text-[#EEC293]",
      ringGlow: "shadow-[0_8px_24px_rgba(238,194,147,0.2)]",
    },
    {
      title:   "Positions",
      value:   stats.total_positions,
      icon:    Briefcase,
      href:    "/flexi-hq/positions",
      cardBg:  "bg-gradient-to-br from-[#EEC293] to-[#e8b57a]",
      textColor: "text-[#322E53]",
      iconColor: "text-[#322E53]",
    },
    {
      title:   "Divisions",
      value:   stats.total_divisions,
      icon:    GitBranch,
      href:    "/flexi-hq/divisions",
      cardBg:  "bg-gradient-to-br from-[#5c5490] to-[#49426E]",
      textColor: "text-white",
      iconColor: "text-white",
    },
  ];
}

/* -------------------------------------------------------------------------- */
/*                           COMPONENT                                        */
/* -------------------------------------------------------------------------- */

export default function FlexiHQDashboard() {
  const router = useRouter();
 
const { data, isLoading, error, refetch } = useFlexiHQDashboard();

  /* ---- derived chart data (computed once data is ready) ---- */
  const deptChartData =
    data
      ? (() => {
          const primary = data.org_snapshot.find((s) => s.divisions_count > 0);
          if (!primary) return [];
          const divMap = Object.fromEntries(primary.divisions.map((d) => [d.id, d.name]));
          const counts: Record<string, number> = {};
          primary.departments.forEach((d) => {
            const div = divMap[d.division_id] ?? "Other";
            counts[div] = (counts[div] ?? 0) + 1;
          });
          return Object.entries(counts).map(([division, count]) => ({ division, count }));
        })()
      : [];

  const posChartData =
    data
      ? (() => {
          const primary = data.org_snapshot.find((s) => s.desig_count > 0);
          if (!primary) return [];
          const deptMap = Object.fromEntries(primary.departments.map((d) => [d.id, d.name]));
          const counts: Record<string, number> = {};
          primary.designations.forEach((d) => {
            const dept = deptMap[d.department_id] ?? "Other";
            counts[dept] = (counts[dept] ?? 0) + 1;
          });
          return Object.entries(counts).map(([department, count]) => ({ department, count }));
        })()
      : [];

  /* ---- error state ---- */
  if (error && !data) {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="text-center">
        <p className="text-sm text-destructive">{error}</p>
        <Button className="mt-4" onClick={refetch}>Retry</Button>
      </div>
    </div>
  );
}

  const statCards = data ? buildStatCards(data.stats) : [];

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={containerVariants}
      className="flex min-h-screen flex-col gap-6 bg-white p-6 md:p-8"
    >
      {/* ------------------------------------------------------------------ */}
      {/* Header                                                              */}
      {/* ------------------------------------------------------------------ */}
      <motion.div variants={itemVariants} className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-brand-900">Flexi HQ</h1>
        <p className="text-sm text-muted-foreground">
          Organizational structure and foundation overview
        </p>
      </motion.div>

      {/* ------------------------------------------------------------------ */}
      {/* Stat cards                                                          */}
      {/* ------------------------------------------------------------------ */}
      <motion.div variants={itemVariants} className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-[110px] rounded-xl" />
            ))
          : statCards.map((stat) => {
              const Icon = stat.icon;
              const isDark = stat.textColor === "text-white";
              const iconBg = isDark ? "bg-white/20" : "bg-[#322E53]/15";
              return (
                <Link href={stat.href} key={stat.title}>
                  <motion.div
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <Card
                      className={`overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow ${stat.cardBg} ${(stat as any).ringGlow ?? ""}`}
                    >
                      <div className={`p-4 ${stat.textColor}`}>
                        <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-lg ${iconBg}`}>
                          <Icon className={`h-5 w-5 ${stat.iconColor}`} />
                        </div>
                        <div className="text-2xl font-bold">{stat.value}</div>
                        <div className="mt-1 text-xs opacity-80">{stat.title}</div>
                      </div>
                    </Card>
                  </motion.div>
                </Link>
              );
            })}
      </motion.div>

      {/* ------------------------------------------------------------------ */}
      {/* Quick actions                                                       */}
      {/* ------------------------------------------------------------------ */}
      <motion.div variants={itemVariants} className="flex flex-wrap gap-2">
        <TooltipProvider delayDuration={200}>
          <Button asChild className="bg-brand-800 text-white shadow-sm hover:bg-brand-900">
            <Link href="/flexi-hq/companies/new">
              <PlusCircle className="mr-2 h-4 w-4" /> New Company
            </Link>
          </Button>

          <UiTooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                onClick={() =>
                  toast.info("Branch management is handled within each company record.")
                }
                className="border-brand-300 bg-white text-brand-700 hover:bg-brand-100"
              >
                <MapPin className="mr-2 h-4 w-4" /> Add Branch
              </Button>
            </TooltipTrigger>
            <TooltipContent>Managed inside each company record</TooltipContent>
          </UiTooltip>

          <Button
            variant="outline"
            onClick={() => router.push("/flexi-hq/workflows")}
            className="border-brand-300 bg-white text-brand-700 hover:bg-brand-100"
          >
            <Layers className="mr-2 h-4 w-4" /> New Department
          </Button>

          <UiTooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                onClick={() => router.push("/flexi-meta/grade-bands")}
                className="border-brand-300 bg-white text-brand-700 hover:bg-brand-100"
              >
                <DollarSign className="mr-2 h-4 w-4" /> Grade Bands
              </Button>
            </TooltipTrigger>
            <TooltipContent>Grade master data is managed in Flexi Meta</TooltipContent>
          </UiTooltip>

          <Button
            variant="outline"
            onClick={() => router.push("/flexi-hq/org-chart")}
            className="border-brand-300 bg-white text-brand-700 hover:bg-brand-100"
          >
            <Network className="mr-2 h-4 w-4" /> View Org Chart
          </Button>

          <UiTooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                onClick={() => router.push("/pay-edge/pakistan-compliance")}
                className="border-brand-300 bg-white text-brand-700 hover:bg-brand-100"
              >
                <ShieldCheck className="mr-2 h-4 w-4" /> Compliance
              </Button>
            </TooltipTrigger>
            <TooltipContent>Configure EOBI, WHT, PESSI statutory rates</TooltipContent>
          </UiTooltip>

          <UiTooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                onClick={() => router.push("/flexi-meta/designations")}
                className="border-brand-300 bg-white text-brand-700 hover:bg-brand-100"
              >
                <BookOpen className="mr-2 h-4 w-4" /> Job Catalog
              </Button>
            </TooltipTrigger>
            <TooltipContent>Positions and designations in Flexi Meta</TooltipContent>
          </UiTooltip>
        </TooltipProvider>
      </motion.div>

      {/* ------------------------------------------------------------------ */}
      {/* Tabs                                                                */}
      {/* ------------------------------------------------------------------ */}
      <motion.div variants={itemVariants}>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className={TAB_LIST_CLS}>
            <TabsTrigger value="overview"   className={TAB_TRIGGER_CLS}>Overview</TabsTrigger>
            <TabsTrigger value="companies"  className={TAB_TRIGGER_CLS}>Companies</TabsTrigger>
            <TabsTrigger value="structure"  className={TAB_TRIGGER_CLS}>Structure</TabsTrigger>
          </TabsList>

          {/* ---- Overview ---- */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">

              {/* Branch distribution */}
              <Card className="border border-brand-300 bg-white shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center text-base font-semibold text-brand-900">
                    <PieChart className="mr-2 h-4 w-4 text-brand-600" />
                    Branch Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-[220px] w-full rounded" />
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <RePieChart>
                        <Pie
                          data={data!.branch_distribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={75}
                          paddingAngle={3}
                          dataKey="count"
                          nameKey="label"
                        >
                          {data!.branch_distribution.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="white" strokeWidth={2} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={tooltipStyle} />
                        <Legend
                          verticalAlign="bottom"
                          height={28}
                          iconSize={8}
                          wrapperStyle={{ fontSize: 11, color: CHART.sage }}
                        />
                      </RePieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Headcount by grade */}
              <Card className="border border-brand-300 bg-white shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center text-base font-semibold text-brand-900">
                    <BarChart3 className="mr-2 h-4 w-4 text-brand-500" />
                    Headcount by Grade
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {isLoading ? (
                    <Skeleton className="h-[180px] w-full rounded" />
                  ) : (
                    data!.headcount_by_grade.map((g) => (
                      <div key={g.grade_id} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-medium text-brand-900">{g.grade_name}</span>
                          <span className="text-brand-700">{g.headcount}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress
                            value={g.headcount > 0 ? 100 : 0}
                            className="h-1.5 flex-1"
                          />
                          <Badge className="border border-brand-300 bg-brand-100 px-1.5 text-[10px] text-brand-700">
                            {g.level}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Divisions of primary company */}
              <Card className="border border-brand-300 bg-white shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center text-base font-semibold text-brand-900">
                    <TrendingUp className="mr-2 h-4 w-4 text-brand-800" />
                    Divisions
                  </CardTitle>
                  <CardDescription className="text-xs text-brand-700">
                    {data?.org_snapshot[0]?.company.company_name ?? "Primary company"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-[160px] w-full rounded" />
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {data!.org_snapshot
                        .find((s) => s.divisions_count > 0)
                        ?.divisions.map((div) => (
                          <div
                            key={div.id}
                            className="rounded-lg border border-brand-200 bg-brand-50 p-3"
                          >
                            <p className="text-xs font-semibold text-brand-900">{div.name}</p>
                            <p className="mt-0.5 text-[10px] text-brand-700">{div.code}</p>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ---- Companies ---- */}
          <TabsContent value="companies" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {isLoading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-[120px] rounded-xl" />
                  ))
                : data!.org_snapshot.map((snap) => {
                    const hasData = snap.divisions_count > 0;
                    return (
                      <Card
                        key={snap.company.id}
                        className="border border-brand-300 bg-white shadow-md hover:shadow-lg transition-shadow"
                      >
                        <CardContent className="flex items-start gap-4 pt-4">
                          <Avatar className="h-10 w-10 border border-brand-200">
                            <AvatarFallback className="bg-brand-800 text-sm font-semibold text-[#EEC293]">
                              {getInitials(snap.company.company_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-2">
                            <div>
                              <p className="text-sm font-semibold text-brand-900">
                                {snap.company.company_name}
                              </p>
                              <p className="text-xs text-brand-700">{snap.company.company_code}</p>
                            </div>
                            {hasData ? (
                              <div className="flex flex-wrap gap-1.5">
                                <Badge className="border border-[#534AB7]/30 bg-[#EEEDFE] px-2 text-[10px] text-[#3C3489]">
                                  {snap.divisions_count} divisions
                                </Badge>
                                <Badge className="border border-[#0F6E56]/30 bg-[#E1F5EE] px-2 text-[10px] text-[#085041]">
                                  {snap.dept_count} departments
                                </Badge>
                                <Badge className="border border-[#854F0B]/30 bg-[#FAEEDA] px-2 text-[10px] text-[#633806]">
                                  {snap.desig_count} positions
                                </Badge>
                                <Badge className="border border-brand-300 bg-brand-100 px-2 text-[10px] text-brand-800">
                                  {snap.branches_count} branches
                                </Badge>
                              </div>
                            ) : (
                              <Badge className="border border-brand-200 bg-brand-50 px-2 text-[10px] text-brand-600">
                                No structure configured
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
            </div>
          </TabsContent>

          {/* ---- Structure ---- */}
          <TabsContent value="structure" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">

              {/* Departments per division */}
              <Card className="border border-brand-300 bg-white shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-brand-900">Departments per Division</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-[260px] w-full rounded" />
                  ) : (
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={deptChartData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={`${CHART.sand}60`} vertical={false} />
                        <XAxis
                          dataKey="division"
                          tick={{ fontSize: 10, fill: CHART.sage }}
                          axisLine={false}
                          tickLine={false}
                          interval={0}
                          angle={-10}
                          textAnchor="end"
                          height={40}
                        />
                        <YAxis hide />
                        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#F5E6D040" }} />
                        <Bar dataKey="count" fill={CHART.navy} radius={[4, 4, 0, 0]} barSize={28} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Positions per department */}
              <Card className="border border-brand-300 bg-white shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-brand-900">Positions per Department</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-[260px] w-full rounded" />
                  ) : (
                    <ResponsiveContainer width="100%" height={Math.max(posChartData.length * 36 + 40, 260)}>
                      <BarChart
                        data={posChartData}
                        layout="vertical"
                        margin={{ top: 4, right: 12, left: 80, bottom: 4 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke={`${CHART.sand}60`} horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 10, fill: CHART.sage }} axisLine={false} tickLine={false} />
                        <YAxis
                          dataKey="department"
                          type="category"
                          tick={{ fontSize: 10, fill: CHART.sage }}
                          axisLine={false}
                          tickLine={false}
                          width={76}
                        />
                        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#F5E6D040" }} />
                        <Bar dataKey="count" fill={CHART.gold} radius={[0, 4, 4, 0]} barSize={14} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}