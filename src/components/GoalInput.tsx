import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Zap, Loader2, Mic, MicOff, Swords, Sparkles, Send } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

interface GoalInputProps {
  onSubmit: (goal: string) => void;
  isRunning: boolean;
  debateMode?: boolean;
  onToggleDebate?: () => void;
  onDebateSubmit?: (topic: string) => void;
}

const EXAMPLES = [
  { icon: '🌴', text: 'Plan a Goa trip under ₹15,000 budget with restaurants, hotels, and attractions' },
  { icon: '⚡', text: 'Research and compare the top 3 JavaScript frameworks for real-time apps' },
  { icon: '🚀', text: 'Create a comprehensive marketing strategy for a new SaaS product launch' },
  { icon: '🗾', text: 'Plan a 5-day Japan trip with budget breakdown, food spots, and must-visit places' },
  { icon: '💻', text: 'Compare top 5 laptops under $1000 for software development' },
];

type VoiceStatus = 'idle' | 'listening' | 'success' | 'error';

const SpeechRecognitionAPI =
  typeof window !== 'undefined'
    ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    : null;

export function GoalInput({ onSubmit, isRunning, debateMode, onToggleDebate, onDebateSubmit }: GoalInputProps) {
  const [goal, setGoal] = useState('');
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatus>('idle');
  const [voiceMessage, setVoiceMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const recognitionRef = useRef<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const supportsVoice = !!SpeechRecognitionAPI;

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
      }
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (goal.trim() && !isRunning) {
      if (debateMode && onDebateSubmit) {
        onDebateSubmit(goal.trim());
      } else {
        onSubmit(goal.trim());
      }
    }
  };

  const startListening = () => {
    if (!SpeechRecognitionAPI || isRunning) return;

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognitionRef.current = recognition;

    recognition.onstart = () => {
      setVoiceStatus('listening');
      setVoiceMessage('');
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setGoal(transcript);
      setVoiceStatus('success');
      setVoiceMessage('Got it');
      setTimeout(() => {
        setVoiceStatus('idle');
        setVoiceMessage('');
      }, 1000);
    };

    recognition.onerror = () => {
      setVoiceStatus('error');
      setVoiceMessage("Couldn't hear you, try again");
      setTimeout(() => {
        setVoiceStatus('idle');
        setVoiceMessage('');
      }, 1500);
    };

    recognition.onend = () => {
      if (voiceStatus === 'listening') {
        setVoiceStatus('idle');
      }
    };

    recognition.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }
    setVoiceStatus('idle');
    setVoiceMessage('');
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-5">
      {/* Main input container */}
      <div
        className={`
          relative rounded-2xl overflow-hidden transition-all duration-500
          ${isFocused
            ? 'shadow-[0_0_60px_hsl(162_72%_46%/0.15),0_0_120px_hsl(162_72%_46%/0.05)]'
            : 'shadow-[0_0_30px_hsl(162_72%_46%/0.06)]'
          }
        `}
      >
        {/* Animated border gradient */}
        <div
          className={`
            absolute inset-0 rounded-2xl p-[1px] transition-opacity duration-500
            ${isFocused ? 'opacity-100' : 'opacity-40'}
          `}
          style={{
            background: 'linear-gradient(135deg, hsl(162 72% 46% / 0.5), hsl(217 91% 60% / 0.3), hsl(162 72% 46% / 0.5))',
            backgroundSize: '200% 200%',
            animation: 'borderShift 4s ease infinite',
          }}
        />

        {/* Inner card */}
        <div className="relative rounded-2xl bg-card/90 backdrop-blur-2xl m-[1px]">
          <textarea
            ref={textareaRef}
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={debateMode
              ? "Enter a topic for two agents to debate from opposite sides..."
              : "Describe a complex task and watch the agent fleet execute it..."
            }
            className="w-full min-h-[130px] bg-transparent px-6 pt-5 pb-16 text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none font-[Outfit] text-sm leading-relaxed"
            disabled={isRunning}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                handleSubmit(e);
              }
            }}
          />

          {/* Bottom bar */}
          <div className="absolute bottom-0 left-0 right-0 px-4 py-3 flex items-center justify-between border-t border-border/30">
            <div className="flex items-center gap-2">
              {/* Debate toggle */}
              {onToggleDebate && (
                <div className="flex items-center gap-2">
                  <Switch
                    checked={debateMode}
                    onCheckedChange={onToggleDebate}
                    disabled={isRunning}
                    className="scale-[0.7] origin-left"
                  />
                  <span
                    className={`text-[11px] font-mono uppercase tracking-wider cursor-pointer transition-colors ${
                      debateMode ? 'text-primary' : 'text-muted-foreground/50'
                    }`}
                    onClick={!isRunning ? onToggleDebate : undefined}
                  >
                    <Swords className="h-3 w-3 inline mr-1" />
                    Debate
                  </span>
                </div>
              )}

              {/* Keyboard hint */}
              <span className="text-[10px] text-muted-foreground/30 font-mono hidden sm:inline ml-2">
                ⌘+Enter to submit
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Mic */}
              <button
                type="button"
                disabled={!supportsVoice || isRunning}
                onClick={voiceStatus === 'listening' ? stopListening : startListening}
                className={`
                  h-9 w-9 flex items-center justify-center rounded-xl transition-all duration-300
                  ${voiceStatus === 'listening'
                    ? 'bg-destructive/15 text-destructive shadow-[0_0_15px_hsl(var(--destructive)/0.3)]'
                    : 'text-muted-foreground/50 hover:text-foreground hover:bg-secondary/80'
                  }
                  disabled:opacity-30 disabled:cursor-not-allowed
                `}
              >
                {voiceStatus === 'listening' ? (
                  <MicOff className="h-4 w-4" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </button>

              {/* Submit */}
              <Button
                type="submit"
                disabled={!goal.trim() || isRunning}
                size="sm"
                className="
                  gap-2 rounded-xl px-5 h-9
                  shadow-[0_0_20px_hsl(162_72%_46%/0.25)]
                  hover:shadow-[0_0_30px_hsl(162_72%_46%/0.4)]
                  transition-all duration-300 group font-[Space_Grotesk] font-semibold
                "
              >
                {isRunning ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : debateMode ? (
                  <Swords className="h-4 w-4" />
                ) : (
                  <Send className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                )}
                {isRunning ? 'Running' : debateMode ? 'Debate' : 'Execute'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Voice feedback */}
      {voiceStatus === 'listening' && (
        <div className="flex items-center gap-3 px-2 animate-slide-up">
          <div className="voice-waveform flex items-end gap-[4px]">
            {[0, 1, 2, 3, 4].map((i) => (
              <span
                key={i}
                className="w-[3px] rounded-full bg-primary"
                style={{
                  animation: `voiceBar 0.6s ease-in-out infinite alternate`,
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            ))}
          </div>
          <span className="text-xs font-mono text-warning">Listening...</span>
        </div>
      )}

      {voiceStatus === 'success' && voiceMessage && (
        <p className="text-xs text-success px-2 animate-slide-up font-mono">{voiceMessage}</p>
      )}
      {voiceStatus === 'error' && voiceMessage && (
        <p className="text-xs text-destructive px-2 animate-slide-up font-mono">{voiceMessage}</p>
      )}

      {/* Example prompts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {EXAMPLES.map((ex, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setGoal(ex.text)}
            disabled={isRunning}
            className="
              group flex items-start gap-2.5 text-left text-xs px-4 py-3
              rounded-xl bg-secondary/30 backdrop-blur-sm
              border border-border/30 hover:border-primary/30
              text-muted-foreground/70 hover:text-foreground
              transition-all duration-300
              hover:bg-secondary/60
              hover:shadow-[0_0_15px_hsl(162_72%_46%/0.06)]
              disabled:opacity-30
            "
          >
            <span className="text-sm mt-0.5 shrink-0">{ex.icon}</span>
            <span className="line-clamp-2 font-[Outfit]">
              {ex.text}
            </span>
          </button>
        ))}
      </div>
    </form>
  );
}
