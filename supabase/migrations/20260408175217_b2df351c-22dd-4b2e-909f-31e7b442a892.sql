
CREATE TABLE public.agent_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  goal TEXT NOT NULL,
  phase TEXT NOT NULL DEFAULT 'idle',
  subtasks JSONB NOT NULL DEFAULT '[]'::jsonb,
  final_report TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.agent_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view sessions" ON public.agent_sessions FOR SELECT USING (true);
CREATE POLICY "Anyone can insert sessions" ON public.agent_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update sessions" ON public.agent_sessions FOR UPDATE USING (true);
