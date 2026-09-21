"use client";

import React, { useState, useMemo } from "react";
import { useStudy } from "@/client/context/StudyContext";
import { StudySession } from "@/shared/types";
import { formatDurationLabel } from "@/shared/utils";
import {
  Clock,
  Trash2,
  Plus,
  Search,
  Table as TableIcon,
  LayoutGrid,
  MoreHorizontal,
  Calendar,
  Tag,
  Check,
  Edit2,
  X,
  Timer,
} from "lucide-react";

interface SessionHistoryProps {
  onOpenManualLog: () => void;
}

type PeriodFilter = "all" | "today" | "yesterday" | "week" | "month";
type ModeFilter = "all" | "pomodoro" | "stopwatch" | "countdown";
type ViewMode = "table" | "cards";

export const SessionHistory: React.FC<SessionHistoryProps> = ({ onOpenManualLog }) => {
  const {
    sessions,
    deleteSession,
    deleteMultipleSessions,
    updateSessionNote,
    subjects,
    isMounted,
  } = useStudy();

  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [filterSubject, setFilterSubject] = useState<string>("all");
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("all");
  const [modeFilter, setModeFilter] = useState<ModeFilter>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedSessionIds, setSelectedSessionIds] = useState<Set<string>>(new Set());

  // Inline note editing state
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editNoteText, setEditNoteText] = useState<string>("");

  // Action menu dropdown state
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Filtered Sessions
  const filteredSessions = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);

    const monthAgo = new Date(now);
    monthAgo.setDate(now.getDate() - 30);

    return sessions.filter((s) => {
      // Subject filter
      if (filterSubject !== "all" && s.subjectId !== filterSubject) {
        return false;
      }

      // Mode filter
      if (modeFilter !== "all" && s.mode !== modeFilter) {
        return false;
      }

      // Period filter
      if (s.startTime) {
        const sDate = new Date(s.startTime);
        const sDateStr = sDate.toISOString().split("T")[0];

        if (periodFilter === "today" && sDateStr !== todayStr) return false;
        if (periodFilter === "yesterday" && sDateStr !== yesterdayStr) return false;
        if (periodFilter === "week" && sDate < weekAgo) return false;
        if (periodFilter === "month" && sDate < monthAgo) return false;
      }

      // Search filter
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesSubject = s.subjectName.toLowerCase().includes(term);
        const matchesNote = s.notes ? s.notes.toLowerCase().includes(term) : false;
        const matchesMode = s.mode.toLowerCase().includes(term);
        if (!matchesSubject && !matchesNote && !matchesMode) return false;
      }

      return true;
    });
  }, [sessions, filterSubject, modeFilter, periodFilter, searchTerm]);

  // Selection handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedSessionIds(new Set(filteredSessions.map((s) => s.id)));
    } else {
      setSelectedSessionIds(new Set());
    }
  };

  const handleToggleSelectRow = (id: string) => {
    setSelectedSessionIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleDeleteSelected = async () => {
    if (selectedSessionIds.size === 0) return;
    if (confirm(`Delete ${selectedSessionIds.size} selected session(s)?`)) {
      await deleteMultipleSessions(Array.from(selectedSessionIds));
      setSelectedSessionIds(new Set());
    }
  };

  const handleStartEditNote = (session: StudySession) => {
    setEditingNoteId(session.id);
    setEditNoteText(session.notes || "");
    setActiveMenuId(null);
  };

  const handleSaveNote = async (id: string) => {
    await updateSessionNote(id, editNoteText.trim());
    setEditingNoteId(null);
  };

  // Helper formatting
  const formatTimeRange = (startIso: string, endIso: string) => {
    try {
      const startObj = new Date(startIso);
      const endObj = new Date(endIso);
      const startFmt = startObj.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      const endFmt = endObj.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      return `${startFmt} – ${endFmt}`;
    } catch {
      return "—";
    }
  };

  const formatDateBadge = (startIso: string) => {
    try {
      const d = new Date(startIso);
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = String(d.getFullYear()).slice(-2);
      return `${day}.${month}.${year}`;
    } catch {
      return "—";
    }
  };

  const getModeDisplay = (mode: string) => {
    switch (mode) {
      case "pomodoro":
        return { label: "Pomodoro", icon: "🍅", color: "text-rose-500" };
      case "countdown":
        return { label: "Countdown", icon: "🎯", color: "text-amber-500" };
      case "stopwatch":
      default:
        return { label: "Stopwatch", icon: "⏱️", color: "text-sky-500" };
    }
  };

  const allSelected =
    filteredSessions.length > 0 &&
    selectedSessionIds.size === filteredSessions.length;

  return (
    <div className="w-full space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold tracking-tight text-[var(--ink)] flex items-center gap-2">
            <span>Sessions</span>
            <span className="text-[var(--ink-subtle)] font-mono text-base font-normal">•</span>
            <span className="text-[var(--ink-muted)] font-mono text-base font-semibold">
              {isMounted ? sessions.length.toLocaleString() : 0}
            </span>
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          {/* View Switcher: Table | Cards */}
          <div className="inline-flex p-0.5 rounded bg-[var(--surface-1)] border border-[var(--hairline)]">
            <button
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded transition-all cursor-pointer ${
                viewMode === "table"
                  ? "bg-[var(--surface-3)] text-[var(--ink)] font-semibold shadow-xs"
                  : "text-[var(--ink-subtle)] hover:text-[var(--ink)]"
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
            <button
              onClick={() => setViewMode("cards")}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded transition-all cursor-pointer ${
                viewMode === "cards"
                  ? "bg-[var(--surface-3)] text-[var(--ink)] font-semibold shadow-xs"
                  : "text-[var(--ink-subtle)] hover:text-[var(--ink)]"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Cards</span>
            </button>
          </div>

          {/* Log Session Button */}
          <button
            onClick={onOpenManualLog}
            className="btn-primary text-xs cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log Session</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-2.5 p-3 rounded-lg bg-[var(--surface-1)] border border-[var(--hairline)]">
        <div className="flex items-center gap-2 flex-wrap flex-1 min-w-[280px]">
          {/* Search Input */}
          <div className="relative w-full sm:w-52">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--ink-subtle)]" />
            <input
              type="text"
              placeholder="Search sessions or notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="theme-input w-full pl-8 pr-2.5 py-1 text-xs"
            />
          </div>

          {/* Period Filter Dropdown */}
          <div className="relative">
            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value as PeriodFilter)}
              className="theme-input px-2.5 py-1 text-xs font-medium cursor-pointer appearance-none pr-7"
            >
              <option value="all">Period: All Time</option>
              <option value="today">Period: Today</option>
              <option value="yesterday">Period: Yesterday</option>
              <option value="week">Period: Past 7 Days</option>
              <option value="month">Period: Past 30 Days</option>
            </select>
            <Calendar className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-[var(--ink-subtle)] pointer-events-none" />
          </div>

          {/* Subjects Dropdown */}
          <div className="relative">
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="theme-input px-2.5 py-1 text-xs font-medium cursor-pointer appearance-none pr-7"
            >
              <option value="all">Courses: All ({subjects.length})</option>
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </select>
            <Tag className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-[var(--ink-subtle)] pointer-events-none" />
          </div>

          {/* Mode Dropdown */}
          <div className="relative">
            <select
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value as ModeFilter)}
              className="theme-input px-2.5 py-1 text-xs font-medium cursor-pointer appearance-none pr-7"
            >
              <option value="all">Activity: All Modes</option>
              <option value="pomodoro">🍅 Pomodoro</option>
              <option value="stopwatch">⏱️ Stopwatch</option>
              <option value="countdown">🎯 Countdown</option>
            </select>
            <Timer className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-[var(--ink-subtle)] pointer-events-none" />
          </div>
        </div>

        {/* Batch Operations */}
        {selectedSessionIds.size > 0 && (
          <div className="flex items-center gap-2 animate-fade-in">
            <span className="text-xs font-mono text-[var(--ink-muted)]">
              {selectedSessionIds.size} selected
            </span>
            <button
              onClick={handleDeleteSelected}
              className="px-2.5 py-1 rounded text-xs text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              <span>Delete</span>
            </button>
          </div>
        )}
      </div>

      {/* TABLE VIEW */}
      {viewMode === "table" ? (
        <div className="sleek-panel overflow-hidden bg-[var(--surface-1)] border-[var(--hairline)] shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[760px]">
              <thead>
                <tr className="border-b border-[var(--hairline)] bg-[var(--surface-2)] text-[11px] font-semibold text-[var(--ink-muted)] uppercase tracking-wider">
                  <th className="py-3 px-4 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={handleSelectAll}
                      className="rounded accent-[var(--primary)] cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-3 w-28">Date</th>
                  <th className="py-3 px-3 w-32">Time</th>
                  <th className="py-3 px-3 w-24">Duration</th>
                  <th className="py-3 px-4">Course / Subject</th>
                  <th className="py-3 px-4">Activity</th>
                  <th className="py-3 px-4 min-w-[180px]">Note</th>
                  <th className="py-3 px-3 w-12 text-center">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[var(--hairline)] text-xs">
                {!isMounted || filteredSessions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-xs text-[var(--ink-subtle)]">
                      No study sessions match your filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredSessions.map((session) => {
                    const isSelected = selectedSessionIds.has(session.id);
                    const modeInfo = getModeDisplay(session.mode);
                    const isEditingNote = editingNoteId === session.id;

                    return (
                      <tr
                        key={session.id}
                        className={`hover:bg-[var(--surface-2)] transition-colors group ${
                          isSelected ? "bg-[var(--surface-3)]/60" : ""
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="py-3 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectRow(session.id)}
                            className="rounded accent-[var(--primary)] cursor-pointer"
                          />
                        </td>

                        {/* Date Badge Pill */}
                        <td className="py-3 px-3">
                          <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                            {formatDateBadge(session.startTime)}
                          </span>
                        </td>

                        {/* Time Range */}
                        <td className="py-3 px-3 font-mono text-[11px] text-[var(--ink-muted)]">
                          {formatTimeRange(session.startTime, session.endTime)}
                        </td>

                        {/* Duration Monospace */}
                        <td className="py-3 px-3 font-mono font-bold text-[var(--ink)] text-xs">
                          {formatDurationLabel(session.durationMinutes)}
                        </td>

                        {/* Subject Badge */}
                        <td className="py-3 px-4">
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border"
                            style={{
                              backgroundColor: `${session.subjectColor}15`,
                              borderColor: `${session.subjectColor}40`,
                              color: session.subjectColor || "var(--ink)",
                            }}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: session.subjectColor }}
                            />
                            <span>{session.subjectName}</span>
                          </span>
                        </td>

                        {/* Activity / Mode */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 text-[var(--ink-muted)] text-xs">
                            <span>{modeInfo.icon}</span>
                            <span className="font-medium text-[var(--ink)]">{modeInfo.label}</span>
                          </div>
                        </td>

                        {/* Notes (Inline editable) */}
                        <td className="py-3 px-4">
                          {isEditingNote ? (
                            <div className="flex items-center gap-1.5">
                              <input
                                type="text"
                                autoFocus
                                value={editNoteText}
                                onChange={(e) => setEditNoteText(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleSaveNote(session.id);
                                  if (e.key === "Escape") setEditingNoteId(null);
                                }}
                                className="theme-input px-2 py-1 text-xs w-full"
                              />
                              <button
                                onClick={() => handleSaveNote(session.id)}
                                className="p-1 rounded btn-primary text-xs cursor-pointer"
                                title="Save"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => setEditingNoteId(null)}
                                className="p-1 rounded text-[var(--ink-subtle)] hover:text-[var(--ink)] cursor-pointer"
                                title="Cancel"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <div
                              onClick={() => handleStartEditNote(session)}
                              className="text-[var(--ink-muted)] hover:text-[var(--ink)] cursor-pointer text-xs truncate max-w-[240px] flex items-center gap-1"
                              title="Click to edit notes"
                            >
                              <span>{session.notes || "—"}</span>
                              <Edit2 className="w-2.5 h-2.5 opacity-0 group-hover:opacity-60 text-[var(--ink-subtle)] flex-shrink-0" />
                            </div>
                          )}
                        </td>

                        {/* Actions Menu ••• */}
                        <td className="py-3 px-3 text-center relative">
                          <div className="relative inline-block">
                            <button
                              onClick={() =>
                                setActiveMenuId(activeMenuId === session.id ? null : session.id)
                              }
                              className="p-1.5 rounded text-[var(--ink-subtle)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
                              title="Session actions"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>

                            {activeMenuId === session.id && (
                              <div className="absolute right-0 mt-1 w-32 rounded-md bg-[var(--surface-1)] border border-[var(--hairline-strong)] shadow-xl py-1 z-30 animate-fade-in text-left">
                                <button
                                  onClick={() => handleStartEditNote(session)}
                                  className="w-full px-3 py-1.5 text-xs text-[var(--ink)] hover:bg-[var(--surface-2)] flex items-center gap-2 cursor-pointer"
                                >
                                  <Edit2 className="w-3 h-3" /> Edit Note
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm("Delete this session record?")) {
                                      deleteSession(session.id);
                                    }
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full px-3 py-1.5 text-xs text-red-600 dark:text-red-400 hover:bg-red-500/10 flex items-center gap-2 cursor-pointer"
                                >
                                  <Trash2 className="w-3 h-3" /> Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* CARDS VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {!isMounted || filteredSessions.length === 0 ? (
            <div className="col-span-full sleek-panel p-12 text-center text-xs text-[var(--ink-subtle)]">
              No study sessions match your filter criteria.
            </div>
          ) : (
            filteredSessions.map((session) => {
              const modeInfo = getModeDisplay(session.mode);

              return (
                <div
                  key={session.id}
                  className="sleek-panel p-4 bg-[var(--surface-1)] border-[var(--hairline)] hover:border-[var(--hairline-strong)] transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border"
                      style={{
                        backgroundColor: `${session.subjectColor}15`,
                        borderColor: `${session.subjectColor}40`,
                        color: session.subjectColor || "var(--ink)",
                      }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: session.subjectColor }}
                      />
                      <span>{session.subjectName}</span>
                    </span>

                    <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                      {formatDateBadge(session.startTime)}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="text-xl font-mono font-bold text-[var(--ink)]">
                      {formatDurationLabel(session.durationMinutes)}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[var(--ink-muted)] font-mono">
                      <span>{formatTimeRange(session.startTime, session.endTime)}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        {modeInfo.icon} {modeInfo.label}
                      </span>
                    </div>
                  </div>

                  {session.notes && (
                    <p className="text-xs text-[var(--ink-muted)] bg-[var(--surface-2)] p-2 rounded border border-[var(--hairline)]">
                      {session.notes}
                    </p>
                  )}

                  <div className="flex items-center justify-end pt-2 border-t border-[var(--hairline)]">
                    <button
                      onClick={() => {
                        if (confirm("Delete this session record?")) {
                          deleteSession(session.id);
                        }
                      }}
                      className="p-1 rounded text-[var(--ink-subtle)] hover:text-red-500 transition-colors cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
