"use client";

import React, { useState, useMemo } from "react";
import { StudyProvider, useStudy } from "@/client/context/StudyContext";
import { Navbar } from "@/client/components/layout/Navbar";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Check,
  X,
  Sparkles,
  Flame,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const COLOR_PRESETS = [
  "#10b981",
  "#38bdf8",
  "#f59e0b",
  "#a855f7",
  "#ec4899",
  "#6366f1",
  "#14b8a6",
  "#f43f5e",
  "#71717a",
];

function HabitTrackerContent() {
  const { habits, addHabit, deleteHabit, toggleHabitDay, isMounted } = useStudy();
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newHabitName, setNewHabitName] = useState("");
  const [newHabitColor, setNewHabitColor] = useState(COLOR_PRESETS[0]);
  const [activeTab, setActiveTab] = useState<"timer" | "screentime" | "heatmap" | "history" | "habit">("habit");

  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth(); // 0-indexed

  // Days in selected month
  const daysInMonth = useMemo(() => {
    return new Date(year, month + 1, 0).getDate();
  }, [year, month]);

  const monthLabel = useMemo(() => {
    return selectedDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }, [selectedDate]);

  const monthPrefix = useMemo(() => {
    const mStr = String(month + 1).padStart(2, "0");
    return `${year}-${mStr}`;
  }, [year, month]);

  const todayKey = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }, []);

  const daysArray = useMemo(() => {
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  }, [daysInMonth]);

  // Daily summary for the zig-zag chart
  const chartData = useMemo(() => {
    return daysArray.map((dayNum) => {
      const dateKey = `${monthPrefix}-${String(dayNum).padStart(2, "0")}`;
      let completedCount = 0;
      const completedNames: string[] = [];

      habits.forEach((h) => {
        const comp = (h.completions || []).find((c) => c.date === dateKey && c.completed);
        if (comp) {
          completedCount += 1;
          completedNames.push(h.name);
        }
      });

      return {
        day: dayNum,
        dateKey,
        count: completedCount,
        completedNames,
      };
    });
  }, [daysArray, monthPrefix, habits]);

  // Summary Metrics
  const stats = useMemo(() => {
    const totalPossible = habits.length * daysInMonth;
    let totalCompleted = 0;
    let todayCompleted = 0;

    chartData.forEach((d) => {
      totalCompleted += d.count;
      if (d.dateKey === todayKey) {
        todayCompleted = d.count;
      }
    });

    const rate = totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;

    return {
      totalHabits: habits.length,
      todayCompleted,
      monthlyRate: rate,
      totalCompleted,
    };
  }, [habits, daysInMonth, chartData, todayKey]);

  const handlePrevMonth = () => {
    setSelectedDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setSelectedDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleCurrentMonth = () => {
    setSelectedDate(new Date());
  };

  const handleCreateHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;
    await addHabit({
      name: newHabitName.trim(),
      color: newHabitColor,
    });
    setNewHabitName("");
    setIsAddModalOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--canvas)] text-[var(--ink)] antialiased">
      <Navbar
        activeTab={activeTab as "timer" | "screentime" | "heatmap" | "history"}
        setActiveTab={(t) => {
          if (t === "timer" || t === "screentime" || t === "heatmap" || t === "history") {
            window.location.href = `/?tab=${t}`;
          }
        }}
        onOpenSubjectModal={() => {}}
      />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Top Header & Month Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-[var(--ink)] flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-500" />
                Habit Journal
              </h1>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-medium">
                Monthly Matrix
              </span>
            </div>
            <p className="text-xs text-[var(--ink-subtle)] mt-0.5">
              Daily habit completion zig-zag curve & bullet journal dot matrix
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Month Navigator */}
            <div className="flex items-center gap-1 bg-[var(--surface-1)] p-1 rounded-md border border-[var(--hairline)]">
              <button
                onClick={handlePrevMonth}
                className="p-1 rounded text-[var(--ink-subtle)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
                title="Previous month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleCurrentMonth}
                className="px-2 py-0.5 text-xs font-semibold text-[var(--ink)] hover:text-emerald-500 transition-colors cursor-pointer"
              >
                {monthLabel}
              </button>
              <button
                onClick={handleNextMonth}
                className="p-1 rounded text-[var(--ink-subtle)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
                title="Next month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="btn-primary text-xs cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Habit</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="sleek-card p-3 flex flex-col justify-between">
            <span className="text-[11px] text-[var(--ink-subtle)] font-medium">Active Habits</span>
            <div className="text-base font-mono font-bold text-[var(--ink)] mt-1">
              {isMounted ? stats.totalHabits : 0}
            </div>
          </div>

          <div className="sleek-card p-3 flex flex-col justify-between">
            <span className="text-[11px] text-[var(--ink-subtle)] font-medium">Done Today</span>
            <div className="text-base font-mono font-bold text-[var(--ink)] mt-1 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-emerald-500" />
              <span>
                {isMounted ? `${stats.todayCompleted} / ${stats.totalHabits}` : "0"}
              </span>
            </div>
          </div>

          <div className="sleek-card p-3 flex flex-col justify-between">
            <span className="text-[11px] text-[var(--ink-subtle)] font-medium">Monthly Rate</span>
            <div className="text-base font-mono font-bold text-[var(--ink)] mt-1">
              {isMounted ? `${stats.monthlyRate}%` : "0%"}
            </div>
          </div>

          <div className="sleek-card p-3 flex flex-col justify-between">
            <span className="text-[11px] text-[var(--ink-subtle)] font-medium">Total Check-ins</span>
            <div className="text-base font-mono font-bold text-[var(--ink)] mt-1">
              {isMounted ? stats.totalCompleted : 0}
            </div>
          </div>
        </div>

        {/* 1. Top Zig-Zag Line Graph */}
        <div className="sleek-panel p-5 sm:p-6 bg-[var(--surface-1)] border-[var(--hairline)] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-semibold text-[var(--ink)] uppercase tracking-wider font-mono">
                Daily Completion Curve ({monthLabel})
              </h2>
              <span className="text-[11px] text-[var(--ink-subtle)]">
                (Peak points = count of completed habits)
              </span>
            </div>
            <div className="text-xs font-mono text-[var(--ink-subtle)]">
              Max: {habits.length} habits
            </div>
          </div>

          <div className="h-44 sm:h-52 w-full pt-2">
            {isMounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                >
                  <CartesianGrid
                    stroke="var(--hairline)"
                    strokeDasharray="2 2"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="day"
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
                    domain={[0, Math.max(habits.length, 3)]}
                    allowDecimals={false}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="sleek-card p-2.5 text-xs space-y-1 bg-[var(--surface-1)] border-[var(--hairline-strong)] shadow-xl">
                            <p className="font-semibold text-[var(--ink)]">
                              Day {data.day} ({data.dateKey})
                            </p>
                            <p className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                              {data.count} / {habits.length} habits completed
                            </p>
                            {data.completedNames.length > 0 && (
                              <div className="pt-1 border-t border-[var(--hairline)] space-y-0.5 text-[11px] text-[var(--ink-muted)]">
                                {data.completedNames.map((name: string) => (
                                  <div key={name} className="flex items-center gap-1.5">
                                    <Check className="w-3 h-3 text-emerald-500" />
                                    <span>{name}</span>
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
                  <Line
                    type="linear"
                    dataKey="count"
                    stroke="var(--chart-line)"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "var(--chart-line)", stroke: "var(--canvas)", strokeWidth: 1.5 }}
                    activeDot={{ r: 5, fill: "#10b981" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-[var(--ink-subtle)]">
                Loading habit graph...
              </div>
            )}
          </div>
        </div>

        {/* 2. Bullet Journal Dot Matrix Table */}
        <div className="sleek-panel p-4 sm:p-6 bg-[var(--surface-1)] border-[var(--hairline)] space-y-3 overflow-hidden">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--hairline)]">
            <span className="text-xs font-semibold text-[var(--ink)] uppercase tracking-wider font-mono">
              Monthly Habit Log
            </span>
            <span className="text-[11px] text-[var(--ink-subtle)] font-mono">
              Click any day cell to toggle completion
            </span>
          </div>

          <div className="overflow-x-auto pb-2 scrollbar-none">
            <table className="w-full border-collapse select-none min-w-[750px]">
              <thead>
                <tr>
                  <th className="text-left text-xs font-medium text-[var(--ink-subtle)] py-2 pr-3 w-48 sticky left-0 bg-[var(--surface-1)] z-10">
                    Habit
                  </th>
                  {daysArray.map((dayNum) => {
                    const dateKey = `${monthPrefix}-${String(dayNum).padStart(2, "0")}`;
                    const isToday = dateKey === todayKey;

                    return (
                      <th
                        key={dayNum}
                        className={`text-center text-[10px] font-mono py-2 px-1 w-7 ${
                          isToday
                            ? "text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 rounded-t"
                            : "text-[var(--ink-subtle)]"
                        }`}
                      >
                        {dayNum}
                      </th>
                    );
                  })}
                  <th className="text-right text-[11px] font-mono text-[var(--ink-subtle)] py-2 pl-3 w-14">
                    Total
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[var(--hairline)]">
                {habits.length === 0 ? (
                  <tr>
                    <td
                      colSpan={daysInMonth + 2}
                      className="text-center py-8 text-xs text-[var(--ink-subtle)]"
                    >
                      No habits added yet. Click "+ New Habit" to create one.
                    </td>
                  </tr>
                ) : (
                  habits.map((habit) => {
                    const habitCompletions = habit.completions || [];
                    const completedThisMonth = daysArray.filter((d) => {
                      const dKey = `${monthPrefix}-${String(d).padStart(2, "0")}`;
                      return habitCompletions.some((c) => c.date === dKey && c.completed);
                    }).length;

                    return (
                      <tr
                        key={habit.id}
                        className="group hover:bg-[var(--surface-2)] transition-colors"
                      >
                        {/* Habit Name Column (Sticky) */}
                        <td className="py-2.5 pr-3 text-xs font-medium text-[var(--ink)] sticky left-0 bg-[var(--surface-1)] group-hover:bg-[var(--surface-2)] transition-colors z-10">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className="w-2 h-2 rounded-full flex-shrink-0"
                                style={{ backgroundColor: habit.color }}
                              />
                              <span className="truncate">{habit.name}</span>
                            </div>
                            <button
                              onClick={() => {
                                if (confirm(`Delete habit "${habit.name}"?`)) {
                                  deleteHabit(habit.id);
                                }
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 text-[var(--ink-subtle)] hover:text-red-500 transition-opacity cursor-pointer flex-shrink-0"
                              title="Delete habit"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </td>

                        {/* Day Columns */}
                        {daysArray.map((dayNum) => {
                          const dateKey = `${monthPrefix}-${String(dayNum).padStart(2, "0")}`;
                          const isDone = habitCompletions.some(
                            (c) => c.date === dateKey && c.completed
                          );
                          const isToday = dateKey === todayKey;

                          return (
                            <td
                              key={dayNum}
                              onClick={() => toggleHabitDay(habit.id, dateKey, !isDone)}
                              className={`text-center py-2 px-1 cursor-pointer transition-all duration-150 ${
                                isToday ? "bg-emerald-500/10" : ""
                              } hover:bg-[var(--surface-3)]`}
                              title={`${habit.name} - Day ${dayNum}`}
                            >
                              <div className="w-6 h-6 mx-auto flex items-center justify-center rounded text-xs font-bold font-mono">
                                {isDone ? (
                                  <span
                                    className="transform scale-110 font-black animate-scale-in"
                                    style={{ color: habit.color || "var(--ink)" }}
                                  >
                                    ✕
                                  </span>
                                ) : (
                                  <span className="text-[var(--ink-subtle)]/40 text-sm leading-none">•</span>
                                )}
                              </div>
                            </td>
                          );
                        })}

                        {/* Total column */}
                        <td className="py-2.5 pl-3 text-right font-mono text-xs font-semibold text-[var(--ink-muted)]">
                          {completedThisMonth}
                        </td>
                      </tr>
                    );
                  })
                )}

                {/* Bottom Daily Sum Row */}
                {habits.length > 0 && (
                  <tr className="border-t-2 border-[var(--hairline-strong)] font-mono text-xs text-[var(--ink-muted)]">
                    <td className="py-2.5 pr-3 text-left font-semibold sticky left-0 bg-[var(--surface-1)] z-10 text-[var(--ink)]">
                      Daily Total
                    </td>
                    {chartData.map((d) => {
                      const isToday = d.dateKey === todayKey;
                      return (
                        <td
                          key={d.day}
                          className={`text-center py-2.5 px-1 font-bold ${
                            isToday ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "text-[var(--ink)]"
                          }`}
                        >
                          {d.count > 0 ? d.count : "·"}
                        </td>
                      );
                    })}
                    <td className="py-2.5 pl-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      {stats.totalCompleted}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* New Habit Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-sm sleek-panel p-5 bg-[var(--modal-bg)] border-[var(--hairline-strong)] shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--hairline)]">
              <span className="text-xs font-semibold text-[var(--ink)]">Create New Habit</span>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-[var(--ink-subtle)] hover:text-[var(--ink)] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateHabit} className="pt-3 space-y-3">
              <div>
                <label className="block text-[11px] text-[var(--ink-muted)] mb-1">Habit Name</label>
                <input
                  type="text"
                  placeholder="e.g. Morning Meditation, Read 20 pages..."
                  autoFocus
                  value={newHabitName}
                  onChange={(e) => setNewHabitName(e.target.value)}
                  className="theme-input w-full px-2.5 py-1.5 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] text-[var(--ink-muted)] mb-1">Color Badge</label>
                <div className="flex items-center gap-1.5">
                  {COLOR_PRESETS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewHabitColor(color)}
                      className="w-4 h-4 rounded-full flex items-center justify-center transition-transform hover:scale-110 cursor-pointer"
                      style={{ backgroundColor: color }}
                    >
                      {newHabitColor === color && (
                        <Check className="w-2.5 h-2.5 text-black stroke-[3]" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="btn-ghost text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newHabitName.trim()}
                  className="btn-primary text-xs cursor-pointer disabled:opacity-40"
                >
                  <Plus className="w-3 h-3" /> Create Habit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function HabitPage() {
  return (
    <StudyProvider>
      <HabitTrackerContent />
    </StudyProvider>
  );
}
