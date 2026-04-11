import { useCallback, useEffect, useState } from 'react';
import { useAgentStore, SubTask } from '@/store/agentStore';
import { supabase } from '@/integrations/supabase/client';
import { searchMemory, saveSession } from '@/lib/persistentMemory';

/**
 * Build execution levels from tasks with depends_on fields.
 */
function getExecutionLevels(tasks: SubTask[]): string[][] {
  const levels: string[][] = [];
  const assigned = new Set<string>();

  let safety = 0;
  while (assigned.size < tasks.length && safety < 20) {
    safety++;
    const currentLevel: string[] = [];

    for (const task of tasks) {
      if (assigned.has(task.id)) continue;
      const deps = task.dependsOn || [];
      const allDepsResolved = deps.every(depId => assigned.has(depId));
      if (allDepsResolved) {
        currentLevel.push(task.id);
      }
    }

    if (currentLevel.length === 0) {
      for (const task of tasks) {
        if (!assigned.has(task.id)) currentLevel.push(task.id);
      }
    }

    currentLevel.forEach(id => assigned.add(id));
    levels.push(currentLevel);
  }

  return levels;
}

export function useAgent() {
  const store = useAgentStore();
  const [history, setHistory] = useState<Array<{ id: string; goal: string; phase: string; created_at: string; final_report: string | null }>>([]);

  const loadHistory = useCallback(async () => {
    const { data } = await supabase
      .from('agent_sessions')
      .select('id, goal, phase, created_at, final_report')
      .order('created_at', { ascending: false })
      .limit(20);
    if (data) setHistory(data);
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const loadSession = useCallback(async (id: string) => {
    const { data } = await supabase
      .from('agent_sessions')
      .select('*')
      .eq('id', id)
      .single();

    if (data) {
      store.reset();
      store.setGoal(data.goal);
      store.setPhase(data.phase as any);
      store.setFinalReport(data.final_report || '');

      const subtasks = (Array.isArray(data.subtasks) ? data.subtasks : []) as any[];
      store.setSubtasks(subtasks.map((t: any, i: number) => ({
        id: `task-${i}`,
        title: t.title || '',
        description: t.description || '',
        status: t.status || 'completed',
        result: t.result || '',
        retryCount: t.retryCount || 0,
        toolCalls: t.toolCalls || [],
        category: t.category || 'default',
        dependsOn: t.dependsOn || [],
      })));

      if (data.phase === 'completed') {
        store.addLog({ type: 'info', message: 'Loaded from history' });
      }
    }
  }, []);

  /**
   * Execute a single sub-agent task.
   */
  const executeSubAgent = useCallback(async (
    task: SubTask,
    goal: string,
    sharedContext: Array<{ title: string; result: string }>,
    agentId: string,
    provider: string = 'lovable',
  ): Promise<{ taskId: string; output: string; success: boolean; structuredData?: any }> => {
    const s = useAgentStore.getState();

    s.addActiveAgent({
      agentId,
      taskId: task.id,
      taskTitle: task.title,
      category: task.category || 'default',
      status: 'running',
      toolsUsed: [],
      startedAt: Date.now(),
    });
    s.addLog({
      type: 'subagent_start',
      message: `AGENT SPAWNED [${task.category || 'default'}] → ${task.title}`,
      taskId: task.id,
    });

    useAgentStore.getState().updateSubtask(task.id, { status: 'running', startedAt: Date.now() });

    try {
      const { data: execData, error: execError } = await supabase.functions.invoke('agent-orchestrator', {
        body: {
          action: 'execute',
          goal,
          task: { title: task.title, description: task.description },
          category: task.category || 'default',
          sharedContext,
          provider,
        },
      });

      if (execError) throw new Error(execError.message);

      const result = execData.result || 'Completed';
      const structuredData = execData.structuredData || undefined;
      const confidence = execData.confidence || 1;
      const qualityScore = Math.round(confidence * 10);
      const toolCalls = (execData.toolCalls || []).map((tc: any) => ({
        id: crypto.randomUUID(),
        tool: tc.tool,
        input: tc.input,
        output: tc.output,
        status: 'completed' as const,
        timestamp: Date.now(),
      }));

      const toolNames = toolCalls.map((tc: any) => tc.tool);
      useAgentStore.getState().updateActiveAgent(agentId, {
        toolsUsed: toolNames,
        currentTool: undefined,
      });

      if (toolCalls.length > 0) {
        toolCalls.forEach((tc: any) => {
          useAgentStore.getState().addLog({
            type: 'tool',
            message: `[${task.category}] Tool: ${tc.tool} → ${tc.output?.slice(0, 100) || 'done'}`,
            taskId: task.id,
          });
        });
      }

      // Self-critique: if quality < 7, retry once
      if (qualityScore < 7 && task.retryCount === 0) {
        useAgentStore.getState().setRetryingTaskId(task.id);
        useAgentStore.getState().addLog({
          type: 'quality_retry',
          message: `QUALITY CHECK FAILED — ${task.title} scored ${qualityScore}/10 → Re-attempting`,
          taskId: task.id,
        });
        useAgentStore.getState().updateSubtask(task.id, { status: 'adapting', retryCount: 1 });

        const { data: adaptData } = await supabase.functions.invoke('agent-orchestrator', {
          body: {
            action: 'adapt',
            goal,
            task: { title: task.title, description: task.description },
            previousResult: result,
            allTasks: useAgentStore.getState().subtasks.map(s => ({ title: s.title, status: s.status })),
            provider,
          },
        });

        useAgentStore.getState().setRetryingTaskId(null);
        const finalResult = adaptData?.adaptedResult || result;

        useAgentStore.getState().updateSubtask(task.id, {
          status: 'completed',
          result: finalResult,
          structuredData,
          toolCalls,
          completedAt: Date.now(),
          retryCount: 1,
        });

        useAgentStore.getState().updateActiveAgent(agentId, { status: 'complete' });
        useAgentStore.getState().addLog({
          type: 'subagent_complete',
          message: `AGENT ${task.id} COMPLETE — quality ${qualityScore}/10 (retried)`,
          taskId: task.id,
        });

        return { taskId: task.id, output: finalResult, success: true, structuredData };
      }

      // Normal completion
      useAgentStore.getState().updateSubtask(task.id, {
        status: 'completed',
        result,
        structuredData,
        toolCalls,
        completedAt: Date.now(),
      });

      useAgentStore.getState().updateActiveAgent(agentId, { status: 'complete' });
      useAgentStore.getState().addLog({
        type: 'subagent_complete',
        message: `AGENT ${task.id} COMPLETE — quality ${qualityScore}/10`,
        taskId: task.id,
      });
      useAgentStore.getState().addLog({
        type: 'success',
        message: `Completed: ${task.title}`,
        taskId: task.id,
      });

      return { taskId: task.id, output: result, success: true, structuredData };
    } catch (err: any) {
      useAgentStore.getState().updateSubtask(task.id, {
        status: 'failed',
        result: err.message,
        completedAt: Date.now(),
      });
      useAgentStore.getState().updateActiveAgent(agentId, { status: 'failed' });
      useAgentStore.getState().addLog({
        type: 'error',
        message: `Failed: ${task.title} — ${err.message}`,
        taskId: task.id,
      });
      return { taskId: task.id, output: err.message, success: false };
    }
  }, []);

  const executeGoal = useCallback(async (goal: string) => {
    // Use different providers for different subtasks for better parallel performance
    const providers = ['lovable', 'groq', 'mistral'];
    let providerIndex = 0;
    const getProvider = () => providers[providerIndex++ % providers.length];
    store.reset();
    store.setGoal(goal);
    store.setIsStreaming(true);
    store.setPhase('decomposing');
    store.addLog({ type: 'info', message: `Goal received: "${goal}"` });

    // Search persistent memory for relevant past sessions
    const relevantMemories = searchMemory(goal);
    if (relevantMemories.length > 0) {
      store.setMemoryLoaded(true);
      store.setRelevantMemories(relevantMemories.map(m => ({ goal: m.goal, summary: m.summary })));
      store.addLog({
        type: 'memory_loaded',
        message: `MEMORY LOADED — Found ${relevantMemories.length} relevant past session${relevantMemories.length > 1 ? 's' : ''} · Injecting context`,
      });
    }

    store.addLog({ type: 'thinking', message: 'Decomposing goal into parallel subtasks...' });

    // Create session in DB
    const { data: sessionData } = await supabase
      .from('agent_sessions')
      .insert({ goal, phase: 'decomposing' })
      .select('id')
      .single();

    const sid = sessionData?.id || null;
    store.setSessionId(sid);

    try {
      // Build memory context string for the LLM
      const memoryContext = relevantMemories.length > 0
        ? `\n\nPAST MEMORY CONTEXT:\n${relevantMemories.map(m => `In a previous session about "${m.goal}", the agent found: ${m.keyFindings.slice(0, 3).join('; ')}`).join('\n')}\nUse this as additional context.`
        : '';

      // Step 1: Decompose
      const { data: decomposeData, error: decomposeError } = await supabase.functions.invoke('agent-orchestrator', {
        body: { action: 'decompose', goal: goal + memoryContext, provider: getProvider() },
      });

      if (decomposeError) throw new Error(decomposeError.message);

      const subtasks: SubTask[] = (decomposeData.subtasks || []).map((t: any, i: number) => ({
        id: `task-${i}`,
        title: t.title,
        description: t.description,
        status: 'pending' as const,
        retryCount: 0,
        toolCalls: [],
        category: t.category || 'default',
        dependsOn: (t.depends_on || []).map((d: number) => `task-${d}`),
      }));

      store.setSubtasks(subtasks);
      store.addLog({ type: 'success', message: `Decomposed into ${subtasks.length} subtasks with dependency graph` });

      // Step 2: Plan
      store.setPhase('planning');
      store.addLog({ type: 'thinking', message: 'Building parallel execution plan...' });

      if (sid) {
        await supabase.from('agent_sessions').update({ phase: 'planning', subtasks: subtasks as any }).eq('id', sid);
      }

      const { data: planData, error: planError } = await supabase.functions.invoke('agent-orchestrator', {
        body: {
          action: 'plan',
          goal,
          subtasks: subtasks.map(s => ({ title: s.title, description: s.description, category: s.category, depends_on: s.dependsOn })),
          provider: getProvider(),
        },
      });

      if (planError) throw new Error(planError.message);

      const executionLevels = getExecutionLevels(subtasks);
      store.setExecutionLevels(executionLevels);

      if (planData.plan) {
        store.addLog({ type: 'info', message: `Plan: ${planData.plan}` });
      }
      store.addLog({
        type: 'info',
        message: `Execution graph: ${executionLevels.length} parallel waves — ${executionLevels.map((l, i) => `L${i}(${l.length})`).join(' → ')}`,
      });

      // Step 3: Execute levels in parallel waves
      store.setPhase('executing');
      const sharedMemory: Record<string, string> = {};

      for (let levelIdx = 0; levelIdx < executionLevels.length; levelIdx++) {
        const levelTaskIds = executionLevels[levelIdx];
        const levelTasks = levelTaskIds.map(id => subtasks.find(t => t.id === id)!).filter(Boolean);

        store.setCurrentLevel(levelIdx);
        store.addLog({
          type: 'level_start',
          message: `PARALLEL WAVE ${levelIdx + 1} — Spawning ${levelTasks.length} specialized agent${levelTasks.length > 1 ? 's' : ''} simultaneously`,
        });

        const currentIntervention = useAgentStore.getState().intervention;
        if (currentIntervention) {
          store.addLog({ type: 'warning', message: `User intervention: "${currentIntervention}"` });
          store.setIntervention(null);
          levelTasks.forEach(t => {
            t.description = `${t.description}\n\n[USER INTERVENTION]: ${currentIntervention}. Acknowledge this and adjust your approach.`;
          });
        }

        const sharedContext = Object.entries(sharedMemory).map(([key, value]) => ({
          title: key.replace('task_output_', ''),
          result: value.slice(0, 500),
        }));

        const results = await Promise.all(
          levelTasks.map(task => {
            const agentId = crypto.randomUUID();
            return executeSubAgent(task, goal, sharedContext, agentId, getProvider());
          })
        );

        for (const result of results) {
          sharedMemory[`task_output_${result.taskId}`] = result.output;
          const idx = subtasks.findIndex(t => t.id === result.taskId);
          if (idx >= 0) {
            subtasks[idx] = {
              ...subtasks[idx],
              status: result.success ? 'completed' : 'failed',
              result: result.output,
              structuredData: result.structuredData,
            };
          }
        }

        useAgentStore.getState().clearActiveAgents();

        if (sid) {
          await supabase.from('agent_sessions').update({ subtasks: subtasks as any }).eq('id', sid);
        }
      }

      // Step 4: Generate final report
      store.addLog({ type: 'thinking', message: 'Generating final report from all agent outputs...' });
      const { data: reportData } = await supabase.functions.invoke('agent-orchestrator', {
        body: {
          action: 'report',
          goal,
          results: subtasks.map(s => ({ title: s.title, status: s.status, result: s.result, category: s.category })),
          provider: getProvider(),
        },
      });

      const report = reportData?.report || reportData?.raw || 'Report generation failed.';
      store.setFinalReport(report);
      store.setPhase('completed');
      store.setHeaderFlash('green');
      setTimeout(() => store.setHeaderFlash(null), 1000);
      store.addLog({ type: 'success', message: 'All agents completed. Report ready.' });

      // Save to persistent memory
      const keyFindings = subtasks
        .filter(t => t.status === 'completed' && t.result)
        .map(t => t.result!.slice(0, 150));
      saveSession(sid || crypto.randomUUID(), goal, subtasks.length, report, keyFindings.slice(0, 5));

      if (sid) {
        await supabase.from('agent_sessions').update({
          phase: 'completed',
          final_report: report,
          subtasks: subtasks as any,
          completed_at: new Date().toISOString(),
        }).eq('id', sid);
      }

      loadHistory();
    } catch (err: any) {
      store.setPhase('error');
      store.addLog({ type: 'error', message: `Agent error: ${err.message}` });
      if (sid) {
        await supabase.from('agent_sessions').update({ phase: 'error' }).eq('id', sid);
      }
    } finally {
      store.setIsStreaming(false);
      store.clearActiveAgents();
    }
  }, [loadHistory, executeSubAgent]);

  /**
   * Execute a debate between two agents.
   */
  const executeDebate = useCallback(async (topic: string) => {
    // Use different providers for debate agents for better parallel performance
    const providers = ['lovable', 'groq', 'mistral'];
    let providerIndex = 0;
    const getProvider = () => providers[providerIndex++ % providers.length];
    store.reset();
    store.resetDebate();
    store.setGoal(topic);
    store.setIsStreaming(true);
    store.setPhase('executing');
    store.addLog({ type: 'info', message: `Debate topic: "${topic}"` });
    store.addLog({ type: 'thinking', message: 'Spawning Optimist and Skeptic agents...' });

    try {
      const [optimistResult, skepticResult] = await Promise.all([
        supabase.functions.invoke('agent-orchestrator', {
          body: { action: 'debate_agent', role: 'optimist', topic, provider: getProvider() },
        }),
        supabase.functions.invoke('agent-orchestrator', {
          body: { action: 'debate_agent', role: 'skeptic', topic, provider: getProvider() },
        }),
      ]);

      const optimistText = optimistResult.data?.argument || 'No argument generated.';
      const skepticText = skepticResult.data?.argument || 'No argument generated.';

      // Set both at once (simulating streaming)
      useAgentStore.getState().updateDebateChunk('optimist', optimistText);
      useAgentStore.getState().updateDebateChunk('skeptic', skepticText);

      store.addLog({ type: 'subagent_complete', message: 'Optimist and Skeptic agents complete' });
      store.addLog({ type: 'thinking', message: 'Synthesizing verdict...' });

      // Run synthesizer
      const { data: synthData } = await supabase.functions.invoke('agent-orchestrator', {
        body: { action: 'debate_synthesize', topic, optimistArgument: optimistText, skepticArgument: skepticText, provider: getProvider() },
      });

      const synthesisText = synthData?.synthesis || 'No synthesis generated.';
      const confidence = synthData?.confidence || 75;

      useAgentStore.getState().updateDebateChunk('synthesis', synthesisText);
      useAgentStore.getState().setDebateResult({
        optimist: optimistText,
        skeptic: skepticText,
        synthesis: synthesisText,
        confidence,
      });

      // Set final report as combined debate output
      const debateReport = `# Debate: ${topic}\n\n## 🟢 Optimist Perspective\n${optimistText}\n\n## 🔴 Skeptic Perspective\n${skepticText}\n\n## ⚖️ Synthesizer Verdict (Confidence: ${confidence}%)\n${synthesisText}`;
      store.setFinalReport(debateReport);
      store.setPhase('completed');
      store.setHeaderFlash('green');
      setTimeout(() => store.setHeaderFlash(null), 1000);
      store.addLog({ type: 'success', message: `Debate complete. Confidence: ${confidence}%` });
    } catch (err: any) {
      store.setPhase('error');
      store.addLog({ type: 'error', message: `Debate error: ${err.message}` });
    } finally {
      store.setIsStreaming(false);
    }
  }, []);

  return { executeGoal, executeDebate, loadSession, history, loadHistory, ...store };
}
