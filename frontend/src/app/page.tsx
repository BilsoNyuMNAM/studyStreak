"use client";

import React, { useState } from "react";
import { StudyProvider, useStudy } from "@/client/context/StudyContext";
import { Navbar } from "@/client/components/layout/Navbar";
import { StudyTimer } from "@/client/components/timer/StudyTimer";
import { ScreenTimeChart } from "@/client/components/analytics/ScreenTimeChart";
import { StackedSubjectHistogram } from "@/client/components/analytics/StackedSubjectHistogram";
import { StreakHeatmap } from "@/client/components/analytics/StreakHeatmap";
import { SessionHistory } from "@/client/components/sessions/SessionHistory";
import { SubjectManagerModal } from "@/client/components/modals/SubjectManagerModal";
import { ManualLogModal } from "@/client/components/modals/ManualLogModal";
import { Flame, Clock, RotateCcw } from "lucide-react";
import { formatDurationLabel } from "@/shared/utils";

function DashboardContent() {
  const { streakStats, resetAllData, isMounted } = useStudy();
  const [activeTab, setActiveTab] = useState<"timer" | "screentime" | "heatmap" | "history">("timer");
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [isManualLogModalOpen, setIsManualLogModalOpen] = useState(false);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab") as "timer" | "screentime" | "heatmap" | "history" | null;
      if (tabParam && ["timer", "screentime", "heatmap", "history"].includes(tabParam)) {
        setActiveTab(tabParam);
      }
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--canvas)] text-[var(--ink)] antialiased">
      {/* Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSubjectModal={() => setIsSubjectModalOpen(true)}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Metric Cards Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="sleek-card p-3 flex flex-col justify-between">
            <span className="text-[11px] text-[var(--ink-subtle)] font-medium">Streak</span>
            <div className="text-base font-mono font-bold text-[var(--ink)] mt-1 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-emerald-500" />
              <span>{isMounted ? `${streakStats.currentStreak} days` : "0 days"}</span>
            </div>
          </div>

          <div className="sleek-card p-3 flex flex-col justify-between">
            <span className="text-[11px] text-[var(--ink-subtle)] font-medium">Today</span>
            <div className="text-base font-mono font-bold text-[var(--ink)] mt-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-[var(--ink-muted)]" />
              <span>{isMounted ? formatDurationLabel(streakStats.todayMinutes) : "0m"}</span>
            </div>
          </div>

          <div className="sleek-card p-3 flex flex-col justify-between">
            <span className="text-[11px] text-[var(--ink-subtle)] font-medium">Best Streak</span>
            <div className="text-base font-mono font-bold text-[var(--ink)] mt-1">
              {isMounted ? `${streakStats.longestStreak} days` : "0 days"}
            </div>
          </div>

          <div className="sleek-card p-3 flex flex-col justify-between">
            <span className="text-[11px] text-[var(--ink-subtle)] font-medium">Total Focus</span>
            <div className="text-base font-mono font-bold text-[var(--ink)] mt-1">
              {isMounted ? formatDurationLabel(streakStats.totalMinutes) : "0m"}
            </div>
          </div>
        </div>

        {/* Tab Views */}
        {activeTab === "timer" && (
          <div className="space-y-8">
            <StudyTimer onOpenSubjectModal={() => setIsSubjectModalOpen(true)} />
            <div className="pt-6 border-t border-[var(--hairline)]">
              <StreakHeatmap />
            </div>
          </div>
        )}

        {activeTab === "screentime" && (
          <div className="space-y-8">
            <StackedSubjectHistogram />
            <div className="pt-6 border-t border-[var(--hairline)]">
              <ScreenTimeChart />
            </div>
          </div>
        )}

        {activeTab === "heatmap" && (
          <div>
            <StreakHeatmap />
          </div>
        )}

        {activeTab === "history" && (
          <div>
            <SessionHistory onOpenManualLog={() => setIsManualLogModalOpen(true)} />
          </div>
        )}
      </main>

      {/* Minimal Footer */}
      <footer className="w-full border-t border-[var(--hairline)] py-5 mt-auto bg-[var(--canvas)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex items-center justify-between text-[11px] text-[var(--ink-subtle)] font-mono">
          <span>studystreak</span>
          <button
            onClick={() => {
              if (confirm("Reset to default demo data?")) {
                resetAllData();
              }
            }}
            className="hover:text-[var(--ink)] flex items-center gap-1 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            Reset Data
          </button>
        </div>
      </footer>

      {/* Modals */}
      <SubjectManagerModal
        isOpen={isSubjectModalOpen}
        onClose={() => setIsSubjectModalOpen(false)}
      />

      <ManualLogModal
        isOpen={isManualLogModalOpen}
        onClose={() => setIsManualLogModalOpen(false)}
      />
    </div>
  );
}

export default function Home() {
  return (
    <StudyProvider>
      <DashboardContent />
    </StudyProvider>
  );
}
