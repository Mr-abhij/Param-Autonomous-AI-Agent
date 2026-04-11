import { useState, useEffect } from 'react';
import { Brain, Trash2, ChevronDown, ChevronRight, X } from 'lucide-react';
import { getAllMemories, clearAllMemories, MemoryRecord, getMemoryCount } from '@/lib/persistentMemory';

interface MemoryPanelProps {
  onClose: () => void;
}

export function MemoryPanel({ onClose }: MemoryPanelProps) {
  const [memories, setMemories] = useState<MemoryRecord[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    setMemories(getAllMemories());
  }, []);

  const handleClear = () => {
    if (window.confirm('Clear all agent memory? This cannot be undone.')) {
      clearAllMemories();
      setMemories([]);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-[hsl(180_100%_45%)]" />
          <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">Agent Memory</h3>
          <span className="px-1.5 py-0.5 text-[10px] font-mono bg-[hsl(180_100%_45%/0.15)] text-[hsl(180_100%_45%)] rounded-full">
            {memories.length}
          </span>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin">
        {memories.length === 0 && (
          <p className="text-muted-foreground text-xs text-center py-8">
            No memories yet. Complete a task to build agent memory.
          </p>
        )}

        {memories.map((mem) => (
          <div
            key={mem.id}
            className="border border-border rounded-lg bg-secondary/30 overflow-hidden"
          >
            <button
              onClick={() => setExpandedId(expandedId === mem.id ? null : mem.id)}
              className="w-full text-left px-3 py-2.5 flex items-start gap-2 hover:bg-secondary/50 transition-colors"
            >
              {expandedId === mem.id ? (
                <ChevronDown className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs text-foreground truncate">
                  {mem.goal.length > 60 ? mem.goal.slice(0, 60) + '…' : mem.goal}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {new Date(mem.timestamp).toLocaleDateString()}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {mem.taskCount} tasks
                  </span>
                </div>
              </div>
            </button>

            {expandedId === mem.id && (
              <div className="px-3 pb-3 border-t border-border/50 pt-2 space-y-2 animate-slide-up">
                {mem.keyFindings.length > 0 && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Key Findings</p>
                    <ul className="space-y-1">
                      {mem.keyFindings.map((f, i) => (
                        <li key={i} className="text-xs text-secondary-foreground flex items-start gap-1.5">
                          <span className="text-primary mt-0.5">•</span>
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {mem.summary && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Summary</p>
                    <p className="text-xs text-secondary-foreground leading-relaxed">{mem.summary}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {memories.length > 0 && (
        <div className="px-3 py-2.5 border-t border-border">
          <button
            onClick={handleClear}
            className="flex items-center gap-1.5 text-[11px] text-destructive hover:text-destructive/80 transition-colors w-full justify-center py-1.5 rounded-md hover:bg-destructive/10"
          >
            <Trash2 className="h-3 w-3" />
            Clear all memory
          </button>
        </div>
      )}
    </div>
  );
}

export function MemoryBadge() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    setCount(getMemoryCount());
  }, []);
  if (count === 0) return null;
  return (
    <span className="ml-1 px-1.5 py-0.5 text-[10px] font-medium bg-[hsl(180_100%_45%/0.15)] text-[hsl(180_100%_45%)] rounded-full">
      {count}
    </span>
  );
}
