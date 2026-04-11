// PARAM Agent Dashboard
import { GoalInput } from '@/components/GoalInput';
import { HeroScene3D } from '@/components/HeroScene3D';
import { TaskGraph } from '@/components/TaskGraph';
import { LiveTaskCards } from '@/components/LiveTaskCards';
import { ExecutionLog } from '@/components/ExecutionLog';
import { ReasoningPanel } from '@/components/ReasoningPanel';
import { FinalReport } from '@/components/FinalReport';
import { StatusBar } from '@/components/StatusBar';
import { HistoryPanel } from '@/components/HistoryPanel';
import { InterventionInput } from '@/components/InterventionInput';
import { AgentFleet } from '@/components/AgentFleet';
import { MemoryPanel, MemoryBadge } from '@/components/MemoryPanel';
import { DebateView } from '@/components/DebateView';
import { FloatingExportBar } from '@/components/FloatingExportBar';
import { useAgent } from '@/hooks/useAgent';
import { useAgentStore } from '@/store/agentStore';
import { RotateCcw, History, X, Brain } from 'lucide-react';
import { useState, useEffect } from 'react';
import logoImg from '@/assets/logo.jpg';

const Index = () => {
  const agent = useAgent();
  const { executeGoal, executeDebate, phase, subtasks, logs, finalReport, isStreaming, reset, goal, history, loadSession, eventCount, headerFlash } = agent;
  const { debateMode, toggleDebateMode, debateResult } = useAgentStore();
  const [showHistory, setShowHistory] = useState(false);
  const [showMemory, setShowMemory] = useState(false);
  const [viewMode, setViewMode] = useState<'graph' | 'list'>('graph');
  const [showExportBar, setShowExportBar] = useState(false);

  const completed = subtasks.filter((t) => t.status === 'completed').length;
  const failed = subtasks.filter((t) => t.status === 'failed').length;

  // Auto-scroll to final report when it appears
  useEffect(() => {
    if (finalReport) {
      setShowExportBar(true);
      setTimeout(() => {
        document.getElementById('final-report-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    }
  }, [finalReport]);

  // Hide export bar on reset
  useEffect(() => {
    if (phase === 'idle') setShowExportBar(false);
  }, [phase]);

  return (
    <div className="flex flex-col h-screen bg-background surface-glow">
      {/* Header */}
      <header className={`flex items-center justify-between px-6 py-4 border-b transition-all duration-300 ${
        headerFlash === 'amber' ? 'border-warning shadow-[0_0_20px_hsl(38_92%_50%/0.3)]' :
        headerFlash === 'green' ? 'border-success shadow-[0_0_20px_hsl(162_72%_46%/0.3)]' :
        'border-border'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden">
            <img src={logoImg} alt="PARAM Agent" className="w-7 h-7 object-contain" />
          </div>
          <div>
            <h1 className="text-base font-bold text-foreground tracking-tight">PARAM Agent</h1>
            <p className="text-xs text-muted-foreground">Parallel Multi-Agent Execution</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => { setShowMemory(!showMemory); if (showHistory) setShowHistory(false); }}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md border border-border hover:border-primary/30 hover:bg-secondary relative"
          >
            <Brain className="h-3.5 w-3.5" />
            Memory
            <MemoryBadge />
          </button>

          <button
            onClick={() => { setShowHistory(!showHistory); if (showMemory) setShowMemory(false); }}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md border border-border hover:border-primary/30 hover:bg-secondary relative"
          >
            <History className="h-3.5 w-3.5" />
            History
            {history.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-[10px] font-medium bg-primary/15 text-primary rounded-full">
                {history.length}
              </span>
            )}
          </button>

          {phase !== 'idle' && (
            <>
              <button
                onClick={() => setViewMode(viewMode === 'graph' ? 'list' : 'graph')}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md border border-border hover:border-primary/30 hover:bg-secondary"
              >
                {viewMode === 'graph' ? '☰ List' : '◎ Graph'}
              </button>
              <button
                onClick={reset}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md border border-border hover:border-primary/30 hover:bg-secondary"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                New Task
              </button>
            </>
          )}
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* History sidebar */}
        {showHistory && (
          <div className="w-[320px] border-r border-border bg-card/50 flex flex-col overflow-hidden animate-slide-up">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
              <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">Past Sessions</h3>
              <button onClick={() => setShowHistory(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <HistoryPanel history={history} onSelect={loadSession} onClose={() => setShowHistory(false)} />
            </div>
          </div>
        )}
        {/* Memory sidebar */}
        {showMemory && (
          <div className="w-[320px] border-r border-border bg-card/50 flex flex-col overflow-hidden animate-slide-up">
            <MemoryPanel onClose={() => setShowMemory(false)} />
          </div>
        )}

        {/* Left: Input + Fleet + Tasks + Report */}
        <div className="flex-1 flex flex-col overflow-y-auto p-6 space-y-6">
          {phase === 'idle' && (
            <div className="flex flex-col items-center justify-center flex-1 w-full relative overflow-hidden">
              {/* Full 3D background */}
              <HeroScene3D />

              {/* Radial glow overlay */}
              <div className="absolute inset-0 z-[1] bg-[radial-gradient(ellipse_at_center,hsl(162_72%_46%/0.04)_0%,transparent_60%)]" />

              {/* Content */}
              <div className="relative z-10 max-w-2xl mx-auto w-full space-y-8 px-4">
                <div className="text-center space-y-3">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-[11px] font-mono uppercase tracking-widest mb-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    Multi-Agent System Online
                  </div>
                  <h2 className="text-4xl font-bold font-[Space_Grotesk] gradient-text tracking-tight">
                    What should I work on?
                  </h2>
                  <p className="text-sm text-muted-foreground/70 max-w-lg mx-auto font-[Outfit] leading-relaxed">
                    Describe a complex task and the agent fleet will decompose it, spawn specialized sub-agents, and execute tasks in parallel waves.
                  </p>
                </div>
                <GoalInput
                  onSubmit={executeGoal}
                  isRunning={isStreaming}
                  debateMode={debateMode}
                  onToggleDebate={toggleDebateMode}
                  onDebateSubmit={executeDebate}
                />
              </div>
            </div>
          )}

          {phase !== 'idle' && (
            <>
              <div className="bg-card/50 border border-border rounded-lg p-4">
                <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Goal</p>
                <p className="text-sm text-foreground">{goal}</p>
              </div>

              {/* Intervention Input */}
              <InterventionInput />

              {/* Debate View */}
              <DebateView />

              {/* Agent Fleet — live parallel agents */}
              <AgentFleet />

              {/* Task Visualization */}
              {viewMode === 'graph' ? (
                <TaskGraph subtasks={subtasks} />
              ) : (
                <LiveTaskCards subtasks={subtasks} />
              )}

              {finalReport && (
                <div id="final-report-section">
                  <FinalReport report={finalReport} />
                </div>
              )}
            </>
          )}
        </div>

        {/* Middle: Reasoning Panel */}
        {phase !== 'idle' && (
          <div className="w-[300px] border-l border-border flex flex-col bg-card/20">
            <ReasoningPanel />
          </div>
        )}

        {/* Right: Execution Log */}
        {phase !== 'idle' && (
          <div className="w-[340px] border-l border-border flex flex-col bg-card/30">
            <ExecutionLog logs={logs} isStreaming={isStreaming} />
          </div>
        )}
      </div>

      {/* Floating Export Bar */}
      {showExportBar && finalReport && (
        <FloatingExportBar report={finalReport} onDismiss={() => setShowExportBar(false)} />
      )}

      {/* Status Bar */}
      <StatusBar phase={phase} subtaskCount={subtasks.length} completedCount={completed} failedCount={failed} eventCount={eventCount} />
    </div>
  );
};

export default Index;
