"use client";

import React, { useState } from "react";
import { useStudy } from "@/client/context/StudyContext";
import { X, Plus } from "lucide-react";

interface ManualLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ManualLogModal: React.FC<ManualLogModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { subjects, addSession } = useStudy();
  const [subjectId, setSubjectId] = useState(subjects[0]?.id || "");
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [dateStr, setDateStr] = useState(() => new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedSub = subjects.find((s) => s.id === subjectId) || subjects[0];
    if (!selectedSub) return;

    const start = new Date(dateStr + "T12:00:00");
    const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

    addSession({
      subjectId: selectedSub.id,
      subjectName: selectedSub.name,
      subjectColor: selectedSub.color,
      durationMinutes: Number(durationMinutes),
      durationSeconds: Number(durationMinutes) * 60,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      mode: "stopwatch",
      notes: notes.trim() || undefined,
      completed: true,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-sm sleek-panel p-5 bg-[var(--modal-bg)] border-[var(--hairline-strong)] text-[var(--ink)] shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--hairline)]">
          <span className="text-xs font-semibold text-[var(--ink)]">Log Study Session</span>
          <button
            onClick={onClose}
            className="p-1 text-[var(--ink-subtle)] hover:text-[var(--ink)] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="pt-3 space-y-3">
          <div>
            <label className="block text-[11px] text-[var(--ink-muted)] mb-1">Subject</label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="theme-input w-full px-2.5 py-1.5 text-xs cursor-pointer"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-[var(--ink-muted)] mb-1">Duration (minutes)</label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min="1"
                max="720"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Math.max(1, Number(e.target.value)))}
                className="theme-input w-full px-2.5 py-1.5 text-xs font-mono"
              />
              {[15, 30, 45, 60].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setDurationMinutes(m)}
                  className={`px-2 py-1 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                    durationMinutes === m
                      ? "bg-[var(--primary)] text-[var(--on-primary)] font-semibold shadow-xs"
                      : "bg-[var(--surface-2)] text-[var(--ink-subtle)] border border-[var(--hairline)] hover:text-[var(--ink)]"
                  }`}
                >
                  {m}m
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-[var(--ink-muted)] mb-1">Date</label>
            <input
              type="date"
              value={dateStr}
              onChange={(e) => setDateStr(e.target.value)}
              className="theme-input w-full px-2.5 py-1.5 text-xs cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-[11px] text-[var(--ink-muted)] mb-1">Notes (Optional)</label>
            <input
              type="text"
              placeholder="Topic or chapter studied..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="theme-input w-full px-2.5 py-1.5 text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary text-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
