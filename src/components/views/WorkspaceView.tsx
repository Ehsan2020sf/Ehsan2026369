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
  ChevronRight,
  Folder,
} from 'lucide-react';
import { Project, ProjectFile } from '../../types';
import { Language, translations } from '../../i18n/translations';
import { formatBytes } from '../../utils/crypto';

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

  const [selectedFilePath, setSelectedFilePath] = useState<string>(
    project.workingFiles[0]?.path || ''
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editBuffer, setEditBuffer] = useState('');

  const selectedFile = project.workingFiles.find((f) => f.path === selectedFilePath);

  const filteredFiles = project.workingFiles.filter(
    (f) =>
      f.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.name.toLowerCase().includes(searchTerm.toLowerCase())
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

  return (
    <div className="h-[calc(100vh-8.5rem)] flex flex-col md:flex-row overflow-hidden border-t border-slate-800">
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
                  isSelected ? 'bg-amber-500/15 text-amber-300 border-l-2 border-amber-400 font-medium' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
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
                onClick={() => onAskAiWithFile('Explain what this file does, its architecture role, and public API.', selectedFile)}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              >
                Explain Role
              </button>
              <button
                onClick={() => onAskAiWithFile('Audit this file for bugs, memory leaks, and null safety issues.', selectedFile)}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              >
                Find Bugs
              </button>
              <button
                onClick={() => onAskAiWithFile('Propose a safer, refactored implementation following Clean Architecture.', selectedFile)}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              >
                Suggest Safer Version
              </button>
              <button
                onClick={() => onAskAiWithFile('Generate unit tests and regression assertions for this file.', selectedFile)}
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
  );
};
