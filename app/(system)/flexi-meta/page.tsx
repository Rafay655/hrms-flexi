"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Banknote,
  Globe,
  FileText,
  Settings2,
  Info,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Group = {
  title: string;
  icon: LucideIcon;
  description: string;
  entityCount: number;
  recordCount: number;
  badges: string[];
  href: string;
};

const GROUPS: Group[] = [
  {
    title: "Organisation",
    icon: Building2,
    description: "Defines your company's structural hierarchy",
    entityCount: 5,
    recordCount: 124,
    badges: ["Departments", "Designations", "Cost Centers"],
    href: "/flexi-meta/departments",
  },
  {
    title: "Compensation",
    icon: Banknote,
    description: "Controls salary bands, grades and statutory rates",
    entityCount: 5,
    recordCount: 47,
    badges: ["Grades", "Grade Bands", "Salary Components"],
    href: "/flexi-meta/grade-templates",
  },
  {
    title: "Geography",
    icon: Globe,
    description: "Location reference data used across all modules",
    entityCount: 4,
    recordCount: 312,
    badges: ["Countries", "States", "Cities"],
    href: "/flexi-meta/countries",
  },
  {
    title: "Employment",
    icon: FileText,
    description: "Employment categories, document and compliance types",
    entityCount: 8,
    recordCount: 89,
    badges: ["Employee Types", "Document Types", "Genders"],
    href: "/flexi-meta/employee-types",
  },
  {
    title: "System",
    icon: Settings2,
    description: "Financial, banking and device configuration",
    entityCount: 10,
    recordCount: 203,
    badges: ["Banks", "Currencies", "Device Types"],
    href: "/flexi-meta/banks",
  },
];

export default function FlexiMetaDashboard() {
  const router = useRouter();

  const totalEntities = GROUPS.reduce((s, g) => s + g.entityCount, 0);
  const totalRecords = GROUPS.reduce((s, g) => s + g.recordCount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-900">
            Flexi Meta — Master Data Engine
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            The dictionary powering every module in Flexi HRMS
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-brand-100 text-brand-800 border-brand-300 hover:bg-brand-100">
            {totalEntities} entity types
          </Badge>
          <Badge className="bg-brand-800 text-white border-transparent hover:bg-brand-800">
            {totalRecords.toLocaleString()} total records
          </Badge>
        </div>
      </div>

      {/* 5 group cards */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {GROUPS.map((group) => {
          const Icon = group.icon;
          return (
            <Card
              key={group.title}
              className="border-brand-300/30 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100">
                    <Icon className="h-6 w-6 text-brand-700" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg font-bold text-brand-800">
                      {group.title}
                    </CardTitle>
                    <CardDescription className="text-xs mt-1 text-muted-foreground">
                      {group.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-baseline gap-2 text-xs text-muted-foreground">
                  <span className="font-semibold text-brand-900">
                    {group.entityCount}
                  </span>
                  <span>entity types</span>
                  <span className="text-brand-300">·</span>
                  <span className="font-semibold text-brand-900">
                    {group.recordCount.toLocaleString()}
                  </span>
                  <span>total records</span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {group.badges.map((b) => (
                    <Badge
                      key={b}
                      variant="outline"
                      className="border-brand-300/60 text-brand-800 text-[10px] font-medium"
                    >
                      {b}
                    </Badge>
                  ))}
                </div>

                <Button
                  onClick={() => router.push(group.href)}
                  className="w-full bg-brand-800 text-white hover:bg-brand-900 gap-2"
                >
                  Configure
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 rounded-xl border border-brand-300/40 bg-brand-100/40 p-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-100">
          <Info className="h-4 w-4 text-brand-800" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-brand-800">
            Flexi Meta feeds Flexi HQ configuration
          </p>
          <p className="text-xs text-brand-700 mt-0.5 leading-relaxed">
            Changes here become available when companies configure their
            structure in Flexi HQ. Any entity you add is immediately selectable
            in the HQ organisation setup and the per-company onboarding form
            builder.
          </p>
        </div>
      </div>
    </div>
  );
}
