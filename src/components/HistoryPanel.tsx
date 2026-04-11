import { Clock, ChevronRight, Trash2 } from 'lucide-react';

interface HistorySession {
  id: string;
  goal: string;
  phase: string;
  created_at: string;
  final_report: string | null;
}

interface HistoryPanelProps {
  history: HistorySession[];
  onSelect: (id: string) => void;
  onClose: () => void;
}

export function HistoryPanel({ history, onSelect, onClose }: HistoryPanelProps) {
  if (history.length === 0) {
    return (
      <div className="p-6 text-center">
        <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">No past sessions yet</p>
        <p className="text-xs text-muted-foreground mt-1">Run your first goal to see it here</p>
      </div>
    );
  }

  return (
    <div className="space-y-1 p-2">
      {history.map((session) => {
        const date = new Date(session.created_at);
        const isCompleted = session.phase === 'completed';

        return (
          <button
            key={session.id}
            onClick={() => {
              onSelect(session.id);
              onClose();
            }}
            className="w-full flex items-start gap-3 px-3 py-2.5 rounded-md text-left hover:bg-secondary/60 transition-colors group"
          >
            <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${isCompleted ? 'bg-success' : 'bg-warning'}`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground truncate">{session.goal}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {date.toLocaleDateString()} · {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                {' · '}
                <span className={isCompleted ? 'text-success' : 'text-warning'}>{session.phase}</span>
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-1" />
          </button>
        );
      })}
    </div>
  );
}
