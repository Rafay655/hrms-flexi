// app/flexi-hq/forecast/page.tsx
"use client";

import React, { useState } from "react";
import {
  TrendingUp,
  Calendar,
  RefreshCw,
  Info,
  Sparkles,
  Zap,
  BarChart3,
  ChevronRight,
  BrainCircuit,
  AlertTriangle,
  Users,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  ComposedChart,
} from "recharts";

export default function LeaveForecast() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [years, setYears] = useState("2");

  const handleGenerate = () => {
    setIsGenerating(true);
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1500)),
      {
        loading: "Generating forecast...",
        success: `Forecast generated using ${years} years of historical data.`,
        error: "Failed to generate forecast",
      }
    );
    setTimeout(() => setIsGenerating(false), 1500);
  };

  const handleImplementAdvisories = () => {
    toast.success("Advisories Implemented", {
      description: "Policy recommendations have been applied.",
    });
  };

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const actualData = [45, 30, 40, 55, 60, 85, 75, 50, 45, 55, 65, 95];
  const forecastData = [48, 35, 82, 50, 58, 88, 70, 48, 52, 60, 68, 98];

  // Transform data for Recharts
  const chartData = months.map((month, i) => ({
    month,
    actual: actualData[i],
    forecast: forecastData[i],
    confidenceUpper: forecastData[i] + 10,
    confidenceLower: Math.max(0, forecastData[i] - 10),
  }));

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="text-xs font-bold text-brand-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-xs" style={{ color: entry.color }}>
              {entry.name}: {entry.value} days
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto w-full space-y-6 bg-white min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-800">
            <BrainCircuit className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-brand-900">Leave Forecast</h1>
            <p className="text-sm text-brand-700">
              Predictive modeling of workforce availability based on historical patterns.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Select value={years} onValueChange={setYears}>
            <SelectTrigger className="w-[120px] border-gray-200 text-brand-800">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 Year Data</SelectItem>
              <SelectItem value="2">2 Years Data</SelectItem>
              <SelectItem value="3">3 Years Data</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="bg-brand-800 hover:bg-brand-900 text-white"
          >
            {isGenerating ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2 text-brand-200" />
            )}
            Generate New Forecast
          </Button>
        </div>
      </div>

      {/* Prediction Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 rounded-xl bg-red-100 text-red-700">
                <TrendingUp className="h-5 w-5" />
              </div>
              <Badge className="bg-red-100 text-red-700 border-red-200">Peak Period</Badge>
            </div>
            <h4 className="text-lg font-bold text-brand-900">Dec 24 - Jan 02</h4>
            <p className="text-sm text-brand-700 mt-1">
              Expected 85% of Engineering to apply for leave.
            </p>
          </CardContent>
        </Card>

        <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-brand-200">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 rounded-xl bg-brand-100 text-brand-800">
                <Zap className="h-5 w-5" />
              </div>
              <Badge className="bg-brand-100 text-brand-800 border-brand-200">High Probability</Badge>
            </div>
            <h4 className="text-lg font-bold text-brand-900">Marketing: March</h4>
            <p className="text-sm text-brand-700 mt-1">
              85% confidence score for increased sick leave duration.
            </p>
          </CardContent>
        </Card>

        <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 rounded-xl bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                Optimal Window
              </Badge>
            </div>
            <h4 className="text-lg font-bold text-brand-900">Feb 01 - Feb 14</h4>
            <p className="text-sm text-brand-700 mt-1">
              Lowest forecasted leave volume. Ideal for major releases.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chart Section */}
      <Card className="border-gray-200 shadow-sm overflow-hidden">
        <CardHeader className="border-b border-gray-200 bg-brand-50/30 px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg text-brand-900 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-brand-800" />
                12-Month Projection (2025)
              </CardTitle>
              <p className="text-sm text-brand-700 mt-1">
                Confidence Band: 92% based on {years} years of historical data
              </p>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 bg-brand-800 rounded-full" />
                <span className="text-xs font-medium text-brand-700">Actual (2024)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 border-t-2 border-dashed border-brand-500" />
                <span className="text-xs font-medium text-brand-700">Forecast (2025)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-brand-100 rounded" />
                <span className="text-xs font-medium text-brand-700">Confidence Band</span>
              </div>
            </div>
          </div>
        </CardHeader>
      <CardContent className="p-6">
  <div className="h-[400px] w-full">
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart
        data={chartData}
        margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />

        <XAxis
          dataKey="month"
          axisLine={false}
          tickLine={false}
          tick={{ fill: "#6B7280", fontSize: 12, fontWeight: 500 }}
        />

        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: "#6B7280", fontSize: 12, fontWeight: 500 }}
          domain={[0, 110]}
        />

        <Tooltip content={<CustomTooltip />} />

        <Line
          type="monotone"
          dataKey="actual"
          name="Actual"
          stroke="#4F46E5"
          strokeWidth={3}
          dot={{ fill: "#4F46E5", strokeWidth: 2, r: 4, stroke: "#FFFFFF" }}
          activeDot={{ r: 6 }}
        />

        <Line
          type="monotone"
          dataKey="forecast"
          name="Forecast"
          stroke="#818CF8"
          strokeWidth={2}
          strokeDasharray="8 6"
          dot={{ fill: "#818CF8", strokeWidth: 2, r: 4, stroke: "#FFFFFF" }}
          activeDot={{ r: 6 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  </div>
</CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Insights & Analysis */}
        <div className="lg:col-span-7 space-y-6">
          <h3 className="text-sm font-bold text-brand-700 uppercase tracking-wider flex items-center gap-2 px-2">
            <Info className="h-4 w-4 text-brand-800" /> Strategic Insights
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-gray-200 shadow-sm">
              <CardContent className="p-6 space-y-3">
                <div className="flex items-center gap-2 text-emerald-700">
                  <Users className="h-5 w-5" />
                  <h4 className="font-bold text-sm uppercase">Engineering Trends</h4>
                </div>
                <p className="text-sm text-brand-700 leading-relaxed">
                  Predictable peaks in Summer (June-July) correlate with school vacations. Recommend
                  restricting critical updates during these windows.
                </p>
              </CardContent>
            </Card>

            <Card className="border-gray-200 shadow-sm">
              <CardContent className="p-6 space-y-3">
                <div className="flex items-center gap-2 text-purple-700">
                  <Calendar className="h-5 w-5" />
                  <h4 className="font-bold text-sm uppercase">Festival Correlation</h4>
                </div>
                <p className="text-sm text-brand-700 leading-relaxed">
                  High correlation found between Eid dates and Casual Leave spikes. AI predicts a{" "}
                  <span className="font-bold text-purple-700">+45%</span> volume increase for March.
                </p>
              </CardContent>
            </Card>

            <Card className="border-gray-200 shadow-sm">
              <CardContent className="p-6 space-y-3">
                <div className="flex items-center gap-2 text-amber-700">
                  <AlertTriangle className="h-5 w-5" />
                  <h4 className="font-bold text-sm uppercase">Lapse Liability</h4>
                </div>
                <p className="text-sm text-brand-700 leading-relaxed">
                  Forecast shows significant lapse risk in Q4. Early notifications in October could
                  reduce year-end workflow bottleneck.
                </p>
              </CardContent>
            </Card>

            <Card className="border-gray-200 shadow-sm">
              <CardContent className="p-6 space-y-3">
                <div className="flex items-center gap-2 text-blue-700">
                  <BarChart3 className="h-5 w-5" />
                  <h4 className="font-bold text-sm uppercase">Resource Planning</h4>
                </div>
                <p className="text-sm text-brand-700 leading-relaxed">
                  February is the highest productivity window. Consider scheduling training or
                  off-sites for the first two weeks.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Global Impact & Action */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="bg-brand-900 border-0 shadow-lg text-white overflow-hidden">
            <CardContent className="p-8 relative">
              <div className="relative z-10 space-y-6">
                <div>
                  <h4 className="text-xl font-bold">Manager Advisory</h4>
                  <p className="text-brand-200 text-sm mt-2">
                    Recommended policy adjustments based on forecasted trends.
                  </p>
                </div>

                <div className="space-y-3">
                  {[
                    "Enable stricter coverage limits for Dec 25-31",
                    "Notify Marketing team of low balance risks by Feb 15",
                    "Plan maintenance window for Feb 05-10",
                  ].map((adv, i) => (
                    <div
                      key={i}
                      className="flex gap-3 group cursor-pointer hover:translate-x-2 transition-transform"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-brand-200 mt-2 group-hover:scale-150 transition-all" />
                      <p className="text-sm text-brand-100 group-hover:text-white transition-colors">
                        {adv}
                      </p>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={handleImplementAdvisories}
                  className="w-full bg-brand-200 text-brand-900 hover:bg-white font-semibold"
                >
                  Implement Advisories <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
              <TrendingUp className="absolute -bottom-10 -right-10 h-48 w-48 text-white/5 -rotate-12" />
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-brand-100 shrink-0">
                <BarChart3 className="h-6 w-6 text-brand-800" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-brand-900 uppercase tracking-wider">
                  Model Fidelity
                </h4>
                <p className="text-2xl font-bold text-brand-900">
                  94.2% <span className="text-sm text-brand-700 font-medium">(High)</span>
                </p>
                <p className="text-xs text-brand-700 mt-1">
                  Trained on {parseInt(years) * 12} data points including public holidays and
                  historical rosters.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}