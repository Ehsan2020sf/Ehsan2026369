import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileArchive,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HardDrive,
  Cpu,
  Layers,
  ArrowRight,
  Sliders,
} from 'lucide-react';
import { ArchiveAudit, ProjectFile } from '../../types';
import { DEFAULT_ZIP_LIMITS, processZipArchive, ZipProcessingLimits } from '../../engines/zipEngine';
import { identifyProject } from '../../engines/projectIdentifier';
import { formatBytes } from '../../utils/crypto';
import { Language, translations } from '../../i18n/translations';

interface ZipImportViewProps {
  onImportComplete: (files: ProjectFile[], audit: ArchiveAudit, projectName: string) => void;
  lang: Language;
  onLoadMonolithArchive?: () => void;
}

export const ZipImportView: React.FC<ZipImportViewProps> = ({
  onImportComplete,
  lang,
  onLoadMonolithArchive,
}) => {
  const t = translations[lang];
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [auditResult, setAuditResult] = useState<ArchiveAudit | null>(null);
  const [extractedFiles, setExtractedFiles] = useState<ProjectFile[]>([]);
  const [limits, setLimits] = useState<ZipProcessingLimits>(DEFAULT_ZIP_LIMITS);
  const [showLimitsConfig, setShowLimitsConfig] = useState(false);

  const handleFile = async (file: File) => {
    setIsProcessing(true);
    setProgress(15);

    try {
      const buffer = await file.arrayBuffer();
      setProgress(50);

      const result = await processZipArchive(buffer, file.name, limits);
      setProgress(90);

      setAuditResult(result.audit);
      setExtractedFiles(result.files);
      setProgress(100);
    } catch (err: any) {
      setAuditResult({
        valid: false,
        originalFilename: file.name,
        archiveSize: file.size,
        sha256: 'ERROR',
        totalEntries: 0,
        validEntriesCount: 0,
        rejectedEntriesCount: 0,
        rejectedEntries: [],
        totalUncompressedSize: 0,
        compressionRatio: 0,
        warnings: [],
        errors: [`Processing failed: ${err.message || String(err)}`],
        quarantined: true,
        quarantineReason: 'Fatal exception during extraction pipeline',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleApproveProject = () => {
    if (!auditResult || extractedFiles.length === 0) return;
    const baseName = auditResult.originalFilename.replace(/\.zip$/i, '');
    onImportComplete(extractedFiles, auditResult, baseName || 'Imported Workspace');
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-5xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <FileArchive className="w-5 h-5 text-amber-400" />
            <span>{t.nav_zip_import}</span>
          </h1>
          <p className="text-xs text-slate-400">
            Defense-in-depth intake engine: validates signatures, enforces ZIP bomb limits, blocks path traversal, and produces cryptographic source audit reports.
          </p>
        </div>

        <button
          onClick={() => setShowLimitsConfig(!showLimitsConfig)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
        >
          <Sliders className="w-3.5 h-3.5 text-amber-400" />
          <span>Configure Intake Limits</span>
        </button>
      </div>

      {/* Configurable Limits Drawer */}
      {showLimitsConfig && (
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="text-slate-400 block mb-1">Max Compressed Size (MB)</label>
            <input
              type="number"
              value={limits.maxCompressedSizeBytes / 1024 / 1024}
              onChange={(e) =>
                setLimits({ ...limits, maxCompressedSizeBytes: Math.max(1, Number(e.target.value)) * 1024 * 1024 })
              }
              className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 font-mono text-xs"
            />
          </div>
          <div>
            <label className="text-slate-400 block mb-1">Max Total Extracted Size (MB)</label>
            <input
              type="number"
              value={limits.maxUncompressedSizeBytes / 1024 / 1024}
              onChange={(e) =>
                setLimits({ ...limits, maxUncompressedSizeBytes: Math.max(1, Number(e.target.value)) * 1024 * 1024 })
              }
              className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 font-mono text-xs"
            />
          </div>
          <div>
            <label className="text-slate-400 block mb-1">Max Entries Limit</label>
            <input
              type="number"
              value={limits.maxEntriesCount}
              onChange={(e) => setLimits({ ...limits, maxEntriesCount: Math.max(10, Number(e.target.value)) })}
              className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 font-mono text-xs"
            />
          </div>
        </div>
      )}

      {/* Pre-Verified Intake Banner for Uploaded NOVIN NEXUS Monolith */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-slate-900 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              TARGET REPOSITORY VERIFIED
            </span>
            <span className="text-xs text-slate-400 font-mono">SHA-256: a9a99c66d1...018a</span>
          </div>
          <h3 className="text-sm font-bold text-slate-100">
            NOVIN_NEXUS_FULL_REPAIRED_INTEGRATED_20261021_a9a99c66.zip
          </h3>
          <p className="text-xs text-slate-400">
            38.08 MB • 12,442 entries • Android Capacitor SDK 36 (Java 21), React / Node Backend, AI Orchestration
          </p>
        </div>
        {onLoadMonolithArchive && (
          <button
            onClick={onLoadMonolithArchive}
            className="whitespace-nowrap px-4 py-2 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors shadow-sm shadow-amber-500/20 flex items-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Load & Ingest Monolith</span>
          </button>
        )}
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 lg:p-12 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-amber-400 bg-amber-500/10'
            : 'border-slate-800 hover:border-slate-700 bg-slate-900/50 hover:bg-slate-900'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".zip,application/zip"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFile(e.target.files[0]);
            }
          }}
        />

        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <UploadCloud className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-200">{t.dragDropText}</h3>
            <p className="text-xs text-slate-500 mt-1">
              Supports standard ZIP archives up to {limits.maxCompressedSizeBytes / 1024 / 1024}MB. Path traversal checks &amp; anti-bomb limits active.
            </p>
          </div>
        </div>

        {isProcessing && (
          <div className="mt-6 max-w-xs mx-auto space-y-2">
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-amber-400 h-full transition-all duration-300 rounded-full"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">Parsing archive &amp; verifying checksums... {progress}%</p>
          </div>
        )}
      </div>

      {/* Audit & Intake Report */}
      {auditResult && (
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              {auditResult.valid ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <XCircle className="w-5 h-5 text-rose-400" />
              )}
              <div>
                <h2 className="text-sm font-bold text-slate-200">
                  {auditResult.valid ? 'Archive Validated & Safe' : 'Archive Validation Failed / Quarantined'}
                </h2>
                <p className="text-[11px] text-slate-400">
                  {auditResult.originalFilename} &bull; {formatBytes(auditResult.archiveSize)}
                </p>
              </div>
            </div>

            {auditResult.valid && extractedFiles.length > 0 && (
              <button
                onClick={handleApproveProject}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors shadow-sm shadow-emerald-500/20"
              >
                <span>Approve &amp; Open Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Audit Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-2.5 rounded bg-slate-950 border border-slate-800/80">
              <div className="text-slate-500 text-[10px]">Cryptographic SHA-256</div>
              <div className="font-mono text-emerald-400 truncate mt-0.5" title={auditResult.sha256}>
                {auditResult.sha256.slice(0, 14)}...
              </div>
            </div>
            <div className="p-2.5 rounded bg-slate-950 border border-slate-800/80">
              <div className="text-slate-500 text-[10px]">Extracted Files Count</div>
              <div className="font-mono text-slate-200 font-bold mt-0.5">
                {auditResult.validEntriesCount} / {auditResult.totalEntries}
              </div>
            </div>
            <div className="p-2.5 rounded bg-slate-950 border border-slate-800/80">
              <div className="text-slate-500 text-[10px]">Uncompressed Size</div>
              <div className="font-mono text-cyan-300 font-bold mt-0.5">
                {formatBytes(auditResult.totalUncompressedSize)}
              </div>
            </div>
            <div className="p-2.5 rounded bg-slate-950 border border-slate-800/80">
              <div className="text-slate-500 text-[10px]">Compression Ratio</div>
              <div className="font-mono text-amber-300 font-bold mt-0.5">
                {auditResult.compressionRatio}x
              </div>
            </div>
          </div>

          {/* Path Traversal & Quarantine Warnings */}
          {auditResult.quarantined && (
            <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800 text-xs text-rose-300 flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Security Quarantine: </span>
                <span>{auditResult.quarantineReason}</span>
              </div>
            </div>
          )}

          {auditResult.rejectedEntries.length > 0 && (
            <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-800 text-xs text-amber-300 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Rejected Archive Entries ({auditResult.rejectedEntries.length})</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] font-mono">
                {auditResult.rejectedEntries.map((r, i) => (
                  <li key={i} className="truncate">
                    <span className="text-slate-200">{r.path}</span> &mdash; <span className="text-amber-400">{r.reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Detected Project Profile */}
          {extractedFiles.length > 0 && (
            <div className="space-y-2 pt-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Automated Project Identification Profile
              </h3>
              {(() => {
                const profile = identifyProject(extractedFiles);
                return (
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-slate-500 text-[10px] block">Project Type</span>
                      <span className="font-mono text-amber-300 font-semibold">{profile.projectType}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">Build System</span>
                      <span className="font-mono text-slate-200">{profile.buildSystem}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">Frameworks</span>
                      <span className="font-mono text-cyan-300">{profile.detectedFrameworks.join(', ') || 'Native'}</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
