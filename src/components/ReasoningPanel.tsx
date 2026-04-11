import { useEffect, useRef, useState } from 'react';
import { useAgentStore } from '@/store/agentStore';

export function ReasoningPanel() {
  const logs = useAgentStore((s) => s.logs);
  const isStreaming = useAgentStore((s) => s.isStreaming);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [displayedText, setDisplayedText] = useState('');
  const prevLengthRef = useRef(0);
  const animFrameRef = useRef<number | null>(null);

  // Extract thinking/info logs as "reasoning"
  const reasoningLogs = logs.filter((l) => l.type === 'thinking' || l.type === 'info');

  useEffect(() => {
    if (reasoningLogs.length <= prevLengthRef.current) return;

    const newEntries = reasoningLogs.slice(prevLengthRef.current);
    prevLengthRef.current = reasoningLogs.length;

    let fullNew = newEntries.map((e) => `> ${e.message}`).join('\n') + '\n';
    let charIndex = 0;

    const animate = () => {
      if (charIndex < fullNew.length) {
        const charsPerFrame = Math.min(3, fullNew.length - charIndex);
        setDisplayedText((prev) => prev + fullNew.slice(charIndex, charIndex + charsPerFrame));
        charIndex += charsPerFrame;
        animFrameRef.current = window.setTimeout(animate, 18);
      }
    };

    animate();

    return () => {
      if (animFrameRef.current) clearTimeout(animFrameRef.current);
    };
  }, [reasoningLogs.length]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [displayedText]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">Agent Cognition</h3>
          {isStreaming && (
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
          )}
        </div>
      </div>
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 font-mono text-xs leading-relaxed"
        style={{
          background: 'linear-gradient(180deg, hsl(220 20% 3%), hsl(220 18% 5%))',
          color: 'hsl(162 40% 60%)',
        }}
      >
        {displayedText.length === 0 && (
          <p className="text-muted-foreground text-center py-8 font-sans">
            Agent reasoning will appear here...
          </p>
        )}
        <pre className="whitespace-pre-wrap break-words">{displayedText}</pre>
        {isStreaming && (
          <span className="typing-cursor text-primary">_</span>
        )}
      </div>
    </div>
  );
}
