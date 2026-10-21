import React, { useState } from 'react';
import {
  FileText,
  Download,
  Copy,
  Check,
  Layers,
  ShieldCheck,
  Code2,
  HardDrive,
} from 'lucide-react';
import { Project } from '../../types';
import { Language, translations } from '../../i18n/translations';
import {
  generateEvidenceReportMarkdown,
  generateEvidenceReportJson,
} from '../../engines/reportingEngine';

export const ReportsView: React.FC<{ project: Project; lang: Language }> = ({ project, lang }) => {
  const t = translations[lang];

  const [activeFormat, setActiveFormat] = useState<'markdown' | 'json'>('markdown');
  const [isCopied, setIsCopied] = useState(false);

  const markdownContent = generateEvidenceReportMarkdown(project);
  const jsonContent = generateEvidenceReportJson(project);

  const currentContent = activeFormat === 'markdown' ? markdownContent : jsonContent;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentContent);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 1500);
  };

  const handleDownload = () => {
    const filename = `${project.id}-evidence-report.${activeFormat === 'markdown' ? 'md' : 'json'}`;
    const blob = new Blob([currentContent], {
      type: activeFormat === 'markdown' ? 'text/markdown;charset=utf-8' : 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-400" />
            <span>{t.nav_reports}</span>
          </h1>
          <p className="text-xs text-slate-400">
            Professional evidence-backed engineering report covering Sections A through K. Generated from real operational audit records, tests, and cryptographic hashes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Format Toggle */}
          <div className="flex rounded-lg bg-slate-900 border border-slate-800 p-0.5 text-xs font-mono">
            <button
              onClick={() => setActiveFormat('markdown')}
              className={`px-3 py-1 rounded-md transition-colors ${
                activeFormat === 'markdown' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Markdown (.md)
            </button>
            <button
              onClick={() => setActiveFormat('json')}
              className={`px-3 py-1 rounded-md transition-colors ${
                activeFormat === 'json' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              JSON (.json)
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{isCopied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors shadow-sm shadow-amber-500/20"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>
        </div>
      </div>

      {/* Report Preview */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
          <span className="font-mono text-slate-400">
            Document: {project.id}-report.{activeFormat === 'markdown' ? 'md' : 'json'}
          </span>
          <span className="text-slate-500 font-mono text-[11px]">
            {currentContent.split('\n').length} Lines &bull; {currentContent.length} Bytes
          </span>
        </div>

        <pre className="p-4 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-slate-200 whitespace-pre-wrap max-h-[600px] overflow-y-auto leading-relaxed selection:bg-amber-500/30">
          {currentContent}
        </pre>
      </div>
    </div>
  );
};
