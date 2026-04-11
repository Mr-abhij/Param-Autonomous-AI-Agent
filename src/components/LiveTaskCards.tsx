import { SubTask, TaskStatus, useAgentStore } from '@/store/agentStore';
import { CheckCircle2, Circle, Loader2, XCircle, RefreshCw, Search, Code2, BarChart3, PenTool, Map, Cpu, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { RichResultCard } from './RichResultCard';
import { ToolCallCard } from './ToolCallCard';

interface LiveTaskCardsProps {
  subtasks: SubTask[];
}

const categoryIcons: Record<string, React.ReactNode> = {
  research: <Search className="h-3.5 w-3.5" />,
  code: <Code2 className="h-3.5 w-3.5" />,
  analysis: <BarChart3 className="h-3.5 w-3.5" />,
  write: <PenTool className="h-3.5 w-3.5" />,
  plan: <Map className="h-3.5 w-3.5" />,
  default: <Cpu className="h-3.5 w-3.5" />,
};

const categoryGradients: Record<string, string> = {
  research: 'from-info/20 to-info/5',
  code: 'from-primary/20 to-primary/5',
  analysis: 'from-warning/20 to-warning/5',
  write: 'from-success/20 to-success/5',
  plan: 'from-accent/20 to-accent/5',
  default: 'from-muted/30 to-muted/10',
};

const categoryAccent: Record<string, string> = {
  research: 'text-info border-info/30',
  code: 'text-primary border-primary/30',
  analysis: 'text-warning border-warning/30',
  write: 'text-success border-success/30',
  plan: 'text-accent border-accent/30',
  default: 'text-muted-foreground border-border',
};

const statusConfig: Record<TaskStatus, { icon: React.ReactNode; label: string; color: string; dotColor: string }> = {
  pending: { icon: <Circle className="h-3 w-3" />, label: 'Queued', color: 'text-muted-foreground', dotColor: 'bg-muted-foreground' },
  running: { icon: <Loader2 className="h-3 w-3 animate-spin" />, label: 'Processing', color: 'text-primary', dotColor: 'bg-primary' },
  completed: { icon: <CheckCircle2 className="h-3 w-3" />, label: 'Complete', color: 'text-success', dotColor: 'bg-success' },
  failed: { icon: <XCircle className="h-3 w-3" />, label: 'Failed', color: 'text-destructive', dotColor: 'bg-destructive' },
  adapting: { icon: <RefreshCw className="h-3 w-3 animate-spin" />, label: 'Retrying', color: 'text-warning', dotColor: 'bg-warning' },
};

function TaskCard({ task, index }: { task: SubTask; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const [streamedText, setStreamedText] = useState('');
  const prevResultRef = useRef('');
  const cfg = statusConfig[task.status];
  const cat = task.category || 'default';
  const isRunning = task.status === 'running' || task.status === 'adapting';
  const isComplete = task.status === 'completed';
  const isFailed = task.status === 'failed';

  // Simulate streaming effect when result appears
  useEffect(() => {
    if (task.result && task.result !== prevResultRef.current) {
      prevResultRef.current = task.result;
      const text = task.result;
      let i = 0;
      const speed = Math.max(2, Math.min(8, 500 / text.length));
      setStreamedText('');
      const interval = setInterval(() => {
        i += Math.ceil(text.length / 60);
        if (i >= text.length) {
          setStreamedText(text);
          clearInterval(interval);
        } else {
          setStreamedText(text.slice(0, i));
        }
      }, speed);
      return () => clearInterval(interval);
    }
  }, [task.result]);

  const elapsed = task.startedAt && task.completedAt
    ? `${((task.completedAt - task.startedAt) / 1000).toFixed(1)}s`
    : task.startedAt
      ? `${((Date.now() - task.startedAt) / 1000).toFixed(0)}s`
      : null;

  const hasDetails = task.toolCalls?.length || task.structuredData;
  const displayResult = streamedText || task.result || '';

  return (
    <div
      className={`group relative rounded-xl border overflow-hidden transition-all duration-500 ${
        isRunning
          ? 'border-primary/40 shadow-[0_0_20px_hsl(var(--primary)/0.15)] scale-[1.01]'
          : isComplete
            ? 'border-success/30 shadow-[0_0_12px_hsl(162_72%_46%/0.1)]'
            : isFailed
              ? 'border-destructive/30'
              : 'border-border/60'
      }`}
    >
      {/* Gradient header bar */}
      <div className={`h-1 bg-gradient-to-r ${categoryGradients[cat]} ${
        isRunning ? 'animate-pulse' : ''
      }`} />

      {/* Card header */}
      <div className="px-4 py-3 bg-card/80">
        <div className="flex items-center gap-2.5">
          {/* Index */}
          <span className="text-[10px] font-mono text-muted-foreground bg-muted/60 w-5 h-5 rounded flex items-center justify-center shrink-0">
            {index + 1}
          </span>

          {/* Category badge */}
          <span className={`flex items-center gap-1 text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border ${categoryAccent[cat]}`}>
            {categoryIcons[cat]}
            {cat}
          </span>

          {/* Status */}
          <span className={`flex items-center gap-1 text-[10px] font-semibold ml-auto ${cfg.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dotColor} ${isRunning ? 'animate-pulse' : ''}`} />
            {cfg.label}
          </span>

          {elapsed && (
            <span className="text-[10px] font-mono text-muted-foreground">{elapsed}</span>
          )}
        </div>

        <h4 className="text-sm font-semibold text-foreground mt-2 leading-snug">{task.title}</h4>
        <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{task.description}</p>
      </div>

      {/* Live output area */}
      {(displayResult || isRunning) && (
        <div className="border-t border-border/50">
          {isRunning && !displayResult && (
            <div className="px-4 py-6 flex flex-col items-center justify-center gap-2">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-[10px] font-mono text-muted-foreground">Agent working...</span>
            </div>
          )}

          {displayResult && (
            <div className="px-4 py-3 max-h-[280px] overflow-y-auto scrollbar-thin">
              <div className="prose prose-invert prose-xs max-w-none
                prose-headings:text-foreground prose-headings:text-xs prose-headings:font-semibold prose-headings:mt-2 prose-headings:mb-1
                prose-p:text-secondary-foreground prose-p:text-[11px] prose-p:leading-relaxed
                prose-strong:text-foreground prose-strong:text-[11px]
                prose-li:text-secondary-foreground prose-li:text-[11px]
                prose-code:text-primary prose-code:text-[10px] prose-code:bg-muted prose-code:px-1 prose-code:rounded
                prose-a:text-primary
              ">
                <ReactMarkdown>{displayResult}</ReactMarkdown>
                {isRunning && <span className="inline-block w-1.5 h-3.5 bg-primary animate-pulse ml-0.5" />}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Expandable details */}
      {hasDetails && isComplete && (
        <>
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 border-t border-border/40 text-[10px] text-muted-foreground hover:text-foreground transition-colors bg-muted/20"
          >
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {expanded ? 'Hide details' : `View details (${task.toolCalls?.length || 0} tools)`}
          </button>

          {expanded && (
            <div className="px-4 pb-3 pt-1 space-y-2 border-t border-border/30 bg-muted/10">
              {task.structuredData && (
                <RichResultCard structuredData={task.structuredData} />
              )}
              {task.toolCalls?.map((tc) => (
                <ToolCallCard key={tc.id} toolCall={tc} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Retry badge */}
      {task.retryCount > 0 && (
        <div className="px-4 py-1.5 border-t border-warning/20 bg-warning/5 flex items-center gap-1.5">
          <RefreshCw className="h-2.5 w-2.5 text-warning" />
          <span className="text-[10px] text-warning">Adapted {task.retryCount}x for better quality</span>
        </div>
      )}
    </div>
  );
}

export function LiveTaskCards({ subtasks }: LiveTaskCardsProps) {
  const { executionLevels, currentLevel } = useAgentStore();

  if (subtasks.length === 0) return null;

  const completed = subtasks.filter(t => t.status === 'completed').length;
  const running = subtasks.filter(t => t.status === 'running' || t.status === 'adapting').length;
  const progress = (completed / subtasks.length) * 100;

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Task Execution
          </h3>
          {running > 0 && (
            <span className="text-[10px] font-mono text-primary flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              {running} running in parallel
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-muted-foreground">
            {completed}/{subtasks.length} tasks
          </span>
          <span className="text-xs font-mono font-bold text-primary">{Math.round(progress)}%</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-muted/50 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out relative overflow-hidden"
          style={{
            width: `${progress}%`,
            background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(162 72% 46%))',
          }}
        >
          {running > 0 && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
          )}
        </div>
      </div>

      {/* Wave indicator */}
      {executionLevels.length > 1 && (
        <div className="flex items-center gap-1.5">
          {executionLevels.map((level, i) => {
            const levelTasks = level.map(id => subtasks.find(t => t.id === id)).filter(Boolean);
            const allDone = levelTasks.every(t => t!.status === 'completed');
            const anyRunning = levelTasks.some(t => t!.status === 'running' || t!.status === 'adapting');
            return (
              <div key={i} className="flex items-center gap-1.5">
                {i > 0 && <span className="text-muted-foreground/30">→</span>}
                <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full border transition-all ${
                  anyRunning
                    ? 'border-primary/40 bg-primary/10 text-primary font-bold'
                    : allDone
                      ? 'border-success/30 bg-success/10 text-success'
                      : 'border-border bg-muted/30 text-muted-foreground'
                }`}>
                  W{i + 1} ({level.length})
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Cards grid — show in parallel layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {subtasks.map((task, i) => (
          <TaskCard key={task.id} task={task} index={i} />
        ))}
      </div>
    </div>
  );
}
