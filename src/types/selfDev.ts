import { ExecutionStatus } from './index';

export type SelfDevState =
  | 'RECEIVED'
  | 'ANALYZING'
  | 'ANALYSIS_COMPLETED'
  | 'DESIGNING'
  | 'GENERATING_CODE'
  | 'BUILDING_PREVIEW'
  | 'AWAITING_APPROVAL'
  | 'EDITING'
  | 'CANCELLED'
  | 'APPLYING_CHANGES'
  | 'RUNNING_TESTS'
  | 'REPAIRING'
  | 'VALIDATING'
  | 'COMPLETED'
  | 'PARTIAL'
  | 'FAILED'
  | 'BLOCKED'
  | 'ROLLING_BACK';

export type OperationType =
  | 'ANALYSIS'
  | 'EXPLANATION'
  | 'DESIGN'
  | 'CODE_GENERATION'
  | 'FILE_CREATION'
  | 'PROJECT_BUILD'
  | 'REPAIR'
  | 'RECONSTRUCTION'
  | 'INTEGRATION'
  | 'TEST'
  | 'UPGRADE'
  | 'PACKAGING'
  | 'APPLY_CHANGES';

export interface ProposalFile {
  path: string;
  action: 'CREATE' | 'MODIFY' | 'DELETE';
  content: string;
  originalContent?: string;
  diffSummary?: string;
  description: string;
  module?: string;
}

export interface SelfDevProposal {
  id: string;
  timestamp: string;
  title: string;
  description: string;
  userPrompt: string;
  detectedIntent: string;
  operationType: OperationType;
  architectureOverview: string;
  proposedFiles: ProposalFile[];
  newCapabilities: string[];
  existingCapabilitiesReused: string[];
  redundanciesDetected: string[];
  newDependencies: string[];
  securityImpact: string;
  estimatedComplexity: 'LOW' | 'MEDIUM' | 'HIGH';
  estimatedEffortMinutes: number;
  preMergeTestResults: {
    name: string;
    status: 'PASS' | 'FAIL' | 'BLOCKED' | 'NOT_TESTED';
    detail: string;
  }[];
  uiPreviewComponent?: {
    name: string;
    componentType: 'WIDGET' | 'PANEL' | 'FORM' | 'METRICS' | 'CUSTOM';
    previewHtml?: string;
    spec: string;
  };
  snapshotId?: string;
}

export interface ZipDiffAnalysis {
  archiveName: string;
  fileCount: number;
  totalSizeBytes: number;
  sha256?: string;
  languages: string[];
  frameworks: string[];
  summary: string;
  nature: string;
  mainCapabilities: string[];
  reusableCode: string[];
  redundantWithNovin: string[];
  potentialIssues: string[];
  externalDependencies: string[];
  mergeableFeatures: string[];
  unnecessaryFeatures: string[];
  securityRisks: string[];
  proposedChanges: string[];
  estimatedComplexity: string;
  requiredTests: string[];
  technicalLimitations: string[];
}

export interface SelfDevLog {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS';
  stage: SelfDevState;
  message: string;
  evidence?: string;
}

export interface RollbackSnapshot {
  id: string;
  timestamp: string;
  description: string;
  filePaths: string[];
  backupDir?: string;
}

export interface SelfDevSession {
  id: string;
  status: SelfDevState;
  activeLanguage: 'fa' | 'en';
  isAudioMuted: boolean;
  isListening: boolean;
  history: {
    id: string;
    role: 'user' | 'assistant';
    text: string;
    audioPlayed?: boolean;
    timestamp: string;
  }[];
  currentProposal?: SelfDevProposal;
  zipAnalysis?: ZipDiffAnalysis;
  logs: SelfDevLog[];
  rollbackSnapshots: RollbackSnapshot[];
}
