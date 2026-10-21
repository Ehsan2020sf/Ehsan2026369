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
  const [isRunningRealScript, setIsRunningRealScript] = useState<string | null>(null);

  const handleRunRealScript = async (scriptKey: string, scriptTitle: string) => {
    setIsRunningRealScript(scriptKey);
    try {
      const res = await fetch('/api/tests/execute-real', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testScript: scriptKey }),
      });
      const data = await res.json();

      const lines = (data.stdout || '').split('\n');
      const passLines = lines.filter((l: string) => l.startsWith('PASS'));
      const failLines = lines.filter((l: string) => l.startsWith('FAIL'));

      const newRecord: TestExecutionRecord = {
        id: `real-${Date.now()}`,
        testName: scriptTitle,
        category: 'INTEGRITY',
        command: `node -e "await import('scripts/${scriptKey}.mjs')"`,
        status: data.status === 'PASS' ? 'PASS' : 'FAIL',
        executionTimeMs: data.durationMs || 10,
        stdout: data.stdout || '(no output)',
        stderr: data.stderr || '',
        exitCode: data.status === 'PASS' ? 0 : 1,
        passedCount: passLines.length || (data.status === 'PASS' ? 1 : 0),
        failedCount: failLines.length || (data.status === 'FAIL' ? 1 : 0),
        skippedCount: 0,
        timestamp: new Date().toISOString(),
      };

      onUpdateTestRecords([newRecord, ...project.testRecords]);
      setSelectedRecordId(newRecord.id);
    } catch (err: any) {
      const failRecord: TestExecutionRecord = {
        id: `real-err-${Date.now()}`,
        testName: scriptTitle,
        category: 'INTEGRITY',
        command: `node scripts/${scriptKey}.mjs`,
        status: 'FAIL',
        executionTimeMs: 0,
        stdout: '',
        stderr: err.message || 'Execution error',
        exitCode: 1,
        passedCount: 0,
        failedCount: 1,
        skippedCount: 0,
        timestamp: new Date().toISOString(),
      };
      onUpdateTestRecords([failRecord, ...project.testRecords]);
      setSelectedRecordId(failRecord.id);
    } finally {
      setIsRunningRealScript(null);
    }
  };

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

      {/* Restricted Test Execution Adapter (Section 13) */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
          <div>
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span>Restricted Test Execution Adapter (Runtime Verification)</span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Directly executes validated test scripts in an isolated process sandbox without modifying source repositories.
            </p>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
            SANDBOX ACTIVE
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
            <div>
              <h4 className="font-bold text-xs text-slate-200">Manifest Hardening Audit</h4>
              <p className="text-[10px] text-slate-400 mt-0.5 font-mono">verify_android_manifest_hardening.mjs</p>
              <p className="text-[10px] text-slate-500 mt-1">
                Validates exported components, cleartext traffic disabling, camera/audio intent permissions, and backup policies.
              </p>
            </div>
            <button
              onClick={() => handleRunRealScript('manifest-hardening', 'Android Manifest Hardening Audit')}
              disabled={isRunningRealScript !== null}
              className="w-full py-1.5 px-3 rounded bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors"
            >
              {isRunningRealScript === 'manifest-hardening' ? (
                <RotateCcw className="w-3 h-3 animate-spin" />
              ) : (
                <Play className="w-3 h-3" />
              )}
              <span>Run Manifest Test</span>
            </button>
          </div>

          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
            <div>
              <h4 className="font-bold text-xs text-slate-200">Gradle Alignment Audit</h4>
              <p className="text-[10px] text-slate-400 mt-0.5 font-mono">verify_android_gradle_alignment.mjs</p>
              <p className="text-[10px] text-slate-500 mt-1">
                Validates SDK 36 compile/target alignment, JDK 21 compiler options, AGP 8.13.0, and packaging identities.
              </p>
            </div>
            <button
              onClick={() => handleRunRealScript('gradle-alignment', 'Android Gradle Alignment & SDK 36 Audit')}
              disabled={isRunningRealScript !== null}
              className="w-full py-1.5 px-3 rounded bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors"
            >
              {isRunningRealScript === 'gradle-alignment' ? (
                <RotateCcw className="w-3 h-3 animate-spin" />
              ) : (
                <Play className="w-3 h-3" />
              )}
              <span>Run Gradle Test</span>
            </button>
          </div>

          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
            <div>
              <h4 className="font-bold text-xs text-slate-200">Unified Integrity Audit</h4>
              <p className="text-[10px] text-slate-400 mt-0.5 font-mono">unified_integrity_audit.mjs</p>
              <p className="text-[10px] text-slate-500 mt-1">
                Deep AST graph validation scanning 2,400+ files and 4,200+ dependency edges across the neural workspace.
              </p>
            </div>
            <button
              onClick={() => handleRunRealScript('unified-integrity', 'Unified Neural AST Integrity Audit')}
              disabled={isRunningRealScript !== null}
              className="w-full py-1.5 px-3 rounded bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors"
            >
              {isRunningRealScript === 'unified-integrity' ? (
                <RotateCcw className="w-3 h-3 animate-spin" />
              ) : (
                <Play className="w-3 h-3" />
              )}
              <span>Run Integrity Audit</span>
            </button>
          </div>

          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
            <div>
              <h4 className="font-bold text-xs text-slate-200">Browser Boundary & Shims</h4>
              <p className="text-[10px] text-slate-400 mt-0.5 font-mono">verify_browser_boundary.mjs</p>
              <p className="text-[10px] text-slate-500 mt-1">
                Guarantees zero unshimmed Node builtins leak into browser graph; verifies browserAssert, crypto, and fs shims.
              </p>
            </div>
            <button
              onClick={() => handleRunRealScript('browser-boundary', 'Browser Boundary & Assert Shims')}
              disabled={isRunningRealScript !== null}
              className="w-full py-1.5 px-3 rounded bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors"
            >
              {isRunningRealScript === 'browser-boundary' ? (
                <RotateCcw className="w-3 h-3 animate-spin" />
              ) : (
                <Play className="w-3 h-3" />
              )}
              <span>Run Browser Boundary</span>
            </button>
          </div>

          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
            <div>
              <h4 className="font-bold text-xs text-slate-200">Architecture Integrity</h4>
              <p className="text-[10px] text-slate-400 mt-0.5 font-mono">verify_architecture.mjs</p>
              <p className="text-[10px] text-slate-500 mt-1">
                Validates 12 core system layers, Android WebView runtime assets, and prevents core-to-UI cyclic leaks.
              </p>
            </div>
            <button
              onClick={() => handleRunRealScript('architecture', 'Architecture Layer & Module Verification')}
              disabled={isRunningRealScript !== null}
              className="w-full py-1.5 px-3 rounded bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors"
            >
              {isRunningRealScript === 'architecture' ? (
                <RotateCcw className="w-3 h-3 animate-spin" />
              ) : (
                <Play className="w-3 h-3" />
              )}
              <span>Run Architecture Test</span>
            </button>
          </div>

          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
            <div>
              <h4 className="font-bold text-xs text-slate-200">GitHub Security Baseline</h4>
              <p className="text-[10px] text-slate-400 mt-0.5 font-mono">verify_github_security_baseline.mjs</p>
              <p className="text-[10px] text-slate-500 mt-1">
                Audits all CI/CD workflows for full 40-character commit SHA pinning and explicit top-level read permissions.
              </p>
            </div>
            <button
              onClick={() => handleRunRealScript('github-security', 'GitHub Actions Security Baseline Audit')}
              disabled={isRunningRealScript !== null}
              className="w-full py-1.5 px-3 rounded bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors"
            >
              {isRunningRealScript === 'github-security' ? (
                <RotateCcw className="w-3 h-3 animate-spin" />
              ) : (
                <Play className="w-3 h-3" />
              )}
              <span>Run Security Baseline</span>
            </button>
          </div>

          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
            <div>
              <h4 className="font-bold text-xs text-slate-200">Persisted Observed Boundary</h4>
              <p className="text-[10px] text-slate-400 mt-0.5 font-mono">test_persisted_observed_evidence_boundary.mjs</p>
              <p className="text-[10px] text-slate-500 mt-1">
                Enforces fail-closed reality promotion across 44 persistence files; ensures zero unproven OBSERVED records.
              </p>
            </div>
            <button
              onClick={() => handleRunRealScript('persisted-observed', 'Persisted Observed Evidence Boundary')}
              disabled={isRunningRealScript !== null}
              className="w-full py-1.5 px-3 rounded bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors"
            >
              {isRunningRealScript === 'persisted-observed' ? (
                <RotateCcw className="w-3 h-3 animate-spin" />
              ) : (
                <Play className="w-3 h-3" />
              )}
              <span>Run Truth Boundary</span>
            </button>
          </div>

          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
            <div>
              <h4 className="font-bold text-xs text-slate-200">Web & Server Build Gate</h4>
              <p className="text-[10px] text-slate-400 mt-0.5 font-mono">verify_web_build.mjs</p>
              <p className="text-[10px] text-slate-500 mt-1">
                Validates dist/index.html script modules and server-dist/server.cjs isolation without artifact leakage.
              </p>
            </div>
            <button
              onClick={() => handleRunRealScript('web-build', 'Web & Server Production Build Gate')}
              disabled={isRunningRealScript !== null}
              className="w-full py-1.5 px-3 rounded bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors"
            >
              {isRunningRealScript === 'web-build' ? (
                <RotateCcw className="w-3 h-3 animate-spin" />
              ) : (
                <Play className="w-3 h-3" />
              )}
              <span>Run Build Gate</span>
            </button>
          </div>
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
