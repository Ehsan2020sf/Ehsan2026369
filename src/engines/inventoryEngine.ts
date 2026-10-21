import { FileInventoryEntry, ProjectFile } from '../types';

export function generateFileInventory(
  workingFiles: ProjectFile[],
  baselineFiles: ProjectFile[]
): FileInventoryEntry[] {
  const baselineMap = new Map<string, ProjectFile>();
  baselineFiles.forEach((f) => baselineMap.set(f.path, f));

  // Build reference map
  const inventory: FileInventoryEntry[] = [];

  for (const file of workingFiles) {
    const linesCount = file.isBinary ? 0 : file.content.split('\n').length;
    const baseFile = baselineMap.get(file.path);

    let mutationStatus: FileInventoryEntry['mutationStatus'] = 'UNMODIFIED';
    if (!baseFile) {
      mutationStatus = 'ADDED';
    } else if (baseFile.sha256 !== file.sha256) {
      mutationStatus = 'MODIFIED';
    }

    // Calculate call sites / mentions in other files
    const baseName = file.name.split('.')[0];
    let callSitesCount = 0;
    if (baseName && baseName.length >= 3) {
      for (const other of workingFiles) {
        if (other.path !== file.path && !other.isBinary && other.content.includes(baseName)) {
          callSitesCount++;
        }
      }
    }

    // Determine module
    const parts = file.path.split('/');
    const module = parts.length > 2 ? parts[0] : 'root';

    inventory.push({
      path: file.path,
      name: file.name,
      extension: file.extension,
      size: file.size,
      linesCount,
      sha256: file.sha256,
      role: file.role,
      module,
      callSitesCount,
      baselineSha256: baseFile?.sha256,
      mutationStatus,
    });
  }

  // Check for deleted baseline files
  for (const baseFile of baselineFiles) {
    if (!workingFiles.some((f) => f.path === baseFile.path)) {
      inventory.push({
        path: baseFile.path,
        name: baseFile.name,
        extension: baseFile.extension,
        size: baseFile.size,
        linesCount: baseFile.isBinary ? 0 : baseFile.content.split('\n').length,
        sha256: baseFile.sha256,
        role: baseFile.role,
        module: baseFile.path.split('/').length > 2 ? baseFile.path.split('/')[0] : 'root',
        callSitesCount: 0,
        baselineSha256: baseFile.sha256,
        mutationStatus: 'DELETED',
      });
    }
  }

  return inventory.sort((a, b) => a.path.localeCompare(b.path));
}

export function generateSha256ChecksumManifest(files: ProjectFile[]): string {
  const header = `# NOVIN FORGE AI - Cryptographic SHA-256 Checksum Manifest\n# Generated: ${new Date().toISOString()}\n# Entries: ${files.length}\n\n`;
  const lines = files
    .slice()
    .sort((a, b) => a.path.localeCompare(b.path))
    .map((f) => `${f.sha256}  ${f.path}`);
  return header + lines.join('\n');
}

export function exportInventoryCsv(inventory: FileInventoryEntry[]): string {
  const header = 'Path,Name,Extension,Size_Bytes,Lines,Role,Module,SHA256,CallSites,MutationStatus\n';
  const rows = inventory.map(
    (e) =>
      `"${e.path}","${e.name}","${e.extension}",${e.size},${e.linesCount},"${e.role}","${e.module || ''}","${e.sha256}",${e.callSitesCount},"${e.mutationStatus}"`
  );
  return header + rows.join('\n');
}
