import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  Terminal,
  Cpu,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Shield,
  Zap,
  ArrowRight,
} from 'lucide-react';
import { EngineeringTask, Project, ProjectFile } from '../../types';
import { Language, translations } from '../../i18n/translations';
import { parseNaturalLanguageTask, selectProjectContext } from '../../engines/aiBrain';

interface AiAssistantViewProps {
  project: Project;
  lang: Language;
  onApplyTaskPlan: (task: EngineeringTask) => void;
  initialPrompt?: string;
  initialFile?: ProjectFile;
}

export const AiAssistantView: React.FC<AiAssistantViewProps> = ({
  project,
  lang,
  onApplyTaskPlan,
  initialPrompt = '',
  initialFile,
}) => {
  const t = translations[lang];

  const [prompt, setPrompt] = useState(initialPrompt);
  const [messages, setMessages] = useState<
    { id: string; role: 'user' | 'assistant'; text: string; task?: EngineeringTask; timestamp: string }[]
  >([
    {
      id: 'init-msg',
      role: 'assistant',
      text: `NOVIN FORGE AI Assistant initialized.
Operating under Master Principle #1 (Reality First), #2 (Preserve the Source), and #5 (Human Approval).
I can formulate structured engineering plans, audit Android components, repair security flaws, and explain architectural dependencies.`,
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const sampleCommands = [
    'Analyze this NOVIN ZIP workspace',
    'Identify security problems & exposed keys',
    'Find duplicate files and evaluate consolidation risks',
    'Repair compilation errors & manifest issues',
    'Explain the Android architecture and Room persistence',
    'Add a new agent management module',
    'Find why tests fail and propose fixes',
  ];

  const handleSend = async (commandToSend?: string) => {
    const text = commandToSend || prompt;
    if (!text.trim() || isLoading) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      role: 'user' as const,
      text,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setPrompt('');
    setIsLoading(true);

    try {
      // 1. Context Selection with Token Budgeting (Section 8)
      const contextSelection = selectProjectContext(project, text, { maxTokens: 4000 });

      // 2. Formulate Structured Engineering Task (Section 9)
      const task = await parseNaturalLanguageTask(text, project);

      // 3. Call AI server proxy or fallback
      let aiResponseText = '';
      try {
        const res = await fetch('/api/gemini/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: text,
            context: `${contextSelection.contextSummary}\n\nSelected Source Excerpts:\n${contextSelection.selectedFiles
              .map((f) => `--- File: ${f.path} ---\n${f.excerpt}`)
              .join('\n\n')}`,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          aiResponseText = data.text;
        } else {
          throw new Error('Server proxy error');
        }
      } catch {
        aiResponseText = `Engineering Task Plan Synthesized:
Goal: ${task.goal}
Scope: ${task.scope.join(', ')}
Constraints: ${task.constraints.join(', ')}

Candidate Steps:
${task.steps.map((s) => `${s.id}. ${s.title} [${s.status}]`).join('\n')}

Human Approval Notice: Before modifying the protected main baseline, explicit engineer approval is required.`;
      }

      const assistantMsg = {
        id: `assist-${Date.now()}`,
        role: 'assistant' as const,
        text: aiResponseText,
        task,
        timestamp: new Date().toLocaleTimeString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          text: `Error processing engineering request: ${err.message || String(err)}`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-8.5rem)] flex flex-col md:flex-row overflow-hidden border-t border-slate-800">
      {/* Main Chat and Command Feed */}
      <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
        {/* Chat Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.role === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-3xl rounded-xl p-4 text-xs leading-relaxed space-y-2 ${
                  msg.role === 'user'
                    ? 'bg-amber-500 text-slate-950 font-semibold'
                    : 'bg-slate-900 border border-slate-800 text-slate-200 shadow-lg'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] opacity-70 pb-1 border-b border-white/10 font-mono">
                  <span>{msg.role === 'user' ? 'Lead Engineer' : 'NOVIN AI Brain'}</span>
                  <span>{msg.timestamp}</span>
                </div>

                <div className="whitespace-pre-wrap font-sans text-xs">
                  {msg.text}
                </div>

                {/* Structured Engineering Task Plan Card */}
                {msg.task && (
                  <div className="mt-3 p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2.5 font-mono text-[11px] text-slate-300">
                    <div className="flex items-center justify-between text-amber-300 font-bold border-b border-slate-800 pb-1.5">
                      <span className="flex items-center gap-1.5">
                        <Terminal className="w-3.5 h-3.5" />
                        <span>Task: {msg.task.id}</span>
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                        {msg.task.status}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[10px]">OBJECTIVE:</span>
                      <p className="text-slate-200">{msg.task.goal}</p>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[10px]">PLANNED STEPS:</span>
                      <div className="space-y-1 mt-1">
                        {msg.task.steps.map((step) => (
                          <div key={step.id} className="flex items-center gap-2">
                            <span className="w-4 h-4 rounded-full bg-slate-800 text-[10px] flex items-center justify-center text-slate-400">
                              {step.id}
                            </span>
                            <span className="text-slate-300">{step.title}</span>
                            <span className="text-[10px] text-slate-500">[{step.status}]</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => onApplyTaskPlan(msg.task!)}
                      className="w-full mt-2 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <span>Review in Code Repair / Integration Engine</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 p-3 text-xs text-amber-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
              <span>AI Brain reasoning and analyzing project context...</span>
            </div>
          )}
        </div>

        {/* Bottom Input Area */}
        <div className="p-3 bg-slate-900 border-t border-slate-800 space-y-2">
          {/* Quick Command Suggestions */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] scrollbar-none">
            <span className="text-slate-500 shrink-0 flex items-center gap-1 font-mono">
              <Zap className="w-3 h-3 text-amber-400" />
              <span>Quick:</span>
            </span>
            {sampleCommands.slice(0, 4).map((cmd, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(cmd)}
                className="shrink-0 px-2.5 py-1 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-colors truncate max-w-xs"
              >
                {cmd}
              </button>
            ))}
          </div>

          {/* Prompt Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe an engineering task (e.g., 'Repair cleartext HTTP in AndroidManifest' or 'Find duplicate files')..."
              className="flex-1 px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 font-sans"
            />
            <button
              type="submit"
              disabled={isLoading || !prompt.trim()}
              className="px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors"
            >
              <span>Execute</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>

      {/* Right Context & Token Budget Panel */}
      <div className="w-full md:w-72 lg:w-80 border-t md:border-t-0 md:border-l border-slate-800 bg-slate-900/50 p-4 space-y-4 text-xs overflow-y-auto shrink-0">
        <h2 className="font-bold text-slate-200 flex items-center justify-between">
          <span>AI Context Budget</span>
          <span className="text-[10px] font-mono text-cyan-400">GEMINI API</span>
        </h2>

        <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
          <div className="flex justify-between text-slate-400 text-[11px]">
            <span>Token Budget:</span>
            <span className="font-mono text-emerald-400 font-semibold">~4,000 / 1M Max</span>
          </div>
          <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
            <div className="bg-emerald-400 h-full w-[20%]"></div>
          </div>
          <p className="text-[10px] text-slate-500 leading-relaxed">
            Adheres to Master Principle #8 &amp; #10 (Resource Awareness). The system selectively scores and excerpts relevant files rather than dumping entire repositories.
          </p>
        </div>

        {initialFile && (
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-500 block uppercase font-mono">Active Target File</span>
            <div className="font-mono text-amber-300 font-semibold truncate text-[11px]">{initialFile.path}</div>
            <div className="text-[10px] text-slate-400">{initialFile.role} &bull; {initialFile.content.split('\n').length} lines</div>
          </div>
        )}

        <div className="space-y-2">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Defense Against Untrusted Input
          </h3>
          <div className="p-2.5 rounded bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 leading-snug space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <Shield className="w-3.5 h-3.5" />
              <span>Prompt Injection Guard</span>
            </div>
            <p>
              Uploaded repository READMEs, commit comments, and configuration files are treated as passive data. An archive cannot grant itself system execution privileges.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
