"use client";

import React, { useState } from "react";
import { Play, Pause, RotateCcw, Check, Plus, Sliders, X } from "lucide-react";
import { useStudy } from "@/client/context/StudyContext";
import { TimerMode } from "@/shared/types";
import { formatTime, formatDurationLabel } from "@/shared/utils";

interface StudyTimerProps {
  onOpenSubjectModal: () => void;
}

export const StudyTimer: React.FC<StudyTimerProps> = ({ onOpenSubjectModal }) => {
  const {
    subjects,
    deleteSubject,
    addSubject,
    isMounted,
    timerMode,
    setTimerMode,
    timerTargetSeconds,
    setTimerTargetSeconds,
    timerSecondsElapsed,
    isTimerRunning,
    pomodoroStage,
    setPomodoroStage,
    selectedSubject,
    setSelectedSubjectId,
    startTimer,
    pauseTimer,
    resetTimer,
    completeTimerSession,
    showSavedToast,
    setShowSavedToast,
  } = useStudy();

  // Custom Time Input Modal/Popover state
  const [isCustomTimeOpen, setIsCustomTimeOpen] = useState(false);
  const [customMinutesInput, setCustomMinutesInput] = useState<number>(25);

  // Quick inline add subject state
  const [isAddingSubjectInline, setIsAddingSubjectInline] = useState(false);
  const [inlineSubjectName, setInlineSubjectName] = useState("");

  const handleModeChange = (newMode: TimerMode) => {
    if (isTimerRunning) {
      if (!confirm("A session is currently running. Switch mode and reset timer?")) {
        return;
      }
    }
    setTimerMode(newMode);
    if (newMode === "pomodoro") {
      setCustomMinutesInput(25);
    } else if (newMode === "countdown") {
      setCustomMinutesInput(10);
    }
  };

  const handleApplyCustomMinutes = (e: React.FormEvent) => {
    e.preventDefault();
    if (customMinutesInput <= 0) return;
    setTimerTargetSeconds(customMinutesInput * 60);
    resetTimer();
    setIsCustomTimeOpen(false);
  };

  const handleInlineAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlineSubjectName.trim()) return;
    const colors = ["#10b981", "#38bdf8", "#f59e0b", "#a855f7", "#ec4899", "#6366f1", "#14b8a6", "#71717a"];
    const randomColor = colors[subjects.length % colors.length];

    const newSub = addSubject({
      name: inlineSubjectName.trim(),
      color: randomColor,
    });
    setSelectedSubjectId(newSub.id);
    setInlineSubjectName("");
    setIsAddingSubjectInline(false);
  };

  const handleDeleteSubjectInline = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Delete subject "${name}"?`)) {
      deleteSubject(id);
    }
  };

  const displaySeconds =
    timerMode === "stopwatch"
      ? timerSecondsElapsed
      : Math.max(0, timerTargetSeconds - timerSecondsElapsed);

  const progressPercentage =
    timerMode === "stopwatch"
      ? Math.min(100, (timerSecondsElapsed / 3600) * 100)
      : Math.min(100, (timerSecondsElapsed / timerTargetSeconds) * 100);

  return (
    <div className="w-full max-w-xl mx-auto space-y-5">
      {/* Mode Switcher */}
      <div className="flex items-center justify-center">
        <div className="inline-flex p-1 rounded-md bg-[var(--surface-1)] border border-[var(--hairline)]">
          <button
            onClick={() => handleModeChange("pomodoro")}
            className={`px-3 py-1 rounded text-xs font-medium transition-all cursor-pointer ${
              timerMode === "pomodoro"
                ? "bg-[var(--surface-3)] text-[var(--ink)] font-semibold shadow-xs"
                : "text-[var(--ink-subtle)] hover:text-[var(--ink)]"
            }`}
          >
            Pomodoro
          </button>
          <button
            onClick={() => handleModeChange("stopwatch")}
            className={`px-3 py-1 rounded text-xs font-medium transition-all cursor-pointer ${
              timerMode === "stopwatch"
                ? "bg-[var(--surface-3)] text-[var(--ink)] font-semibold shadow-xs"
                : "text-[var(--ink-subtle)] hover:text-[var(--ink)]"
            }`}
          >
            Stopwatch
          </button>
          <button
            onClick={() => handleModeChange("countdown")}
            className={`px-3 py-1 rounded text-xs font-medium transition-all cursor-pointer ${
              timerMode === "countdown"
                ? "bg-[var(--surface-3)] text-[var(--ink)] font-semibold shadow-xs"
                : "text-[var(--ink-subtle)] hover:text-[var(--ink)]"
            }`}
          >
            Countdown
          </button>
        </div>
      </div>

      {/* Main Focus Panel */}
      <div className="sleek-panel p-6 sm:p-9 flex flex-col items-center relative overflow-hidden bg-[var(--surface-1)] border-[var(--hairline)]">
        {/* Subject Bar */}
        <div className="w-full flex items-center justify-between pb-4 border-b border-[var(--hairline)] gap-2">
          <span className="text-xs text-[var(--ink-subtle)] font-medium flex-shrink-0">
            Subject
          </span>

          <div className="flex items-center gap-1.5 overflow-x-auto max-w-[85%] scrollbar-none py-1">
            {subjects.map((sub) => {
              const isSelected = selectedSubject?.id === sub.id;
              return (
                <div
                  key={sub.id}
                  className="group relative inline-flex items-center"
                >
                  <button
                    onClick={() => setSelectedSubjectId(sub.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[var(--surface-3)] text-[var(--ink)] border border-[var(--hairline-strong)] font-semibold"
                        : "text-[var(--ink-subtle)] hover:text-[var(--ink)] bg-[var(--surface-2)]"
                    }`}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: sub.color }}
                    />
                    <span>{sub.name}</span>
                  </button>

                  {/* Inline Delete Cross */}
                  <button
                    onClick={(e) => handleDeleteSubjectInline(sub.id, sub.name, e)}
                    className="opacity-0 group-hover:opacity-100 absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[var(--surface-4)] text-[var(--ink-muted)] hover:text-red-400 flex items-center justify-center transition-opacity cursor-pointer z-10"
                    title={`Delete subject "${sub.name}"`}
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              );
            })}

            {/* Inline Add Subject Input */}
            {isAddingSubjectInline ? (
              <form onSubmit={handleInlineAddSubject} className="inline-flex items-center gap-1">
                <input
                  type="text"
                  placeholder="Subject name..."
                  autoFocus
                  value={inlineSubjectName}
                  onChange={(e) => setInlineSubjectName(e.target.value)}
                  className="theme-input px-2 py-0.5 text-xs w-28"
                />
                <button
                  type="submit"
                  className="p-1 rounded btn-primary text-xs cursor-pointer"
                >
                  <Check className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingSubjectInline(false)}
                  className="p-1 rounded text-[var(--ink-subtle)] hover:text-[var(--ink)] text-xs cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </form>
            ) : (
              <button
                onClick={() => setIsAddingSubjectInline(true)}
                className="p-1 px-1.5 rounded text-[var(--ink-subtle)] hover:text-[var(--ink)] bg-[var(--surface-2)] border border-[var(--hairline)] flex items-center gap-1 text-xs transition-colors cursor-pointer"
                title="Add subject inline"
              >
                <Plus className="w-3 h-3" />
                <span>Add</span>
              </button>
            )}
          </div>
        </div>

        {/* Pomodoro Intervals & Custom Duration Controls */}
        {timerMode === "pomodoro" && (
          <div className="flex items-center gap-2 mt-5 flex-wrap justify-center">
            <button
              onClick={() => {
                setPomodoroStage("focus");
                setTimerTargetSeconds(25 * 60);
                resetTimer();
              }}
              className={`px-2.5 py-1 rounded text-xs transition-all cursor-pointer ${
                pomodoroStage === "focus" && timerTargetSeconds === 25 * 60
                  ? "bg-[var(--primary)] text-[var(--on-primary)] font-semibold shadow-xs"
                  : "bg-[var(--surface-2)] text-[var(--ink-subtle)] hover:text-[var(--ink)] border border-[var(--hairline)]"
              }`}
            >
              25m Focus
            </button>
            <button
              onClick={() => {
                setPomodoroStage("break");
                setTimerTargetSeconds(5 * 60);
                resetTimer();
              }}
              className={`px-2.5 py-1 rounded text-xs transition-all cursor-pointer ${
                pomodoroStage === "break" && timerTargetSeconds === 5 * 60
                  ? "bg-[var(--primary)] text-[var(--on-primary)] font-semibold shadow-xs"
                  : "bg-[var(--surface-2)] text-[var(--ink-subtle)] hover:text-[var(--ink)] border border-[var(--hairline)]"
              }`}
            >
              5m Break
            </button>
            <button
              onClick={() => {
                setPomodoroStage("break");
                setTimerTargetSeconds(15 * 60);
                resetTimer();
              }}
              className={`px-2.5 py-1 rounded text-xs transition-all cursor-pointer ${
                pomodoroStage === "break" && timerTargetSeconds === 15 * 60
                  ? "bg-[var(--primary)] text-[var(--on-primary)] font-semibold shadow-xs"
                  : "bg-[var(--surface-2)] text-[var(--ink-subtle)] hover:text-[var(--ink)] border border-[var(--hairline)]"
              }`}
            >
              15m Break
            </button>
            <button
              onClick={() => setIsCustomTimeOpen(true)}
              className="px-2.5 py-1 rounded text-xs text-[var(--ink-subtle)] hover:text-[var(--ink)] bg-[var(--surface-2)] border border-[var(--hairline)] flex items-center gap-1 cursor-pointer"
              title="Set custom duration"
            >
              <Sliders className="w-3 h-3" />
              <span>Custom</span>
            </button>
          </div>
        )}

        {/* Countdown Quick Selection + Custom */}
        {timerMode === "countdown" && (
          <div className="flex items-center gap-1.5 mt-5 flex-wrap justify-center">
            {[10, 20, 30, 45, 60, 90].map((m) => (
              <button
                key={m}
                onClick={() => {
                  setTimerTargetSeconds(m * 60);
                  resetTimer();
                }}
                className={`px-2.5 py-1 rounded font-mono text-xs transition-all cursor-pointer ${
                  timerTargetSeconds === m * 60
                    ? "bg-[var(--primary)] text-[var(--on-primary)] font-semibold shadow-xs"
                    : "bg-[var(--surface-2)] text-[var(--ink-subtle)] hover:text-[var(--ink)] border border-[var(--hairline)]"
                }`}
              >
                {m}m
              </button>
            ))}
            <button
              onClick={() => setIsCustomTimeOpen(true)}
              className="px-2 py-1 rounded text-xs text-[var(--ink-subtle)] hover:text-[var(--ink)] bg-[var(--surface-2)] border border-[var(--hairline)] flex items-center gap-1 cursor-pointer"
              title="Set custom duration"
            >
              <Sliders className="w-3 h-3" />
              <span>Custom</span>
            </button>
          </div>
        )}

        {/* Custom Duration Popover Form */}
        {isCustomTimeOpen && (
          <form
            onSubmit={handleApplyCustomMinutes}
            className="mt-4 p-3 rounded-lg bg-[var(--surface-2)] border border-[var(--hairline-strong)] flex items-center gap-2 animate-fade-in"
          >
            <span className="text-xs text-[var(--ink-muted)]">Set duration:</span>
            <input
              type="number"
              min="1"
              max="720"
              autoFocus
              value={customMinutesInput}
              onChange={(e) => setCustomMinutesInput(Math.max(1, Number(e.target.value)))}
              className="w-16 px-2 py-1 rounded text-xs font-mono theme-input text-center"
            />
            <span className="text-xs text-[var(--ink-subtle)]">mins</span>
            <button
              type="submit"
              className="btn-primary text-xs py-1 px-2.5 cursor-pointer ml-1"
            >
              Set
            </button>
            <button
              type="button"
              onClick={() => setIsCustomTimeOpen(false)}
              className="text-xs text-[var(--ink-subtle)] hover:text-[var(--ink)] px-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </form>
        )}

        {/* Digital Readout */}
        <div className="my-8 flex flex-col items-center">
          <div
            onClick={() => {
              if (!isTimerRunning && timerMode !== "stopwatch") {
                setIsCustomTimeOpen(true);
              }
            }}
            className="text-6xl sm:text-7xl font-mono font-bold tracking-tight text-[var(--ink)] tabular-nums select-none cursor-pointer hover:opacity-90 transition-opacity"
            style={{ fontVariantNumeric: "tabular-nums" }}
            title={!isTimerRunning && timerMode !== "stopwatch" ? "Click to edit timer duration" : undefined}
          >
            {isMounted ? formatTime(displaySeconds) : "25:00"}
          </div>

          <div className="mt-2.5 flex items-center gap-2 text-xs text-[var(--ink-muted)]">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: selectedSubject?.color || "var(--ink)" }}
            />
            <span>{selectedSubject?.name || "General Focus"}</span>
            {isTimerRunning && (
              <span className="text-[11px] font-mono text-emerald-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                running
              </span>
            )}
          </div>
        </div>

        {/* Minimal Progress Bar */}
        <div className="w-full max-w-xs h-1 bg-[var(--surface-3)] rounded-full overflow-hidden mb-7">
          <div
            className="h-full bg-[var(--ink)] transition-all duration-300 ease-linear"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {/* Control Buttons */}
        <div className="flex items-center gap-2.5">
          {!isTimerRunning ? (
            <button
              onClick={startTimer}
              className="btn-primary text-sm px-6 py-2 cursor-pointer shadow-xs"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              {timerSecondsElapsed > 0 ? "Resume" : "Start"}
            </button>
          ) : (
            <button
              onClick={pauseTimer}
              className="btn-secondary text-sm px-6 py-2 cursor-pointer"
            >
              <Pause className="w-3.5 h-3.5 fill-current" />
              Pause
            </button>
          )}

          {timerSecondsElapsed > 0 && (
            <>
              <button
                onClick={() => completeTimerSession()}
                className="btn-secondary text-xs px-3.5 py-2 text-emerald-600 dark:text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/10 cursor-pointer flex items-center gap-1.5"
                title="Save study session now"
              >
                <Check className="w-3.5 h-3.5" />
                <span>
                  Done ({formatDurationLabel(Math.max(1, Math.round(timerSecondsElapsed / 60)))})
                </span>
              </button>

              <button
                onClick={resetTimer}
                className="btn-ghost p-2 text-[var(--ink-subtle)] hover:text-[var(--ink)] cursor-pointer"
                title="Reset timer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>

        {/* 25-Min Streak Info Footer */}
        <p className="mt-7 text-[11px] text-[var(--ink-subtle)] font-mono">
          Sessions totaling 25+ minutes automatically secure today's streak.
        </p>
      </div>

      {/* Saved Toast */}
      {showSavedToast && (
        <div className="sleek-card p-3 flex items-center justify-between border-emerald-500/40 bg-[var(--surface-1)] animate-fade-in shadow-sm">
          <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            <Check className="w-4 h-4" />
            <span>Session recorded and synchronized to database.</span>
          </div>
          <button
            onClick={() => setShowSavedToast(false)}
            className="text-xs text-[var(--ink-subtle)] hover:text-[var(--ink)] cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};
