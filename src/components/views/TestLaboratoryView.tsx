import React, { useState } from 'react';
import {
  FlaskConical,
  Play,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Terminal,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import { Project, TestExecutionRecord } from '../../types';
import { Language, translations } from '../../i18n/translations';
import {
  runArchiveIntegrityTests,
  runManifestContractTests,
  runStaticCodeAnalysis,
} from '../../engines/testEngine';

interface TestLaboratoryViewProps {
  project: Project;
  lang: Language;
  onUpdateTestRecords: (records: TestExecutionRecord[]) => void;
}

export const TestLaboratoryView: React.FC<TestLaboratoryViewProps> = ({
  project,
  lang,
  onUpdateTestRecords,
}) => {
  const t = translations[lang];

  const [isRunning, setIsRunning] = useState(false);
  const [selectedRecordId, setSelectedRecordId] = useState<string>(
    project.testRecords[0]?.id || ''
  );

  const testRecords = project.testRecords;
  const activeRecord = testRecords.find((r) => r.id === selectedRecordId) || testRecords[0];

  const handleRunAllSuites = async () => {
    setIsRunning(true);

    try {
      // Simulate real execution delay
      await new Promise((res) => setTimeout(res, 350));

      const r1 = runArchiveIntegrityTests(project.workingFiles);
      const r2 = runManifestContractTests(project.manifestData);
      const r3 = runStaticCodeAnalysis(project.workingFiles);

      const allRecords = [r1, r2, r3];
      onUpdateTestRecords(allRecords);
      setSelectedRecordId(r1.id);
    } finally {
      setIsRunning(false);
    }
  };

  const totalPassed = testRecords.reduce((acc, r) => acc + r.passedCount, 0);
  const totalFailed = testRecords.reduce((acc, r) => acc + r.failedCount, 0);

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-emerald-400" />
            <span>{t.nav_tests}</span>
          </h1>
          <p className="text-xs text-slate-400">
            Real test execution and evidence collection engine: workspace archive integrity, AndroidManifest contracts (AAPT2), and static code analysis.
          </p>
        </div>

        <button
          onClick={handleRunAllSuites}
          disabled={isRunning}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 transition-colors shadow-sm shadow-emerald-500/20"
        >
          {isRunning ? <RotateCcw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
          <span>{isRunning ? 'Executing Suites...' : 'Execute All Test Suites'}</span>
        </button>
      </div>

      {/* Test Baseline Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="text-slate-400 text-xs">Executed Suites</div>
          <div className="text-xl font-bold font-mono text-slate-100">{testRecords.length}</div>
          <div className="text-[10px] text-slate-500">Active Test Categories</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="text-slate-400 text-xs">Passed Assertions</div>
          <div className="text-xl font-bold font-mono text-emerald-400">{totalPassed}</div>
          <div className="text-[10px] text-emerald-500/80">Verified Positive Rules</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="text-slate-400 text-xs">Failed Assertions</div>
          <div className="text-xl font-bold font-mono text-rose-400">{totalFailed}</div>
          <div className="text-[10px] text-rose-500/80">Contract Violations</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="text-slate-400 text-xs">Execution Discipline</div>
          <div className="text-sm font-bold font-mono text-amber-300">REALITY FIRST</div>
          <div className="text-[10px] text-slate-500">No fabricated passes</div>
        </div>
      </div>

      {testRecords.length === 0 ? (
        <div className="p-8 rounded-xl bg-slate-900 border border-slate-800 text-center text-slate-400 text-xs space-y-3">
          <FlaskConical className="w-10 h-10 mx-auto text-slate-600" />
          <h3 className="text-sm font-bold text-slate-200">No Test Records Logged Yet</h3>
          <p className="max-w-md mx-auto text-slate-500">
            Click &quot;Execute All Test Suites&quot; to run real archive integrity, manifest specifications, and lexical syntax verification.
          </p>
          <button
            onClick={handleRunAllSuites}
            className="px-4 py-2 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs"
          >
            Run Tests Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Test Suites List */}
          <div className="space-y-2">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Executed Suites ({testRecords.length})
            </h2>

            <div className="space-y-2">
              {testRecords.map((r) => {
                const isSelected = r.id === activeRecord?.id;
                return (
                  <div
                    key={r.id}
                    onClick={() => setSelectedRecordId(r.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-slate-900 border-amber-400 ring-1 ring-amber-400'
                        : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-slate-200 flex items-center gap-1.5">
                        {r.status === 'PASS' ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-rose-400" />
                        )}
                        <span className="truncate max-w-[170px]">{r.testName}</span>
                      </span>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                          r.status === 'PASS'
                            ? 'bg-emerald-950 text-emerald-300'
                            : 'bg-rose-950 text-rose-300'
                        }`}
                      >
                        {r.status}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                      <span>{r.executionTimeMs}ms &bull; Exit {r.exitCode}</span>
                      <span className="text-slate-400">
                        {r.passedCount}P / {r.failedCount}F
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Test Execution Output Inspector */}
          {activeRecord && (
            <div className="lg:col-span-2 space-y-4">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-4 text-xs">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                      <span>{activeRecord.testName}</span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                          activeRecord.status === 'PASS'
                            ? 'bg-emerald-950 text-emerald-300'
                            : 'bg-rose-950 text-rose-300'
                        }`}
                      >
                        {activeRecord.status}
                      </span>
                    </h2>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      Command: <span className="text-amber-300">{activeRecord.command}</span>
                    </p>
                  </div>

                  <span className="text-[10px] text-slate-500 font-mono">
                    Time: {activeRecord.executionTimeMs}ms
                  </span>
                </div>

                {/* Stdout Log Viewer */}
                <div>
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block mb-1">
                    Standard Output (stdout)
                  </span>
                  <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 whitespace-pre-wrap max-h-64 overflow-y-auto">
                    {activeRecord.stdout}
                  </pre>
                </div>

                {/* Stderr if failed */}
                {activeRecord.stderr && (
                  <div>
                    <span className="text-rose-400 font-bold uppercase tracking-wider text-[10px] block mb-1">
                      Standard Error (stderr)
                    </span>
                    <pre className="p-3 rounded-lg bg-rose-950/30 border border-rose-900/60 font-mono text-[11px] text-rose-300 whitespace-pre-wrap">
                      {activeRecord.stderr}
                    </pre>
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
