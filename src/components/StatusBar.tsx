import { AgentPhase } from '@/store/agentStore';
import { Activity, Brain, Cpu, GitBranch, CheckCircle2, XCircle, RefreshCw, Zap } from 'lucide-react';

interface StatusBarProps {
  phase: AgentPhase;
  subtaskCount: number;
  completedCount: number;
  failedCount: number;
  eventCount: number;
}

const phaseConfig: Record<AgentPhase, { icon: React.ReactNode; label: string; color: string }> = {
  idle: { icon: <Activity className="h-3.5 w-3.5" />, label: 'Idle', color: 'text-muted-foreground' },
  decomposing: { icon: <GitBranch className="h-3.5 w-3.5 animate-pulse" />, label: 'Decomposing', color: 'text-info' },
  planning: { icon: <Brain className="h-3.5 w-3.5 animate-pulse" />, label: 'Planning', color: 'text-info' },
  executing: { icon: <Cpu className="h-3.5 w-3.5 animate-pulse" />, label: 'Executing', color: 'text-primary' },
  adapting: { icon: <RefreshCw className="h-3.5 w-3.5 animate-spin" />, label: 'Adapting', color: 'text-warning' },
  completed: { icon: <CheckCircle2 className="h-3.5 w-3.5" />, label: 'Completed', color: 'text-success' },
  error: { icon: <XCircle className="h-3.5 w-3.5" />, label: 'Error', color: 'text-destructive' },
};

export function StatusBar({ phase, subtaskCount, completedCount, failedCount, eventCount }: StatusBarProps) {
  const cfg = phaseConfig[phase];

  return (
    <div className="flex items-center gap-4 px-4 py-2 border-t border-border bg-card/50 text-xs">
      <div className={`flex items-center gap-1.5 ${cfg.color}`}>
        {cfg.icon}
        <span className="font-medium">{cfg.label}</span>
      </div>

      <div className="h-3 w-px bg-border" />

      <div className="flex items-center gap-3 text-muted-foreground">
        <span>Tasks: {subtaskCount}</span>
        <span className="text-success">✓ {completedCount}</span>
        {failedCount > 0 && <span className="text-destructive">✗ {failedCount}</span>}
      </div>

      <div className="h-3 w-px bg-border" />

      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Zap className="h-3 w-3 text-primary" />
        <span className="font-mono">{eventCount} events</span>
      </div>

      <div className="flex-1" />

      <span className="text-muted-foreground font-mono">param-agent v2.0</span>
    </div>
  );
}
