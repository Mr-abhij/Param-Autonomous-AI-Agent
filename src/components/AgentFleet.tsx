import { useAgentStore, ActiveAgent } from '@/store/agentStore';
import { Search, Code2, BarChart3, PenTool, Map, Cpu, Zap, Activity } from 'lucide-react';

const categoryIcons: Record<string, React.ReactNode> = {
  research: <Search className="h-4 w-4" />,
  code: <Code2 className="h-4 w-4" />,
  analysis: <BarChart3 className="h-4 w-4" />,
  write: <PenTool className="h-4 w-4" />,
  plan: <Map className="h-4 w-4" />,
  default: <Cpu className="h-4 w-4" />,
};

const categoryColors: Record<string, { border: string; bg: string; text: string; glow: string }> = {
  research: { border: 'border-info/50', bg: 'bg-info/8', text: 'text-info', glow: 'shadow-[0_0_15px_hsl(200_90%_55%/0.2)]' },
  code: { border: 'border-primary/50', bg: 'bg-primary/8', text: 'text-primary', glow: 'shadow-[0_0_15px_hsl(var(--primary)/0.2)]' },
  analysis: { border: 'border-warning/50', bg: 'bg-warning/8', text: 'text-warning', glow: 'shadow-[0_0_15px_hsl(38_92%_50%/0.2)]' },
  write: { border: 'border-success/50', bg: 'bg-success/8', text: 'text-success', glow: 'shadow-[0_0_15px_hsl(162_72%_46%/0.2)]' },
  plan: { border: 'border-accent/50', bg: 'bg-accent/8', text: 'text-accent', glow: 'shadow-[0_0_15px_hsl(var(--accent)/0.2)]' },
  default: { border: 'border-border', bg: 'bg-card/30', text: 'text-muted-foreground', glow: '' },
};

const statusLabels: Record<ActiveAgent['status'], string> = {
  spawning: 'INITIALIZING',
  running: 'EXECUTING',
  complete: 'DONE',
  failed: 'ERROR',
};

export function AgentFleet() {
  const { activeAgents, currentLevel, executionLevels } = useAgentStore();
  const agents = Object.values(activeAgents);

  if (agents.length === 0 && executionLevels.length === 0) return null;

  const totalLevels = executionLevels.length;
  const runningCount = agents.filter(a => a.status === 'running' || a.status === 'spawning').length;

  return (
    <div className="space-y-3 animate-slide-up">
      {/* Fleet header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1 rounded-md bg-primary/10 border border-primary/20">
            <Activity className="h-3.5 w-3.5 text-primary" />
          </div>
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
            Agent Fleet
          </h3>
          {runningCount > 0 && (
            <span className="flex items-center gap-1.5 text-[10px] font-mono text-primary">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              {runningCount} agents active
            </span>
          )}
        </div>
        {totalLevels > 0 && (
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground bg-muted/40 px-2.5 py-1 rounded-full border border-border/50">
            <Zap className="h-3 w-3 text-primary" />
            WAVE {currentLevel + 1}/{totalLevels} — {agents.length} parallel
          </div>
        )}
      </div>

      {/* Agent cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {agents.map((agent) => {
          const isRunning = agent.status === 'running' || agent.status === 'spawning';
          const isComplete = agent.status === 'complete';
          const isFailed = agent.status === 'failed';
          const colors = categoryColors[agent.category] || categoryColors.default;
          const elapsed = ((Date.now() - agent.startedAt) / 1000).toFixed(0);

          return (
            <div
              key={agent.agentId}
              className={`rounded-xl border p-3.5 transition-all duration-500 animate-slide-up ${colors.bg} ${
                isRunning ? `${colors.border} ${colors.glow}` : ''
              } ${isComplete ? 'border-success/40 bg-success/5' : ''} ${
                isFailed ? 'border-destructive/40 bg-destructive/5' : ''
              } ${!isRunning && !isComplete && !isFailed ? colors.border : ''}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className={`${isRunning ? `${colors.text} animate-pulse` : isComplete ? 'text-success' : isFailed ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {categoryIcons[agent.category] || categoryIcons.default}
                </span>
                <span className={`text-[9px] font-mono font-black uppercase tracking-wider ${
                  isRunning ? colors.text : isComplete ? 'text-success' : isFailed ? 'text-destructive' : 'text-muted-foreground'
                }`}>
                  {statusLabels[agent.status]}
                </span>
                <span className="text-[9px] font-mono text-muted-foreground/60 ml-auto">
                  {elapsed}s
                </span>
              </div>

              <p className="text-xs text-foreground truncate font-medium mb-1.5" title={agent.taskTitle}>
                {agent.taskTitle}
              </p>

              {agent.currentTool && (
                <p className="text-[10px] font-mono text-primary/80 truncate flex items-center gap-1">
                  <Zap className="h-2.5 w-2.5" />
                  {agent.currentTool}
                </p>
              )}

              {agent.toolsUsed.length > 0 && !agent.currentTool && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {agent.toolsUsed.slice(0, 4).map((tool, i) => (
                    <span key={i} className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground border border-border/30">
                      {tool}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
