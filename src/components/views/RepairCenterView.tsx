import React, { useState } from 'react';
import {
  Wrench,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  GitCommit,
  Check,
  FileCode,
  ShieldCheck,
} from 'lucide-react';
import { Project, ProjectFile } from '../../types';
import { Language, translations } from '../../i18n/translations';
import { generateCandidateRepairs, applyApprovedRepair, RepairCandidate } from '../../engines/repairEngine';
import { DiffViewer } from '../DiffViewer';

interface RepairCenterViewProps {
  project: Project;
  lang: Language;
  onApplyRepair: (updatedFiles: ProjectFile[], candidateTitle: string) => void;
}

export const RepairCenterView: React.FC<RepairCenterViewProps> = ({ project, lang, onApplyRepair }) => {
  const t = translations[lang];

  const [candidates, setCandidates] = useState<RepairCandidate[]>(() => generateCandidateRepairs(project));
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>(candidates[0]?.id || '');
  const [approverEmail, setApproverEmail] = useState('engineer@novin.ai');
  const [appliedNotice, setAppliedNotice] = useState<string | null>(null);

  const activeCandidate = candidates.find((c) => c.id === selectedCandidateId) || candidates[0];

  const handleApprove = async () => {
    if (!activeCandidate) return;

    try {
      const { updatedFiles } = await applyApprovedRepair(project, activeCandidate, approverEmail);

      // Mark candidate as applied
      setCandidates((prev) =>
        prev.map((c) => (c.id === activeCandidate.id ? { ...c, status: 'APPLIED' } : c))
      );

      setAppliedNotice(`Patch successfully applied to active working copy: ${activeCandidate.title}`);
      onApplyRepair(updatedFiles, activeCandidate.title);

      setTimeout(() => setAppliedNotice(null), 4000);
    } catch (err: any) {
      alert(`Repair application failed: ${err.message}`);
    }
  };

  const handleReject = () => {
    if (!activeCandidate) return;
    setCandidates((prev) =>
      prev.map((c) => (c.id === activeCandidate.id ? { ...c, status: 'REJECTED' } : c))
    );
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-amber-400" />
            <span>{t.nav_repair}</span>
          </h1>
          <p className="text-xs text-slate-400">
            Controlled 14-step automated repair engine. Formulates verified candidate patches, unified diffs, and regression checks under mandatory human approval.
          </p>
        </div>

        <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
          {candidates.filter((c) => c.status === 'PROPOSED').length} Proposed Patches Available
        </span>
      </div>

      {appliedNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800 text-xs text-emerald-300 flex items-center gap-2 shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{appliedNotice}</span>
        </div>
      )}

      {candidates.length === 0 ? (
        <div className="p-8 rounded-xl bg-slate-900 border border-slate-800 text-center text-slate-400 text-xs space-y-2">
          <ShieldCheck className="w-10 h-10 mx-auto text-emerald-400" />
          <h3 className="text-sm font-bold text-slate-200">Workspace Baseline Is Healthy</h3>
          <p className="max-w-md mx-auto text-slate-500">
            No active security flaws or manifest regressions currently require automated code repair.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Candidate List on Left */}
          <div className="space-y-2">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Candidate Patches ({candidates.length})
            </h2>

            <div className="space-y-2">
              {candidates.map((cand) => {
                const isSelected = cand.id === activeCandidate?.id;
                return (
                  <div
                    key={cand.id}
                    onClick={() => setSelectedCandidateId(cand.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-slate-900 border-amber-400 ring-1 ring-amber-400'
                        : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <span className="font-semibold text-xs text-slate-200 line-clamp-1">{cand.title}</span>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.2 rounded uppercase ${
                          cand.status === 'APPLIED'
                            ? 'bg-emerald-950 text-emerald-300'
                            : cand.status === 'REJECTED'
                            ? 'bg-rose-950 text-rose-300'
                            : 'bg-amber-950 text-amber-300'
                        }`}
                      >
                        {cand.status}
                      </span>
                    </div>

                    <div className="mt-1 text-[11px] text-slate-400 font-mono truncate">
                      {cand.targetFile}
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-800/80 pt-1.5">
                      <span>Regression Risk:</span>
                      <span className="font-bold text-emerald-400">{cand.regressionRisk}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Patch Inspector on Right */}
          {activeCandidate && (
            <div className="lg:col-span-2 space-y-4">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <h2 className="text-sm font-bold text-slate-100">{activeCandidate.title}</h2>
                    <p className="text-xs text-slate-400 font-mono">{activeCandidate.targetFile}</p>
                  </div>

                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
                    Candidate: {activeCandidate.id}
                  </span>
                </div>

                {/* Root Cause & Rationale */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase font-mono block">Identified Root Cause</span>
                    <p className="text-slate-300 mt-1">{activeCandidate.rootCause}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase font-mono block">Expected Remediation Benefit</span>
                    <p className="text-slate-300 mt-1">{activeCandidate.rationale}</p>
                  </div>
                </div>

                {/* Unified Diff View */}
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Proposed Code Modification (Unified Diff)
                  </h3>
                  <DiffViewer
                    oldText={activeCandidate.originalContent}
                    newText={activeCandidate.patchedContent}
                    oldTitle="Original Target File"
                    newTitle="Proposed Verified Patch"
                  />
                </div>

                {/* Human Approval Gate Action Bar */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2 font-bold text-amber-300">
                      <GitCommit className="w-4 h-4" />
                      <span>Human Approval Gate (Master Principle #5)</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Applies changes strictly to isolated working copy. The original source archive baseline remains recoverable.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    {activeCandidate.status === 'APPLIED' ? (
                      <span className="px-3 py-1.5 rounded-lg bg-emerald-950 text-emerald-300 text-xs font-bold border border-emerald-800 flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5" />
                        <span>Applied in Working Copy</span>
                      </span>
                    ) : (
                      <>
                        <button
                          onClick={handleReject}
                          className="flex-1 sm:flex-none px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-rose-300 hover:bg-rose-950/40 border border-slate-800 transition-colors"
                        >
                          {t.reject}
                        </button>
                        <button
                          onClick={handleApprove}
                          className="flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors flex items-center justify-center gap-1.5 shadow-sm shadow-amber-500/20"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{t.approve}</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
