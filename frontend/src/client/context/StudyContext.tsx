"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Subject, StudySession, StreakStats, TimerMode, Habit, HabitCompletion } from "@/shared/types";
import { DEFAULT_SUBJECTS, generateSeedSessions } from "@/shared/utils/initialData";
import { formatDateKey } from "@/shared/utils";

const DEFAULT_HABITS: Habit[] = [
  { id: "h-1", name: "Deep Work (2h+)", color: "#10b981", icon: "zap", completions: [] },
  { id: "h-2", name: "Read 20+ Pages", color: "#38bdf8", icon: "book", completions: [] },
  { id: "h-3", name: "Daily Exercise", color: "#f59e0b", icon: "activity", completions: [] },
  { id: "h-4", name: "Outside Walk", color: "#a855f7", icon: "sun", completions: [] },
  { id: "h-5", name: "Zero Distractions", color: "#ec4899", icon: "shield", completions: [] },
  { id: "h-6", name: "Sleep 8+ Hours", color: "#6366f1", icon: "moon", completions: [] },
];

interface StudyContextType {
  theme: "dark" | "light";
  toggleTheme: () => void;
  subjects: Subject[];
  sessions: StudySession[];
  streakStats: StreakStats;
  isMounted: boolean;
  isLoading: boolean;
  addSession: (session: Omit<StudySession, "id">) => Promise<StudySession>;
  deleteSession: (id: string) => Promise<void>;
  updateSessionNote: (id: string, note: string) => Promise<void>;
  deleteMultipleSessions: (ids: string[]) => Promise<void>;
  addSubject: (subject: Omit<Subject, "id">) => Subject;
  deleteSubject: (id: string) => Promise<void>;
  resetAllData: () => Promise<void>;

  // Habits State & Actions
  habits: Habit[];
  addHabit: (habit: Omit<Habit, "id" | "completions">) => Promise<Habit>;
  deleteHabit: (id: string) => Promise<void>;
  toggleHabitDay: (habitId: string, date: string, completed: boolean) => Promise<void>;

  // Global Timer State (persists across tab changes)
  timerMode: TimerMode;
  setTimerMode: (mode: TimerMode) => void;
  timerTargetSeconds: number;
  setTimerTargetSeconds: (seconds: number) => void;
  timerSecondsElapsed: number;
  setTimerSecondsElapsed: React.Dispatch<React.SetStateAction<number>>;
  isTimerRunning: boolean;
  pomodoroStage: "focus" | "break";
  setPomodoroStage: (stage: "focus" | "break") => void;
  selectedSubjectId: string | null;
  setSelectedSubjectId: (id: string | null) => void;
  selectedSubject: Subject | null;
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  completeTimerSession: (overrideDurationSec?: number) => Promise<void>;
  showSavedToast: boolean;
  setShowSavedToast: (show: boolean) => void;
}

const StudyContext = createContext<StudyContextType | undefined>(undefined);

const STORAGE_KEYS = {
  THEME: "study_streak_theme_v4",
  SESSIONS: "study_streak_sessions_v4",
  SUBJECTS: "study_streak_subjects_v4",
  HABITS: "study_streak_habits_v4",
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

export const StudyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [subjects, setSubjects] = useState<Subject[]>(DEFAULT_SUBJECTS);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [habits, setHabits] = useState<Habit[]>(DEFAULT_HABITS);
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Global Timer State
  const [timerMode, setTimerModeState] = useState<TimerMode>("pomodoro");
  const [timerTargetSeconds, setTimerTargetSeconds] = useState<number>(25 * 60);
  const [timerSecondsElapsed, setTimerSecondsElapsed] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [pomodoroStage, setPomodoroStage] = useState<"focus" | "break">("focus");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [showSavedToast, setShowSavedToast] = useState<boolean>(false);

  // Audio tone generator
  const playChime = useCallback(() => {
    try {
      if (typeof window === "undefined") return;
      const AudioContext =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.01, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch (e) {
      console.warn("Audio chime warning:", e);
    }
  }, []);

  // Compute selected subject or fallback
  const selectedSubject = useMemo(() => {
    if (subjects.length === 0) return null;
    if (!selectedSubjectId) return subjects[0];
    const found = subjects.find((s) => s.id === selectedSubjectId);
    return found || subjects[0];
  }, [subjects, selectedSubjectId]);

  // Load from backend API with fallback to localStorage
  const fetchRemoteData = useCallback(async () => {
    try {
      const [subjectsRes, sessionsRes, habitsRes] = await Promise.allSettled([
        fetch(`${API_BASE}/subjects`),
        fetch(`${API_BASE}/sessions`),
        fetch(`${API_BASE}/habits`),
      ]);

      let loadedSubjects: Subject[] | null = null;
      let loadedSessions: StudySession[] | null = null;
      let loadedHabits: Habit[] | null = null;

      if (subjectsRes.status === "fulfilled" && subjectsRes.value.ok) {
        const json = await subjectsRes.value.json();
        if (json.success && Array.isArray(json.data)) {
          const subs: Subject[] = json.data;
          loadedSubjects = subs;
          setSubjects(subs);
          localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(subs));
        }
      }

      if (sessionsRes.status === "fulfilled" && sessionsRes.value.ok) {
        const json = await sessionsRes.value.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          const sessList: StudySession[] = json.data.map((s: {
            id: string;
            subjectId: string;
            subjectName: string;
            subjectColor: string;
            durationMinutes: number;
            durationSeconds: number;
            startTime: string;
            endTime: string;
            mode: "pomodoro" | "stopwatch" | "countdown";
            notes?: string | null;
            completed: boolean;
          }) => ({
            ...s,
            startTime: new Date(s.startTime).toISOString(),
            endTime: new Date(s.endTime).toISOString(),
          }));
          loadedSessions = sessList;
          setSessions(sessList);
          localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessList));
        }
      }

      if (habitsRes.status === "fulfilled" && habitsRes.value.ok) {
        const json = await habitsRes.value.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          const habList: Habit[] = json.data;
          loadedHabits = habList;
          setHabits(habList);
          localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(habList));
        }
      }

      if (!loadedSubjects) {
        const localSubs = localStorage.getItem(STORAGE_KEYS.SUBJECTS);
        if (localSubs) setSubjects(JSON.parse(localSubs));
      }
      if (!loadedSessions) {
        const localSess = localStorage.getItem(STORAGE_KEYS.SESSIONS);
        if (localSess) {
          setSessions(JSON.parse(localSess));
        } else {
          const seeds = generateSeedSessions();
          setSessions(seeds);
          localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(seeds));
        }
      }
      if (!loadedHabits) {
        const localHabs = localStorage.getItem(STORAGE_KEYS.HABITS);
        if (localHabs) {
          try {
            setHabits(JSON.parse(localHabs));
          } catch {
            setHabits(DEFAULT_HABITS);
          }
        } else {
          setHabits(DEFAULT_HABITS);
          localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(DEFAULT_HABITS));
        }
      }
    } catch (e) {
      console.warn("Could not sync with backend API, using local storage:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    setIsMounted(true);
    try {
      const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) as "dark" | "light" | null;
      if (savedTheme) setTheme(savedTheme);

      const localSubs = localStorage.getItem(STORAGE_KEYS.SUBJECTS);
      if (localSubs) {
        try {
          const parsed = JSON.parse(localSubs);
          if (Array.isArray(parsed)) setSubjects(parsed);
        } catch {
          setSubjects(DEFAULT_SUBJECTS);
        }
      }
      const localSess = localStorage.getItem(STORAGE_KEYS.SESSIONS);
      if (localSess) {
        try {
          const parsed = JSON.parse(localSess);
          if (Array.isArray(parsed)) setSessions(parsed);
        } catch {
          setSessions(generateSeedSessions());
        }
      } else {
        const seeds = generateSeedSessions();
        setSessions(seeds);
      }

      const localHabs = localStorage.getItem(STORAGE_KEYS.HABITS);
      if (localHabs) {
        try {
          const parsed = JSON.parse(localHabs);
          if (Array.isArray(parsed)) setHabits(parsed);
        } catch {
          setHabits(DEFAULT_HABITS);
        }
      }
    } catch (e) {
      console.error("Local storage error:", e);
    }

    fetchRemoteData();
  }, [fetchRemoteData]);

  useEffect(() => {
    if (!isMounted) return;
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.remove("dark");
      root.classList.add("light");
    }
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  }, [theme, isMounted]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const addSession = async (sessionData: Omit<StudySession, "id">): Promise<StudySession> => {
    const tempId = `sess-${Date.now()}`;
    const newSession: StudySession = {
      ...sessionData,
      id: tempId,
    };

    setSessions((prev) => {
      const updated = [newSession, ...prev];
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(updated));
      }
      return updated;
    });

    try {
      console.log("[API] Sending session to backend:", sessionData);
      const res = await fetch(`${API_BASE}/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sessionData),
      });

      if (res.ok) {
        const data = await res.json();
        console.log("[API] Session saved successfully:", data);
        if (data.success && data.data?.id) {
          setSessions((prev) =>
            prev.map((s) => (s.id === tempId ? { ...s, id: data.data.id } : s))
          );
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        console.warn("[API] Backend session record returned status:", res.status, errData);
      }
    } catch (err) {
      console.warn("[API] Backend session record fetch failed:", err);
    }

    return newSession;
  };

  const deleteSession = async (id: string) => {
    setSessions((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(updated));
      }
      return updated;
    });

    try {
      await fetch(`${API_BASE}/sessions/${id}`, { method: "DELETE" });
    } catch (e) {
      console.warn("Backend session delete error:", e);
    }
  };

  const updateSessionNote = async (id: string, note: string) => {
    setSessions((prev) => {
      const updated = prev.map((s) => (s.id === id ? { ...s, notes: note } : s));
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(updated));
      }
      return updated;
    });
  };

  const deleteMultipleSessions = async (ids: string[]) => {
    const idSet = new Set(ids);
    setSessions((prev) => {
      const updated = prev.filter((s) => !idSet.has(s.id));
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(updated));
      }
      return updated;
    });

    for (const id of ids) {
      try {
        await fetch(`${API_BASE}/sessions/${id}`, { method: "DELETE" });
      } catch (e) {
        console.warn("Backend session delete error:", e);
      }
    }
  };

  const addSubject = (subjectData: Omit<Subject, "id">): Subject => {
    const tempId = `sub-${Date.now()}`;
    const newSub: Subject = {
      ...subjectData,
      id: tempId,
    };

    setSubjects((prev) => {
      const updated = [...prev, newSub];
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(updated));
      }
      return updated;
    });
    setSelectedSubjectId(tempId);

    fetch(`${API_BASE}/subjects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(subjectData),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data?.id) {
          setSubjects((prev) =>
            prev.map((s) => (s.id === tempId ? { ...s, id: data.data.id } : s))
          );
          setSelectedSubjectId((cur) => (cur === tempId ? data.data.id : cur));
        }
      })
      .catch((err) => console.warn("Backend subject creation error:", err));

    return newSub;
  };

  const deleteSubject = async (id: string) => {
    setSubjects((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(updated));
      }
      return updated;
    });

    // Update selectedSubjectId if deleted
    if (selectedSubjectId === id) {
      const remaining = subjects.filter((s) => s.id !== id);
      setSelectedSubjectId(remaining.length > 0 ? remaining[0].id : null);
    }

    try {
      await fetch(`${API_BASE}/subjects/${id}`, { method: "DELETE" });
    } catch (e) {
      console.warn("Backend subject delete error:", e);
    }
  };

  // Habit Actions
  const addHabit = async (habitData: Omit<Habit, "id" | "completions">): Promise<Habit> => {
    const tempId = `hab-${Date.now()}`;
    const newHabit: Habit = {
      ...habitData,
      id: tempId,
      completions: [],
    };

    setHabits((prev) => {
      const updated = [...prev, newHabit];
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(updated));
      }
      return updated;
    });

    try {
      const res = await fetch(`${API_BASE}/habits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(habitData),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data?.id) {
          setHabits((prev) =>
            prev.map((h) => (h.id === tempId ? { ...h, id: data.data.id } : h))
          );
          return data.data;
        }
      }
    } catch (e) {
      console.warn("Backend habit create error:", e);
    }

    return newHabit;
  };

  const deleteHabit = async (id: string) => {
    setHabits((prev) => {
      const updated = prev.filter((h) => h.id !== id);
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(updated));
      }
      return updated;
    });

    try {
      await fetch(`${API_BASE}/habits/${id}`, { method: "DELETE" });
    } catch (e) {
      console.warn("Backend habit delete error:", e);
    }
  };

  const toggleHabitDay = async (habitId: string, date: string, completed: boolean) => {
    setHabits((prev) => {
      const updated = prev.map((h) => {
        if (h.id !== habitId) return h;
        const completions = h.completions || [];
        const existingIdx = completions.findIndex((c) => c.date === date);
        let updatedCompletions: HabitCompletion[];

        if (existingIdx >= 0) {
          updatedCompletions = completions.map((c, i) =>
            i === existingIdx ? { ...c, completed } : c
          );
        } else {
          updatedCompletions = [
            ...completions,
            {
              id: `comp-${Date.now()}`,
              habitId,
              date,
              completed,
              createdAt: new Date().toISOString(),
            },
          ];
        }

        return {
          ...h,
          completions: updatedCompletions,
        };
      });

      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(updated));
      }
      return updated;
    });

    try {
      await fetch(`${API_BASE}/habits/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ habitId, date, completed }),
      });
    } catch (e) {
      console.warn("Backend habit toggle error:", e);
    }
  };

  const resetAllData = async () => {
    const seeds = generateSeedSessions();
    setSessions(seeds);
    setSubjects(DEFAULT_SUBJECTS);
    setHabits(DEFAULT_HABITS);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(seeds));
      localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(DEFAULT_SUBJECTS));
      localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(DEFAULT_HABITS));
    }
    try {
      await fetch(`${API_BASE}/seed`, { method: "POST" });
    } catch (e) {
      console.warn("Seed endpoint call error:", e);
    }
  };

  // Timer controls
  const startTimer = useCallback(() => {
    if (!sessionStartTime) {
      setSessionStartTime(new Date());
    }
    setIsTimerRunning(true);
    setShowSavedToast(false);
  }, [sessionStartTime]);

  const pauseTimer = useCallback(() => {
    setIsTimerRunning(false);
  }, []);

  const resetTimer = useCallback(() => {
    setIsTimerRunning(false);
    setTimerSecondsElapsed(0);
    setSessionStartTime(null);
  }, []);

  const setTimerMode = useCallback((newMode: TimerMode) => {
    setIsTimerRunning(false);
    setTimerSecondsElapsed(0);
    setSessionStartTime(null);
    setTimerModeState(newMode);

    if (newMode === "pomodoro") {
      setTimerTargetSeconds(25 * 60);
      setPomodoroStage("focus");
    } else if (newMode === "countdown") {
      setTimerTargetSeconds(10 * 60);
    }
  }, []);

  // Complete & Save Session Function
  const completeTimerSession = useCallback(
    async (overrideDurationSec?: number) => {
      setIsTimerRunning(false);
      const durationSec = overrideDurationSec ?? timerSecondsElapsed;
      if (durationSec <= 0) {
        setTimerSecondsElapsed(0);
        setSessionStartTime(null);
        return;
      }

      const durationMins = Math.round(durationSec / 60);
      const activeSub = selectedSubject || {
        id: "general-study",
        name: "General Study",
        color: "#ffffff",
      };

      const now = new Date();
      const start = sessionStartTime || new Date(now.getTime() - durationSec * 1000);

      await addSession({
        subjectId: activeSub.id,
        subjectName: activeSub.name,
        subjectColor: activeSub.color,
        durationSeconds: durationSec,
        durationMinutes: durationMins,
        startTime: start.toISOString(),
        endTime: now.toISOString(),
        mode: timerMode,
        completed: true,
      });

      playChime();
      setShowSavedToast(true);
      setTimeout(() => setShowSavedToast(false), 4000);

      setTimerSecondsElapsed(0);
      setSessionStartTime(null);
    },
    [timerSecondsElapsed, selectedSubject, sessionStartTime, timerMode, addSession, playChime]
  );

  // Background Persistent Timer Interval (ticks even when switching tabs)
  const completeTimerSessionRef = useRef(completeTimerSession);
  useEffect(() => {
    completeTimerSessionRef.current = completeTimerSession;
  }, [completeTimerSession]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSecondsElapsed((prev) => {
          const nextVal = prev + 1;
          if (
            (timerMode === "pomodoro" || timerMode === "countdown") &&
            nextVal >= timerTargetSeconds
          ) {
            completeTimerSessionRef.current(nextVal);
            return timerTargetSeconds;
          }
          return nextVal;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, timerMode, timerTargetSeconds]);

  // Streak & Screen Time Statistics
  const streakStats: StreakStats = useMemo(() => {
    const dailyMinutesMap = new Map<string, number>();

    sessions.forEach((s) => {
      if (!s.startTime) return;
      const dateKey = formatDateKey(new Date(s.startTime));
      const current = dailyMinutesMap.get(dateKey) || 0;
      dailyMinutesMap.set(dateKey, current + s.durationMinutes);
    });

    const todayKey = formatDateKey(new Date());
    const todayMinutes = dailyMinutesMap.get(todayKey) || 0;

    let totalActiveDays = 0;
    let totalMinutes = 0;

    dailyMinutesMap.forEach((mins) => {
      totalMinutes += mins;
      if (mins >= 25) {
        totalActiveDays += 1;
      }
    });

    let currentStreak = 0;
    const checkDate = new Date();

    const todayActive = todayMinutes >= 25;
    if (todayActive) {
      currentStreak = 1;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayKey = formatDateKey(yesterday);
      if ((dailyMinutesMap.get(yesterdayKey) || 0) >= 25) {
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        currentStreak = 0;
      }
    }

    if (currentStreak > 0 || (dailyMinutesMap.get(formatDateKey(checkDate)) || 0) >= 25) {
      while (true) {
        const key = formatDateKey(checkDate);
        const mins = dailyMinutesMap.get(key) || 0;
        if (mins >= 25) {
          if (!todayActive && currentStreak === 0) {
            currentStreak = 1;
          } else {
            currentStreak++;
          }
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    }

    const sortedDates = Array.from(dailyMinutesMap.keys())
      .filter((key) => (dailyMinutesMap.get(key) || 0) >= 25)
      .sort();

    let longestStreak = 0;
    let tempStreak = 0;
    let prevDate: Date | null = null;

    sortedDates.forEach((dStr) => {
      const currentDate = new Date(dStr + "T00:00:00");
      if (!prevDate) {
        tempStreak = 1;
      } else {
        const diffDays = Math.round(
          (currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (diffDays === 1) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
      }
      longestStreak = Math.max(longestStreak, tempStreak);
      prevDate = currentDate;
    });

    return {
      currentStreak,
      longestStreak: Math.max(longestStreak, currentStreak),
      totalDaysActive: totalActiveDays,
      totalMinutes,
      todayMinutes,
    };
  }, [sessions]);

  return (
    <StudyContext.Provider
      value={{
        theme,
        toggleTheme,
        subjects,
        sessions,
        streakStats,
        isMounted,
        isLoading,
        addSession,
        deleteSession,
        updateSessionNote,
        deleteMultipleSessions,
        addSubject,
        deleteSubject,
        resetAllData,

        // Habits
        habits,
        addHabit,
        deleteHabit,
        toggleHabitDay,

        // Timer
        timerMode,
        setTimerMode,
        timerTargetSeconds,
        setTimerTargetSeconds,
        timerSecondsElapsed,
        setTimerSecondsElapsed,
        isTimerRunning,
        pomodoroStage,
        setPomodoroStage,
        selectedSubjectId,
        setSelectedSubjectId,
        selectedSubject,
        startTimer,
        pauseTimer,
        resetTimer,
        completeTimerSession,
        showSavedToast,
        setShowSavedToast,
      }}
    >
      {children}
    </StudyContext.Provider>
  );
};

export const useStudy = () => {
  const context = useContext(StudyContext);
  if (!context) {
    throw new Error("useStudy must be used within a StudyProvider");
  }
  return context;
};
