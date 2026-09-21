"use client";

import React, { useMemo, useState } from "react";
import { useStudy } from "@/client/context/StudyContext";
import { formatDateKey, formatDurationLabel } from "@/shared/utils";
import { Flame, Trophy, Calendar, Check } from "lucide-react";

export const StreakHeatmap: React.FC = () => {
  const { sessions, streakStats, isMounted } = useStudy();
  const [hoveredCell, setHoveredCell] = useState<{
    dateStr: string;
    totalMinutes: number;
    hasStudied: boolean;
    sessionsCount: number;
  } | null>(null);

  const calendarGrid = useMemo(() => {
    const dailyMap = new Map<
      string,
      { totalMinutes: number; sessionsCount: number; hasStudied: boolean }
    >();

    sessions.forEach((s) => {
      if (!s.startTime) return;
      const key = formatDateKey(new Date(s.startTime));
      const cur = dailyMap.get(key) || {
        totalMinutes: 0,
        sessionsCount: 0,
        hasStudied: false,
      };
      cur.totalMinutes += s.durationMinutes;
      cur.sessionsCount += 1;
      if (cur.totalMinutes >= 25) {
        cur.hasStudied = true;
      }
      dailyMap.set(key, cur);
    });

    const now = new Date();
    const days: Array<{
      date: Date;
      dateKey: string;
      totalMinutes: number;
      sessionsCount: number;
      hasStudied: boolean;
      dayOfWeek: number;
    }> = [];

    const totalDays = 52 * 7;
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - totalDays + (7 - now.getDay()));

    for (let i = 0; i < totalDays; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      if (d > now) break;

      const key = formatDateKey(d);
      const data = dailyMap.get(key) || {
        totalMinutes: 0,
        sessionsCount: 0,
        hasStudied: false,
      };

      days.push({
        date: d,
        dateKey: key,
        totalMinutes: data.totalMinutes,
        sessionsCount: data.sessionsCount,
        hasStudied: data.hasStudied,
        dayOfWeek: d.getDay(),
      });
    }

    const weeks: typeof days[] = [];
    let currentWeek: typeof days = [];

    days.forEach((day) => {
      currentWeek.push(day);
      if (day.dayOfWeek === 6 || currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });
    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    return weeks;
  }, [sessions]);

  const monthLabels = useMemo(() => {
    const labels: Array<{ name: string; weekIndex: number }> = [];
    let lastMonth = -1;

    calendarGrid.forEach((week, wIndex) => {
      const firstDay = week[0];
      if (firstDay) {
        const m = firstDay.date.getMonth();
        if (m !== lastMonth) {
          labels.push({
            name: firstDay.date.toLocaleDateString("en-US", { month: "short" }),
            weekIndex: wIndex,
          });
          lastMonth = m;
        }
      }
    });

    return labels;
  }, [calendarGrid]);

  return (
    <div className="w-full space-y-5">
      {/* Title & Top Counters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-[var(--ink)] flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-500" />
            Consistency Heatmap
          </h2>
          <p className="text-xs text-[var(--ink-subtle)]">
            Days with 25+ mins study marked as active
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <div className="px-2.5 py-1 rounded bg-[var(--surface-1)] border border-[var(--hairline)] flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-[var(--ink-subtle)]">Streak:</span>
            <span className="font-mono font-bold text-[var(--ink)]">
              {isMounted ? streakStats.currentStreak : 0}d
            </span>
          </div>

          <div className="px-2.5 py-1 rounded bg-[var(--surface-1)] border border-[var(--hairline)] flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-[var(--ink-muted)]" />
            <span className="text-[var(--ink-subtle)]">Best:</span>
            <span className="font-mono font-bold text-[var(--ink)]">
              {isMounted ? streakStats.longestStreak : 0}d
            </span>
          </div>
        </div>
      </div>

      {/* Grid Panel */}
      <div className="sleek-panel p-6 sm:p-8 space-y-4 bg-[var(--surface-1)] border-[var(--hairline)]">
        {/* Hover info */}
        <div className="flex items-center justify-between min-h-[20px] text-xs">
          {hoveredCell ? (
            <div className="flex items-center gap-2 text-[var(--ink-muted)]">
              <span
                className={`w-2 h-2 rounded-xs ${
                  hoveredCell.hasStudied ? "bg-emerald-500" : "bg-[var(--surface-3)]"
                }`}
              />
              <span className="font-medium text-[var(--ink)]">{hoveredCell.dateStr}</span>
              <span className="text-[var(--ink-subtle)] font-mono">
                {hoveredCell.hasStudied
                  ? `(${formatDurationLabel(hoveredCell.totalMinutes)})`
                  : "(Rest day)"}
              </span>
            </div>
          ) : (
            <span className="text-[11px] text-[var(--ink-subtle)] font-mono">
              Hover over a cell to view history
            </span>
          )}

          <div className="flex items-center gap-1.5 text-[10px] text-[var(--ink-subtle)] font-mono">
            <span>Rest</span>
            <div className="w-2.5 h-2.5 rounded-xs bg-[var(--surface-2)] border border-[var(--hairline)]" />
            <div className="w-2.5 h-2.5 rounded-xs bg-emerald-500" />
            <span>Active</span>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="overflow-x-auto pb-2 scrollbar-none">
          <div className="min-w-[700px]">
            {/* Month Labels */}
            <div className="flex text-[10px] text-[var(--ink-subtle)] font-mono mb-2 pl-5">
              {calendarGrid.map((week, idx) => {
                const matchedMonth = monthLabels.find((m) => m.weekIndex === idx);
                return (
                  <div key={idx} className="w-3 mr-1 text-left">
                    {matchedMonth ? matchedMonth.name : ""}
                  </div>
                );
              })}
            </div>

            {/* Grid Days */}
            <div className="flex gap-1">
              <div className="flex flex-col justify-between text-[9px] text-[var(--ink-subtle)] font-mono pr-1.5 py-0.5 select-none">
                <span>M</span>
                <span className="opacity-0">T</span>
                <span>W</span>
                <span className="opacity-0">T</span>
                <span>F</span>
                <span className="opacity-0">S</span>
                <span>S</span>
              </div>

              {/* 52 Columns */}
              <div className="flex gap-1">
                {calendarGrid.map((week, wIdx) => (
                  <div key={wIdx} className="flex flex-col gap-1">
                    {week.map((day) => {
                      const isToday =
                        day.dateKey === formatDateKey(new Date());

                      return (
                        <div
                          key={day.dateKey}
                          onMouseEnter={() =>
                            setHoveredCell({
                              dateStr: day.date.toLocaleDateString("en-US", {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                              }),
                              totalMinutes: day.totalMinutes,
                              hasStudied: day.hasStudied,
                              sessionsCount: day.sessionsCount,
                            })
                          }
                          onMouseLeave={() => setHoveredCell(null)}
                          className={`w-2.5 h-2.5 rounded-xs cursor-pointer transition-transform duration-100 ${
                            day.hasStudied
                              ? "bg-emerald-500 hover:scale-125"
                              : "bg-[var(--surface-2)] hover:bg-[var(--surface-3)] border border-[var(--hairline)]"
                          } ${isToday ? "ring-1 ring-[var(--ink)]" : ""}`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-[var(--hairline)] flex items-center justify-between text-xs text-[var(--ink-subtle)]">
          <span>
            {isMounted && streakStats.todayMinutes >= 25 ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Today's streak maintained
              </span>
            ) : (
              "Complete 25+ mins today to extend streak"
            )}
          </span>

          <span className="font-mono text-[11px]">
            {isMounted ? `${streakStats.totalDaysActive} active days` : ""}
          </span>
        </div>
      </div>
    </div>
  );
};
