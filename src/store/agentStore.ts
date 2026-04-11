import { create } from 'zustand';

export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'adapting';

export interface StructuredDataItem {
  name: string;
  category?: string;
  location?: string;
  priceRange?: string;
  rating?: number;
  description?: string;
  tags?: string[];
  mapQuery?: string;
}

export interface StructuredData {
  items?: StructuredDataItem[];
  budgetBreakdown?: {
    items: { category: string; amount: string; percentage: number }[];
    total?: string;
  };
  tips?: string[];
}

export interface SubTask {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  result?: string;
  structuredData?: StructuredData;
  toolCalls?: ToolCall[];
  startedAt?: number;
  completedAt?: number;
  retryCount: number;
  category?: string;
  dependsOn?: string[];
}

export interface ToolCall {
  id: string;
  tool: string;
  input: string;
  output?: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  timestamp: number;
}

export interface LogEntry {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'thinking' | 'tool' | 'quality_retry' | 'level_start' | 'subagent_start' | 'subagent_complete' | 'memory_loaded';
  message: string;
  timestamp: number;
  taskId?: string;
}

export type AgentPhase = 'idle' | 'decomposing' | 'planning' | 'executing' | 'adapting' | 'completed' | 'error';

export interface ActiveAgent {
  agentId: string;
  taskId: string;
  taskTitle: string;
  category: string;
  status: 'spawning' | 'running' | 'complete' | 'failed';
  toolsUsed: string[];
  currentTool?: string;
  startedAt: number;
}

export interface DebateResult {
  optimist: string;
  skeptic: string;
  synthesis: string;
  confidence: number;
}

interface AgentState {
  goal: string;
  phase: AgentPhase;
  subtasks: SubTask[];
  logs: LogEntry[];
  finalReport: string;
  isStreaming: boolean;
  totalTokens: number;
  startTime: number | null;
  eventCount: number;
  sessionId: string | null;
  retryingTaskId: string | null;
  intervention: string | null;
  headerFlash: 'amber' | 'green' | null;

  // Parallel multi-agent state
  activeAgents: Record<string, ActiveAgent>;
  executionLevels: string[][];
  currentLevel: number;

  // Memory state
  memoryLoaded: boolean;
  relevantMemories: Array<{ goal: string; summary: string }>;

  // Debate state
  debateMode: boolean;
  debateResult: DebateResult | null;
  debateStreaming: { optimist: string; skeptic: string; synthesis: string };

  setGoal: (goal: string) => void;
  setPhase: (phase: AgentPhase) => void;
  setSubtasks: (tasks: SubTask[]) => void;
  updateSubtask: (id: string, update: Partial<SubTask>) => void;
  addLog: (entry: Omit<LogEntry, 'id' | 'timestamp'>) => void;
  setFinalReport: (report: string) => void;
  setIsStreaming: (v: boolean) => void;
  addTokens: (n: number) => void;
  incrementEventCount: () => void;
  setSessionId: (id: string | null) => void;
  setRetryingTaskId: (id: string | null) => void;
  setIntervention: (msg: string | null) => void;
  setHeaderFlash: (flash: 'amber' | 'green' | null) => void;

  // Parallel multi-agent actions
  setExecutionLevels: (levels: string[][]) => void;
  setCurrentLevel: (level: number) => void;
  addActiveAgent: (agent: ActiveAgent) => void;
  updateActiveAgent: (agentId: string, update: Partial<ActiveAgent>) => void;
  removeActiveAgent: (agentId: string) => void;
  clearActiveAgents: () => void;

  // Memory actions
  setMemoryLoaded: (loaded: boolean) => void;
  setRelevantMemories: (memories: Array<{ goal: string; summary: string }>) => void;

  // Debate actions
  toggleDebateMode: () => void;
  setDebateMode: (mode: boolean) => void;
  updateDebateChunk: (agent: 'optimist' | 'skeptic' | 'synthesis', chunk: string) => void;
  setDebateResult: (result: DebateResult | null) => void;
  resetDebate: () => void;

  reset: () => void;
}

export const useAgentStore = create<AgentState>((set) => ({
  goal: '',
  phase: 'idle',
  subtasks: [],
  logs: [],
  finalReport: '',
  isStreaming: false,
  totalTokens: 0,
  startTime: null,
  eventCount: 0,
  sessionId: null,
  retryingTaskId: null,
  intervention: null,
  headerFlash: null,
  activeAgents: {},
  executionLevels: [],
  currentLevel: 0,
  memoryLoaded: false,
  relevantMemories: [],
  debateMode: false,
  debateResult: null,
  debateStreaming: { optimist: '', skeptic: '', synthesis: '' },

  setGoal: (goal) => set({ goal }),
  setPhase: (phase) => set({ phase }),
  setSubtasks: (subtasks) => set({ subtasks }),
  updateSubtask: (id, update) =>
    set((s) => ({
      subtasks: s.subtasks.map((t) => (t.id === id ? { ...t, ...update } : t)),
    })),
  addLog: (entry) =>
    set((s) => ({
      logs: [...s.logs, { ...entry, id: crypto.randomUUID(), timestamp: Date.now() }],
      eventCount: s.eventCount + 1,
    })),
  setFinalReport: (finalReport) => set({ finalReport }),
  setIsStreaming: (isStreaming) => set({ isStreaming }),
  addTokens: (n) => set((s) => ({ totalTokens: s.totalTokens + n })),
  incrementEventCount: () => set((s) => ({ eventCount: s.eventCount + 1 })),
  setSessionId: (sessionId) => set({ sessionId }),
  setRetryingTaskId: (retryingTaskId) => set({ retryingTaskId }),
  setIntervention: (intervention) => set({ intervention }),
  setHeaderFlash: (headerFlash) => set({ headerFlash }),

  setExecutionLevels: (executionLevels) => set({ executionLevels }),
  setCurrentLevel: (currentLevel) => set({ currentLevel }),
  addActiveAgent: (agent) =>
    set((s) => ({ activeAgents: { ...s.activeAgents, [agent.agentId]: agent } })),
  updateActiveAgent: (agentId, update) =>
    set((s) => ({
      activeAgents: {
        ...s.activeAgents,
        [agentId]: s.activeAgents[agentId] ? { ...s.activeAgents[agentId], ...update } : s.activeAgents[agentId],
      },
    })),
  removeActiveAgent: (agentId) =>
    set((s) => {
      const { [agentId]: _, ...rest } = s.activeAgents;
      return { activeAgents: rest };
    }),
  clearActiveAgents: () => set({ activeAgents: {} }),

  // Memory
  setMemoryLoaded: (memoryLoaded) => set({ memoryLoaded }),
  setRelevantMemories: (relevantMemories) => set({ relevantMemories }),

  // Debate
  toggleDebateMode: () => set((s) => ({ debateMode: !s.debateMode })),
  setDebateMode: (debateMode) => set({ debateMode }),
  updateDebateChunk: (agent, chunk) =>
    set((s) => ({
      debateStreaming: { ...s.debateStreaming, [agent]: s.debateStreaming[agent] + chunk },
    })),
  setDebateResult: (debateResult) => set({ debateResult }),
  resetDebate: () => set({ debateResult: null, debateStreaming: { optimist: '', skeptic: '', synthesis: '' } }),

  reset: () =>
    set({
      goal: '',
      phase: 'idle',
      subtasks: [],
      logs: [],
      finalReport: '',
      isStreaming: false,
      totalTokens: 0,
      startTime: null,
      eventCount: 0,
      sessionId: null,
      retryingTaskId: null,
      intervention: null,
      headerFlash: null,
      activeAgents: {},
      executionLevels: [],
      currentLevel: 0,
      memoryLoaded: false,
      relevantMemories: [],
      debateResult: null,
      debateStreaming: { optimist: '', skeptic: '', synthesis: '' },
    }),
}));
