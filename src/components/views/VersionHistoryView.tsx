import React, { useState } from 'react';
import {
  History,
  GitCommit,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  User,
  ArrowRight,
  HardDrive,
  FileCode,
} from 'lucide-react';
import { Project, ProjectVersion } from '../../types';
import { Language, translations } from '../../i18n/translations';

interface VersionHistoryViewProps {
  project: Project;
  lang: Language;
  onRollbackToVersion: (version: ProjectVersion) => void;
}

export const VersionHistoryView: React.FC<VersionHistoryViewProps> = ({
  project,
  lang,
  onRollbackToVersion,
}) => {
  const t = translations[lang];

  const [selectedVersionId, setSelectedVersionId] = useState<string>(
    project.versions[project.versions.length - 1]?.versionId || ''
  );
  const [rollbackSuccess, setRollbackSuccess] = useState<string | null>(null);

  const selectedVersion =
    project.versions.find((v) => v.versionId === selectedVersionId) ||
    project.versions[project.versions.length - 1];

  const handleRollback = () => {
    if (!selectedVersion) return;
    if (confirm(`Execute transactional rollback to version ${selectedVersion.versionId}?`)) {
      onRollbackToVersion(selectedVersion);
      setRollbackSuccess(`Successfully rolled back working copy state to ${selectedVersion.versionId}.`);
      setTimeout(() => setRollbackSuccess(null), 4000);
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <History className="w-5 h-5 text-amber-400" />
            <span>{t.nav_versions}</span>
          </h1>
          <p className="text-xs text-slate-400">
            Immutable snapshot baseline and transactional change journal. Every approved repair and integration is permanently logged with cryptographic rollback hashes.
          </p>
        </div>

        <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
          {project.versions.length} Version Snapshots Logged
        </span>
      </div>

      {rollbackSuccess && (
        <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800 text-xs text-emerald-300 flex items-center gap-2 shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{rollbackSuccess}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Version List on Left */}
        <div className="space-y-2">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Version Timeline ({project.versions.length})
          </h2>

          <div className="space-y-2">
            {project.versions.map((ver, idx) => {
              const isSelected = ver.versionId === selectedVersion?.versionId;
              const isBaseline = idx === 0;

              return (
                <div
                  key={ver.versionId}
                  onClick={() => setSelectedVersionId(ver.versionId)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-slate-900 border-amber-400 ring-1 ring-amber-400'
                      : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-100 flex items-center gap-1.5">
                      <GitCommit className="w-3.5 h-3.5 text-amber-400" />
                      <span>{ver.versionId}</span>
                    </span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                        isBaseline ? 'bg-cyan-950 text-cyan-300' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {isBaseline ? 'BASELINE' : 'REVISION'}
                    </span>
                  </div>

                  <p className="mt-1.5 text-xs text-slate-300 line-clamp-1">{ver.description}</p>

                  <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 font-mono border-t border-slate-800 pt-1.5">
                    <span>{ver.timestamp.slice(0, 10)}</span>
                    <span>{ver.changeRecords.length} Changes</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Version Inspector on Right */}
        {selectedVersion && (
          <div className="lg:col-span-2 space-y-4">
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4 text-xs">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] font-mono text-cyan-400 block uppercase">
                    Version Snapshot Details
                  </span>
                  <h2 className="text-base font-bold text-slate-100">{selectedVersion.versionId}</h2>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    Source Digest: {selectedVersion.sourceHash.slice(0, 24)}...
                  </p>
                </div>

                <button
                  onClick={handleRollback}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Rollback Workspace To This Version</span>
                </button>
              </div>

              {/* Version Metadata */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">Created Date</span>
                  <span className="font-mono text-slate-200">{selectedVersion.timestamp.slice(0, 19).replace('T', ' ')}</span>
                </div>
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">Approved By</span>
                  <span className="font-mono text-slate-200">{selectedVersion.approvedBy || 'System Architect'}</span>
                </div>
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">Snapshot Files</span>
                  <span className="font-mono text-cyan-300">{selectedVersion.filesSnapshotCount} entries</span>
                </div>
              </div>

              {/* Transactional Change Journal */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Transactional Change Records ({selectedVersion.changeRecords.length})
                </h3>

                {selectedVersion.changeRecords.length === 0 ? (
                  <div className="p-3 rounded bg-slate-950 border border-slate-800 text-slate-500 italic text-[11px]">
                    Original baseline snapshot. No preceding mutations recorded.
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-64 overflow-y-auto font-mono text-[11px]">
                    {selectedVersion.changeRecords.map((chg) => (
                      <div
                        key={chg.id}
                        className="p-2.5 rounded bg-slate-950 border border-slate-800 flex flex-col gap-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-200">{chg.filePath}</span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                              chg.action === 'ADD'
                                ? 'bg-emerald-950 text-emerald-300'
                                : 'bg-amber-950 text-amber-300'
                            }`}
                          >
                            {chg.action}
                          </span>
                        </div>
                        <p className="text-slate-400 font-sans text-xs">{chg.reason}</p>
                        <div className="flex justify-between text-[10px] text-slate-600">
                          <span>Author: {chg.author}</span>
                          {chg.rollbackSha && <span>Rollback Digest: {chg.rollbackSha.slice(0, 10)}...</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
