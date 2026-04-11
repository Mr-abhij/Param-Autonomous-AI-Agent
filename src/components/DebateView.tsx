import { useAgentStore } from '@/store/agentStore';
import { Sparkles } from 'lucide-react';

export function DebateView() {
  const { debateStreaming, debateResult } = useAgentStore();

  const hasContent = debateStreaming.optimist || debateStreaming.skeptic || debateStreaming.synthesis;
  if (!hasContent && !debateResult) return null;

  const confidence = debateResult?.confidence ?? null;

  return (
    <div className="border border-border rounded-xl bg-card/80 overflow-hidden animate-slide-up">
      <div className="h-1 bg-gradient-to-r from-[hsl(142_70%_45%)] via-primary to-destructive" />

      <div className="px-5 py-3 border-b border-border bg-gradient-to-r from-primary/8 to-transparent flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-bold text-foreground">Agent Debate</h3>
        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/20">
          {debateResult ? 'COMPLETE' : 'LIVE'}
        </span>
      </div>

      {/* Two columns: Optimist vs Skeptic */}
      <div className="grid grid-cols-1 md:grid-cols-2 relative">
        {/* Optimist */}
        <div className="p-4 border-b md:border-b-0 md:border-r border-border">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-[hsl(142_70%_45%)] shadow-[0_0_6px_hsl(142_70%_45%/0.5)]" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-[hsl(142_70%_45%)]">
              Optimist Agent
            </h4>
          </div>
          <div className="text-xs text-secondary-foreground leading-relaxed whitespace-pre-wrap min-h-[60px]">
            {debateStreaming.optimist || (
              <span className="text-muted-foreground italic">Analyzing...</span>
            )}
            {!debateResult && debateStreaming.optimist && (
              <span className="inline-block w-1.5 h-3.5 bg-[hsl(142_70%_45%)] ml-0.5 animate-pulse" />
            )}
          </div>
        </div>

        {/* VS Divider (desktop) */}
        <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="w-8 h-8 rounded-full border-2 border-primary bg-background flex items-center justify-center">
            <span className="text-[10px] font-bold text-primary">VS</span>
          </div>
        </div>

        {/* Skeptic */}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-destructive shadow-[0_0_6px_hsl(var(--destructive)/0.5)]" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-destructive">
              Skeptic Agent
            </h4>
          </div>
          <div className="text-xs text-secondary-foreground leading-relaxed whitespace-pre-wrap min-h-[60px]">
            {debateStreaming.skeptic || (
              <span className="text-muted-foreground italic">Analyzing...</span>
            )}
            {!debateResult && debateStreaming.skeptic && (
              <span className="inline-block w-1.5 h-3.5 bg-destructive ml-0.5 animate-pulse" />
            )}
          </div>
        </div>
      </div>

      {/* Synthesis */}
      {(debateStreaming.synthesis || debateResult) && (
        <div className="border-t border-border p-4 bg-primary/5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary">
              Synthesizer Verdict
            </h4>
          </div>
          <div className="text-xs text-secondary-foreground leading-relaxed whitespace-pre-wrap">
            {debateStreaming.synthesis || ''}
            {!debateResult && debateStreaming.synthesis && (
              <span className="inline-block w-1.5 h-3.5 bg-primary ml-0.5 animate-pulse" />
            )}
          </div>

          {/* Confidence bar */}
          {confidence !== null && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                  Confidence Score
                </span>
                <span className="text-sm font-bold text-primary">{confidence}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-[hsl(162_72%_46%)] rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${confidence}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
