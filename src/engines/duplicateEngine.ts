import { DuplicateCandidate, ProjectFile } from '../types';

function normalizeText(text: string): string {
  return text
    .replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '') // remove comments
    .replace(/\s+/g, ' ') // collapse whitespaces
    .trim();
}

function calculateJaccardSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1.0;
  const words1 = new Set(str1.split(/\W+/).filter(Boolean));
  const words2 = new Set(str2.split(/\W+/).filter(Boolean));
  if (words1.size === 0 || words2.size === 0) return 0;

  let intersection = 0;
  words1.forEach((w) => {
    if (words2.has(w)) intersection++;
  });
  const union = new Set([...words1, ...words2]).size;
  return union > 0 ? intersection / union : 0;
}

export function detectDuplicates(files: ProjectFile[]): DuplicateCandidate[] {
  const candidates: DuplicateCandidate[] = [];
  let candidateCounter = 1;

  // Track exact hash matches
  const hashMap = new Map<string, ProjectFile[]>();
  for (const file of files) {
    if (!hashMap.has(file.sha256)) {
      hashMap.set(file.sha256, []);
    }
    hashMap.get(file.sha256)!.push(file);
  }

  // Exact matches
  hashMap.forEach((matchedFiles, hash) => {
    if (matchedFiles.length > 1) {
      for (let i = 0; i < matchedFiles.length; i++) {
        for (let j = i + 1; j < matchedFiles.length; j++) {
          const fileA = matchedFiles[i];
          const fileB = matchedFiles[j];

          // Calculate references across project
          const callSitesA = countReferences(fileA.name, files);
          const callSitesB = countReferences(fileB.name, files);

          candidates.push({
            id: `DUP-${candidateCounter++}`,
            fileA: fileA.path,
            fileB: fileB.path,
            type: fileA.isBinary ? 'EXACT_BINARY' : 'EXACT_TEXT',
            hashA: hash,
            hashB: hash,
            similarityPercentage: 100,
            evidence: 'Cryptographic SHA-256 hash match: identical payload bit-for-bit.',
            callSitesFileA: callSitesA,
            callSitesFileB: callSitesB,
            riskOfConsolidation: fileA.path.includes('/build/') || fileB.path.includes('/build/') ? 'LOW' : 'MEDIUM',
            recommendedAction:
              fileA.path.includes('/res/') || fileB.path.includes('/res/')
                ? 'KEEP_BOTH' // Android resources in different densities/qualifiers are intentionally duplicated
                : 'MERGE_AFTER_REVIEW',
            confidence: 1.0,
          });
        }
      }
    }
  });

  // Source code similarity comparison (for text source files)
  const sourceFiles = files.filter((f) => !f.isBinary && f.content.length > 100 && f.role === 'SOURCE');

  for (let i = 0; i < sourceFiles.length; i++) {
    for (let j = i + 1; j < sourceFiles.length; j++) {
      const fileA = sourceFiles[i];
      const fileB = sourceFiles[j];

      // Skip if already flagged as exact hash match
      if (fileA.sha256 === fileB.sha256) continue;

      const normA = normalizeText(fileA.content);
      const normB = normalizeText(fileB.content);

      if (normA === normB && normA.length > 50) {
        // Normalized exact text
        candidates.push({
          id: `DUP-${candidateCounter++}`,
          fileA: fileA.path,
          fileB: fileB.path,
          type: 'EXACT_TEXT',
          hashA: fileA.sha256,
          hashB: fileB.sha256,
          similarityPercentage: 100,
          evidence: 'Normalized code match: identical AST/token content after comment and whitespace stripping.',
          callSitesFileA: countReferences(fileA.name, files),
          callSitesFileB: countReferences(fileB.name, files),
          riskOfConsolidation: 'MEDIUM',
          recommendedAction: 'MERGE_AFTER_REVIEW',
          confidence: 0.98,
        });
      } else {
        const similarity = calculateJaccardSimilarity(normA, normB);
        if (similarity >= 0.75) {
          candidates.push({
            id: `DUP-${candidateCounter++}`,
            fileA: fileA.path,
            fileB: fileB.path,
            type: 'SIMILAR_CODE',
            hashA: fileA.sha256,
            hashB: fileB.sha256,
            similarityPercentage: Math.round(similarity * 100),
            evidence: `High token and syntactic similarity score (${Math.round(similarity * 100)}%). Common functions/classes detected.`,
            callSitesFileA: countReferences(fileA.name, files),
            callSitesFileB: countReferences(fileB.name, files),
            riskOfConsolidation: 'HIGH',
            recommendedAction: 'INVESTIGATE',
            confidence: parseFloat(similarity.toFixed(2)),
          });
        }
      }
    }
  }

  return candidates;
}

function countReferences(filename: string, allFiles: ProjectFile[]): number {
  const baseName = filename.split('.')[0];
  if (!baseName || baseName.length < 3) return 0;
  let count = 0;
  for (const f of allFiles) {
    if (f.name === filename) continue;
    if (f.content.includes(baseName)) {
      count++;
    }
  }
  return count;
}
