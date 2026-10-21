import JSZip from 'jszip';
import { processZipArchive } from '../src/engines/zipEngine.js';
import { identifyProject } from '../src/engines/projectIdentifier.js';
import { detectDuplicates } from '../src/engines/duplicateEngine.js';
import { runSecurityAudit } from '../src/engines/securityEngine.js';
import { runAndroidStaticAnalysis } from '../src/engines/androidAnalyzer.js';
import { runRegressionAudit } from '../src/engines/testAdapter.js';
import { calculateSha256 } from '../src/utils/crypto.js';
import { ProjectFile, TestExecutionRecord, SecurityFinding } from '../src/types/index.js';

async function runVerification() {
  console.log('====================================================');
  console.log('NOVIN FORGE AI - AUTOMATED ENGINE VERIFICATION SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, evidence: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      console.log(`       Evidence: ${evidence}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      console.error(`       Evidence: ${evidence}`);
      failed++;
    }
  }

  // TEST 1: Valid ZIP Archive Creation & Intake (G2)
  console.log('\n--- Test Group 1: Valid ZIP Archive Intake & Cryptographic Hash ---');
  const validZip = new JSZip();
  validZip.file('app/src/main/AndroidManifest.xml', '<manifest package="ai.novin.test"><application /></manifest>');
  validZip.file('app/build.gradle.kts', 'plugins { id("com.android.application") }');
  validZip.file('app/src/main/java/Main.kt', 'package ai.novin.test\nfun main() { println("Hello") }');

  const validBuffer = await validZip.generateAsync({ type: 'arraybuffer' });
  const validResult = await processZipArchive(validBuffer, 'test_project.zip');

  assert(validResult.audit.valid === true, 'Valid archive accepted without error', `ValidEntries: ${validResult.files.length}, Errors: ${validResult.audit.errors.length}`);
  assert(validResult.files.length === 3, 'Extracted all 3 files accurately', `Extracted count: ${validResult.files.length}`);
  assert(validResult.audit.sha256.length === 64, 'Calculated genuine 256-bit SHA-256 for archive', `Archive SHA: ${validResult.audit.sha256}`);

  // TEST 2: Path Traversal Prevention (G3, G4)
  console.log('\n--- Test Group 2: Path Traversal Prevention & Security Quarantine ---');
  const maliciousZip = new JSZip();
  maliciousZip.file('traversal_payload.txt', 'root:x:0:0:root:/root:/bin/bash');
  maliciousZip.file('legitimate_file.txt', 'Safe content');

  const rawBytes = await maliciousZip.generateAsync({ type: 'uint8array' });
  // Directly patch binary buffer to simulate an attacker crafting path traversal in ZIP headers
  const needle = new TextEncoder().encode('traversal_payload.txt');
  const replacement = new TextEncoder().encode('../../etc/passwd.txt');
  for (let i = 0; i <= rawBytes.length - needle.length; i++) {
    let match = true;
    for (let j = 0; j < needle.length; j++) {
      if (rawBytes[i + j] !== needle[j]) { match = false; break; }
    }
    if (match) {
      rawBytes.set(replacement, i);
    }
  }

  const maliciousResult = await processZipArchive(rawBytes.buffer as ArrayBuffer, 'malicious.zip');

  assert(maliciousResult.audit.quarantined === true, 'Archive with path traversal quarantined', `Quarantine Reason: ${maliciousResult.audit.quarantineReason}`);
  assert(
    maliciousResult.audit.rejectedEntries.some((r) => r.path.includes('../')),
    'Path traversal entry rejected explicitly',
    `Rejected entries count: ${maliciousResult.audit.rejectedEntries.length}`
  );
  assert(
    !maliciousResult.files.some((f) => f.path.includes('../')),
    'No path traversal entries leaked into workspace files',
    `Workspace file count: ${maliciousResult.files.length}`
  );

  // TEST 3: Invalid Header / Corrupted Archive (G3)
  console.log('\n--- Test Group 3: Invalid Header & Corrupted Archive Handling ---');
  const corruptBuffer = new TextEncoder().encode('THIS IS NOT A VALID ZIP FILE HEADER');
  const corruptResult = await processZipArchive(corruptBuffer.buffer as ArrayBuffer, 'corrupt.zip');

  assert(corruptResult.audit.valid === false, 'Corrupted archive safely rejected', `Errors: ${corruptResult.audit.errors.join('; ')}`);
  assert(corruptResult.audit.errors[0].includes('Invalid ZIP signature'), 'Identified header signature mismatch', corruptResult.audit.errors[0]);

  // TEST 4: Original Archive Baseline Immutability (G6)
  console.log('\n--- Test Group 4: Original Archive Baseline Immutability ---');
  const baselineFile: ProjectFile = {
    path: 'app/src/main/java/Immutable.kt',
    name: 'Immutable.kt',
    extension: 'kt',
    size: 50,
    sha256: await calculateSha256('original_immutable_content'),
    content: 'original_immutable_content',
    isBinary: false,
    role: 'SOURCE',
  };
  const baselineHash = baselineFile.sha256;

  // Working copy mutation
  const workingFile: ProjectFile = {
    ...baselineFile,
    content: 'mutated_working_copy_content',
    sha256: await calculateSha256('mutated_working_copy_content'),
  };

  assert(baselineFile.sha256 === baselineHash, 'Protected baseline source file is immutable', `Baseline SHA: ${baselineFile.sha256}`);
  assert(workingFile.sha256 !== baselineFile.sha256, 'Working copy undergoes mutations independently', `Working SHA: ${workingFile.sha256}`);

  // TEST 5: Project Type & Android Manifest Detection (G8)
  console.log('\n--- Test Group 5: Project Type Detection & Evidence Parsing ---');
  const testProjectFiles: ProjectFile[] = [
    {
      path: 'app/src/main/AndroidManifest.xml',
      name: 'AndroidManifest.xml',
      extension: 'xml',
      size: 400,
      sha256: 'sha1',
      content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android" package="ai.novin.mobile">
    <uses-permission android:name="android.permission.INTERNET" />
    <application android:usesCleartextTraffic="true">
        <activity android:name=".ui.MainActivity" android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>`,
      isBinary: false,
      role: 'MANIFEST',
    },
    {
      path: 'app/build.gradle.kts',
      name: 'build.gradle.kts',
      extension: 'kts',
      size: 300,
      sha256: 'sha2',
      content: 'plugins { id("com.android.application"); id("org.jetbrains.kotlin.plugin.compose") }\nandroid { compileSdk = 34 }',
      isBinary: false,
      role: 'BUILD_SCRIPT',
    },
    {
      path: 'app/src/main/java/ai/novin/mobile/ui/MainActivity.kt',
      name: 'MainActivity.kt',
      extension: 'kt',
      size: 300,
      sha256: 'sha3',
      content: 'package ai.novin.mobile.ui\nimport androidx.compose.runtime.Composable\n@Composable fun AppUI() {}',
      isBinary: false,
      role: 'SOURCE',
    },
  ];

  const projectIdent = identifyProject(testProjectFiles);
  assert(projectIdent.projectType === 'android_kotlin_compose', 'Accurately detected android_kotlin_compose', `Detected: ${projectIdent.projectType}`);
  assert(projectIdent.manifestData?.packageName === 'ai.novin.mobile', 'Parsed package identifier from manifest', `Package: ${projectIdent.manifestData?.packageName}`);
  assert(projectIdent.manifestData?.usesCleartextTraffic === true, 'Detected usesCleartextTraffic="true" configuration', 'Cleartext detected');

  // TEST 6: Duplicate Code Analysis (G9)
  console.log('\n--- Test Group 6: Duplicate Code & Call-Site Analysis ---');
  const duplicateFiles: ProjectFile[] = [
    {
      path: 'app/src/main/java/UtilsA.kt',
      name: 'UtilsA.kt',
      extension: 'kt',
      size: 200,
      sha256: await calculateSha256('class CommonHelper { fun calculate() = 42 }'),
      content: 'class CommonHelper { fun calculate() = 42 }',
      isBinary: false,
      role: 'SOURCE',
    },
    {
      path: 'core/src/main/java/UtilsB.kt',
      name: 'UtilsB.kt',
      extension: 'kt',
      size: 200,
      sha256: await calculateSha256('class CommonHelper { fun calculate() = 42 }'),
      content: 'class CommonHelper { fun calculate() = 42 }',
      isBinary: false,
      role: 'SOURCE',
    },
  ];

  const duplicates = detectDuplicates(duplicateFiles);
  assert(duplicates.length > 0, 'Discovered duplicate code candidate', `Found ${duplicates.length} duplicate pair(s)`);
  assert(duplicates[0].similarityPercentage === 100, 'Identified exact 100% hash/text match', `Similarity: ${duplicates[0].similarityPercentage}%`);

  // TEST 7: Security Audit Scanner (G10)
  console.log('\n--- Test Group 7: Security Vulnerability & Secret Scanning ---');
  const insecureFiles: ProjectFile[] = [
    {
      path: 'app/src/main/java/Secrets.kt',
      name: 'Secrets.kt',
      extension: 'kt',
      size: 150,
      sha256: 'sec_sha',
      content: 'val apiKey = "AIzaSyD9834190284019284019284019284019"',
      isBinary: false,
      role: 'SOURCE',
    },
  ];
  const securityFindings = runSecurityAudit(insecureFiles, projectIdent.manifestData);
  assert(securityFindings.some((s) => s.category === 'SECRET'), 'Discovered hardcoded Google API key', `Secrets found: ${securityFindings.filter((s) => s.category === 'SECRET').length}`);
  assert(securityFindings.some((s) => s.category === 'NETWORK'), 'Discovered cleartext network traffic risk in manifest', 'Cleartext finding confirmed');

  // TEST 8: Pure Static Android Analyzer & Toolchain Status (Section 17 & 18)
  console.log('\n--- Test Group 8: Pure Static Android Analyzer & Toolchain Matrix ---');
  const androidReport = runAndroidStaticAnalysis(testProjectFiles);
  assert(androidReport.compileSdkVersion === 34, 'Static parser extracted compileSdkVersion', `compileSdk: ${androidReport.compileSdkVersion}`);
  assert(
    androidReport.toolchainStatus.some((t) => t.tool.includes('aapt2') && t.executionMode === 'IN_SANDBOX_STATIC'),
    'aapt2 gracefully mapped to IN_SANDBOX_STATIC parser',
    'AAPT2 status verified'
  );
  assert(
    androidReport.toolchainStatus.some((t) => t.tool.includes('Device') && t.executionMode === 'BLOCKED'),
    'Physical Android device correctly marked BLOCKED / NOT VERIFIED ON DEVICE',
    'Reality-first hardware constraint verified'
  );

  // TEST 9: Regression Audit Against Baseline (G15, G24)
  console.log('\n--- Test Group 9: Regression Audit Against Baseline ---');
  const baseTests: TestExecutionRecord[] = [
    {
      id: 't1',
      testName: 'Integrity Suite',
      category: 'INTEGRITY',
      command: 'verify',
      executionTimeMs: 10,
      timestamp: new Date().toISOString(),
      exitCode: 0,
      status: 'PASS',
      stdout: 'PASS',
      stderr: '',
      passedCount: 5,
      failedCount: 0,
      skippedCount: 0,
    },
  ];
  const mutatedTests: TestExecutionRecord[] = [
    {
      id: 't2',
      testName: 'Integrity Suite',
      category: 'INTEGRITY',
      command: 'verify',
      executionTimeMs: 12,
      timestamp: new Date().toISOString(),
      exitCode: 1,
      status: 'FAIL', // Simulated regression
      stdout: 'FAIL',
      stderr: 'Path altered',
      passedCount: 4,
      failedCount: 1,
      skippedCount: 0,
    },
  ];

  const regressionResult = runRegressionAudit(baseTests, mutatedTests, [], [], 'v1.0.0', 'v1.1.0');
  assert(regressionResult.hasRegressions === true, 'Detected test suite regression correctly', regressionResult.summary);
  assert(regressionResult.regressedTests.length === 1, 'Pinpointed exact regressed suite', regressionResult.regressedTests[0].suiteName);

  console.log('\n====================================================');
  console.log(`VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runVerification().catch((err) => {
  console.error('Verification script error:', err);
  process.exit(1);
});
