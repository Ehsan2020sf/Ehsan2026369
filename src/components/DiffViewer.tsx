import React from 'react';
import * as Diff from 'diff';

interface DiffViewerProps {
  oldText: string;
  newText: string;
  oldTitle?: string;
  newTitle?: string;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({
  oldText,
  newText,
  oldTitle = 'Original Content',
  newTitle = 'Proposed Content',
}) => {
  const diff = Diff.diffLines(oldText, newText);

  return (
    <div className="border border-slate-800 rounded-lg overflow-hidden font-mono text-xs bg-slate-950">
      <div className="flex items-center justify-between px-3 py-2 bg-slate-900 border-b border-slate-800 text-slate-400">
        <span className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block"></span>
          <span>{oldTitle}</span>
        </span>
        <span className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block"></span>
          <span>{newTitle}</span>
        </span>
      </div>

      <div className="max-h-80 overflow-y-auto p-2 divide-y divide-slate-900">
        {diff.map((part, index) => {
          const colorClass = part.added
            ? 'bg-emerald-950/40 text-emerald-300 border-l-2 border-emerald-500 pl-2'
            : part.removed
            ? 'bg-rose-950/40 text-rose-300 border-l-2 border-rose-500 line-through pl-2'
            : 'text-slate-400 pl-2.5 opacity-80';

          const prefix = part.added ? '+' : part.removed ? '-' : ' ';

          return (
            <div key={index} className={`py-0.5 whitespace-pre-wrap font-mono ${colorClass}`}>
              {part.value.split('\n').filter((l, idx, arr) => idx < arr.length - 1 || l.length > 0).map((line, lIdx) => (
                <div key={lIdx} className="flex">
                  <span className="w-4 select-none opacity-40">{prefix}</span>
                  <span className="flex-1">{line || ' '}</span>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};
