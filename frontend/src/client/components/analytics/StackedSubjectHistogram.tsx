"use client";

import React, { useState, useMemo } from "react";
import { useStudy } from "@/client/context/StudyContext";
import { formatDurationLabel, formatDateKey } from "@/shared/utils";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { ChevronLeft, ChevronRight, BarChart3 } from "lucide-react";

type HistogramRange = "7d" | "14d" | "30d";

export const StackedSubjectHistogram: React.FC = () => {
  const { sessions, subjects, isMounted } = useStudy();
  const [range, setRange] = useState<HistogramRange>("14d");
  const [offsetIndex, setOffsetIndex] = useState<number>(0);
  const [hiddenSubjects, setHiddenSubjects] = useState<Set<string>>(new Set());

  const numDays = range === "7d" ? 7 : range === "14d" ? 14 : 30;

  // Generate stacked chart data
  const { chartData, uniqueSubjectKeys, dailyAverageMinutes, dateRangeTitle } = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const endDate = new Date(now);
    endDate.setDate(now.getDate() - offsetIndex * numDays);

    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - numDays + 1);

    const daysList: Array<{
      dateKey: string;
      label: string;
      fullDate: string;
      totalMinutes: number;
      [subjectKey: string]: any;
    }> = [];

    const subjectSet = new Set<string>();

    for (let i = 0; i < numDays; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const key = formatDateKey(d);

      const label = d.toLocaleDateString("en-US", {
        weekday: numDays <= 14 ? "short" : undefined,
        day: "numeric",
        month: numDays > 14 ? "numeric" : undefined,
      });

      const fullDate = d.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });

      daysList.push({
        dateKey: key,
        label,
        fullDate,
        totalMinutes: 0,
      });
    }

    let totalPeriodMinutes = 0;

    // Aggregate sessions by day and subject
    sessions.forEach((s) => {
      if (!s.startTime) return;
      const sKey = formatDateKey(new Date(s.startTime));
      const dayItem = daysList.find((d) => d.dateKey === sKey);
      if (dayItem) {
        const subName = s.subjectName || "General";
        subjectSet.add(subName);

        const currentMins = (dayItem[subName] || 0) + s.durationMinutes;
        dayItem[subName] = currentMins;
        dayItem.totalMinutes += s.durationMinutes;
        totalPeriodMinutes += s.durationMinutes;
      }
    });

    const activeDaysCount = daysList.length;
    const avgMins = activeDaysCount > 0 ? Math.round(totalPeriodMinutes / activeDaysCount) : 0;
    const avgHours = Number((avgMins / 60).toFixed(2));

    const dateRangeTitle = `${startDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })} – ${endDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })}`;

    const formattedData = daysList.map((d) => {
      const item: any = {
        ...d,
        totalHours: Number((d.totalMinutes / 60).toFixed(2)),
      };
      subjectSet.forEach((subName) => {
        const mins = d[subName] || 0;
        item[`${subName}_hours`] = Number((mins / 60).toFixed(2));
        item[`${subName}_mins`] = mins;
      });
      return item;
    });

    return {
      chartData: formattedData,
      uniqueSubjectKeys: Array.from(subjectSet),
      dailyAverageMinutes: avgMins,
      dailyAverageHours: avgHours,
      dateRangeTitle,
    };
  }, [sessions, range, offsetIndex, numDays]);

  const toggleSubject = (subName: string) => {
    setHiddenSubjects((prev) => {
      const next = new Set(prev);
      if (next.has(subName)) {
        next.delete(subName);
      } else {
        next.add(subName);
      }
      return next;
    });
  };

  // Get color for subject
  const getSubjectColor = (subName: string, idx: number) => {
    const matched = subjects.find((s) => s.name === subName);
    if (matched) return matched.color;
    const fallbackPalette = [
      "#38bdf8",
      "#10b981",
      "#f59e0b",
      "#f43f5e",
      "#a855f7",
      "#6366f1",
      "#14b8a6",
      "#ec4899",
      "#71717a",
    ];
    return fallbackPalette[idx % fallbackPalette.length];
  };

  const avgHoursFormatted = Number((dailyAverageMinutes / 60).toFixed(2));

  return (
    <div className="w-full space-y-5">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold tracking-tight text-[var(--ink)] flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-500" />
              Subject Time Distribution
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[var(--surface-2)] text-[var(--ink-muted)] border border-[var(--hairline)]">
              Stacked Histogram
            </span>
          </div>
          <p className="text-xs text-[var(--ink-subtle)] mt-0.5">
            Color-coded study duration per subject with daily average benchmark
          </p>
        </div>

        {/* Range switcher & offsets */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex p-0.5 rounded bg-[var(--surface-1)] border border-[var(--hairline)]">
            {(["7d", "14d", "30d"] as HistogramRange[]).map((r) => (
              <button
                key={r}
                onClick={() => {
                  setRange(r);
                  setOffsetIndex(0);
                }}
                className={`px-2.5 py-1 text-xs font-medium rounded capitalize transition-all cursor-pointer ${
                  range === r
                    ? "bg-[var(--surface-3)] text-[var(--ink)] font-semibold shadow-xs"
                    : "text-[var(--ink-subtle)] hover:text-[var(--ink)]"
                }`}
              >
                {r === "7d" ? "7 Days" : r === "14d" ? "14 Days" : "30 Days"}
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

      {/* Main Panel */}
      <div className="sleek-panel p-5 sm:p-7 bg-[var(--surface-1)] border-[var(--hairline)] space-y-5">
        {/* Top Legend */}
        <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-[var(--hairline)]">
          <div className="flex items-center gap-2 flex-wrap">
            {uniqueSubjectKeys.map((subName, idx) => {
              const isHidden = hiddenSubjects.has(subName);
              const color = getSubjectColor(subName, idx);

              return (
                <button
                  key={subName}
                  onClick={() => toggleSubject(subName)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs transition-all cursor-pointer ${
                    isHidden
                      ? "opacity-40 line-through bg-[var(--surface-2)] text-[var(--ink-subtle)] border border-[var(--hairline)]"
                      : "bg-[var(--surface-2)] text-[var(--ink)] border border-[var(--hairline)] hover:border-[var(--hairline-strong)]"
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-xs"
                    style={{ backgroundColor: color }}
                  />
                  <span className="font-medium text-[11px]">{subName}</span>
                </button>
              );
            })}
          </div>

          <span className="text-[11px] font-mono text-[var(--ink-subtle)]">
            {dateRangeTitle}
          </span>
        </div>

        {/* Stacked Bar Chart */}
        <div className="h-64 sm:h-80 w-full pt-2">
          {isMounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 25, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  stroke="var(--hairline)"
                  strokeDasharray="2 2"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  stroke="var(--ink-subtle)"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: "var(--hairline)" }}
                  interval={0}
                />
                <YAxis
                  stroke="var(--ink-subtle)"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: "var(--hairline)" }}
                  unit="h"
                  domain={[0, (dataMax: number) => Math.max(Math.ceil(dataMax * 1.15), 3)]}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="sleek-card p-3 text-xs space-y-1.5 bg-[var(--surface-1)] border-[var(--hairline-strong)] shadow-xl">
                          <p className="font-semibold text-[var(--ink)]">
                            {data.fullDate}
                          </p>
                          <p className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                            Total: {formatDurationLabel(data.totalMinutes)}
                          </p>
                          <div className="pt-1.5 border-t border-[var(--hairline)] space-y-1">
                            {uniqueSubjectKeys.map((subName, i) => {
                              const mins = data[`${subName}_mins`] || 0;
                              if (mins === 0 || hiddenSubjects.has(subName)) return null;
                              const color = getSubjectColor(subName, i);
                              return (
                                <div
                                  key={subName}
                                  className="flex items-center justify-between gap-4 text-[11px]"
                                >
                                  <div className="flex items-center gap-1.5">
                                    <span
                                      className="w-2 h-2 rounded-xs"
                                      style={{ backgroundColor: color }}
                                    />
                                    <span className="text-[var(--ink-muted)]">{subName}</span>
                                  </div>
                                  <span className="font-mono text-[var(--ink)] font-medium">
                                    {formatDurationLabel(mins)}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />

                {/* Daily Average Benchmark Reference Line */}
                {avgHoursFormatted > 0 && (
                  <ReferenceLine
                    y={avgHoursFormatted}
                    stroke="var(--ink)"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    label={{
                      value: `${formatDurationLabel(dailyAverageMinutes)} Ø studied daily`,
                      position: "right",
                      fill: "var(--ink)",
                      fontSize: 10,
                      fontWeight: 600,
                      className: "font-mono",
                    }}
                  />
                )}

                {/* Stacked Bars for each unique subject */}
                {uniqueSubjectKeys.map((subName, idx) => {
                  if (hiddenSubjects.has(subName)) return null;
                  const color = getSubjectColor(subName, idx);
                  const isTopStack = idx === uniqueSubjectKeys.length - 1;

                  return (
                    <Bar
                      key={subName}
                      dataKey={`${subName}_hours`}
                      stackId="studyStack"
                      fill={color}
                      radius={isTopStack ? [3, 3, 0, 0] : [0, 0, 0, 0]}
                      maxBarSize={38}
                    />
                  );
                })}
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-[var(--ink-subtle)]">
              Loading subject distribution...
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between pt-3 border-t border-[var(--hairline)] text-xs text-[var(--ink-subtle)] font-mono">
          <span>
            Daily Average:{" "}
            <strong className="text-[var(--ink)]">
              {isMounted ? formatDurationLabel(dailyAverageMinutes) : "0m"}
            </strong>
          </span>
          <span>
            Subjects: <strong className="text-[var(--ink)]">{uniqueSubjectKeys.length}</strong>
          </span>
        </div>
      </div>
    </div>
  );
};
