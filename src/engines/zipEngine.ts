import JSZip from 'jszip';
import { ArchiveAudit, FileRole, ProjectFile } from '../types';
import { calculateSha256 } from '../utils/crypto';

export interface ZipProcessingLimits {
  maxCompressedSizeBytes: number; // default 50 MB
  maxUncompressedSizeBytes: number; // default 150 MB
  maxEntriesCount: number; // default 3000 files
  maxCompressionRatio: number; // default 50x
  maxIndividualFileSizeBytes: number; // default 20 MB
}

export const DEFAULT_ZIP_LIMITS: ZipProcessingLimits = {
  maxCompressedSizeBytes: 50 * 1024 * 1024,
  maxUncompressedSizeBytes: 150 * 1024 * 1024,
  maxEntriesCount: 3000,
  maxCompressionRatio: 50,
  maxIndividualFileSizeBytes: 20 * 1024 * 1024,
};

function inferFileRole(path: string): FileRole {
  const lower = path.toLowerCase();
  const filename = lower.split('/').pop() || '';

  if (filename === 'androidmanifest.xml') return 'MANIFEST';
  if (filename.endsWith('.gradle') || filename.endsWith('.gradle.kts') || filename === 'gradle.properties') return 'BUILD_SCRIPT';
  if (filename === 'package.json' || filename === 'tsconfig.json' || filename.endsWith('.toml') || filename.endsWith('.yaml') || filename.endsWith('.yml')) return 'CONFIG';
  if (lower.includes('test') || filename.endsWith('test.kt') || filename.endsWith('test.java') || filename.endsWith('spec.ts')) return 'TEST';
  if (lower.includes('/res/') || lower.includes('/drawable') || lower.includes('/layout') || lower.includes('/values')) return 'RESOURCE';
  if (lower.includes('/assets/')) return 'ASSET';
  if (filename.endsWith('.md') || filename.endsWith('.txt')) return 'DOCUMENTATION';
  if (filename.endsWith('.kt') || filename.endsWith('.java') || filename.endsWith('.ts') || filename.endsWith('.tsx') || filename.endsWith('.js') || filename.endsWith('.py') || filename.endsWith('.rs') || filename.endsWith('.go') || filename.endsWith('.c') || filename.endsWith('.cpp')) {
    return 'SOURCE';
  }
  if (filename.endsWith('.png') || filename.endsWith('.jpg') || filename.endsWith('.so') || filename.endsWith('.jar') || filename.endsWith('.aar') || filename.endsWith('.apk') || filename.endsWith('.aab')) {
    return 'BINARY';
  }
  return 'UNKNOWN';
}

function isBinaryExtension(ext: string): boolean {
  const binaryExts = ['png', 'jpg', 'jpeg', 'gif', 'ico', 'webp', 'pdf', 'zip', 'tar', 'gz', 'so', 'jar', 'aar', 'dex', 'class', 'apk', 'aab', 'bin', 'exe'];
  return binaryExts.includes(ext.toLowerCase());
}

/**
 * Validates and extracts a ZIP buffer with strict defense-in-depth security checks.
 */
export async function processZipArchive(
  arrayBuffer: ArrayBuffer,
  filename: string,
  limits: ZipProcessingLimits = DEFAULT_ZIP_LIMITS
): Promise<{ audit: ArchiveAudit; files: ProjectFile[] }> {
  const archiveSize = arrayBuffer.byteLength;
  const sha256 = await calculateSha256(arrayBuffer);

  const warnings: string[] = [];
  const errors: string[] = [];
  const rejectedEntries: { path: string; reason: string }[] = [];
  const files: ProjectFile[] = [];

  // Check 1: Empty file or size limit
  if (archiveSize === 0) {
    return {
      audit: {
        valid: false,
        originalFilename: filename,
        archiveSize: 0,
        sha256,
        totalEntries: 0,
        validEntriesCount: 0,
        rejectedEntriesCount: 0,
        rejectedEntries: [],
        totalUncompressedSize: 0,
        compressionRatio: 0,
        warnings: [],
        errors: ['Archive is 0 bytes (empty file).'],
        quarantined: true,
        quarantineReason: 'Empty archive',
      },
      files: [],
    };
  }

  if (archiveSize > limits.maxCompressedSizeBytes) {
    errors.push(`Archive compressed size (${(archiveSize / 1024 / 1024).toFixed(1)} MB) exceeds allowed limit of ${(limits.maxCompressedSizeBytes / 1024 / 1024).toFixed(1)} MB`);
    return {
      audit: {
        valid: false,
        originalFilename: filename,
        archiveSize,
        sha256,
        totalEntries: 0,
        validEntriesCount: 0,
        rejectedEntriesCount: 0,
        rejectedEntries: [],
        totalUncompressedSize: 0,
        compressionRatio: 0,
        warnings: [],
        errors,
        quarantined: true,
        quarantineReason: 'Exceeded maximum compressed size limit (ZIP bomb prevention)',
      },
      files: [],
    };
  }

  // Check 2: ZIP signature header verification ('PK\x03\x04')
  const bytes = new Uint8Array(arrayBuffer.slice(0, 4));
  const isZipSignature = bytes[0] === 0x50 && bytes[1] === 0x4b && (bytes[2] === 0x03 || bytes[2] === 0x05 || bytes[2] === 0x07);
  if (!isZipSignature) {
    errors.push('Invalid ZIP signature: file header does not match PK\\x03\\x04 specification.');
    return {
      audit: {
        valid: false,
        originalFilename: filename,
        archiveSize,
        sha256,
        totalEntries: 0,
        validEntriesCount: 0,
        rejectedEntriesCount: 0,
        rejectedEntries: [],
        totalUncompressedSize: 0,
        compressionRatio: 0,
        warnings: [],
        errors,
        quarantined: true,
        quarantineReason: 'Invalid ZIP signature / Corrupted header',
      },
      files: [],
    };
  }

  // Parse ZIP
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(arrayBuffer, { checkCRC32: true });
  } catch (err: any) {
    errors.push(`Archive parsing failed: ${err.message || String(err)}`);
    return {
      audit: {
        valid: false,
        originalFilename: filename,
        archiveSize,
        sha256,
        totalEntries: 0,
        validEntriesCount: 0,
        rejectedEntriesCount: 0,
        rejectedEntries: [],
        totalUncompressedSize: 0,
        compressionRatio: 0,
        warnings: [],
        errors,
        quarantined: true,
        quarantineReason: 'Corrupted central directory or parsing error',
      },
      files: [],
    };
  }

  const rawEntries = Object.keys(zip.files);
  const totalEntries = rawEntries.length;

  // Check 3: Entry count limit
  if (totalEntries > limits.maxEntriesCount) {
    errors.push(`Archive contains ${totalEntries} entries, exceeding limit of ${limits.maxEntriesCount}`);
    return {
      audit: {
        valid: false,
        originalFilename: filename,
        archiveSize,
        sha256,
        totalEntries,
        validEntriesCount: 0,
        rejectedEntriesCount: totalEntries,
        rejectedEntries: [{ path: '*', reason: 'Total entries exceed limit' }],
        totalUncompressedSize: 0,
        compressionRatio: 0,
        warnings,
        errors,
        quarantined: true,
        quarantineReason: 'Excessive entry count (ZIP bomb defense)',
      },
      files: [],
    };
  }

  let totalUncompressedSize = 0;
  const pathCollisionTracker = new Set<string>();

  for (const rawPath of rawEntries) {
    const entry = zip.files[rawPath];
    if (entry.dir) continue;

    // Normalization & Traversal checks
    const normalizedPath = rawPath.replace(/\\/g, '/');

    // Security Check: Path Traversal attempts
    if (
      normalizedPath.includes('../') ||
      normalizedPath.startsWith('/') ||
      /^[a-zA-Z]:/.test(normalizedPath) ||
      normalizedPath.includes('\0')
    ) {
      rejectedEntries.push({
        path: rawPath,
        reason: 'Path traversal attempt or absolute path detected.',
      });
      continue;
    }

    // Security Check: Case-insensitive duplicate collisions
    const lowerPath = normalizedPath.toLowerCase();
    if (pathCollisionTracker.has(lowerPath)) {
      warnings.push(`Case-insensitive path collision detected: ${normalizedPath}`);
    }
    pathCollisionTracker.add(lowerPath);

    // Extract file content
    try {
      const ext = normalizedPath.split('.').pop() || '';
      const isBinary = isBinaryExtension(ext);
      let content = '';
      let fileBytes: Uint8Array;

      if (isBinary) {
        fileBytes = await entry.async('uint8array');
        // Limit individual file size
        if (fileBytes.byteLength > limits.maxIndividualFileSizeBytes) {
          rejectedEntries.push({
            path: normalizedPath,
            reason: `Individual file size (${(fileBytes.byteLength / 1024 / 1024).toFixed(1)} MB) exceeds limit.`,
          });
          continue;
        }
        totalUncompressedSize += fileBytes.byteLength;
        content = `[Binary Content: ${fileBytes.byteLength} bytes]`;
      } else {
        const textContent = await entry.async('string');
        const encoder = new TextEncoder();
        fileBytes = encoder.encode(textContent);

        if (fileBytes.byteLength > limits.maxIndividualFileSizeBytes) {
          rejectedEntries.push({
            path: normalizedPath,
            reason: `Individual file size (${(fileBytes.byteLength / 1024 / 1024).toFixed(1)} MB) exceeds limit.`,
          });
          continue;
        }
        totalUncompressedSize += fileBytes.byteLength;
        content = textContent;
      }

      // Check cumulative uncompressed size
      if (totalUncompressedSize > limits.maxUncompressedSizeBytes) {
        errors.push(`Total uncompressed size exceeds ${limits.maxUncompressedSizeBytes / 1024 / 1024} MB. Extraction halted.`);
        break;
      }

      const fileSha = await calculateSha256(fileBytes);
      const fileName = normalizedPath.split('/').pop() || '';

      files.push({
        path: normalizedPath,
        name: fileName,
        extension: ext,
        size: fileBytes.byteLength,
        sha256: fileSha,
        content,
        isBinary,
        role: inferFileRole(normalizedPath),
      });
    } catch (err: any) {
      rejectedEntries.push({
        path: normalizedPath,
        reason: `Failed to decompress entry: ${err.message || String(err)}`,
      });
    }
  }

  // Calculate compression ratio
  const compressionRatio = archiveSize > 0 ? totalUncompressedSize / archiveSize : 0;
  if (compressionRatio > limits.maxCompressionRatio) {
    warnings.push(`Suspicious compression ratio (${compressionRatio.toFixed(1)}x) detected.`);
  }

  const isQuarantined = rejectedEntries.some((r) => r.reason.includes('Path traversal'));

  const audit: ArchiveAudit = {
    valid: errors.length === 0 && !isQuarantined,
    originalFilename: filename,
    archiveSize,
    sha256,
    totalEntries,
    validEntriesCount: files.length,
    rejectedEntriesCount: rejectedEntries.length,
    rejectedEntries,
    totalUncompressedSize,
    compressionRatio: parseFloat(compressionRatio.toFixed(2)),
    warnings,
    errors,
    quarantined: isQuarantined,
    quarantineReason: isQuarantined ? 'Security violation: Path traversal or malicious entries detected' : undefined,
  };

  return { audit, files };
}
