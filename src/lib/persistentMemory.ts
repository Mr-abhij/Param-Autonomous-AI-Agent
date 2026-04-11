const STORAGE_KEY = 'param_persistent_memory';

export interface MemoryRecord {
  id: string;
  sessionId: string;
  goal: string;
  keyFindings: string[];
  summary: string;
  timestamp: number;
  taskCount: number;
}

function getAll(): MemoryRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as MemoryRecord[];
  } catch {
    return [];
  }
}

function saveAll(records: MemoryRecord[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export function saveSession(
  sessionId: string,
  goal: string,
  taskCount: number,
  finalReport: string,
  keyFindings: string[]
): void {
  const records = getAll();
  // Avoid duplicates
  if (records.some(r => r.sessionId === sessionId)) return;

  const summary = finalReport.slice(0, 300);
  records.unshift({
    id: crypto.randomUUID(),
    sessionId,
    goal,
    keyFindings,
    summary,
    timestamp: Date.now(),
    taskCount,
  });

  // Keep max 50 sessions
  if (records.length > 50) records.length = 50;
  saveAll(records);
}

export function searchMemory(query: string): MemoryRecord[] {
  const records = getAll();
  if (!query.trim()) return [];

  const keywords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  
  const scored = records.map(r => {
    const text = `${r.goal} ${r.keyFindings.join(' ')} ${r.summary}`.toLowerCase();
    const score = keywords.reduce((acc, kw) => acc + (text.includes(kw) ? 1 : 0), 0);
    return { record: r, score };
  });

  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(s => s.record);
}

export function getAllMemories(): MemoryRecord[] {
  return getAll().sort((a, b) => b.timestamp - a.timestamp);
}

export function clearAllMemories(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function getMemoryCount(): number {
  return getAll().length;
}
