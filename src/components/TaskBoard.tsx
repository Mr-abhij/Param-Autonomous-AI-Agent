import { SubTask, TaskStatus } from '@/store/agentStore';
import { CheckCircle2, Circle, Loader2, XCircle, RefreshCw, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { ToolCallCard } from './ToolCallCard';
import { RichResultCard } from './RichResultCard';
import ReactMarkdown from 'react-markdown';

interface TaskBoardProps {
  subtasks: SubTask[];
}

const statusConfig: Record<TaskStatus, { icon: React.ReactNode; color: string; label: string; bg: string }> = {
  pending: { icon: <Circle className="h-4 w-4" />, color: 'text-muted-foreground', label: 'Pending', bg: '' },
  running: { icon: <Loader2 className="h-4 w-4 animate-spin" />, color: 'text-info', label: 'Running', bg: 'border-l-2 border-l-blue-500/50' },
  completed: { icon: <CheckCircle2 className="h-4 w-4" />, color: 'text-success', label: 'Done', bg: 'border-l-2 border-l-emerald-500/40' },
  failed: { icon: <XCircle className="h-4 w-4" />, color: 'text-destructive', label: 'Failed', bg: 'border-l-2 border-l-red-500/40' },
  adapting: { icon: <RefreshCw className="h-4 w-4 animate-spin" />, color: 'text-warning', label: 'Adapting', bg: 'border-l-2 border-l-yellow-500/40' },
};

export function TaskBoard({ subtasks }: TaskBoardProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  if (subtasks.length === 0) return null;

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const completed = subtasks.filter((t) => t.status === 'completed').length;
  const progress = (completed / subtasks.length) * 100;

  return (
    <div className="space-y-4 animate-slide-up">
      {/* Progress Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          Subtasks
          <span className="text-muted-foreground font-normal ml-2">
            {completed}/{subtasks.length}
          </span>
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-primary font-semibold">{Math.round(progress)}%</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${progress}%`,
            background: 'linear-gradient(90deg, hsl(162 72% 46%), hsl(180 70% 40%))',
          }}
        />
      </div>

      {/* Task List */}
      <div className="space-y-2">
        {subtasks.map((task, i) => {
          const cfg = statusConfig[task.status];
          const isExpanded = expanded.has(task.id);
          const hasRichData = task.structuredData && (
            (task.structuredData.items && task.structuredData.items.length > 0) ||
            task.structuredData.budgetBreakdown ||
            (task.structuredData.tips && task.structuredData.tips.length > 0)
          );

          return (
            <div key={task.id} className={`border border-border rounded-lg overflow-hidden bg-card/60 ${cfg.bg} transition-all duration-200`}>
              <button
                onClick={() => toggle(task.id)}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-secondary/40 transition-colors"
              >
                <span className="text-xs text-muted-foreground font-mono w-5 shrink-0">{String(i + 1).padStart(2, '0')}</span>
                <span className={`${cfg.color} shrink-0`}>{cfg.icon}</span>
                <span className="flex-1 text-sm text-foreground truncate font-medium">{task.title}</span>
                {hasRichData && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 shrink-0">
                    Rich Data
                  </span>
                )}
                <span className={`text-xs px-2 py-0.5 rounded-full border ${cfg.color} border-current/20 shrink-0`}>
                  {cfg.label}
                </span>
                {isExpanded ? (
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                )}
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 pt-2 border-t border-border space-y-3">
                  <p className="text-xs text-muted-foreground italic">{task.description}</p>

                  {/* Markdown Result */}
                  {task.result && (
                    <div className="bg-muted/50 rounded-lg p-4 border border-border">
                      <div className="prose prose-invert prose-xs max-w-none prose-headings:text-foreground prose-headings:text-sm prose-headings:font-semibold prose-headings:mt-3 prose-headings:mb-1.5 prose-p:text-secondary-foreground prose-p:text-xs prose-p:leading-relaxed prose-strong:text-foreground prose-li:text-secondary-foreground prose-li:text-xs prose-code:text-primary prose-code:text-xs prose-a:text-primary">
                        <ReactMarkdown>{task.result}</ReactMarkdown>
                      </div>
                    </div>
                  )}

                  {/* Structured Rich Data */}
                  {hasRichData && task.structuredData && (
                    <RichResultCard structuredData={task.structuredData} />
                  )}

                  {/* Tool Calls */}
                  {task.toolCalls && task.toolCalls.length > 0 && (
                    <div className="space-y-1">
                      {task.toolCalls.map((tc) => (
                        <ToolCallCard key={tc.id} toolCall={tc} />
                      ))}
                    </div>
                  )}

                  {task.retryCount > 0 && (
                    <p className="text-xs text-warning flex items-center gap-1.5">
                      <RefreshCw className="h-3 w-3" />
                      Strategy adapted {task.retryCount} time(s)
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
