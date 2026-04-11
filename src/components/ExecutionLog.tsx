import { LogEntry } from '@/store/agentStore';
import { useEffect, useRef } from 'react';
import { Info, CheckCircle2, AlertTriangle, XCircle, Brain, Wrench, RotateCcw, Zap, UserPlus, Award } from 'lucide-react';

interface ExecutionLogProps {
  logs: LogEntry[];
  isStreaming: boolean;
}

const logIcons: Record<LogEntry['type'], React.ReactNode> = {
  info: <Info className="h-3.5 w-3.5 text-info" />,
  success: <CheckCircle2 className="h-3.5 w-3.5 text-success" />,
  warning: <AlertTriangle className="h-3.5 w-3.5 text-warning" />,
  error: <XCircle className="h-3.5 w-3.5 text-destructive" />,
  thinking: <Brain className="h-3.5 w-3.5 text-primary" />,
  tool: <Wrench className="h-3.5 w-3.5 text-primary" />,
  quality_retry: <RotateCcw className="h-3.5 w-3.5 text-warning" />,
  level_start: <Zap className="h-3.5 w-3.5 text-info" />,
  subagent_start: <UserPlus className="h-3.5 w-3.5 text-primary" />,
  subagent_complete: <Award className="h-3.5 w-3.5 text-success" />,
  memory_loaded: <Brain className="h-3.5 w-3.5 text-[hsl(180_100%_45%)]" />,
};

const specialTypes = new Set(['quality_retry', 'level_start', 'subagent_start', 'subagent_complete', 'memory_loaded']);

function getSpecialStyle(type: LogEntry['type']): string {
  switch (type) {
    case 'quality_retry':
      return 'bg-warning/10 border border-warning/20 text-warning font-semibold';
    case 'level_start':
      return 'bg-info/10 border border-info/20 text-info font-semibold';
    case 'subagent_start':
      return 'bg-primary/10 border border-primary/20 text-primary';
    case 'subagent_complete':
      return 'bg-success/10 border border-success/20 text-success font-semibold';
    case 'memory_loaded':
      return 'bg-[hsl(180_100%_45%/0.1)] border border-[hsl(180_100%_45%/0.2)] text-[hsl(180_100%_45%)] font-semibold';
    default:
      return '';
  }
}

export function ExecutionLog({ logs, isStreaming }: ExecutionLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
        <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">Execution Log</h3>
        {isStreaming && (
          <span className="flex items-center gap-1.5 text-xs text-primary">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Live
          </span>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-1 font-mono text-xs">
        {logs.length === 0 && (
          <p className="text-muted-foreground text-center py-8">Waiting for agent to start...</p>
        )}
        {logs.map((log) => (
          <div
            key={log.id}
            className={`flex items-start gap-2 py-1 animate-slide-up ${
              specialTypes.has(log.type)
                ? `rounded-md px-2 py-2 my-1 ${getSpecialStyle(log.type)}`
                : ''
            }`}
          >
            <span className="shrink-0 mt-0.5">{logIcons[log.type]}</span>
            <span className="text-muted-foreground shrink-0">
              {new Date(log.timestamp).toLocaleTimeString('en-US', { hour12: false })}
            </span>
            <span className={`break-all ${
              specialTypes.has(log.type) ? '' : 'text-secondary-foreground'
            }`}>
              {log.message}
            </span>
          </div>
        ))}
        {isStreaming && (
          <div className="flex items-center gap-2 py-1 text-muted-foreground">
            <Brain className="h-3.5 w-3.5 text-primary animate-pulse" />
            <span className="typing-cursor">Agent is thinking</span>
          </div>
        )}
      </div>
    </div>
  );
}
