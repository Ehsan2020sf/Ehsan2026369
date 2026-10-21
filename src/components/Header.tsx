import React from 'react';
import { ShieldCheck, Cpu, Download, Play, Terminal, Globe, Menu, Sparkles, FolderArchive } from 'lucide-react';
import { Project } from '../types';
import { Language, translations } from '../i18n/translations';

interface HeaderProps {
  project: Project;
  lang: Language;
  onToggleLang: () => void;
  onRunSecurity: () => void;
  onRunTests: () => void;
  onExportZip: () => void;
  onToggleMobileMenu: () => void;
  onOpenAi: () => void;
  isProcessing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  project,
  lang,
  onToggleLang,
  onRunSecurity,
  onRunTests,
  onExportZip,
  onToggleMobileMenu,
  onOpenAi,
  isProcessing,
}) => {
  const t = translations[lang];
  const latestVersion = project.versions[project.versions.length - 1];

  return (
    <header className="h-14 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-3 lg:px-4 flex items-center justify-between z-30 sticky top-0">
      {/* Brand & Project Info */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-md"
          title="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950 font-bold">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm tracking-wide text-slate-100 font-mono">NOVIN FORGE</span>
              <span className="px-1.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded">
                AI WORKBENCH
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block truncate max-w-[200px] md:max-w-[340px]">
              {project.name} &bull; <span className="font-mono text-slate-300">{project.projectType}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Center Status Indicators */}
      <div className="hidden xl:flex items-center gap-2">
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-950/70 border border-slate-800 text-xs">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-slate-400">{t.immutableSnapshot}:</span>
          <span className="font-mono text-[11px] text-emerald-400 font-semibold" title={project.originalArchiveAudit?.sha256 || 'Baseline'}>
            {project.originalArchiveAudit?.sha256 ? `${project.originalArchiveAudit.sha256.slice(0, 8)}...` : 'Verified'}
          </span>
        </div>

        <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-950/70 border border-slate-800 text-xs">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
          <span className="text-slate-400">Version:</span>
          <span className="font-mono text-[11px] text-cyan-300 font-semibold">
            {latestVersion ? latestVersion.versionId : 'v1.0.0-baseline'}
          </span>
        </div>

        {project.securityFindings.length > 0 && (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-rose-950/40 border border-rose-800/40 text-xs text-rose-300">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            <span>{project.securityFindings.length} Flaws Detected</span>
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Language switch */}
        <button
          onClick={onToggleLang}
          className="flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 transition-colors border border-slate-700"
          title="Switch Language / تغییر زبان"
        >
          <Globe className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-xs">{t.languageToggle}</span>
        </button>

        {/* AI Brain quick button */}
        <button
          onClick={onOpenAi}
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 hover:brightness-110 shadow-sm shadow-amber-500/20 transition-all font-semibold"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{t.askAi}</span>
        </button>

        {/* Run Audit */}
        <button
          onClick={onRunSecurity}
          disabled={isProcessing}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          title="Run Security Audit"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
          <span className="hidden sm:inline">Audit</span>
        </button>

        {/* Run Tests */}
        <button
          onClick={onRunTests}
          disabled={isProcessing}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          title="Run Verification Suites"
        >
          <Play className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">Test</span>
        </button>

        {/* Export ZIP */}
        <button
          onClick={onExportZip}
          disabled={isProcessing}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          title="Export current workspace as ZIP"
        >
          <Download className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">Export</span>
        </button>
      </div>
    </header>
  );
};
