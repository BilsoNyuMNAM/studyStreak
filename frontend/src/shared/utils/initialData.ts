import { Subject, StudySession } from "../types";

export const DEFAULT_SUBJECTS: Subject[] = [
  { id: "sub-1", name: "Deep Work", color: "#e4e4e7" },
  { id: "sub-2", name: "Engineering & Code", color: "#a1a1aa" },
  { id: "sub-3", name: "Reading & Research", color: "#71717a" },
  { id: "sub-4", name: "Mathematics", color: "#d4d4d8" },
];

export function generateSeedSessions(): StudySession[] {
  const sessions: StudySession[] = [];
  const now = new Date();

  for (let i = 40; i >= 0; i--) {
    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() - i);
    
    const isRestDay = (i === 12 || i === 25);
    
    if (!isRestDay) {
      const numSessions = (i % 3 === 0) ? 2 : 1;
      
      for (let s = 0; s < numSessions; s++) {
        const sub = DEFAULT_SUBJECTS[(i + s) % DEFAULT_SUBJECTS.length];
        const durationMins = [25, 45, 60, 30, 90][(i + s) % 5];
        const durationSecs = durationMins * 60;
        
        const sessionStart = new Date(targetDate);
        sessionStart.setHours(10 + s * 4, 0, 0, 0);
        const sessionEnd = new Date(sessionStart.getTime() + durationSecs * 1000);

        sessions.push({
          id: `seed-${i}-${s}`,
          subjectId: sub.id,
          subjectName: sub.name,
          subjectColor: sub.color,
          durationSeconds: durationSecs,
          durationMinutes: durationMins,
          startTime: sessionStart.toISOString(),
          endTime: sessionEnd.toISOString(),
          mode: s === 0 ? "pomodoro" : "stopwatch",
          completed: true,
          notes: null,
        });
      }
    }
  }

  return sessions;
}
