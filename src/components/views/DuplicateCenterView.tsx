import React, { useState } from 'react';
import {
  CopySlash,
  Layers,
  FileCode,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Info,
} from 'lucide-react';
import { DuplicateCandidate, Project } from '../../types';
import { Language, translations } from '../../i18n/translations';
import { DiffViewer } from '../DiffViewer';

interface DuplicateCenterViewProps {
  project: Project;
  lang: Language;
}

export const DuplicateCenterView: React.FC<DuplicateCenterViewProps> = ({ project, lang }) => {
  const t = translations[lang];

  const duplicates = project.duplicates;
  const [selectedCandidate, setSelectedCandidate] = useState<DuplicateCandidate | null>(
    duplicates[0] || null
  );

  const fileA = selectedCandidate
    ? project.workingFiles.find((f) => f.path === selectedCandidate.fileA)
    : null;
  const fileB = selectedCandidate
    ? project.workingFiles.find((f) => f.path === selectedCandidate.fileB)
    : null;

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <CopySlash className="w-5 h-5 text-amber-400" />
            <span>{t.nav_duplicates}</span>
          </h1>
          <p className="text-xs text-slate-400">
            Multi-tier duplication analysis: cryptographic SHA-256 matching, normalized AST comparison, call-site reference inspection, and safe consolidation advisory.
          </p>
        </div>

        <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
          {duplicates.length} Duplication Pairs Detected
        </span>
      </div>

      {duplicates.length === 0 ? (
        <div className="p-8 rounded-xl bg-slate-900 border border-slate-800 text-center text-slate-400 text-xs space-y-2">
          <ShieldCheck className="w-10 h-10 mx-auto text-emerald-400" />
          <h3 className="text-sm font-bold text-slate-200">No Redundant Duplicates Discovered</h3>
          <p className="max-w-md mx-auto text-slate-500">
            All files in the workspace have unique payloads and roles.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Candidates List */}
          <div className="space-y-2">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Discovered Duplicate Groups ({duplicates.length})
            </h2>

            <div className="space-y-2">
              {duplicates.map((dup) => {
                const isSelected = selectedCandidate?.id === dup.id;
                return (
                  <div
                    key={dup.id}
                    onClick={() => setSelectedCandidate(dup)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-slate-900 border-amber-400 ring-1 ring-amber-400'
                        : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-amber-300">
                        {dup.similarityPercentage}% Match
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                        {dup.type}
                      </span>
                    </div>

                    <div className="mt-2 space-y-1 text-[11px] font-mono text-slate-300">
                      <div className="truncate text-slate-300">A: {dup.fileA.split('/').pop()}</div>
                      <div className="truncate text-slate-400">B: {dup.fileB.split('/').pop()}</div>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-800 pt-1.5">
                      <span>Advice:</span>
                      <span className="font-semibold text-cyan-300">{dup.recommendedAction}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Duplicate Candidate Comparison Inspector */}
          {selectedCandidate && (
            <div className="lg:col-span-2 space-y-4">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                      <span>Comparison Analysis: {selectedCandidate.id}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
                        {selectedCandidate.similarityPercentage}% Similarity
                      </span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">{selectedCandidate.evidence}</p>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 block uppercase font-mono">Consolidation Risk</span>
                    <span
                      className={`text-xs font-bold ${
                        selectedCandidate.riskOfConsolidation === 'HIGH'
                          ? 'text-rose-400'
                          : selectedCandidate.riskOfConsolidation === 'MEDIUM'
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {selectedCandidate.riskOfConsolidation} RISK
                    </span>
                  </div>
                </div>

                {/* Call-sites and Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-500 font-mono block">FILE A &bull; {selectedCandidate.callSitesFileA} References</span>
                    <p className="font-mono text-cyan-300 text-[11px] truncate" title={selectedCandidate.fileA}>
                      {selectedCandidate.fileA}
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono">SHA: {selectedCandidate.hashA.slice(0, 16)}...</p>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-500 font-mono block">FILE B &bull; {selectedCandidate.callSitesFileB} References</span>
                    <p className="font-mono text-cyan-300 text-[11px] truncate" title={selectedCandidate.fileB}>
                      {selectedCandidate.fileB}
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono">SHA: {selectedCandidate.hashB.slice(0, 16)}...</p>
                  </div>
                </div>

                {/* Recommendation Notice (Master Principle #3: No Blind Merging) */}
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-start gap-2 text-xs">
                  <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="font-bold text-amber-300">Engineering Recommendation: {selectedCandidate.recommendedAction}</span>
                    <p className="text-slate-400 leading-relaxed text-[11px]">
                      Master Principle #3: Never delete files merely because their hashes match, nor merge merely because names are similar. Both files may be required by distinct module packaging or test configurations.
                    </p>
                  </div>
                </div>

                {/* Code Diff Comparison */}
                {fileA && fileB && (
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Side-by-Side Unified Token Diff
                    </h3>
                    <DiffViewer
                      oldText={fileA.content}
                      newText={fileB.content}
                      oldTitle={`File A (${fileA.name})`}
                      newTitle={`File B (${fileB.name})`}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
