import { ChangeRecord, Project, ProjectFile, ProjectVersion } from '../types';
import { calculateSha256 } from '../utils/crypto';

export interface IntegrationPlan {
  id: string;
  sourceLabel: string;
  incomingHash: string;
  timestamp: string;
  strategy: 'ADD_MODULE' | 'EXTEND_MODULE' | 'REPLACE_IMPLEMENTATION' | 'ADAPT_API';
  filesToAdd: ProjectFile[];
  filesToModify: { current: ProjectFile; incoming: ProjectFile; rationale: string }[];
  filesIdentical: string[];
  securityImplications: string[];
  impactAssessment: {
    addedCount: number;
    modifiedCount: number;
    identicalCount: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    rollbackStrategy: string;
  };
  approvalStatus: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'APPLIED';
}

export async function planControlledIntegration(
  project: Project,
  incomingFiles: ProjectFile[],
  incomingLabel = 'Secondary Intake Module'
): Promise<IntegrationPlan> {
  const currentFilesMap = new Map<string, ProjectFile>();
  project.workingFiles.forEach((f) => currentFilesMap.set(f.path, f));

  const filesToAdd: ProjectFile[] = [];
  const filesToModify: { current: ProjectFile; incoming: ProjectFile; rationale: string }[] = [];
  const filesIdentical: string[] = [];
  const securityImplications: string[] = [];

  for (const inc of incomingFiles) {
    if (!currentFilesMap.has(inc.path)) {
      filesToAdd.push(inc);
      if (inc.content.includes('AIzaSy') || inc.content.includes('AKIA')) {
        securityImplications.push(`Incoming file '${inc.path}' contains potential hardcoded API secret.`);
      }
    } else {
      const curr = currentFilesMap.get(inc.path)!;
      if (curr.sha256 === inc.sha256) {
        filesIdentical.push(inc.path);
      } else {
        filesToModify.push({
          current: curr,
          incoming: inc,
          rationale: `Content diff detected. Line count: ${curr.content.split('\n').length} -> ${inc.content.split('\n').length}`,
        });
        if (inc.content.includes('android:usesCleartextTraffic="true"')) {
          securityImplications.push(`Incoming modification in '${inc.path}' enables cleartext HTTP transmission.`);
        }
      }
    }
  }

  const incomingJoinedHashes = incomingFiles.map((f) => f.sha256).join('|');
  const incomingHash = await calculateSha256(incomingJoinedHashes);

  const riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' =
    securityImplications.length > 0 ? 'HIGH' : filesToModify.length > 3 ? 'MEDIUM' : 'LOW';

  return {
    id: `INT-PLAN-${Date.now()}`,
    sourceLabel: incomingLabel,
    incomingHash,
    timestamp: new Date().toISOString(),
    strategy: filesToAdd.some((f) => f.path.startsWith('feature/') || f.path.startsWith('agent/')) ? 'ADD_MODULE' : 'EXTEND_MODULE',
    filesToAdd,
    filesToModify,
    filesIdentical,
    securityImplications,
    impactAssessment: {
      addedCount: filesToAdd.length,
      modifiedCount: filesToModify.length,
      identicalCount: filesIdentical.length,
      riskLevel,
      rollbackStrategy: 'Rollback to baseline version via change journal transactional reverse commit.',
    },
    approvalStatus: 'PENDING_APPROVAL',
  };
}

export async function executeApprovedIntegration(
  project: Project,
  plan: IntegrationPlan,
  approverEmail: string
): Promise<{ updatedFiles: ProjectFile[]; newVersion: ProjectVersion }> {
  const fileMap = new Map<string, ProjectFile>();
  project.workingFiles.forEach((f) => fileMap.set(f.path, f));

  const changeRecords: ChangeRecord[] = [];

  // 1. Add files
  for (const file of plan.filesToAdd) {
    fileMap.set(file.path, file);
    changeRecords.push({
      id: `CHG-ADD-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      filePath: file.path,
      action: 'ADD',
      newContent: file.content,
      reason: `Integration intake: Added file from ${plan.sourceLabel}`,
      author: approverEmail,
    });
  }

  // 2. Modify files
  for (const item of plan.filesToModify) {
    fileMap.set(item.incoming.path, item.incoming);
    changeRecords.push({
      id: `CHG-MOD-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      filePath: item.incoming.path,
      action: 'MODIFY',
      previousContent: item.current.content,
      newContent: item.incoming.content,
      reason: `Integration intake: Updated implementation from ${plan.sourceLabel}`,
      author: approverEmail,
      rollbackSha: item.current.sha256,
    });
  }

  const updatedFiles = Array.from(fileMap.values());
  const allHashes = updatedFiles.map((f) => f.sha256).sort().join('');
  const newSourceHash = await calculateSha256(allHashes);

  const newVersion: ProjectVersion = {
    versionId: `v${project.versions.length + 1}.0.0-rev${Date.now().toString().slice(-4)}`,
    parentVersionId: project.versions[project.versions.length - 1]?.versionId,
    sourceHash: newSourceHash,
    timestamp: new Date().toISOString(),
    tag: `Integration from ${plan.sourceLabel}`,
    description: `Approved controlled integration of ${plan.filesToAdd.length} added file(s) and ${plan.filesToModify.length} modified file(s).`,
    approvedBy: approverEmail,
    changeRecords,
    filesSnapshotCount: updatedFiles.length,
  };

  return { updatedFiles, newVersion };
}
