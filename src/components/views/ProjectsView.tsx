import React, { useState } from 'react';
import {
  FolderGit2,
  Plus,
  Download,
  Trash2,
  HardDrive,
  Calendar,
  Layers,
  Cpu,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { Project } from '../../types';
import { Language, translations } from '../../i18n/translations';
import { formatBytes } from '../../utils/crypto';

interface ProjectsViewProps {
  currentProject: Project;
  allProjects: Project[];
  lang: Language;
  onSelectProject: (p: Project) => void;
  onExportZip: () => void;
  onLoadNovinSample: () => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  currentProject,
  allProjects,
  lang,
  onSelectProject,
  onExportZip,
  onLoadNovinSample,
}) => {
  const t = translations[lang];

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <FolderGit2 className="w-5 h-5 text-amber-400" />
            <span>{t.nav_projects}</span>
          </h1>
          <p className="text-xs text-slate-400">
            Persistent project workspace repository. Manages distinct project baselines, versions, and isolated execution scopes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onLoadNovinSample}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            <Cpu className="w-3.5 h-3.5 text-amber-400" />
            <span>Reload NOVIN Sample</span>
          </button>
          <button
            onClick={onExportZip}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors shadow-sm shadow-amber-500/20"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Active Workspace (.ZIP)</span>
          </button>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {allProjects.map((p) => {
          const isActive = p.id === currentProject.id;
          const totalSize = p.workingFiles.reduce((acc, f) => acc + f.size, 0);

          return (
            <div
              key={p.id}
              onClick={() => onSelectProject(p)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                isActive
                  ? 'bg-slate-900 border-amber-400 ring-1 ring-amber-400 shadow-lg'
                  : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-amber-300">
                    {p.id}
                  </span>
                  <h3 className="font-bold text-sm text-slate-100 mt-1">{p.name}</h3>
                </div>

                {isActive && (
                  <span className="flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                    <Check className="w-3 h-3" />
                    <span>ACTIVE</span>
                  </span>
                )}
              </div>

              <p className="mt-2 text-xs text-slate-400 line-clamp-2 leading-relaxed">
                {p.description}
              </p>

              <div className="mt-4 pt-3 border-t border-slate-800 grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-400">
                <div>
                  <span className="text-slate-500 block">TYPE:</span>
                  <span className="text-cyan-300 truncate block">{p.projectType}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">WORKSPACE:</span>
                  <span>{p.workingFiles.length} files ({formatBytes(totalSize)})</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
