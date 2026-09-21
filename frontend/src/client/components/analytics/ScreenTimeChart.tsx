"use client";

import React, { useState, useMemo } from "react";
import { useStudy } from "@/client/context/StudyContext";
import { formatDurationLabel, formatDateKey } from "@/shared/utils";
import { ChevronLeft, ChevronRight, BarChart2, Clock } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";

interface ChartItem {
  label: string;
  fullDate?: string;
  dateKey?: string;
  hour?: number;
  weekIndex?: number;
  minutes: number;
  hours: number;
  subjectMap: { [key: string]: number };
}

type Timeframe = "day" | "week" | "month";

export const ScreenTimeChart: React.FC = () => {
  const { sessions, subjects, isMounted } = useStudy();
  const [timeframe, setTimeframe] = useState<Timeframe>("week");
  const [offsetIndex, setOffsetIndex] = useState<number>(0);

  const chartData: { items: ChartItem[]; title: string } = useMemo(() => {
    const now = new Date();

    if (timeframe === "day") {
      const targetDate = new Date(now);
      targetDate.setDate(now.getDate() - offsetIndex);
      const dateKey = formatDateKey(targetDate);

      const hourBuckets: ChartItem[] = Array.from({ length: 24 }, (_, h) => {
        const label =
          h === 0 ? "12a" : h < 12 ? `${h}a` : h === 12 ? "12p" : `${h - 12}p`;
        return {
          label,
          hour: h,
          hours: 0,
          minutes: 0,
          subjectMap: {} as { [key: string]: number },
        };
      });

      sessions.forEach((s) => {
        if (!s.startTime) return;
        const sDate = new Date(s.startTime);
        if (formatDateKey(sDate) === dateKey) {
          const hour = sDate.getHours();
          if (hourBuckets[hour]) {
            hourBuckets[hour].minutes += s.durationMinutes;
            hourBuckets[hour].hours = Number((hourBuckets[hour].minutes / 60).toFixed(2));
            hourBuckets[hour].subjectMap[s.subjectName] =
              (hourBuckets[hour].subjectMap[s.subjectName] || 0) + s.durationMinutes;
          }
        }
      });

      return {
        items: hourBuckets.filter((_, idx) => idx % 2 === 0),
        title: targetDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
      };
    } else if (timeframe === "week") {
      const currentDay = now.getDay();
      const diffToMonday = (currentDay === 0 ? -6 : 1) - currentDay;
      const monday = new Date(now);
      monday.setDate(now.getDate() + diffToMonday - offsetIndex * 7);

      const days: ChartItem[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((name, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        const key = formatDateKey(d);
        return {
          label: name,
          fullDate: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          dateKey: key,
          minutes: 0,
          hours: 0,
          subjectMap: {} as { [key: string]: number },
        };
      });

      sessions.forEach((s) => {
        if (!s.startTime) return;
        const key = formatDateKey(new Date(s.startTime));
        const dayItem = days.find((d) => d.dateKey === key);
        if (dayItem) {
          dayItem.minutes += s.durationMinutes;
          dayItem.hours = Number((dayItem.minutes / 60).toFixed(2));
          dayItem.subjectMap[s.subjectName] =
            (dayItem.subjectMap[s.subjectName] || 0) + s.durationMinutes;
        }
      });

      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      const title = `${monday.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${sunday.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;

      return { items: days, title };
    } else {
      const weeks: ChartItem[] = Array.from({ length: 4 }, (_, i) => {
        const weekNum = 4 - i;
        return {
          label: `W${weekNum}`,
          weekIndex: i,
          minutes: 0,
          hours: 0,
          subjectMap: {} as { [key: string]: number },
        };
      });

      sessions.forEach((s) => {
        if (!s.startTime) return;
        const sDate = new Date(s.startTime);
        const diffDays = Math.floor(
          (now.getTime() - sDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        const weekIdx = Math.floor(diffDays / 7);
        if (weekIdx >= 0 && weekIdx < 4) {
          const targetSlot = 3 - weekIdx;
          if (weeks[targetSlot]) {
            weeks[targetSlot].minutes += s.durationMinutes;
            weeks[targetSlot].hours = Number((weeks[targetSlot].minutes / 60).toFixed(2));
            weeks[targetSlot].subjectMap[s.subjectName] =
              (weeks[targetSlot].subjectMap[s.subjectName] || 0) + s.durationMinutes;
          }
        }
      });

      return {
        items: weeks,
        title: "Past 4 Weeks",
      };
    }
  }, [sessions, timeframe, offsetIndex]);

  const summaryMetrics = useMemo(() => {
    let totalMinutes = 0;
    const subjectTotals: { [name: string]: { minutes: number; color: string } } = {};

    chartData.items.forEach((item) => {
      totalMinutes += item.minutes;
      Object.entries(item.subjectMap).forEach(([subName, mins]) => {
        const matchedSub = subjects.find((s) => s.name === subName);
        const color = matchedSub?.color || "#a1a1aa";
        if (!subjectTotals[subName]) {
          subjectTotals[subName] = { minutes: 0, color };
        }
        subjectTotals[subName].minutes += mins;
      });
    });

    const divisor = timeframe === "day" ? 1 : timeframe === "week" ? 7 : 28;
    const dailyAverageMinutes = Math.round(totalMinutes / divisor);

    return {
      totalMinutes,
      dailyAverageMinutes,
      subjectBreakdown: Object.entries(subjectTotals).sort(
        (a, b) => b[1].minutes - a[1].minutes
      ),
    };
  }, [chartData, timeframe, subjects]);

  return (
    <div className="w-full space-y-5">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-[var(--ink)] flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-[var(--ink-muted)]" />
            Daily & Hourly Activity
          </h2>
          <p className="text-xs text-[var(--ink-subtle)]">
            Hourly timeline and historical activity distribution
          </p>
        </div>

        {/* Timeframe Switcher */}
        <div className="flex items-center gap-2">
          <div className="inline-flex p-0.5 rounded bg-[var(--surface-1)] border border-[var(--hairline)]">
            {(["day", "week", "month"] as Timeframe[]).map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTimeframe(t);
                  setOffsetIndex(0);
                }}
                className={`px-2.5 py-1 text-xs font-medium rounded capitalize transition-all cursor-pointer ${
                  timeframe === t
                    ? "bg-[var(--surface-3)] text-[var(--ink)] font-semibold shadow-xs"
                    : "text-[var(--ink-subtle)] hover:text-[var(--ink)]"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setOffsetIndex((prev) => prev + 1)}
              className="p-1 rounded text-[var(--ink-subtle)] hover:text-[var(--ink)] bg-[var(--surface-1)] border border-[var(--hairline)] transition-all cursor-pointer"
              title="Previous period"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setOffsetIndex((prev) => Math.max(0, prev - 1))}
              disabled={offsetIndex === 0}
              className={`p-1 rounded text-[var(--ink-subtle)] bg-[var(--surface-1)] border border-[var(--hairline)] transition-all ${
                offsetIndex === 0
                  ? "opacity-30 cursor-not-allowed"
                  : "hover:text-[var(--ink)] cursor-pointer"
              }`}
              title="Next period"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Screen Time Main Container */}
      <div className="sleek-panel p-6 sm:p-8 space-y-6 bg-[var(--surface-1)] border-[var(--hairline)]">
        {/* Top Metric Header */}
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-5 border-b border-[var(--hairline)]">
          <div>
            <span className="text-[11px] font-mono text-[var(--ink-subtle)]">
              {chartData.title}
            </span>
            <div className="text-3xl sm:text-4xl font-mono font-bold tracking-tight text-[var(--ink)] mt-1">
              {isMounted ? formatDurationLabel(summaryMetrics.totalMinutes) : "0h 0m"}
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div>
              <div className="text-[11px] text-[var(--ink-subtle)] flex items-center gap-1">
                <Clock className="w-3 h-3 text-[var(--ink-muted)]" />
                Daily Average
              </div>
              <div className="text-sm font-mono font-semibold text-[var(--ink)] mt-0.5">
                {isMounted ? formatDurationLabel(summaryMetrics.dailyAverageMinutes) : "0m"}
              </div>
            </div>
          </div>
        </div>

        {/* Minimalist Bar Chart */}
        <div className="h-56 sm:h-64 w-full pt-2">
          {isMounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData.items}
                margin={{ top: 10, right: 0, left: -25, bottom: 0 }}
              >
                <XAxis
                  dataKey="label"
                  stroke="var(--ink-subtle)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="var(--ink-subtle)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  unit="h"
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as ChartItem;
                      return (
                        <div className="sleek-card p-2.5 text-xs space-y-1 bg-[var(--surface-1)] border-[var(--hairline-strong)] shadow-xl">
                          <p className="font-semibold text-[var(--ink)]">
                            {data.label} {data.fullDate ? `(${data.fullDate})` : ""}
                          </p>
                          <p className="font-mono text-[var(--ink-muted)]">
                            Total: {formatDurationLabel(data.minutes)}
                          </p>
                          {Object.entries(data.subjectMap || {}).length > 0 && (
                            <div className="pt-1 border-t border-[var(--hairline)] space-y-0.5">
                              {Object.entries(data.subjectMap).map(([sub, mins]) => (
                                <div
                                  key={sub}
                                  className="flex items-center justify-between gap-4 text-[11px] text-[var(--ink-subtle)]"
                                >
                                  <span>{sub}</span>
                                  <span className="font-mono text-[var(--ink)]">{formatDurationLabel(mins)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="hours"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                >
                  {chartData.items.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.minutes > 0 ? "var(--chart-fill)" : "var(--chart-empty)"}
                      className="transition-colors hover:opacity-80"
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-[var(--ink-subtle)]">
              Loading analytics...
            </div>
          )}
        </div>

        {/* Minimalist Subject Breakdown */}
        {isMounted && summaryMetrics.subjectBreakdown.length > 0 && (
          <div className="pt-5 border-t border-[var(--hairline)] space-y-2">
            <span className="text-[11px] font-mono text-[var(--ink-subtle)]">
              Distribution
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {summaryMetrics.subjectBreakdown.map(([subName, data]) => {
                const percentage =
                  summaryMetrics.totalMinutes > 0
                    ? Math.round((data.minutes / summaryMetrics.totalMinutes) * 100)
                    : 0;

                return (
                  <div
                    key={subName}
                    className="flex items-center justify-between p-2 rounded bg-[var(--surface-2)] border border-[var(--hairline)]"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: data.color }}
                      />
                      <span className="text-xs text-[var(--ink)] truncate font-medium">
                        {subName}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs font-mono text-[var(--ink-muted)]">
                        {formatDurationLabel(data.minutes)}
                      </span>
                      <span className="text-[10px] font-mono px-1 rounded bg-[var(--surface-3)] text-[var(--ink-muted)]">
                        {percentage}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
