"use client";

import React, { useState } from "react";
import { useStudy } from "@/client/context/StudyContext";
import { X, Plus, Trash2, Check } from "lucide-react";

interface SubjectManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const COLOR_PRESETS = [
  "#ffffff",
  "#e4e4e7",
  "#a1a1aa",
  "#71717a",
  "#52525b",
  "#10b981",
  "#38bdf8",
  "#6366f1",
  "#f59e0b",
];

export const SubjectManagerModal: React.FC<SubjectManagerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { subjects, addSubject, deleteSubject } = useStudy();
  const [newSubjectName, setNewSubjectName] = useState("");
  const [selectedColor, setSelectedColor] = useState(COLOR_PRESETS[0]);

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName.trim()) return;

    addSubject({
      name: newSubjectName.trim(),
      color: selectedColor,
    });

    setNewSubjectName("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-sm sleek-panel p-5 bg-[var(--modal-bg)] border-[var(--hairline-strong)] text-[var(--ink)] shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--hairline)]">
          <span className="text-xs font-semibold text-[var(--ink)]">Manage Subjects</span>
          <button
            onClick={onClose}
            className="p-1 text-[var(--ink-subtle)] hover:text-[var(--ink)] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="py-3 space-y-1.5 max-h-48 overflow-y-auto pr-1">
          {subjects.length === 0 ? (
            <div className="text-center py-4 text-xs text-[var(--ink-subtle)]">
              No subjects created yet.
            </div>
          ) : (
            subjects.map((sub) => (
              <div
                key={sub.id}
                className="flex items-center justify-between p-2 rounded bg-[var(--surface-2)] border border-[var(--hairline)]"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: sub.color }}
                  />
                  <span className="text-xs text-[var(--ink)] font-medium">{sub.name}</span>
                </div>

                <button
                  onClick={() => deleteSubject(sub.id)}
                  className="p-1 text-[var(--ink-subtle)] hover:text-red-500 transition-colors cursor-pointer"
                  title="Delete subject"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        <form onSubmit={handleAdd} className="pt-3 border-t border-[var(--hairline)] space-y-3">
          <input
            type="text"
            placeholder="New subject name..."
            value={newSubjectName}
            onChange={(e) => setNewSubjectName(e.target.value)}
            className="theme-input w-full px-2.5 py-1.5 text-xs"
          />

          <div className="flex items-center gap-1.5">
            {COLOR_PRESETS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setSelectedColor(color)}
                className="w-4 h-4 rounded-full flex items-center justify-center transition-transform hover:scale-110 cursor-pointer"
                style={{ backgroundColor: color }}
              >
                {selectedColor === color && (
                  <Check className="w-2.5 h-2.5 text-black stroke-[3]" />
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost text-xs cursor-pointer"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={!newSubjectName.trim()}
              className="btn-primary text-xs cursor-pointer disabled:opacity-40"
            >
              <Plus className="w-3 h-3" /> Add
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
