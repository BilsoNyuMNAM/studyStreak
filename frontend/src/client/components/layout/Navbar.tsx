"use client";

import React from "react";
import { Flame, Moon, Sun, Clock, BarChart2, Calendar, History, Plus } from "lucide-react";
import { useStudy } from "@/client/context/StudyContext";

interface NavbarProps {
  activeTab: "timer" | "screentime" | "heatmap" | "history";
  setActiveTab: (tab: "timer" | "screentime" | "heatmap" | "history") => void;
  onOpenSubjectModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenSubjectModal,
}) => {
  const { theme, toggleTheme, streakStats, isMounted, isTimerRunning } = useStudy();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[var(--hairline)] bg-[var(--canvas)]/90 backdrop-blur-md">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-13 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-5 h-5 rounded-sm bg-[var(--primary)] text-[var(--on-primary)] font-mono font-bold text-[11px] flex items-center justify-center">
            S
          </div>
          <span className="font-semibold text-sm tracking-tight text-[var(--ink)]">
            studystreak
          </span>
        </div>

        {/* Center Nav Tabs */}
        <nav className="hidden sm:flex items-center gap-1 bg-[var(--surface-1)] p-1 rounded-md border border-[var(--hairline)]">
          <button
            onClick={() => setActiveTab("timer")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-all cursor-pointer ${
              activeTab === "timer"
                ? "bg-[var(--surface-3)] text-[var(--ink)] font-semibold shadow-xs"
                : "text-[var(--ink-subtle)] hover:text-[var(--ink)]"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Timer</span>
            {isTimerRunning && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-0.5" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("screentime")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-all cursor-pointer ${
              activeTab === "screentime"
                ? "bg-[var(--surface-3)] text-[var(--ink)] font-semibold shadow-xs"
                : "text-[var(--ink-subtle)] hover:text-[var(--ink)]"
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            Screen Time
          </button>
          <button
            onClick={() => setActiveTab("heatmap")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-all cursor-pointer ${
              activeTab === "heatmap"
                ? "bg-[var(--surface-3)] text-[var(--ink)] font-semibold shadow-xs"
                : "text-[var(--ink-subtle)] hover:text-[var(--ink)]"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Streak Grid
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-all cursor-pointer ${
              activeTab === "history"
                ? "bg-[var(--surface-3)] text-[var(--ink)] font-semibold shadow-xs"
                : "text-[var(--ink-subtle)] hover:text-[var(--ink)]"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Logs
          </button>
          <a
            href="/habit"
            className="flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium text-[var(--ink-subtle)] hover:text-emerald-500 transition-all cursor-pointer"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Habits
          </a>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Streak Pill */}
          <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-[var(--surface-2)] border border-[var(--hairline)] text-xs">
            <Flame className="w-3.5 h-3.5 text-emerald-500" />
            <span className="font-mono font-semibold text-[var(--ink)]">
              {isMounted ? streakStats.currentStreak : "0"}
            </span>
            <span className="text-[var(--ink-subtle)] text-[11px]">d</span>
          </div>

          {/* Manage Subjects */}
          <button
            onClick={onOpenSubjectModal}
            className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 text-xs text-[var(--ink-muted)] hover:text-[var(--ink)] rounded hover:bg-[var(--surface-2)] border border-transparent transition-all cursor-pointer"
            title="Manage subjects"
          >
            <Plus className="w-3 h-3" />
            Subjects
          </button>

          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="p-1.5 rounded text-[var(--ink-subtle)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)] transition-all cursor-pointer"
          >
            {theme === "dark" ? (
              <Sun className="w-3.5 h-3.5" />
            ) : (
              <Moon className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Tabs */}
      <div className="sm:hidden flex items-center justify-around border-t border-[var(--hairline)] py-1.5 px-2 bg-[var(--surface-1)]">
        <button
          onClick={() => setActiveTab("timer")}
          className={`text-xs py-1 px-2 rounded flex items-center gap-1 cursor-pointer ${
            activeTab === "timer" ? "text-[var(--ink)] font-semibold bg-[var(--surface-3)]" : "text-[var(--ink-subtle)]"
          }`}
        >
          <span>Timer</span>
          {isTimerRunning && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("screentime")}
          className={`text-xs py-1 px-2 rounded cursor-pointer ${
            activeTab === "screentime" ? "text-[var(--ink)] font-semibold bg-[var(--surface-3)]" : "text-[var(--ink-subtle)]"
          }`}
        >
          Analytics
        </button>
        <button
          onClick={() => setActiveTab("heatmap")}
          className={`text-xs py-1 px-2 rounded cursor-pointer ${
            activeTab === "heatmap" ? "text-[var(--ink)] font-semibold bg-[var(--surface-3)]" : "text-[var(--ink-subtle)]"
          }`}
        >
          Streak
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`text-xs py-1 px-2 rounded cursor-pointer ${
            activeTab === "history" ? "text-[var(--ink)] font-semibold bg-[var(--surface-3)]" : "text-[var(--ink-subtle)]"
          }`}
        >
          Logs
        </button>
        <a
          href="/habit"
          className="text-xs py-1 px-2 rounded text-emerald-500 font-medium hover:underline"
        >
          Habits
        </a>
      </div>
    </header>
  );
};
