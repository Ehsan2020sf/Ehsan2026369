import React, { useState } from 'react';
import {
  Network,
  Layers,
  Activity,
  Cpu,
  Database,
  Radio,
  FileCode,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { ArchitectureNode, Project } from '../../types';
import { Language, translations } from '../../i18n/translations';

interface ArchitectureViewProps {
  project: Project;
  lang: Language;
  onSelectFile?: (filePath: string) => void;
}

export const ArchitectureView: React.FC<ArchitectureViewProps> = ({ project, lang, onSelectFile }) => {
  const t = translations[lang];
  const [selectedNode, setSelectedNode] = useState<ArchitectureNode | null>(null);

  const arch = project.architecture;
  if (!arch || arch.nodes.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 space-y-2">
        <Network className="w-10 h-10 mx-auto text-slate-600" />
        <p className="text-sm">Architecture graph has not been synthesized yet for this workspace.</p>
      </div>
    );
  }

  const getNodeIcon = (type: ArchitectureNode['type']) => {
    switch (type) {
      case 'MODULE':
        return Layers;
      case 'ACTIVITY':
        return Activity;
      case 'SERVICE':
        return Radio;
      case 'DATABASE':
      case 'ENTITY':
        return Database;
      case 'AI_AGENT':
        return Cpu;
      default:
        return FileCode;
    }
  };

  const getNodeColor = (type: ArchitectureNode['type']) => {
    switch (type) {
      case 'MODULE':
        return 'border-purple-500/40 bg-purple-950/20 text-purple-300';
      case 'ACTIVITY':
        return 'border-cyan-500/40 bg-cyan-950/20 text-cyan-300';
      case 'SERVICE':
        return 'border-blue-500/40 bg-blue-950/20 text-blue-300';
      case 'DATABASE':
      case 'ENTITY':
        return 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300';
      case 'AI_AGENT':
        return 'border-amber-500/40 bg-amber-950/20 text-amber-300';
      case 'REPOSITORY':
        return 'border-indigo-500/40 bg-indigo-950/20 text-indigo-300';
      default:
        return 'border-slate-700 bg-slate-900 text-slate-300';
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Network className="w-5 h-5 text-amber-400" />
            <span>{t.nav_architecture}</span>
          </h1>
          <p className="text-xs text-slate-400">
            Synthesized model of project modules, Android lifecycle components, database persistence, and AI agents with confidence tagging.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Confirmed</span>
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            <span>Statically Inferred</span>
          </span>
        </div>
      </div>

      {/* Architecture Drift Report */}
      {arch.driftFindings.length > 0 && (
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>Architecture Drift &amp; Clean Contracts Analysis</span>
          </h2>
          <div className="space-y-1.5 text-xs">
            {arch.driftFindings.map((finding, idx) => (
              <div key={idx} className="flex items-start gap-2 p-2 rounded bg-slate-950 text-slate-300 border border-slate-800/80 font-mono text-[11px]">
                {finding.includes('Drift') ? (
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                )}
                <span>{finding}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Visual Component Graph Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Discovered Component Topology ({arch.nodes.length} Nodes &bull; {arch.edges.length} Edges)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {arch.nodes.map((node) => {
              const Icon = getNodeIcon(node.type);
              const colorClass = getNodeColor(node.type);
              const isSelected = selectedNode?.id === node.id;

              return (
                <div
                  key={node.id}
                  onClick={() => setSelectedNode(node)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${colorClass} ${
                    isSelected ? 'ring-2 ring-amber-400 shadow-lg' : 'hover:brightness-110'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="font-bold text-xs truncate max-w-[150px]">{node.label}</span>
                    </div>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-900/60 border border-slate-800">
                      {node.type}
                    </span>
                  </div>

                  {node.filePath && (
                    <div className="mt-2 text-[10px] text-slate-400 font-mono truncate" title={node.filePath}>
                      {node.filePath}
                    </div>
                  )}

                  {/* Connected edges summary */}
                  <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between border-t border-slate-800/60 pt-1.5">
                    <span>Relations:</span>
                    <span className="font-mono text-slate-300">
                      {arch.edges.filter((e) => e.source === node.id || e.target === node.id).length} links
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Dependency Connections List */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Dependency Edges &amp; Call Paths
            </h3>
            <div className="max-h-48 overflow-y-auto space-y-1 font-mono text-xs">
              {arch.edges.map((edge) => (
                <div key={edge.id} className="flex items-center justify-between p-1.5 rounded bg-slate-950 text-slate-300 border border-slate-800/60">
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-amber-400">{edge.source.replace('mod_', '').replace('act_', '').replace('agent_', '')}</span>
                    <span className="text-slate-600">&rarr;</span>
                    <span className="text-cyan-400 font-semibold">{edge.label}</span>
                    <span className="text-slate-600">&rarr;</span>
                    <span className="text-emerald-400">{edge.target.replace('mod_', '').replace('act_', '').replace('db_', '').replace('srv_', '')}</span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${edge.confidence === 'CONFIRMED' ? 'bg-emerald-950 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}>
                    {edge.confidence}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Node Detail Inspector */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Node Inspector</h2>

          {selectedNode ? (
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-mono">{selectedNode.type}</span>
                <h3 className="text-base font-bold text-slate-100">{selectedNode.label}</h3>
              </div>

              {selectedNode.filePath && (
                <div>
                  <span className="text-slate-500 text-[10px] block">Source Path</span>
                  <p className="font-mono text-cyan-300 text-[11px] break-all">{selectedNode.filePath}</p>
                  {onSelectFile && (
                    <button
                      onClick={() => onSelectFile(selectedNode.filePath!)}
                      className="mt-2 text-xs text-amber-400 hover:underline flex items-center gap-1"
                    >
                      <span>Open in Code Workspace &rarr;</span>
                    </button>
                  )}
                </div>
              )}

              {selectedNode.details && (
                <div>
                  <span className="text-slate-500 text-[10px] block mb-1">Component Attributes</span>
                  <div className="p-2 rounded bg-slate-950 font-mono text-[11px] space-y-1 text-slate-300">
                    {Object.entries(selectedNode.details).map(([k, v]) => (
                      <div key={k} className="flex justify-between">
                        <span className="text-slate-500">{k}:</span>
                        <span>{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <span className="text-slate-500 text-[10px] block mb-1">Incoming / Outgoing Connections</span>
                <div className="space-y-1 text-[11px]">
                  {arch.edges
                    .filter((e) => e.source === selectedNode.id || e.target === selectedNode.id)
                    .map((e) => (
                      <div key={e.id} className="p-1 rounded bg-slate-950 font-mono text-slate-400">
                        {e.source === selectedNode.id ? `Outgoing: ${e.label} -> ${e.target}` : `Incoming: from ${e.source} (${e.label})`}
                      </div>
                    ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-xl bg-slate-900/50 border border-slate-800 text-center text-slate-500 text-xs">
              <Info className="w-6 h-6 mx-auto mb-2 text-slate-600" />
              <p>Click any component node in the topology view to inspect its architectural attributes, file location, and connections.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
