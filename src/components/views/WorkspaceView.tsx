import React, { useState } from 'react';
import {
  Code2,
  FileCode,
  Search,
  Sparkles,
  Shield,
  Copy,
  Check,
  HardDrive,
  Hash,
  Layers,
  Download,
  AlertTriangle,
  CheckCircle2,
  Smartphone,
  Cpu,
  FileText,
  Activity,
  History,
} from 'lucide-react';
import { Project, ProjectFile } from '../../types';
import { Language, translations } from '../../i18n/translations';
import { formatBytes } from '../../utils/crypto';
import {
  exportInventoryCsv,
  generateFileInventory,
  generateSha256ChecksumManifest,
} from '../../engines/inventoryEngine';
import { runAndroidStaticAnalysis } from '../../engines/androidAnalyzer';
import { runRegressionAudit } from '../../engines/testAdapter';

interface WorkspaceViewProps {
  project: Project;
  lang: Language;
  onAskAiWithFile: (prompt: string, file: ProjectFile) => void;
  onUpdateFileContent?: (filePath: string, newContent: string) => void;
}

export const WorkspaceView: React.FC<WorkspaceViewProps> = ({
  project,
  lang,
  onAskAiWithFile,
  onUpdateFileContent,
}) => {
  const t = translations[lang];

  const [activeTab, setActiveTab] = useState<'editor' | 'inventory' | 'android' | 'regression'>('editor');
  const [selectedFilePath, setSelectedFilePath] = useState<string>(
    project.workingFiles[0]?.path || ''
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editBuffer, setEditBuffer] = useState('');

  // Inventory computation
  const inventory = generateFileInventory(project.workingFiles, project.baselineFiles);

  // Android static analysis
  const androidReport = runAndroidStaticAnalysis(project.workingFiles);

  // Regression analysis against baseline
  const regressionReport = runRegressionAudit(
    project.testRecords,
    project.testRecords,
    project.securityFindings,
    project.securityFindings,
    project.versions[0]?.versionId || 'v1.0.0-baseline',
    project.versions[project.versions.length - 1]?.versionId || 'current-working-copy'
  );

  const selectedFile = project.workingFiles.find((f) => f.path === selectedFilePath);

  const filteredFiles = project.workingFiles.filter(
    (f) =>
      f.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredInventory = inventory.filter(
    (item) =>
      item.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sha256.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectFile = (file: ProjectFile) => {
    setSelectedFilePath(file.path);
    setIsEditing(false);
    setEditBuffer(file.content);
  };

  const handleCopyCode = () => {
    if (!selectedFile) return;
    navigator.clipboard.writeText(selectedFile.content);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 1500);
  };

  const handleSaveEdit = () => {
    if (!selectedFile || !onUpdateFileContent) return;
    onUpdateFileContent(selectedFile.path, editBuffer);
    setIsEditing(false);
  };

  const handleDownloadShaManifest = () => {
    const manifest = generateSha256ChecksumManifest(project.workingFiles);
    const blob = new Blob([manifest], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${project.id}-sha256sum.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadInventoryCsv = () => {
    const csv = exportInventoryCsv(inventory);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${project.id}-file-inventory.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-[calc(100vh-8.5rem)] flex flex-col overflow-hidden border-t border-slate-800">
      {/* Sub-view switcher bar */}
      <div className="h-10 px-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('editor')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors ${
              activeTab === 'editor'
                ? 'bg-slate-800 text-amber-300 border-b-2 border-amber-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Code Editor &amp; Workspace</span>
          </button>

          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors ${
              activeTab === 'inventory'
                ? 'bg-slate-800 text-amber-300 border-b-2 border-amber-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Hash className="w-3.5 h-3.5" />
            <span>File Inventory &amp; SHA-256 Index</span>
            <span className="text-[10px] bg-slate-800 px-1.5 rounded-full font-mono text-cyan-300">
              {inventory.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('android')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors ${
              activeTab === 'android'
                ? 'bg-slate-800 text-amber-300 border-b-2 border-amber-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
            <span>Android Static Analysis &amp; Toolchain</span>
          </button>

          <button
            onClick={() => setActiveTab('regression')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors ${
              activeTab === 'regression'
                ? 'bg-slate-800 text-amber-300 border-b-2 border-amber-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5 text-purple-400" />
            <span>Regression Checks Against Baseline</span>
          </button>
        </div>

        {activeTab === 'inventory' && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadShaManifest}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors"
              title="Download sha256sum.txt manifest"
            >
              <Download className="w-3 h-3 text-cyan-400" />
              <span>sha256sum.txt</span>
            </button>
            <button
              onClick={handleDownloadInventoryCsv}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors"
              title="Export inventory as CSV"
            >
              <Download className="w-3 h-3 text-amber-400" />
              <span>CSV Index</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Tab Content */}
      {activeTab === 'editor' && (
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left File Explorer */}
          <div className="w-full md:w-64 lg:w-72 border-r border-slate-800 bg-slate-900/70 flex flex-col shrink-0">
            <div className="p-2.5 border-b border-slate-800">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Search files in workspace..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
                />
              </div>
            </div>

            {/* File List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40">
              {filteredFiles.map((file) => {
                const isSelected = file.path === selectedFilePath;
                return (
                  <button
                    key={file.path}
                    onClick={() => handleSelectFile(file)}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between text-xs transition-colors ${
                      isSelected
                        ? 'bg-amber-500/15 text-amber-300 border-l-2 border-amber-400 font-medium'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileCode className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-amber-400' : 'text-slate-500'}`} />
                      <span className="truncate font-mono text-[11px]">{file.path}</span>
                    </div>
                    <span className="text-[10px] text-slate-600 font-mono shrink-0 ml-1">
                      {formatBytes(file.size)}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Explorer Bottom Counter */}
            <div className="p-2 border-t border-slate-800 text-[10px] text-slate-500 font-mono flex justify-between bg-slate-950/40">
              <span>{project.workingFiles.length} files total</span>
              <span>{project.projectType}</span>
            </div>
          </div>

          {/* Center & Right Code Editor / Viewer */}
          <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
            {selectedFile ? (
              <>
                {/* File Header Bar */}
                <div className="h-10 px-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2 truncate text-xs font-mono">
                    <span className="text-slate-300 font-semibold">{selectedFile.name}</span>
                    <span className="text-slate-600">&bull;</span>
                    <span className="text-slate-500 truncate text-[11px]">{selectedFile.path}</span>
                    <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] text-amber-300">
                      {selectedFile.role}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyCode}
                      className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span className="hidden sm:inline">{isCopied ? 'Copied' : 'Copy'}</span>
                    </button>

                    {isEditing ? (
                      <button
                        onClick={handleSaveEdit}
                        className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-semibold"
                      >
                        Save Changes
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setIsEditing(true);
                          setEditBuffer(selectedFile.content);
                        }}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                      >
                        Edit Working Copy
                      </button>
                    )}
                  </div>
                </div>

                {/* AI Assistant Quick Actions for Selected File */}
                <div className="px-3 py-1.5 bg-slate-900/60 border-b border-slate-800/80 flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span className="text-slate-500 flex items-center gap-1 mr-1">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>AI Prompt:</span>
                  </span>
                  <button
                    onClick={() =>
                      onAskAiWithFile(
                        'Explain what this file does, its architecture role, and public API.',
                        selectedFile
                      )
                    }
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                  >
                    Explain Role
                  </button>
                  <button
                    onClick={() =>
                      onAskAiWithFile(
                        'Audit this file for bugs, memory leaks, and null safety issues.',
                        selectedFile
                      )
                    }
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                  >
                    Find Bugs
                  </button>
                  <button
                    onClick={() =>
                      onAskAiWithFile(
                        'Propose a safer, refactored implementation following Clean Architecture.',
                        selectedFile
                      )
                    }
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                  >
                    Suggest Safer Version
                  </button>
                  <button
                    onClick={() =>
                      onAskAiWithFile(
                        'Generate unit tests and regression assertions for this file.',
                        selectedFile
                      )
                    }
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                  >
                    Generate Tests
                  </button>
                </div>

                {/* Editor Content Area */}
                <div className="flex-1 overflow-auto flex">
                  {isEditing ? (
                    <textarea
                      value={editBuffer}
                      onChange={(e) => setEditBuffer(e.target.value)}
                      className="w-full h-full p-4 bg-slate-950 text-slate-200 font-mono text-xs resize-none focus:outline-none"
                      spellCheck={false}
                    />
                  ) : (
                    <div className="w-full flex font-mono text-xs select-text">
                      {/* Line Numbers */}
                      <div className="select-none py-3 px-2 bg-slate-950 text-slate-600 text-right w-12 border-r border-slate-800/40 text-[11px]">
                        {selectedFile.content.split('\n').map((_, idx) => (
                          <div key={idx}>{idx + 1}</div>
                        ))}
                      </div>

                      {/* Code Lines */}
                      <pre className="p-3 text-slate-200 flex-1 overflow-x-auto whitespace-pre font-mono text-[11px] leading-relaxed">
                        {selectedFile.content}
                      </pre>
                    </div>
                  )}
                </div>

                {/* File Metadata Footer */}
                <div className="h-6 px-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <div className="flex items-center gap-3">
                    <span>SHA-256: {selectedFile.sha256.slice(0, 16)}...</span>
                    <span>Size: {formatBytes(selectedFile.size)}</span>
                  </div>
                  <div>
                    <span>Lines: {selectedFile.content.split('\n').length}</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-500 text-xs">
                Select a file from the explorer on the left to inspect and edit.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: File Inventory & Cryptographic Hash Index (Item 5) */}
      {activeTab === 'inventory' && (
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4 bg-slate-950">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Hash className="w-4 h-4 text-cyan-400" />
                <span>Reliable File Inventory &amp; Cryptographic Hash Index</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Every entry indexed with cryptographic SHA-256 digest, line counts, module tags, and baseline mutation status.
              </p>
            </div>
            <span className="font-mono text-xs text-slate-400">
              {inventory.length} indexed files
            </span>
          </div>

          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950/80 text-slate-400 text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">File Path</th>
                    <th className="py-2.5 px-3">Role</th>
                    <th className="py-2.5 px-3">Lines</th>
                    <th className="py-2.5 px-3">Size</th>
                    <th className="py-2.5 px-3">Call Sites</th>
                    <th className="py-2.5 px-3">Baseline Mutation</th>
                    <th className="py-2.5 px-3">SHA-256 Digest</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300 text-[11px]">
                  {filteredInventory.map((item) => (
                    <tr key={item.path} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2 px-3 font-semibold text-slate-100">{item.path}</td>
                      <td className="py-2 px-3">
                        <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] text-amber-300">
                          {item.role}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-400">{item.linesCount}</td>
                      <td className="py-2 px-3 text-slate-400">{formatBytes(item.size)}</td>
                      <td className="py-2 px-3 text-slate-400">{item.callSitesCount} refs</td>
                      <td className="py-2 px-3">
                        <span
                          className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                            item.mutationStatus === 'UNMODIFIED'
                              ? 'bg-slate-800 text-slate-400'
                              : item.mutationStatus === 'MODIFIED'
                              ? 'bg-amber-950 text-amber-300'
                              : item.mutationStatus === 'ADDED'
                              ? 'bg-emerald-950 text-emerald-300'
                              : 'bg-rose-950 text-rose-300'
                          }`}
                        >
                          {item.mutationStatus}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-cyan-300" title={item.sha256}>
                        {item.sha256.slice(0, 16)}...
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Android Static Analysis & Toolchain (Item 17 & 18) */}
      {activeTab === 'android' && (
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-5 bg-slate-950">
          <div>
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <span>Android-Specific Static Analysis &amp; Toolchain Availability Matrix</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Pure static AST analysis without assuming the Android SDK or AAPT2 is installed. Explicitly identifies operations dependent on unavailable tools.
            </p>
          </div>

          {/* Android Metrics Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-slate-500 text-[10px] block font-mono">Application Package</span>
              <span className="font-mono text-cyan-300 font-bold mt-1 block truncate">
                {androidReport.packageName || 'Not declared'}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-slate-500 text-[10px] block font-mono">Target SDK Version</span>
              <span className="font-mono text-amber-300 font-bold mt-1 block">
                API {androidReport.targetSdkVersion || '34'}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-slate-500 text-[10px] block font-mono">Cleartext HTTP Policy</span>
              <span
                className={`font-mono font-bold mt-1 block ${
                  androidReport.usesCleartextTraffic ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {androidReport.usesCleartextTraffic ? 'Enabled (Vulnerable)' : 'Disabled (Secure)'}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-slate-500 text-[10px] block font-mono">Conformance Score</span>
              <span className="font-mono text-emerald-400 font-bold mt-1 block">
                {androidReport.conformanceScore} / 100
              </span>
            </div>
          </div>

          {/* Toolchain Availability Matrix (Section 18) */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Toolchain Dependency &amp; Runtime Availability Matrix
            </h3>
            <div className="space-y-2">
              {androidReport.toolchainStatus.map((t, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs"
                >
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-200">{t.tool}</span>
                    <p className="text-[11px] text-slate-400">{t.reason}</p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase shrink-0 ${
                      t.executionMode === 'IN_SANDBOX_STATIC'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : t.executionMode === 'SIMULATED'
                        ? 'bg-amber-950 text-amber-300 border border-amber-800'
                        : 'bg-rose-950 text-rose-300 border border-rose-800'
                    }`}
                  >
                    {t.executionMode}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Compliance Violations List */}
          {androidReport.complianceViolations.length > 0 && (
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <h3 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                <span>Detected Android Specifications Violations ({androidReport.complianceViolations.length})</span>
              </h3>
              <ul className="list-disc list-inside space-y-1 text-xs text-slate-300">
                {androidReport.complianceViolations.map((v, i) => (
                  <li key={i}>{v}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Regression Baseline Checks (Item 15) */}
      {activeTab === 'regression' && (
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-5 bg-slate-950">
          <div>
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <History className="w-4 h-4 text-purple-400" />
              <span>Automated Regression Checks Against Immutable Baseline</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Continuously verifies that code repairs or feature integrations have not broken previously passing tests or introduced new vulnerabilities.
            </p>
          </div>

          <div
            className={`p-4 rounded-xl border flex items-center gap-3 text-xs ${
              regressionReport.hasRegressions
                ? 'bg-rose-950/40 border-rose-800 text-rose-300'
                : 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
            }`}
          >
            {regressionReport.hasRegressions ? (
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            )}
            <div className="space-y-0.5">
              <span className="font-bold text-sm block">
                {regressionReport.hasRegressions ? 'Regressions Detected' : 'Baseline Regression Clean'}
              </span>
              <p className="text-[11px] leading-relaxed">{regressionReport.summary}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Resolved Issues */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <h3 className="font-bold text-emerald-400 uppercase tracking-wider text-[11px]">
                Resolved Vulnerabilities &amp; Regressions ({regressionReport.resolvedIssues.length})
              </h3>
              {regressionReport.resolvedIssues.length === 0 ? (
                <p className="text-slate-500 italic text-[11px]">No resolved issues compared to baseline.</p>
              ) : (
                <ul className="list-disc list-inside space-y-1 text-slate-300 font-mono text-[11px]">
                  {regressionReport.resolvedIssues.map((issue, i) => (
                    <li key={i}>{issue}</li>
                  ))}
                </ul>
              )}
            </div>

            {/* Regressed Test Suites */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <h3 className="font-bold text-rose-400 uppercase tracking-wider text-[11px]">
                Regressed Test Suites ({regressionReport.regressedTests.length})
              </h3>
              {regressionReport.regressedTests.length === 0 ? (
                <p className="text-emerald-400/80 italic text-[11px]">Zero test suites regressed from baseline PASS state.</p>
              ) : (
                <div className="space-y-1.5 font-mono text-[11px]">
                  {regressionReport.regressedTests.map((reg, i) => (
                    <div key={i} className="p-2 rounded bg-rose-950/30 border border-rose-900/60">
                      <span className="font-bold text-slate-200">{reg.suiteName}</span>
                      <div className="text-[10px] text-rose-400">
                        Previous: {reg.previousStatus} &rarr; Current: {reg.currentStatus}
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
  );
};
