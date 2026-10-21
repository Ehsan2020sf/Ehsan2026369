import React, { useState } from 'react';
import {
  GitMerge,
  UploadCloud,
  FileArchive,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowRight,
  ShieldAlert,
  GitCommit,
  Check,
  Cpu,
} from 'lucide-react';
import { Project, ProjectFile } from '../../types';
import { Language, translations } from '../../i18n/translations';
import { processZipArchive } from '../../engines/zipEngine';
import { planControlledIntegration, executeApprovedIntegration, IntegrationPlan } from '../../engines/integrationEngine';
import { DiffViewer } from '../DiffViewer';

interface IntegrationReviewViewProps {
  project: Project;
  lang: Language;
  onApplyIntegration: (updatedFiles: ProjectFile[], plan: IntegrationPlan) => void;
}

export const IntegrationReviewView: React.FC<IntegrationReviewViewProps> = ({
  project,
  lang,
  onApplyIntegration,
}) => {
  const t = translations[lang];

  const [activePlan, setActivePlan] = useState<IntegrationPlan | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedModifyIndex, setSelectedModifyIndex] = useState(0);
  const [approverEmail, setApproverEmail] = useState('architect@novin.ai');
  const [appliedSuccess, setAppliedSuccess] = useState(false);

  // Quick helper to load a simulated secondary feature module
  const handleLoadFeatureModule = async () => {
    setIsProcessing(true);
    try {
      const incomingFiles: ProjectFile[] = [
        {
          path: 'core/ai/src/main/java/ai/novin/nexus/ai/OfflineVectorIndex.kt',
          name: 'OfflineVectorIndex.kt',
          extension: 'kt',
          size: 720,
          sha256: 'e814a0f44bc1982b64758b99182098b182903847592837492837482910293847',
          content: `package ai.novin.nexus.ai

/**
 * NOVIN Offline Vector Embeddings Store
 * Enables zero-cloud semantic search and local RAG retrieval on-device.
 */
class OfflineVectorIndex {
    private val memoryStore = mutableMapOf<String, FloatArray>()

    fun insertEmbedding(key: String, vector: FloatArray) {
        memoryStore[key] = vector
    }

    fun findNearest(queryVector: FloatArray, k: Int = 3): List<String> {
        return memoryStore.keys.take(k)
    }
}
`,
          isBinary: false,
          role: 'SOURCE',
        },
        {
          path: 'app/build.gradle.kts',
          name: 'build.gradle.kts',
          extension: 'kts',
          size: 1400,
          sha256: '9928374829102938475829102938475628192038475628192038475628192038',
          content: project.workingFiles.find((f) => f.path === 'app/build.gradle.kts')?.content
            ? project.workingFiles.find((f) => f.path === 'app/build.gradle.kts')!.content +
              `\n    // Added by Offline Vector Integration\n    implementation("androidx.datastore:datastore-preferences:1.0.0")\n`
            : '',
          isBinary: false,
          role: 'BUILD_SCRIPT',
        },
      ];

      const plan = await planControlledIntegration(
        project,
        incomingFiles,
        'NOVIN Offline Vector Engine Intake'
      );
      setActivePlan(plan);
      setAppliedSuccess(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApprove = async () => {
    if (!activePlan) return;
    try {
      const { updatedFiles } = await executeApprovedIntegration(
        project,
        activePlan,
        approverEmail
      );
      setActivePlan({ ...activePlan, approvalStatus: 'APPLIED' });
      setAppliedSuccess(true);
      onApplyIntegration(updatedFiles, activePlan);
    } catch (err: any) {
      alert(`Integration failed: ${err.message}`);
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <GitMerge className="w-5 h-5 text-amber-400" />
            <span>{t.nav_integration}</span>
          </h1>
          <p className="text-xs text-slate-400">
            Phases A through K controlled project integration engine. Inspects incoming artifacts, prevents blind merging, displays unified diffs, and enforces human approval gates.
          </p>
        </div>

        <button
          onClick={handleLoadFeatureModule}
          disabled={isProcessing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors shadow-sm shadow-amber-500/20"
        >
          <Cpu className="w-4 h-4" />
          <span>Stage &apos;Offline Vector&apos; Feature Module</span>
        </button>
      </div>

      {appliedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800 text-xs text-emerald-300 flex items-center gap-2 shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            Integration successfully accepted and applied into project working copy. New immutable snapshot revision logged.
          </span>
        </div>
      )}

      {/* Integration Workflow Guide Phases A-K */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
        <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
          Phases A &ndash; K Integration Gating Pipeline
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 text-[10px] font-mono">
          <div className="p-2 rounded bg-slate-950 border border-slate-800 text-slate-400">
            <span className="text-amber-400 font-bold block">Phase A</span>
            <span>Registration</span>
          </div>
          <div className="p-2 rounded bg-slate-950 border border-slate-800 text-slate-400">
            <span className="text-amber-400 font-bold block">Phase B/C</span>
            <span>Diff Baseline</span>
          </div>
          <div className="p-2 rounded bg-slate-950 border border-slate-800 text-slate-400">
            <span className="text-amber-400 font-bold block">Phase D/E</span>
            <span>Impact Audit</span>
          </div>
          <div className="p-2 rounded bg-slate-950 border border-slate-800 text-slate-400">
            <span className="text-amber-400 font-bold block">Phase F</span>
            <span>Diff Preview</span>
          </div>
          <div className="p-2 rounded bg-slate-950 border border-slate-800 text-amber-300">
            <span className="text-amber-400 font-bold block">Phase G</span>
            <span>Human Gate</span>
          </div>
          <div className="p-2 rounded bg-slate-950 border border-slate-800 text-slate-400">
            <span className="text-emerald-400 font-bold block">Phase H-K</span>
            <span>Apply &amp; Record</span>
          </div>
        </div>
      </div>

      {!activePlan ? (
        <div className="p-8 rounded-xl bg-slate-900 border border-slate-800 text-center text-slate-400 text-xs space-y-3">
          <GitMerge className="w-10 h-10 mx-auto text-slate-600" />
          <h3 className="text-sm font-bold text-slate-200">No Staged Integration In Progress</h3>
          <p className="max-w-md mx-auto text-slate-500">
            Click &quot;Stage Offline Vector Feature Module&quot; above or import an incoming ZIP to initiate a controlled integration review.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Plan Header */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3 text-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono text-cyan-400 block uppercase">
                  Strategy: {activePlan.strategy}
                </span>
                <h2 className="text-sm font-bold text-slate-100">{activePlan.sourceLabel}</h2>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  Incoming SHA-256 Digest: {activePlan.incomingHash.slice(0, 20)}...
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
                  Risk Level: <span className="font-bold text-emerald-400">{activePlan.impactAssessment.riskLevel}</span>
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                    activePlan.approvalStatus === 'APPLIED'
                      ? 'bg-emerald-950 text-emerald-300'
                      : 'bg-amber-950 text-amber-300'
                  }`}
                >
                  {activePlan.approvalStatus}
                </span>
              </div>
            </div>

            {/* Impact Counts */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-500 text-[10px] block">Files to Add</span>
                <span className="font-mono text-emerald-400 font-bold text-sm">
                  +{activePlan.impactAssessment.addedCount}
                </span>
              </div>
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-500 text-[10px] block">Files to Modify</span>
                <span className="font-mono text-amber-300 font-bold text-sm">
                  ~{activePlan.impactAssessment.modifiedCount}
                </span>
              </div>
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-500 text-[10px] block">Identical Files</span>
                <span className="font-mono text-slate-400 font-bold text-sm">
                  {activePlan.impactAssessment.identicalCount}
                </span>
              </div>
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-500 text-[10px] block">Rollback Strategy</span>
                <span className="text-[10px] text-slate-300 truncate block">Transactional Journal</span>
              </div>
            </div>
          </div>

          {/* Files to Add List */}
          {activePlan.filesToAdd.length > 0 && (
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
              <h3 className="font-bold text-emerald-400 uppercase tracking-wider text-[11px]">
                New Files to Add ({activePlan.filesToAdd.length})
              </h3>
              <div className="space-y-1 font-mono text-[11px]">
                {activePlan.filesToAdd.map((f) => (
                  <div key={f.path} className="p-2 rounded bg-slate-950 border border-slate-800/80 flex justify-between">
                    <span className="text-slate-200">{f.path}</span>
                    <span className="text-slate-500">{f.role}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Modified Files Diff Inspector */}
          {activePlan.filesToModify.length > 0 && (
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                  Modified File Diffs ({activePlan.filesToModify.length})
                </h3>
                <span className="text-slate-500 text-[11px]">
                  Inspecting {activePlan.filesToModify[selectedModifyIndex]?.incoming.path}
                </span>
              </div>

              {activePlan.filesToModify[selectedModifyIndex] && (
                <DiffViewer
                  oldText={activePlan.filesToModify[selectedModifyIndex].current.content}
                  newText={activePlan.filesToModify[selectedModifyIndex].incoming.content}
                  oldTitle="Current Working Copy"
                  newTitle="Incoming Proposed Change"
                />
              )}
            </div>
          )}

          {/* Human Approval Action Bar */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2 font-bold text-amber-300">
                <GitCommit className="w-4 h-4" />
                <span>Phase G: Mandatory Human Approval</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Promotes staged modifications to the working workspace. Produces an immutable version snapshot with rollback journal.
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {activePlan.approvalStatus === 'APPLIED' ? (
                <span className="px-3 py-1.5 rounded-lg bg-emerald-950 text-emerald-300 text-xs font-bold border border-emerald-800 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" />
                  <span>Integration Accepted</span>
                </span>
              ) : (
                <>
                  <button
                    onClick={() => setActivePlan(null)}
                    className="flex-1 sm:flex-none px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-rose-300 hover:bg-rose-950/40 border border-slate-800 transition-colors"
                  >
                    Reject Integration
                  </button>
                  <button
                    onClick={handleApprove}
                    className="flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors flex items-center justify-center gap-1.5 shadow-sm shadow-amber-500/20"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve &amp; Integrate</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
