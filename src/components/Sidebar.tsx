import React from 'react';
import {
  LayoutDashboard,
  FolderGit2,
  FileArchive,
  Network,
  Code2,
  Sparkles,
  Wrench,
  CopySlash,
  ShieldAlert,
  FlaskConical,
  GitMerge,
  Hammer,
  History,
  Bot,
  SearchCode,
  FileText,
  Sliders,
  X,
} from 'lucide-react';
import { Project } from '../types';
import { Language, translations } from '../i18n/translations';

export type ViewType =
  | 'dashboard'
  | 'projects'
  | 'zip_import'
  | 'architecture'
  | 'workspace'
  | 'ai_assistant'
  | 'repair'
  | 'duplicates'
  | 'security'
  | 'tests'
  | 'integration'
  | 'build'
  | 'versions'
  | 'agents'
  | 'research'
  | 'reports'
  | 'settings';

interface SidebarProps {
  currentView: ViewType;
  onSelectView: (view: ViewType) => void;
  project: Project;
  lang: Language;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  project,
  lang,
  isOpenMobile,
  onCloseMobile,
}) => {
  const t = translations[lang];

  const navGroups: {
    titleEn: string;
    titleFa: string;
    items: {
      id: ViewType;
      labelKey: keyof typeof t;
      icon: React.ElementType;
      badge?: number | string;
      badgeColor?: string;
    }[];
  }[] = [
    {
      titleEn: 'COMMAND & CONTROL',
      titleFa: 'مرکز فرماندهی',
      items: [
        { id: 'dashboard', labelKey: 'nav_dashboard', icon: LayoutDashboard },
        { id: 'projects', labelKey: 'nav_projects', icon: FolderGit2, badge: 1 },
        {
          id: 'zip_import',
          labelKey: 'nav_zip_import',
          icon: FileArchive,
          badge: project.originalArchiveAudit?.valid ? '✓' : undefined,
          badgeColor: 'bg-emerald-500/20 text-emerald-300',
        },
      ],
    },
    {
      titleEn: 'STUDIO & AI BRAIN',
      titleFa: 'استودیو و هوش مصنوعی',
      items: [
        { id: 'workspace', labelKey: 'nav_workspace', icon: Code2, badge: project.workingFiles.length },
        { id: 'ai_assistant', labelKey: 'nav_ai_assistant', icon: Sparkles },
        { id: 'architecture', labelKey: 'nav_architecture', icon: Network },
      ],
    },
    {
      titleEn: 'ANALYSIS & HARDENING',
      titleFa: 'تحلیل، امنیت و بازسازی',
      items: [
        {
          id: 'security',
          labelKey: 'nav_security',
          icon: ShieldAlert,
          badge: project.securityFindings.length || undefined,
          badgeColor: 'bg-rose-500/20 text-rose-300 font-bold',
        },
        {
          id: 'duplicates',
          labelKey: 'nav_duplicates',
          icon: CopySlash,
          badge: project.duplicates.length || undefined,
          badgeColor: 'bg-amber-500/20 text-amber-300',
        },
        { id: 'repair', labelKey: 'nav_repair', icon: Wrench },
        { id: 'integration', labelKey: 'nav_integration', icon: GitMerge },
      ],
    },
    {
      titleEn: 'LABORATORY & RELEASE',
      titleFa: 'آزمایشگاه و کامپایل',
      items: [
        {
          id: 'tests',
          labelKey: 'nav_tests',
          icon: FlaskConical,
          badge: project.testRecords.length > 0 ? `${project.testRecords.filter((t) => t.status === 'PASS').length}/${project.testRecords.length}` : undefined,
        },
        { id: 'build', labelKey: 'nav_build', icon: Hammer },
        { id: 'versions', labelKey: 'nav_versions', icon: History, badge: project.versions.length },
      ],
    },
    {
      titleEn: 'INTELLIGENCE & AUDIT',
      titleFa: 'اطلاعات، عامل‌ها و گزارش‌ها',
      items: [
        { id: 'agents', labelKey: 'nav_agents', icon: Bot, badge: 16 },
        { id: 'research', labelKey: 'nav_research', icon: SearchCode },
        { id: 'reports', labelKey: 'nav_reports', icon: FileText },
        { id: 'settings', labelKey: 'nav_settings', icon: Sliders },
      ],
    },
  ];

  const handleItemClick = (id: ViewType) => {
    onSelectView(id);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:static top-0 bottom-0 z-50 w-64 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-200 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Mobile Header */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-slate-800 lg:hidden">
          <span className="font-bold text-sm text-slate-100 font-mono">NOVIN FORGE AI</span>
          <button
            onClick={onCloseMobile}
            className="p-1.5 text-slate-400 hover:text-white rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
          {navGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              <h3 className="px-2 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                {lang === 'fa' ? group.titleFa : group.titleEn}
              </h3>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentView === item.id;
                  const label = t[item.labelKey] as string;

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleItemClick(item.id)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                        <span className="truncate">{label}</span>
                      </span>

                      {item.badge !== undefined && (
                        <span
                          className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                            item.badgeColor || 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Integrity Status Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40 text-[11px] text-slate-400 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Security Core:</span>
            <span className="text-emerald-400 font-mono font-semibold">Active &bull; Sandbox</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">G0-G25 Gates:</span>
            <span className="text-amber-300 font-mono font-semibold">24/25 Monitored</span>
          </div>
        </div>
      </aside>
    </>
  );
};
