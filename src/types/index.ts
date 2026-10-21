export type ProjectType =
  | 'android_kotlin_compose'
  | 'android_java'
  | 'android_gradle'
  | 'react_typescript'
  | 'node_javascript'
  | 'python'
  | 'flutter_dart'
  | 'rust'
  | 'go'
  | 'multi_module'
  | 'unknown';

export type FileRole =
  | 'SOURCE'
  | 'CONFIG'
  | 'MANIFEST'
  | 'RESOURCE'
  | 'TEST'
  | 'ASSET'
  | 'BUILD_SCRIPT'
  | 'DOCUMENTATION'
  | 'BINARY'
  | 'UNKNOWN';

export interface ProjectFile {
  path: string;
  name: string;
  extension: string;
  size: number;
  sha256: string;
  content: string; // Text content if text, base64 or indicator if binary
  isBinary: boolean;
  role: FileRole;
  module?: string;
  lastModified?: number;
}

export interface ManifestData {
  packageName?: string;
  versionCode?: string;
  versionName?: string;
  minSdkVersion?: number;
  targetSdkVersion?: number;
  compileSdkVersion?: number;
  permissions: string[];
  activities: { name: string; exported: boolean; isLauncher: boolean }[];
  services: { name: string; exported: boolean }[];
  receivers: { name: string; exported: boolean }[];
  usesCleartextTraffic?: boolean;
}

export interface ArchiveAudit {
  valid: boolean;
  originalFilename: string;
  archiveSize: number;
  sha256: string;
  totalEntries: number;
  validEntriesCount: number;
  rejectedEntriesCount: number;
  rejectedEntries: { path: string; reason: string }[];
  totalUncompressedSize: number;
  compressionRatio: number;
  warnings: string[];
  errors: string[];
  quarantined: boolean;
  quarantineReason?: string;
}

export type ExecutionStatus =
  | 'PASS'
  | 'PARTIAL'
  | 'FAIL'
  | 'BLOCKED'
  | 'UNKNOWN'
  | 'NOT_TESTED'
  | 'NOT_VERIFIED_ON_DEVICE';

export interface SecurityFinding {
  id: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  title: string;
  category: 'SECRET' | 'ANDROID_PERMISSION' | 'EXPORTED_COMPONENT' | 'NETWORK' | 'INJECTION' | 'STORAGE' | 'CODE_SAFETY';
  filePath: string;
  lineNumber?: number;
  evidence: string;
  description: string;
  remediation: string;
  verificationStatus: ExecutionStatus;
}

export interface DuplicateCandidate {
  id: string;
  fileA: string;
  fileB: string;
  type: 'EXACT_BINARY' | 'EXACT_TEXT' | 'SIMILAR_CODE' | 'NAMING_COLLISION';
  hashA: string;
  hashB: string;
  similarityPercentage: number;
  evidence: string;
  callSitesFileA: number;
  callSitesFileB: number;
  riskOfConsolidation: 'LOW' | 'MEDIUM' | 'HIGH';
  recommendedAction: 'KEEP_BOTH' | 'MERGE_AFTER_REVIEW' | 'REPLACE' | 'ARCHIVE' | 'INVESTIGATE';
  confidence: number;
}

export interface ArchitectureNode {
  id: string;
  label: string;
  type: 'MODULE' | 'ACTIVITY' | 'SERVICE' | 'RECEIVER' | 'DATABASE' | 'ENTITY' | 'REPOSITORY' | 'AI_AGENT' | 'NETWORK_CLIENT' | 'CONFIG' | 'TEST';
  filePath?: string;
  module?: string;
  details?: Record<string, string | number | boolean>;
}

export interface ArchitectureEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  confidence: 'CONFIRMED' | 'STATICALLY_INFERRED' | 'AI_INFERRED' | 'UNKNOWN';
}

export interface ArchitectureGraph {
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
  driftFindings: string[];
}

export interface ChangeRecord {
  id: string;
  timestamp: string;
  filePath: string;
  action: 'ADD' | 'MODIFY' | 'DELETE';
  previousContent?: string;
  newContent?: string;
  reason: string;
  author: string;
  rollbackSha?: string;
}

export interface ProjectVersion {
  versionId: string;
  parentVersionId?: string;
  sourceHash: string;
  timestamp: string;
  tag: string;
  description: string;
  approvedBy?: string;
  changeRecords: ChangeRecord[];
  filesSnapshotCount: number;
}

export interface EngineeringTask {
  id: string;
  userPrompt: string;
  goal: string;
  scope: string[];
  constraints: string[];
  steps: { id: number; title: string; status: 'PENDING' | 'IN_PROGRESS' | 'DONE' | 'BLOCKED' }[];
  status: 'PROPOSED' | 'PLANNING' | 'WAITING_APPROVAL' | 'EXECUTING' | 'COMPLETED' | 'REJECTED';
  proposedDiffs?: { filePath: string; original: string; proposed: string; rationale: string }[];
  createdAt: string;
}

export interface TestExecutionRecord {
  id: string;
  testName: string;
  category: 'INTEGRITY' | 'STATIC_LINT' | 'MANIFEST_CONTRACT' | 'UNIT_TEST' | 'REGRESSION';
  command: string;
  executionTimeMs: number;
  timestamp: string;
  exitCode: number;
  status: ExecutionStatus;
  stdout: string;
  stderr: string;
  passedCount: number;
  failedCount: number;
  skippedCount: number;
}

export interface BuildRecord {
  id: string;
  variant: 'DEBUG' | 'RELEASE';
  environment: string;
  command: string;
  status: ExecutionStatus;
  artifactName?: string;
  artifactHash?: string;
  buildTimeMs: number;
  logs: string[];
  timestamp: string;
}

export interface AgentDefinition {
  id: string;
  name: string;
  version: string;
  purpose: string;
  status: 'REGISTERED' | 'AVAILABLE' | 'RUNNING' | 'DISABLED' | 'UNAVAILABLE';
  supportedTasks: string[];
  requiredPermissions: string[];
  inputSchema: string;
  outputSchema: string;
}

export interface ResearchEntry {
  id: string;
  query: string;
  title: string;
  url: string;
  source: string;
  timestamp: string;
  summary: string;
  versionInfo?: string;
  relevance: string;
  confidence: number;
}

export interface AcceptanceGate {
  gateId: string;
  title: string;
  description: string;
  status: ExecutionStatus;
  evidence: string;
  testMethod: string;
  result: string;
  remainingLimitation: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  originalArchiveAudit?: ArchiveAudit;
  // Immutable baseline files
  baselineFiles: ProjectFile[];
  // Current working copy files
  workingFiles: ProjectFile[];
  projectType: ProjectType;
  detectedFrameworks: string[];
  detectedLanguages: string[];
  manifestData?: ManifestData;
  versions: ProjectVersion[];
  securityFindings: SecurityFinding[];
  duplicates: DuplicateCandidate[];
  architecture?: ArchitectureGraph;
  tasks: EngineeringTask[];
  testRecords: TestExecutionRecord[];
  buildRecords: BuildRecord[];
  activeTask?: EngineeringTask;
}
