import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Key,
  Radio,
  FileCode,
  Wrench,
  CheckCircle2,
  Lock,
  Terminal,
} from 'lucide-react';
import { Project, SecurityFinding } from '../../types';
import { Language, translations } from '../../i18n/translations';

interface SecurityCenterViewProps {
  project: Project;
  lang: Language;
  onNavigateToRepair: () => void;
}

export const SecurityCenterView: React.FC<SecurityCenterViewProps> = ({
  project,
  lang,
  onNavigateToRepair,
}) => {
  const t = translations[lang];

  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');
  const [selectedFinding, setSelectedFinding] = useState<SecurityFinding | null>(
    project.securityFindings[0] || null
  );

  const findings = project.securityFindings.filter(
    (f) => severityFilter === 'ALL' || f.severity === severityFilter
  );

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            <span>{t.nav_security}</span>
          </h1>
          <p className="text-xs text-slate-400">
            Defense-in-depth static analysis: exposed API credentials, dangerous Android permissions, exported components without protections, and cleartext traffic flaws.
          </p>
        </div>

        <button
          onClick={onNavigateToRepair}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors shadow-sm shadow-amber-500/20"
        >
          <Wrench className="w-3.5 h-3.5" />
          <span>Launch Code Repair Center</span>
        </button>
      </div>

      {/* Severity Filter Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2 text-xs">
        {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((sev) => {
          const count =
            sev === 'ALL'
              ? project.securityFindings.length
              : project.securityFindings.filter((f) => f.severity === sev).length;

          return (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-3 py-1 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                severityFilter === sev
                  ? 'bg-slate-800 text-amber-300 border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>{sev}</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-900 font-mono text-slate-400">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {findings.length === 0 ? (
        <div className="p-8 rounded-xl bg-slate-900 border border-slate-800 text-center text-slate-400 text-xs space-y-2">
          <ShieldCheck className="w-10 h-10 mx-auto text-emerald-400" />
          <h3 className="text-sm font-bold text-slate-200">No Security Flaws Match Selected Filter</h3>
          <p className="text-slate-500">All scanned manifests, source codes, and dependencies adhere to configured policies.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Finding Cards List */}
          <div className="space-y-2">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Security Findings ({findings.length})
            </h2>

            <div className="space-y-2">
              {findings.map((f) => {
                const isSelected = selectedFinding?.id === f.id;
                return (
                  <div
                    key={f.id}
                    onClick={() => setSelectedFinding(f)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-slate-900 border-amber-400 ring-1 ring-amber-400'
                        : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded ${
                          f.severity === 'CRITICAL'
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : f.severity === 'HIGH'
                            ? 'bg-orange-950 text-orange-300 border border-orange-800'
                            : 'bg-amber-950 text-amber-300'
                        }`}
                      >
                        {f.severity}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">{f.category}</span>
                    </div>

                    <h3 className="mt-2 text-xs font-bold text-slate-200 line-clamp-1">{f.title}</h3>
                    <p className="mt-1 text-[11px] text-slate-400 font-mono truncate">
                      {f.filePath}{f.lineNumber ? `:${f.lineNumber}` : ''}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Finding Detail Inspector */}
          {selectedFinding && (
            <div className="lg:col-span-2 space-y-4">
              <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4 text-xs">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <span
                      className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded inline-block mb-1 ${
                        selectedFinding.severity === 'CRITICAL'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : selectedFinding.severity === 'HIGH'
                          ? 'bg-orange-950 text-orange-300 border border-orange-800'
                          : 'bg-amber-950 text-amber-300'
                      }`}
                    >
                      {selectedFinding.severity} SEVERITY
                    </span>
                    <h2 className="text-base font-bold text-slate-100">{selectedFinding.title}</h2>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      Target: {selectedFinding.filePath}
                      {selectedFinding.lineNumber ? ` (Line ${selectedFinding.lineNumber})` : ''}
                    </p>
                  </div>

                  <span className="text-[10px] font-mono px-2 py-1 rounded bg-slate-800 text-slate-300">
                    Finding ID: {selectedFinding.id}
                  </span>
                </div>

                {/* Evidence Snippet */}
                <div className="space-y-1.5">
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">
                    Observed Code Evidence (Static Analysis)
                  </span>
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-rose-300 overflow-x-auto">
                    {selectedFinding.evidence}
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">
                    Threat &amp; Impact Assessment
                  </span>
                  <p className="text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                    {selectedFinding.description}
                  </p>
                </div>

                {/* Remediation Strategy */}
                <div className="space-y-1">
                  <span className="text-emerald-400 font-bold uppercase tracking-wider text-[10px] block">
                    Remediation Guidance
                  </span>
                  <p className="text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                    {selectedFinding.remediation}
                  </p>
                </div>

                {/* Action button to Repair Center */}
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={onNavigateToRepair}
                    className="px-4 py-2 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors flex items-center gap-1.5"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>Generate Candidate Patch in Repair Center &rarr;</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
