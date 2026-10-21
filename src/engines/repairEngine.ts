import { ChangeRecord, Project, ProjectFile, SecurityFinding } from '../types';
import { calculateSha256 } from '../utils/crypto';

export interface RepairCandidate {
  id: string;
  findingId?: string;
  title: string;
  targetFile: string;
  originalContent: string;
  patchedContent: string;
  rationale: string;
  rootCause: string;
  affectedDependencies: string[];
  regressionRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'PROPOSED' | 'APPROVED' | 'APPLIED' | 'REJECTED';
}

/**
 * Generates verified candidate patches for known security and configuration flaws.
 */
export function generateCandidateRepairs(project: Project): RepairCandidate[] {
  const repairs: RepairCandidate[] = [];

  for (const finding of project.securityFindings) {
    if (finding.category === 'NETWORK' && finding.filePath === 'AndroidManifest.xml') {
      const file = project.workingFiles.find((f) => f.path.includes('AndroidManifest.xml'));
      if (file && file.content.includes('android:usesCleartextTraffic="true"')) {
        repairs.push({
          id: `REP-${finding.id}`,
          findingId: finding.id,
          title: 'Remediate Cleartext Network Transmission',
          targetFile: file.path,
          originalContent: file.content,
          patchedContent: file.content.replace('android:usesCleartextTraffic="true"', 'android:usesCleartextTraffic="false"'),
          rationale: 'Disables unencrypted HTTP traffic across the application to prevent Man-in-the-Middle network sniffing.',
          rootCause: 'android:usesCleartextTraffic set to true in application tag.',
          affectedDependencies: ['Network Security Config', 'Retrofit / OkHttp clients'],
          regressionRisk: 'LOW',
          status: 'PROPOSED',
        });
      }
    }

    if (finding.category === 'EXPORTED_COMPONENT' && finding.filePath === 'AndroidManifest.xml') {
      const file = project.workingFiles.find((f) => f.path.includes('AndroidManifest.xml'));
      if (file && file.content.includes('android:exported="true"')) {
        // Find non-launcher exported activities
        const actNameMatch = finding.title.match(/:\s*(.+)$/);
        const compName = actNameMatch ? actNameMatch[1] : '';
        if (compName && file.content.includes(compName)) {
          const compRegex = new RegExp(`(<activity[^>]*android:name="${compName}"[^>]*android:exported=")(true)(")`);
          if (compRegex.test(file.content)) {
            repairs.push({
              id: `REP-${finding.id}`,
              findingId: finding.id,
              title: `Constrain Exported Component (${compName})`,
              targetFile: file.path,
              originalContent: file.content,
              patchedContent: file.content.replace(compRegex, `$1false$3`),
              rationale: 'Restricts the activity to package-internal invocations, preventing external malicious intent triggers.',
              rootCause: 'Activity marked as globally exported without required permission.',
              affectedDependencies: ['Intent navigation', 'Deep links'],
              regressionRisk: 'LOW',
              status: 'PROPOSED',
            });
          }
        }
      }
    }

    if (finding.category === 'SECRET' && finding.lineNumber) {
      const file = project.workingFiles.find((f) => f.path === finding.filePath);
      if (file) {
        const lines = file.content.split('\n');
        const lineIdx = finding.lineNumber - 1;
        if (lines[lineIdx] && (lines[lineIdx].includes('AIzaSy') || lines[lineIdx].includes('AKIA'))) {
          const originalLine = lines[lineIdx];
          const sanitizedLine = originalLine
            .replace(/AIzaSy[0-9A-Za-z-_]{33}/g, 'BuildConfig.GEMINI_API_KEY')
            .replace(/AKIA[0-9A-Z]{16}/g, 'BuildConfig.AWS_ACCESS_KEY');

          const newLines = [...lines];
          newLines[lineIdx] = sanitizedLine;

          repairs.push({
            id: `REP-${finding.id}`,
            findingId: finding.id,
            title: `Redact Hardcoded Secret in ${file.name}`,
            targetFile: file.path,
            originalContent: file.content,
            patchedContent: newLines.join('\n'),
            rationale: 'Replaces plain-text hardcoded secret with secure BuildConfig environment parameter.',
            rootCause: 'Secret committed directly to source code file.',
            affectedDependencies: ['BuildConfig.java', 'gradle.properties'],
            regressionRisk: 'LOW',
            status: 'PROPOSED',
          });
        }
      }
    }
  }

  return repairs;
}

/**
 * Applies an approved repair to the working copy and produces a change record.
 */
export async function applyApprovedRepair(
  project: Project,
  repair: RepairCandidate,
  approverEmail: string
): Promise<{ updatedFiles: ProjectFile[]; changeRecord: ChangeRecord }> {
  const targetIndex = project.workingFiles.findIndex((f) => f.path === repair.targetFile);
  if (targetIndex === -1) {
    throw new Error(`Target file ${repair.targetFile} not found in working files.`);
  }

  const currentFile = project.workingFiles[targetIndex];
  const newSha256 = await calculateSha256(repair.patchedContent);

  const updatedFile: ProjectFile = {
    ...currentFile,
    content: repair.patchedContent,
    size: new Blob([repair.patchedContent]).size,
    sha256: newSha256,
    lastModified: Date.now(),
  };

  const updatedFiles = [...project.workingFiles];
  updatedFiles[targetIndex] = updatedFile;

  const changeRecord: ChangeRecord = {
    id: `CHG-${Date.now()}`,
    timestamp: new Date().toISOString(),
    filePath: repair.targetFile,
    action: 'MODIFY',
    previousContent: currentFile.content,
    newContent: repair.patchedContent,
    reason: `${repair.title}: ${repair.rationale}`,
    author: approverEmail || 'engineer@novin.ai',
    rollbackSha: currentFile.sha256,
  };

  return { updatedFiles, changeRecord };
}
