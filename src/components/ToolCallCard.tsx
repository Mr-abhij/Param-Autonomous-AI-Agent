import { ToolCall } from '@/store/agentStore';
import { Wrench } from 'lucide-react';

interface ToolCallCardProps {
  toolCall: ToolCall;
}

export function ToolCallCard({ toolCall }: ToolCallCardProps) {
  return (
    <div className="flex items-start gap-2 px-3 py-2 bg-secondary/60 rounded-md border border-border">
      <Wrench className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-foreground font-mono">{toolCall.tool}</p>
        {toolCall.input && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{toolCall.input}</p>
        )}
        {toolCall.output && (
          <p className="text-xs text-success mt-0.5 truncate">{toolCall.output}</p>
        )}
      </div>
    </div>
  );
}
