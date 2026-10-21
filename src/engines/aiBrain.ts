import { EngineeringTask, Project, ProjectFile } from '../types';

export interface ContextSelectionOptions {
  maxTokens?: number; // e.g. 8000
  relevantKeywords?: string[];
  includeManifest?: boolean;
}

export function selectProjectContext(
  project: Project,
  query: string,
  options: ContextSelectionOptions = {}
): { contextSummary: string; selectedFiles: { path: string; excerpt: string }[]; estimatedTokens: number } {
  const queryTerms = query.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
  const scoredFiles: { file: ProjectFile; score: number }[] = [];

  for (const file of project.workingFiles) {
    if (file.isBinary) continue;
    let score = 0;
    const lowerPath = file.path.toLowerCase();
    const lowerContent = file.content.toLowerCase();

    // Check path matching
    for (const term of queryTerms) {
      if (lowerPath.includes(term)) score += 10;
      if (lowerContent.includes(term)) score += 2;
    }

    if (file.path.endsWith('AndroidManifest.xml')) score += 8;
    if (file.path.endsWith('build.gradle.kts') || file.path.endsWith('build.gradle')) score += 6;
    if (file.role === 'SOURCE') score += 3;

    scoredFiles.push({ file, score });
  }

  scoredFiles.sort((a, b) => b.score - a.score);

  // Take top files within budget
  const selected: { path: string; excerpt: string }[] = [];
  let tokenEstimate = 0;
  const maxTokens = options.maxTokens || 6000;

  for (const { file } of scoredFiles) {
    if (tokenEstimate >= maxTokens) break;
    const lines = file.content.split('\n');
    const snippet = lines.slice(0, 150).join('\n');
    const estTokens = Math.ceil(snippet.length / 4);
    if (tokenEstimate + estTokens <= maxTokens) {
      selected.push({ path: file.path, excerpt: snippet });
      tokenEstimate += estTokens;
    }
  }

  const contextSummary = `Project: ${project.name} (${project.projectType})\nFiles: ${project.workingFiles.length} total, ${project.securityFindings.length} security findings, ${project.duplicates.length} duplicate groups.`;

  return {
    contextSummary,
    selectedFiles: selected,
    estimatedTokens: tokenEstimate,
  };
}

export async function parseNaturalLanguageTask(
  prompt: string,
  project: Project
): Promise<EngineeringTask> {
  const taskId = `TASK-${Date.now().toString().slice(-6)}`;
  const lower = prompt.toLowerCase();

  let goal = 'Inspect and analyze engineering workspace';
  let scope = ['Workspace file trees', 'Project configuration'];
  let constraints = ['Preserve immutable source baseline', 'Never execute untrusted scripts'];
  let steps = [
    { id: 1, title: 'Analyze project structure and dependencies', status: 'PENDING' as const },
    { id: 2, title: 'Evaluate task requirements and safety implications', status: 'PENDING' as const },
    { id: 3, title: 'Formulate verifiable candidate solution', status: 'PENDING' as const },
  ];

  if (lower.includes('security') || lower.includes('vulnerabilit') || lower.includes('secret')) {
    goal = 'Audit project for hardcoded secrets, unsafe permissions, and network vulnerabilities.';
    scope = ['AndroidManifest.xml', 'Source code files', 'Network security configs'];
    constraints = ['Do not disclose production secrets', 'Flag high-risk permissions'];
    steps = [
      { id: 1, title: 'Scan manifest for cleartext traffic and exported components', status: 'PENDING' as const },
      { id: 2, title: 'Regex pattern search for exposed API keys and private tokens', status: 'PENDING' as const },
      { id: 3, title: 'Compile security findings report with remediation guidance', status: 'PENDING' as const },
    ];
  } else if (lower.includes('duplicate') || lower.includes('similar') || lower.includes('consolidation')) {
    goal = 'Detect duplicate binary and source implementations across modules and propose safe consolidation.';
    scope = ['Project files', 'Module resources', 'Call-site references'];
    constraints = ['Never delete identical files if both are independently referenced'];
    steps = [
      { id: 1, title: 'Compute SHA-256 hashes for all project entries', status: 'PENDING' as const },
      { id: 2, title: 'Run AST and normalized text similarity comparisons', status: 'PENDING' as const },
      { id: 3, title: 'Assess reference counts and consolidation risks', status: 'PENDING' as const },
    ];
  } else if (lower.includes('repair') || lower.includes('fix') || lower.includes('error')) {
    goal = 'Execute controlled 14-step code repair workflow with isolated candidate verification.';
    scope = ['Failing components', 'Configuration manifests', 'Test laboratory'];
    constraints = ['Never hide failing tests', 'Require human approval before applying patch'];
    steps = [
      { id: 1, title: 'Reproduce problem and collect exact error traces', status: 'PENDING' as const },
      { id: 2, title: 'Formulate minimal candidate patch in working sandbox', status: 'PENDING' as const },
      { id: 3, title: 'Run integrity and static analysis checks against baseline', status: 'PENDING' as const },
      { id: 4, title: 'Submit candidate diff for human engineering approval', status: 'PENDING' as const },
    ];
  } else if (lower.includes('architecture') || lower.includes('explain') || lower.includes('structure')) {
    goal = 'Synthesize comprehensive architecture model and verify clean separation of concerns.';
    scope = ['Activities', 'Services', 'Room Database', 'Repositories', 'AI Agents'];
    constraints = ['Detect architectural drift against project conventions'];
    steps = [
      { id: 1, title: 'Identify all entrypoints, services, and persistence layers', status: 'PENDING' as const },
      { id: 2, title: 'Build visual dependency graph with edge confidence levels', status: 'PENDING' as const },
      { id: 3, title: 'Evaluate architectural drift against clean architecture', status: 'PENDING' as const },
    ];
  } else if (lower.includes('agent') || lower.includes('module') || lower.includes('add')) {
    goal = 'Design and propose a modular NOVIN engineering extension with clean interfaces.';
    scope = ['New module declaration', 'Interface contracts', 'DI bindings'];
    constraints = ['Keep changes cohesive and fully reversible'];
    steps = [
      { id: 1, title: 'Define interface contract and schemas', status: 'PENDING' as const },
      { id: 2, title: 'Generate candidate implementation files in candidate branch', status: 'PENDING' as const },
      { id: 3, title: 'Verify compile dependencies without impacting protected baseline', status: 'PENDING' as const },
    ];
  }

  // Check if server-side Gemini endpoint is reachable
  try {
    const res = await fetch('/api/gemini/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, projectSummary: `${project.name} (${project.projectType})` }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.goal && data.steps) {
        goal = data.goal;
        scope = data.scope || scope;
        constraints = data.constraints || constraints;
        steps = data.steps;
      }
    }
  } catch {
    // Graceful offline fallback adheres to Master Principle #8 (no fake calls)
  }

  return {
    id: taskId,
    userPrompt: prompt,
    goal,
    scope,
    constraints,
    steps,
    status: 'PROPOSED',
    createdAt: new Date().toISOString(),
  };
}
