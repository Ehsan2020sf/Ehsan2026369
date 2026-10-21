import React, { useState } from 'react';
import {
  Bot,
  Cpu,
  Shield,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Play,
  Terminal,
} from 'lucide-react';
import { AgentDefinition } from '../../types';
import { INITIAL_AGENTS } from '../../engines/agentRegistry';
import { Language, translations } from '../../i18n/translations';

interface AgentRegistryViewProps {
  lang: Language;
  onDispatchAgent: (agent: AgentDefinition) => void;
}

export const AgentRegistryView: React.FC<AgentRegistryViewProps> = ({ lang, onDispatchAgent }) => {
  const t = translations[lang];

  const [agents, setAgents] = useState<AgentDefinition[]>(INITIAL_AGENTS);
  const [selectedAgentId, setSelectedAgentId] = useState<string>(agents[0]?.id || '');
  const [filter, setFilter] = useState<string>('ALL');

  const selectedAgent = agents.find((a) => a.id === selectedAgentId) || agents[0];

  const filteredAgents = agents.filter((a) => filter === 'ALL' || a.status === filter);

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Bot className="w-5 h-5 text-amber-400" />
            <span>{t.nav_agents}</span>
          </h1>
          <p className="text-xs text-slate-400">
            Multi-agent engineering orchestrator. Defines 16 specialized agents with strict capability scopes, input/output schemas, and permission boundaries.
          </p>
        </div>

        <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
          16 Agents Registered
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Agent Cards Grid on Left */}
        <div className="space-y-2 lg:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Registered Agents ({agents.length})
            </h2>
            <div className="flex gap-1 text-[10px]">
              {(['ALL', 'AVAILABLE', 'DISABLED'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setFilter(st)}
                  className={`px-2 py-0.5 rounded font-mono ${
                    filter === st ? 'bg-slate-800 text-amber-300' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[600px] overflow-y-auto pr-1">
            {filteredAgents.map((agent) => {
              const isSelected = agent.id === selectedAgent?.id;
              return (
                <div
                  key={agent.id}
                  onClick={() => setSelectedAgentId(agent.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-slate-900 border-amber-400 ring-1 ring-amber-400'
                      : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <span className="font-bold text-xs text-slate-100 flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-amber-400" />
                      <span>{agent.name}</span>
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300">
                      {agent.status}
                    </span>
                  </div>

                  <p className="mt-2 text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {agent.purpose}
                  </p>

                  <div className="mt-3 flex items-center justify-between text-[10px] text-slate-500 font-mono border-t border-slate-800 pt-1.5">
                    <span>v{agent.version}</span>
                    <span>{agent.supportedTasks.length} Tasks</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Agent Inspector on Right */}
        {selectedAgent && (
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Agent Specifications</h2>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-4 text-xs">
              <div>
                <span className="text-[10px] font-mono text-cyan-400 block uppercase">
                  Agent ID: {selectedAgent.id}
                </span>
                <h3 className="text-base font-bold text-slate-100">{selectedAgent.name}</h3>
                <p className="text-slate-400 text-xs mt-1 leading-relaxed">{selectedAgent.purpose}</p>
              </div>

              <div>
                <span className="text-slate-500 text-[10px] block uppercase font-mono mb-1">
                  Supported Tasks
                </span>
                <div className="flex flex-wrap gap-1">
                  {selectedAgent.supportedTasks.map((task) => (
                    <span
                      key={task}
                      className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300 font-mono text-[10px]"
                    >
                      {task}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-slate-500 text-[10px] block uppercase font-mono mb-1">
                  Required Permissions
                </span>
                <div className="flex flex-wrap gap-1">
                  {selectedAgent.requiredPermissions.map((perm) => (
                    <span
                      key={perm}
                      className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-amber-300 font-mono text-[10px]"
                    >
                      {perm}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-slate-500 text-[10px] block uppercase font-mono mb-1">Input Schema</span>
                <pre className="p-2 rounded bg-slate-950 font-mono text-[10px] text-slate-400 overflow-x-auto">
                  {selectedAgent.inputSchema}
                </pre>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => onDispatchAgent(selectedAgent)}
                  className="w-full py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Engage in AI Engineering Brain</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
