import React, { useState } from 'react';
import { Terminal, Shield, FlaskConical, Hammer, ChevronDown, ChevronUp, Trash2, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { Project } from '../types';

interface BottomPanelProps {
  project: Project;
  logs: { id: string; timestamp: string; level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS'; message: string }[];
  onClearLogs: () => void;
}

export const BottomPanel: React.FC<BottomPanelProps> = ({ project, logs, onClearLogs }) => {
  const [activeTab, setActiveTab] = useState<'console' | 'tests' | 'security' | 'builds'>('console');
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <footer
      className={`border-t border-slate-800 bg-slate-950 flex flex-col transition-all duration-200 z-20 ${
        isExpanded ? 'h-72' : 'h-36'
      }`}
    >
      {/* Panel Tab Header */}
      <div className="h-9 px-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('console')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors ${
              activeTab === 'console'
                ? 'bg-slate-800 text-amber-300 border-b-2 border-amber-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Execution Console</span>
            <span className="text-[10px] bg-slate-800 px-1.5 rounded-full text-slate-400 font-mono">
              {logs.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('tests')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors ${
              activeTab === 'tests'
                ? 'bg-slate-800 text-amber-300 border-b-2 border-amber-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5" />
            <span>Test Records</span>
            <span className="text-[10px] bg-slate-800 px-1.5 rounded-full text-slate-400 font-mono">
              {project.testRecords.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors ${
              activeTab === 'security'
                ? 'bg-slate-800 text-amber-300 border-b-2 border-amber-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Security Stream</span>
            <span className="text-[10px] bg-rose-950/60 text-rose-300 px-1.5 rounded-full font-mono">
              {project.securityFindings.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('builds')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors ${
              activeTab === 'builds'
                ? 'bg-slate-800 text-amber-300 border-b-2 border-amber-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Hammer className="w-3.5 h-3.5" />
            <span>Build Diagnostics</span>
            <span className="text-[10px] bg-slate-800 px-1.5 rounded-full text-slate-400 font-mono">
              {project.buildRecords.length}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'console' && (
            <button
              onClick={onClearLogs}
              className="p-1 text-slate-500 hover:text-slate-300 rounded"
              title="Clear Console Logs"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-slate-500 hover:text-slate-300 rounded"
            title={isExpanded ? 'Collapse Panel' : 'Expand Panel'}
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Panel Content Body */}
      <div className="flex-1 overflow-y-auto p-2 font-mono text-xs">
        {activeTab === 'console' && (
          <div className="space-y-1">
            {logs.length === 0 ? (
              <p className="text-slate-600 italic py-2">Execution console initialized. Ready for operations.</p>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="flex items-start gap-2 leading-relaxed">
                  <span className="text-slate-600 select-none text-[10px]">
                    {log.timestamp.slice(11, 19)}
                  </span>
                  {log.level === 'INFO' && <span className="text-cyan-400 font-semibold">[INFO]</span>}
                  {log.level === 'WARN' && <span className="text-amber-400 font-semibold">[WARN]</span>}
                  {log.level === 'ERROR' && <span className="text-rose-400 font-semibold">[ERROR]</span>}
                  {log.level === 'SUCCESS' && <span className="text-emerald-400 font-semibold">[OK]</span>}
                  <span className="text-slate-300 flex-1 whitespace-pre-wrap">{log.message}</span>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'tests' && (
          <div className="space-y-2">
            {project.testRecords.length === 0 ? (
              <p className="text-slate-600 italic py-2">No test suites executed yet. Click &quot;Test&quot; in the header or run from Test Laboratory.</p>
            ) : (
              project.testRecords.map((t) => (
                <div key={t.id} className="p-2 rounded bg-slate-900 border border-slate-800">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                      {t.status === 'PASS' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                      {t.status === 'FAIL' && <XCircle className="w-3.5 h-3.5 text-rose-400" />}
                      {t.status === 'PARTIAL' && <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
                      <span>{t.testName}</span>
                    </span>
                    <span className="text-slate-500 text-[11px]">{t.executionTimeMs}ms &bull; Exit {t.exitCode}</span>
                  </div>
                  <pre className="text-[11px] text-slate-400 whitespace-pre-wrap overflow-x-auto bg-slate-950 p-1.5 rounded">
                    {t.stdout}
                  </pre>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-1">
            {project.securityFindings.length === 0 ? (
              <p className="text-emerald-400/80 italic py-2">No security vulnerabilities or leaked secrets currently detected.</p>
            ) : (
              project.securityFindings.map((sec) => (
                <div key={sec.id} className="flex items-center justify-between p-1.5 rounded bg-slate-900/60 border border-slate-800 text-[11px]">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        sec.severity === 'CRITICAL'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : sec.severity === 'HIGH'
                          ? 'bg-orange-950 text-orange-300'
                          : 'bg-amber-950 text-amber-300'
                      }`}
                    >
                      {sec.severity}
                    </span>
                    <span className="text-slate-200">{sec.title}</span>
                    <span className="text-slate-500">in {sec.filePath}</span>
                  </div>
                  <span className="text-slate-400 font-mono text-[10px]">{sec.category}</span>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'builds' && (
          <div className="space-y-1">
            {project.buildRecords.length === 0 ? (
              <p className="text-slate-600 italic py-2">No build operations logged. Run a build variant from Build Center.</p>
            ) : (
              project.buildRecords.map((b) => (
                <div key={b.id} className="p-2 rounded bg-slate-900 border border-slate-800">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-200 font-semibold">Variant: {b.variant} ({b.environment})</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${b.status === 'PASS' ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'}`}>
                      {b.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">Artifact SHA-256: <span className="font-mono text-cyan-300">{b.artifactHash || 'N/A'}</span></div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </footer>
  );
};
