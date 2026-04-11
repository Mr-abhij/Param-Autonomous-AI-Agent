import { useState, useCallback } from 'react';
import { useAgentStore } from '@/store/agentStore';
import { AlertTriangle, Send, Check } from 'lucide-react';

export function InterventionInput() {
  const phase = useAgentStore((s) => s.phase);
  const isStreaming = useAgentStore((s) => s.isStreaming);
  const setIntervention = useAgentStore((s) => s.setIntervention);
  const [message, setMessage] = useState('');
  const [flash, setFlash] = useState(false);

  const isActive = isStreaming && (phase === 'executing' || phase === 'decomposing' || phase === 'planning' || phase === 'adapting');

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setIntervention(message.trim());
    setMessage('');
    setFlash(true);
    setTimeout(() => setFlash(false), 1500);
  }, [message, setIntervention]);

  if (!isActive) return null;

  return (
    <form onSubmit={handleSubmit} className="relative animate-slide-up">
      <div className={`flex items-center gap-3 px-4 py-2.5 rounded-lg border transition-all duration-300 ${
        flash
          ? 'border-success/50 bg-success/5'
          : 'border-warning/30 bg-warning/5 hover:border-warning/50'
      }`}>
        <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Intervene → type a new constraint mid-run..."
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-warning/50 outline-none font-mono"
          disabled={flash}
        />
        {flash ? (
          <span className="flex items-center gap-1 text-xs text-success font-medium">
            <Check className="h-3.5 w-3.5" />
            Injected ✓
          </span>
        ) : (
          <button
            type="submit"
            disabled={!message.trim()}
            className="p-1.5 rounded-md text-warning hover:bg-warning/10 disabled:opacity-30 transition-colors"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </form>
  );
}
