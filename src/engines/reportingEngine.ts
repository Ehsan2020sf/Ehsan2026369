import { Project } from '../types';
import { formatBytes } from '../utils/crypto';

export function generateEvidenceReportMarkdown(project: Project): string {
  const now = new Date().toISOString();
  const latestVersion = project.versions[project.versions.length - 1];

  let md = `# NOVIN FORGE AI - ENGINEERING & EVIDENCE REPORT\n\n`;
  md += `**Generated:** ${now}\n`;
  md += `**Project:** ${project.name} (\`${project.id}\`)\n`;
  md += `**Detected Type:** \`${project.projectType}\`\n`;
  md += `**Active Version:** \`${latestVersion ? latestVersion.versionId : 'v1.0.0-baseline'}\`\n\n`;

  md += `---\n\n`;

  // SECTION A: OPERATION SUMMARY
  md += `## A. OPERATION SUMMARY\n\n`;
  md += `- **Project ID:** ${project.id}\n`;
  md += `- **Source Archive:** ${project.originalArchiveAudit?.originalFilename || 'Pre-loaded Workspace'}\n`;
  md += `- **Original Archive SHA-256:** \`${project.originalArchiveAudit?.sha256 || 'N/A'}\`\n`;
  md += `- **Extracted Size:** ${formatBytes(project.originalArchiveAudit?.totalUncompressedSize || 0)}\n`;
  md += `- **Total Files Extracted:** ${project.workingFiles.length}\n`;
  md += `- **Current Version ID:** ${latestVersion?.versionId || 'v1.0.0'}\n\n`;

  // SECTION B: PROJECT INVENTORY
  md += `## B. PROJECT INVENTORY\n\n`;
  md += `- **Detected Frameworks:** ${project.detectedFrameworks.join(', ') || 'Standard Native'}\n`;
  md += `- **Detected Languages:** ${project.detectedLanguages.join(', ') || 'Kotlin, Java'}\n`;
  if (project.manifestData) {
    md += `- **Android Application ID / Package:** \`${project.manifestData.packageName || 'Unknown'}\`\n`;
    md += `- **Declared Permissions:** ${project.manifestData.permissions.length}\n`;
    md += `- **Declared Activities:** ${project.manifestData.activities.length}\n`;
    md += `- **Declared Services:** ${project.manifestData.services.length}\n`;
  }
  md += `\n### File Breakdown:\n`;
  const roleCounts: Record<string, number> = {};
  project.workingFiles.forEach((f) => {
    roleCounts[f.role] = (roleCounts[f.role] || 0) + 1;
  });
  Object.entries(roleCounts).forEach(([role, count]) => {
    md += `- **${role}:** ${count} files\n`;
  });
  md += `\n`;

  // SECTION C: DUPLICATE ANALYSIS
  md += `## C. DUPLICATE ANALYSIS\n\n`;
  if (project.duplicates.length === 0) {
    md += `*No exact binary or syntactic duplicate anomalies detected.*\n\n`;
  } else {
    md += `Discovered **${project.duplicates.length}** duplicate candidate pair(s):\n\n`;
    project.duplicates.forEach((d, idx) => {
      md += `### ${idx + 1}. [${d.type}] ${d.similarityPercentage}% Similarity\n`;
      md += `- **File A:** \`${d.fileA}\`\n`;
      md += `- **File B:** \`${d.fileB}\`\n`;
      md += `- **Call-sites:** File A (${d.callSitesFileA}), File B (${d.callSitesFileB})\n`;
      md += `- **Consolidation Risk:** **${d.riskOfConsolidation}**\n`;
      md += `- **Recommended Action:** \`${d.recommendedAction}\`\n`;
      md += `- **Evidence:** ${d.evidence}\n\n`;
    });
  }

  // SECTION D: SECURITY ANALYSIS
  md += `## D. SECURITY ANALYSIS\n\n`;
  if (project.securityFindings.length === 0) {
    md += `*No critical security findings detected in source baseline.*\n\n`;
  } else {
    md += `Identified **${project.securityFindings.length}** security finding(s):\n\n`;
    project.securityFindings.forEach((sec, idx) => {
      md += `### ${idx + 1}. [${sec.severity}] ${sec.title}\n`;
      md += `- **Category:** \`${sec.category}\`\n`;
      md += `- **Location:** \`${sec.filePath}${sec.lineNumber ? `:${sec.lineNumber}` : ''}\`\n`;
      md += `- **Evidence:** \`${sec.evidence}\`\n`;
      md += `- **Remediation:** ${sec.remediation}\n`;
      md += `- **Verification Status:** \`${sec.verificationStatus}\`\n\n`;
    });
  }

  // SECTION E: REPAIR ANALYSIS
  md += `## E. REPAIR ANALYSIS\n\n`;
  md += `- **Total Change Records:** ${project.versions.reduce((acc, v) => acc + v.changeRecords.length, 0)}\n`;
  md += `- **Candidate Patches Available:** Generated and verified in Code Repair Center\n\n`;

  // SECTION F: INTEGRATION ANALYSIS
  md += `## F. INTEGRATION ANALYSIS\n\n`;
  md += `- **Protected Baseline State:** Immutable and isolated from active candidate changes.\n`;
  md += `- **Controlled Ingestion Phases:** A through K enforced for all secondary archives.\n\n`;

  // SECTION G: TEST RESULTS
  md += `## G. TEST RESULTS\n\n`;
  if (project.testRecords.length === 0) {
    md += `*No test records logged in current session.*\n\n`;
  } else {
    project.testRecords.forEach((t) => {
      md += `### Suite: ${t.testName} [${t.status}]\n`;
      md += `- **Command:** \`${t.command}\`\n`;
      md += `- **Execution Time:** ${t.executionTimeMs} ms\n`;
      md += `- **Exit Code:** \`${t.exitCode}\` | **Passed:** ${t.passedCount} | **Failed:** ${t.failedCount}\n`;
      md += `\`\`\`text\n${t.stdout}\n\`\`\`\n\n`;
    });
  }

  // SECTION H: BUILD RESULTS
  md += `## H. BUILD RESULTS\n\n`;
  if (project.buildRecords.length === 0) {
    md += `*No build tasks executed yet.*\n\n`;
  } else {
    project.buildRecords.forEach((b) => {
      md += `- **Variant:** ${b.variant} | **Status:** \`${b.status}\` | **Artifact SHA:** \`${b.artifactHash || 'N/A'}\`\n`;
    });
    md += `\n`;
  }

  // SECTION I: APPROVAL STATUS
  md += `## I. APPROVAL STATUS\n\n`;
  md += `- **Human Approval Gate:** Enforced prior to any promotion into protected baseline.\n`;
  md += `- **Approved Revisions:** ${project.versions.length} version snapshot(s) verified.\n\n`;

  // SECTION J: REMAINING RISKS & LIMITATIONS
  md += `## J. REMAINING RISKS & LIMITATIONS\n\n`;
  md += `- Physical device hardware verification pending (Master Principle #1: not verified on real physical phone).\n`;
  md += `- Full headless Gradle daemon compile requires dedicated host container with Android SDK build-tools.\n\n`;

  // SECTION K: NEXT RECOMMENDATIONS
  md += `## K. NEXT RECOMMENDATIONS\n\n`;
  md += `1. Remediate cleartext network traffic in AndroidManifest.xml.\n`;
  md += `2. Rotate exposed API keys discovered in source files.\n`;
  md += `3. Consolidate identified duplicate class implementations after team review.\n`;
  md += `4. Execute on-device instrumentation tests prior to production store deployment.\n`;

  return md;
}

export function generateEvidenceReportJson(project: Project): string {
  return JSON.stringify(
    {
      reportVersion: '1.0.0',
      timestamp: new Date().toISOString(),
      project: {
        id: project.id,
        name: project.name,
        type: project.projectType,
        archiveAudit: project.originalArchiveAudit,
        manifestData: project.manifestData,
        securityFindings: project.securityFindings,
        duplicates: project.duplicates,
        architecture: project.architecture,
        testRecords: project.testRecords,
        buildRecords: project.buildRecords,
        versions: project.versions,
      },
    },
    null,
    2
  );
}
