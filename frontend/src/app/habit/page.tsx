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
  Calendar as CalendarIcon,
  CheckCircle2,
  SlidersHorizontal,
  RotateCcw,
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

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

type RangeType = "month" | "30days" | "3months" | "custom";

interface DayInfo {
  dayNum: number;
  dateKey: string; // YYYY-MM-DD
  dateObj: Date;
  shortLabel: string;
  fullDateLabel: string;
  isToday: boolean;
}

function HabitTrackerContent() {
  const { habits, addHabit, deleteHabit, toggleHabitDay, isMounted } = useStudy();

  // Navigation & Range State
  const [rangeType, setRangeType] = useState<RangeType>("month");
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth()); // 0-11

  // Custom date range state
  const [customStartDate, setCustomStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split("T")[0];
  });
  const [customEndDate, setCustomEndDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newHabitName, setNewHabitName] = useState("");
  const [newHabitColor, setNewHabitColor] = useState(COLOR_PRESETS[0]);
  const [inspectingDay, setInspectingDay] = useState<{
    dateKey: string;
    formattedDate: string;
  } | null>(null);

  const [activeTab, setActiveTab] = useState<
    "timer" | "screentime" | "heatmap" | "history" | "habit"
  >("habit");

  const todayKey = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }, []);

  // Compute array of days based on selected range mode
  const daysList: DayInfo[] = useMemo(() => {
    const result: DayInfo[] = [];

    if (rangeType === "month") {
      const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
      const mPrefix = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}`;

      for (let day = 1; day <= daysInMonth; day++) {
        const dateKey = `${mPrefix}-${String(day).padStart(2, "0")}`;
        const dateObj = new Date(selectedYear, selectedMonth, day);
        result.push({
          dayNum: day,
          dateKey,
          dateObj,
          shortLabel: String(day),
          fullDateLabel: dateObj.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
          }),
          isToday: dateKey === todayKey,
        });
      }
    } else if (rangeType === "30days") {
      const now = new Date();
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        const dateKey = `${y}-${m}-${day}`;
        result.push({
          dayNum: d.getDate(),
          dateKey,
          dateObj: d,
          shortLabel: d.toLocaleDateString("en-US", { month: "numeric", day: "numeric" }),
          fullDateLabel: d.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
          }),
          isToday: dateKey === todayKey,
        });
      }
    } else if (rangeType === "3months") {
      const start = new Date(selectedYear, selectedMonth - 2, 1);
      const end = new Date(selectedYear, selectedMonth + 1, 0);

      const cur = new Date(start);
      while (cur <= end) {
        const y = cur.getFullYear();
        const m = String(cur.getMonth() + 1).padStart(2, "0");
        const day = String(cur.getDate()).padStart(2, "0");
        const dateKey = `${y}-${m}-${day}`;
        result.push({
          dayNum: cur.getDate(),
          dateKey,
          dateObj: new Date(cur),
          shortLabel: cur.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          fullDateLabel: cur.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
          }),
          isToday: dateKey === todayKey,
        });
        cur.setDate(cur.getDate() + 1);
      }
    } else {
      // Custom range
      const start = new Date(customStartDate + "T00:00:00");
      const end = new Date(customEndDate + "T00:00:00");

      if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && start <= end) {
        const cur = new Date(start);
        let count = 0;
        while (cur <= end && count < 365) {
          const y = cur.getFullYear();
          const m = String(cur.getMonth() + 1).padStart(2, "0");
          const day = String(cur.getDate()).padStart(2, "0");
          const dateKey = `${y}-${m}-${day}`;
          result.push({
            dayNum: cur.getDate(),
            dateKey,
            dateObj: new Date(cur),
            shortLabel: cur.toLocaleDateString("en-US", { month: "numeric", day: "numeric" }),
            fullDateLabel: cur.toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            }),
            isToday: dateKey === todayKey,
          });
          cur.setDate(cur.getDate() + 1);
          count++;
        }
      }
    }

    return result;
  }, [rangeType, selectedYear, selectedMonth, customStartDate, customEndDate, todayKey]);

  // Display title for the active range
  const rangeTitle = useMemo(() => {
    if (rangeType === "month") {
      return `${MONTH_NAMES[selectedMonth]} ${selectedYear}`;
    }
    if (rangeType === "30days") {
      return "Past 30 Days";
    }
    if (rangeType === "3months") {
      const startM = (selectedMonth - 2 + 12) % 12;
      return `${MONTH_NAMES[startM]} – ${MONTH_NAMES[selectedMonth]} ${selectedYear}`;
    }
    return `${customStartDate} to ${customEndDate}`;
  }, [rangeType, selectedMonth, selectedYear, customStartDate, customEndDate]);

  // Daily summary for the zig-zag chart
  const chartData = useMemo(() => {
    return daysList.map((d) => {
      let completedCount = 0;
      const completedNames: string[] = [];

      habits.forEach((h) => {
        const comp = (h.completions || []).find((c) => c.date === d.dateKey && c.completed);
        if (comp) {
          completedCount += 1;
          completedNames.push(h.name);
        }
      });

      return {
        label: d.shortLabel,
        fullDate: d.fullDateLabel,
        day: d.dayNum,
        dateKey: d.dateKey,
        count: completedCount,
        completedNames,
      };
    });
  }, [daysList, habits]);

  // Summary Metrics
  const stats = useMemo(() => {
    const totalPossible = habits.length * daysList.length;
    let totalCompleted = 0;
    let todayCompleted = 0;
    let bestDayCount = 0;

    chartData.forEach((d) => {
      totalCompleted += d.count;
      if (d.count > bestDayCount) {
        bestDayCount = d.count;
      }
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
      bestDayCount,
    };
  }, [habits, daysList, chartData, todayKey]);

  // Handlers for month navigation
  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  const handleCurrentMonth = () => {
    const now = new Date();
    setSelectedMonth(now.getMonth());
    setSelectedYear(now.getFullYear());
    setRangeType("month");
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

  const availableYears = useMemo(() => {
    const curYear = new Date().getFullYear();
    return [curYear - 2, curYear - 1, curYear, curYear + 1, curYear + 2];
  }, []);

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
        {/* Top Header & Range Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-[var(--ink)] flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-500" />
                Habit Journal
              </h1>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-medium">
                {rangeTitle}
              </span>
            </div>
            <p className="text-xs text-[var(--ink-subtle)] mt-0.5">
              Daily habit curve & interactive bullet-journal matrix. Click any point or cell to checkmark!
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Range Presets Switcher */}
            <div className="inline-flex p-0.5 rounded-md bg-[var(--surface-1)] border border-[var(--hairline)]">
              <button
                onClick={() => setRangeType("month")}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-all cursor-pointer ${
                  rangeType === "month"
                    ? "bg-[var(--surface-3)] text-[var(--ink)] font-semibold shadow-xs"
                    : "text-[var(--ink-subtle)] hover:text-[var(--ink)]"
                }`}
              >
                Month
              </button>
              <button
                onClick={() => setRangeType("30days")}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-all cursor-pointer ${
                  rangeType === "30days"
                    ? "bg-[var(--surface-3)] text-[var(--ink)] font-semibold shadow-xs"
                    : "text-[var(--ink-subtle)] hover:text-[var(--ink)]"
                }`}
              >
                30 Days
              </button>
              <button
                onClick={() => setRangeType("3months")}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-all cursor-pointer ${
                  rangeType === "3months"
                    ? "bg-[var(--surface-3)] text-[var(--ink)] font-semibold shadow-xs"
                    : "text-[var(--ink-subtle)] hover:text-[var(--ink)]"
                }`}
              >
                3 Months
              </button>
              <button
                onClick={() => setRangeType("custom")}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-all cursor-pointer ${
                  rangeType === "custom"
                    ? "bg-[var(--surface-3)] text-[var(--ink)] font-semibold shadow-xs"
                    : "text-[var(--ink-subtle)] hover:text-[var(--ink)]"
                }`}
              >
                Custom
              </button>
            </div>

            {/* Range Selectors / Month Picker Dropdowns */}
            {rangeType === "month" && (
              <div className="flex items-center gap-1 bg-[var(--surface-1)] p-1 rounded-md border border-[var(--hairline)]">
                <button
                  onClick={handlePrevMonth}
                  className="p-1 rounded text-[var(--ink-subtle)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
                  title="Previous month"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                {/* Month Dropdown */}
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="bg-transparent text-xs font-semibold text-[var(--ink)] px-1 py-0.5 cursor-pointer focus:outline-none"
                >
                  {MONTH_NAMES.map((m, idx) => (
                    <option key={m} value={idx} className="bg-[var(--surface-1)] text-[var(--ink)]">
                      {m}
                    </option>
                  ))}
                </select>

                {/* Year Dropdown */}
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="bg-transparent text-xs font-semibold text-[var(--ink)] px-1 py-0.5 cursor-pointer focus:outline-none"
                >
                  {availableYears.map((y) => (
                    <option key={y} value={y} className="bg-[var(--surface-1)] text-[var(--ink)]">
                      {y}
                    </option>
                  ))}
                </select>

                <button
                  onClick={handleNextMonth}
                  className="p-1 rounded text-[var(--ink-subtle)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
                  title="Next month"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {rangeType === "custom" && (
              <div className="flex items-center gap-1.5 bg-[var(--surface-1)] p-1 rounded-md border border-[var(--hairline)]">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="theme-input px-1.5 py-0.5 text-xs"
                />
                <span className="text-xs text-[var(--ink-subtle)] font-mono">→</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="theme-input px-1.5 py-0.5 text-xs"
                />
              </div>
            )}

            <button
              onClick={handleCurrentMonth}
              className="p-1.5 rounded text-xs text-[var(--ink-subtle)] hover:text-[var(--ink)] bg-[var(--surface-1)] border border-[var(--hairline)] hover:bg-[var(--surface-2)] transition-all cursor-pointer"
              title="Jump to Today / Current Month"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

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
            <span className="text-[11px] text-[var(--ink-subtle)] font-medium">Range Success Rate</span>
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

        {/* 1. Interactive Zig-Zag Line Graph with Click-to-Checkmark */}
        <div className="sleek-panel p-5 sm:p-6 bg-[var(--surface-1)] border-[var(--hairline)] space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xs font-semibold text-[var(--ink)] uppercase tracking-wider font-mono">
                Completion Curve ({rangeTitle})
              </h2>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                • Click any point to checkmark habits
              </span>
            </div>
            <div className="text-xs font-mono text-[var(--ink-subtle)]">
              Max: {habits.length} habits • {daysList.length} days
            </div>
          </div>

          <div className="h-48 sm:h-56 w-full pt-2">
            {isMounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                  onClick={(e: any) => {
                    if (e && e.activePayload && e.activePayload.length > 0) {
                      const data = e.activePayload[0].payload;
                      setInspectingDay({
                        dateKey: data.dateKey,
                        formattedDate: data.fullDate,
                      });
                    }
                  }}
                  className="cursor-pointer"
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
                    interval={daysList.length > 35 ? Math.floor(daysList.length / 14) : 0}
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
                          <div className="sleek-card p-3 text-xs space-y-1.5 bg-[var(--surface-1)] border-[var(--hairline-strong)] shadow-xl min-w-[200px]">
                            <div className="flex items-center justify-between gap-2 border-b border-[var(--hairline)] pb-1.5">
                              <p className="font-semibold text-[var(--ink)]">
                                {data.fullDate}
                              </p>
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
                                {data.count} / {habits.length}
                              </span>
                            </div>

                            {data.completedNames.length > 0 ? (
                              <div className="space-y-1 text-[11px] text-[var(--ink-muted)]">
                                {data.completedNames.map((name: string) => (
                                  <div key={name} className="flex items-center gap-1.5">
                                    <Check className="w-3 h-3 text-emerald-500" />
                                    <span>{name}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-[11px] text-[var(--ink-subtle)] italic">
                                No habits completed on this date.
                              </p>
                            )}

                            <div className="pt-1.5 border-t border-[var(--hairline)] flex items-center justify-between text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                              <span>👆 Click point to edit checkmarks</span>
                            </div>
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
                    dot={{
                      r: 3,
                      fill: "var(--chart-line)",
                      stroke: "var(--canvas)",
                      strokeWidth: 1.5,
                      cursor: "pointer",
                    }}
                    activeDot={{
                      r: 6,
                      fill: "#10b981",
                      stroke: "var(--canvas)",
                      strokeWidth: 2,
                      cursor: "pointer",
                    }}
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

        {/* 2. Bullet Journal Dot Matrix Table for the selected Range */}
        <div className="sleek-panel p-4 sm:p-6 bg-[var(--surface-1)] border-[var(--hairline)] space-y-3 overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[var(--hairline)]">
            <span className="text-xs font-semibold text-[var(--ink)] uppercase tracking-wider font-mono">
              Habit Completion Matrix ({daysList.length} Days)
            </span>
            <span className="text-[11px] text-[var(--ink-subtle)] font-mono">
              Click any day cell to toggle checkmark
            </span>
          </div>

          <div className="overflow-x-auto pb-2 scrollbar-none">
            <table className="w-full border-collapse select-none min-w-[750px]">
              <thead>
                <tr>
                  <th className="text-left text-xs font-medium text-[var(--ink-subtle)] py-2 pr-3 w-48 sticky left-0 bg-[var(--surface-1)] z-10">
                    Habit
                  </th>
                  {daysList.map((d) => (
                    <th
                      key={d.dateKey}
                      onClick={() =>
                        setInspectingDay({
                          dateKey: d.dateKey,
                          formattedDate: d.fullDateLabel,
                        })
                      }
                      className={`text-center text-[10px] font-mono py-2 px-1 w-7 cursor-pointer transition-colors hover:text-emerald-500 ${
                        d.isToday
                          ? "text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 rounded-t"
                          : "text-[var(--ink-subtle)]"
                      }`}
                      title={`${d.fullDateLabel} - Click to checkmark all habits for this day`}
                    >
                      {d.shortLabel}
                    </th>
                  ))}
                  <th className="text-right text-[11px] font-mono text-[var(--ink-subtle)] py-2 pl-3 w-14">
                    Total
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[var(--hairline)]">
                {habits.length === 0 ? (
                  <tr>
                    <td
                      colSpan={daysList.length + 2}
                      className="text-center py-8 text-xs text-[var(--ink-subtle)]"
                    >
                      No habits added yet. Click "+ New Habit" to create one.
                    </td>
                  </tr>
                ) : (
                  habits.map((habit) => {
                    const habitCompletions = habit.completions || [];
                    const completedInRange = daysList.filter((d) =>
                      habitCompletions.some((c) => c.date === d.dateKey && c.completed)
                    ).length;

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
                        {daysList.map((d) => {
                          const isDone = habitCompletions.some(
                            (c) => c.date === d.dateKey && c.completed
                          );

                          return (
                            <td
                              key={d.dateKey}
                              onClick={() => toggleHabitDay(habit.id, d.dateKey, !isDone)}
                              className={`text-center py-2 px-1 cursor-pointer transition-all duration-150 ${
                                d.isToday ? "bg-emerald-500/10" : ""
                              } hover:bg-[var(--surface-3)]`}
                              title={`${habit.name} on ${d.fullDateLabel}`}
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
                                  <span className="text-[var(--ink-subtle)]/40 text-sm leading-none">
                                    •
                                  </span>
                                )}
                              </div>
                            </td>
                          );
                        })}

                        {/* Total column */}
                        <td className="py-2.5 pl-3 text-right font-mono text-xs font-semibold text-[var(--ink-muted)]">
                          {completedInRange}
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
                          key={d.dateKey}
                          onClick={() =>
                            setInspectingDay({
                              dateKey: d.dateKey,
                              formattedDate: d.fullDate,
                            })
                          }
                          className={`text-center py-2.5 px-1 font-bold cursor-pointer hover:bg-[var(--surface-3)] ${
                            isToday
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : "text-[var(--ink)]"
                          }`}
                          title={`Click to checkmark habits for ${d.fullDate}`}
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

      {/* 3. Direct Day Checkmark / Quick Check-in Modal */}
      {inspectingDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md sleek-panel p-5 sm:p-6 bg-[var(--modal-bg)] border-[var(--hairline-strong)] shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--hairline)]">
              <div>
                <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 uppercase tracking-wider font-semibold">
                  Day Check-in
                </span>
                <h3 className="text-sm font-bold text-[var(--ink)] mt-0.5">
                  {inspectingDay.formattedDate}
                </h3>
              </div>
              <button
                onClick={() => setInspectingDay(null)}
                className="p-1 text-[var(--ink-subtle)] hover:text-[var(--ink)] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {habits.length === 0 ? (
                <p className="text-center py-6 text-xs text-[var(--ink-subtle)]">
                  No habits added yet.
                </p>
              ) : (
                habits.map((habit) => {
                  const isDone = (habit.completions || []).some(
                    (c) => c.date === inspectingDay.dateKey && c.completed
                  );

                  return (
                    <div
                      key={habit.id}
                      onClick={() =>
                        toggleHabitDay(habit.id, inspectingDay.dateKey, !isDone)
                      }
                      className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${
                        isDone
                          ? "bg-[var(--surface-2)] border-emerald-500/40 shadow-xs"
                          : "bg-[var(--surface-1)] border-[var(--hairline)] hover:border-[var(--hairline-strong)]"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: habit.color }}
                        />
                        <span
                          className={`text-xs font-medium ${
                            isDone
                              ? "text-[var(--ink)] font-semibold"
                              : "text-[var(--ink-muted)]"
                          }`}
                        >
                          {habit.name}
                        </span>
                      </div>

                      <div
                        className={`w-6 h-6 rounded flex items-center justify-center transition-all ${
                          isDone
                            ? "bg-emerald-500 text-black font-bold"
                            : "border border-[var(--hairline-strong)] text-transparent hover:border-emerald-500/60"
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[var(--hairline)]">
              <span className="text-xs font-mono text-[var(--ink-subtle)]">
                {
                  habits.filter((h) =>
                    (h.completions || []).some(
                      (c) => c.date === inspectingDay.dateKey && c.completed
                    )
                  ).length
                }{" "}
                of {habits.length} completed
              </span>

              <button
                onClick={() => setInspectingDay(null)}
                className="btn-primary text-xs cursor-pointer px-4 py-1.5"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. New Habit Modal */}
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
