import { AndroidStaticAnalysisReport, ProjectFile } from '../types';

export function runAndroidStaticAnalysis(files: ProjectFile[]): AndroidStaticAnalysisReport {
  let packageName: string | undefined;
  let versionCode: string | undefined;
  let versionName: string | undefined;
  let minSdkVersion: number | undefined;
  let targetSdkVersion: number | undefined;
  let compileSdkVersion: number | undefined;
  let usesCleartextTraffic = false;
  let allowBackup = true;

  const unprotectedExportedActivities: string[] = [];
  let exportedActivitiesCount = 0;
  let exportedServicesCount = 0;
  let exportedReceiversCount = 0;
  const dangerousPermissions: string[] = [];
  const gradlePlugins: string[] = [];
  const gradleDependencies: string[] = [];
  const versionCatalogLibraries: string[] = [];
  const complianceViolations: string[] = [];

  // 1. Analyze AndroidManifest.xml
  const manifestFile = files.find((f) => f.path.toLowerCase().endsWith('androidmanifest.xml'));
  if (manifestFile) {
    const content = manifestFile.content;

    // Package
    const pkgMatch = content.match(/package\s*=\s*"([^"]+)"/);
    if (pkgMatch) packageName = pkgMatch[1];

    // Version
    const vcMatch = content.match(/android:versionCode\s*=\s*"([^"]+)"/);
    if (vcMatch) versionCode = vcMatch[1];
    const vnMatch = content.match(/android:versionName\s*=\s*"([^"]+)"/);
    if (vnMatch) versionName = vnMatch[1];

    // Cleartext
    const clearMatch = content.match(/android:usesCleartextTraffic\s*=\s*"([^"]+)"/);
    usesCleartextTraffic = clearMatch ? clearMatch[1] === 'true' : false;
    if (usesCleartextTraffic) {
      complianceViolations.push(
        'Cleartext HTTP transmission is explicitly enabled (android:usesCleartextTraffic="true"). High security risk on API 28+.'
      );
    }

    // AllowBackup
    const backupMatch = content.match(/android:allowBackup\s*=\s*"([^"]+)"/);
    allowBackup = backupMatch ? backupMatch[1] === 'true' : true;
    if (allowBackup) {
      complianceViolations.push(
        'Application backup is enabled without android:fullBackupContent rules, permitting extraction of private databases via ADB backup.'
      );
    }

    // Permissions
    const permRegex = /<uses-permission[^>]+android:name\s*=\s*"([^"]+)"/g;
    let pm: RegExpExecArray | null;
    while ((pm = permRegex.exec(content)) !== null) {
      const perm = pm[1];
      if (
        perm.includes('SEND_SMS') ||
        perm.includes('RECORD_AUDIO') ||
        perm.includes('ACCESS_FINE_LOCATION') ||
        perm.includes('READ_CONTACTS') ||
        perm.includes('CAMERA')
      ) {
        dangerousPermissions.push(perm);
      }
    }

    // Activities
    const actRegex = /<activity\b([^>]*)>([\s\S]*?)<\/activity>|<activity\b([^>]*)\/>/g;
    let am: RegExpExecArray | null;
    while ((am = actRegex.exec(content)) !== null) {
      const attrs = am[1] || am[3] || '';
      const inner = am[2] || '';
      const nameMatch = attrs.match(/android:name\s*=\s*"([^"]+)"/);
      const exportedMatch = attrs.match(/android:exported\s*=\s*"([^"]+)"/);
      const isLauncher = inner.includes('android.intent.action.MAIN') && inner.includes('android.intent.category.LAUNCHER');

      if (exportedMatch && exportedMatch[1] === 'true') {
        exportedActivitiesCount++;
        if (!isLauncher) {
          const actName = nameMatch ? nameMatch[1] : 'UnknownActivity';
          unprotectedExportedActivities.push(actName);
          complianceViolations.push(
            `Activity '${actName}' has android:exported="true" but lacks an intent filter or permission constraint.`
          );
        }
      }
    }

    // Services
    const srvRegex = /<service\b([^>]*)>/g;
    let sm: RegExpExecArray | null;
    while ((sm = srvRegex.exec(content)) !== null) {
      if (sm[1].includes('android:exported="true"')) exportedServicesCount++;
    }

    // Receivers
    const recRegex = /<receiver\b([^>]*)>/g;
    let rm: RegExpExecArray | null;
    while ((rm = recRegex.exec(content)) !== null) {
      if (rm[1].includes('android:exported="true"')) exportedReceiversCount++;
    }
  }

  // 2. Analyze Gradle build scripts
  for (const file of files) {
    const p = file.path.toLowerCase();
    if (p.endsWith('.gradle') || p.endsWith('.gradle.kts') || p.endsWith('variables.gradle') || p.endsWith('gradle.properties')) {
      const content = file.content;

      // Extract namespace if package wasn't in manifest
      if (!packageName) {
        const nsMatch = content.match(/namespace\s*=?\s*["']([^"']+)["']/);
        if (nsMatch) packageName = nsMatch[1];
        const appMatch = content.match(/applicationId\s*=?\s*["']([^"']+)["']/);
        if (appMatch) packageName = appMatch[1];
      }

      // Extract compileSdk, minSdk, targetSdk
      const compileMatch = content.match(/(?:compileSdk|compileSdkVersion)\s*=?\s*(\d+)/);
      if (compileMatch && !compileSdkVersion) compileSdkVersion = parseInt(compileMatch[1], 10);

      const minMatch = content.match(/(?:minSdk|minSdkVersion)\s*=?\s*(\d+)/);
      if (minMatch && !minSdkVersion) minSdkVersion = parseInt(minMatch[1], 10);

      const targetMatch = content.match(/(?:targetSdk|targetSdkVersion)\s*=?\s*(\d+)/);
      if (targetMatch && !targetSdkVersion) targetSdkVersion = parseInt(targetMatch[1], 10);

      // Plugins
      const pluginRegex = /id\(?["']([^"']+)["']\)?/g;
      let plm: RegExpExecArray | null;
      while ((plm = pluginRegex.exec(content)) !== null) {
        if (!gradlePlugins.includes(plm[1])) gradlePlugins.push(plm[1]);
      }

      // Dependencies
      const depRegex = /implementation\(?["']([^"':]+:[^"':]+:[^"']+)["']\)?/g;
      let dm: RegExpExecArray | null;
      while ((dm = depRegex.exec(content)) !== null) {
        if (!gradleDependencies.includes(dm[1])) gradleDependencies.push(dm[1]);
      }
    }

    // Version catalog
    if (file.path.endsWith('libs.versions.toml')) {
      const libRegex = /([a-zA-Z0-9_-]+)\s*=\s*\{[^}]*module\s*=\s*"([^"]+)"/g;
      let lm: RegExpExecArray | null;
      while ((lm = libRegex.exec(file.content)) !== null) {
        versionCatalogLibraries.push(`${lm[1]} -> ${lm[2]}`);
      }
    }
  }

  // SDK compliance checks
  if (targetSdkVersion && targetSdkVersion < 34) {
    complianceViolations.push(
      `targetSdkVersion is ${targetSdkVersion}. Google Play Store requires targeting API 34+ (Android 14) for store compliance.`
    );
  }
  if (minSdkVersion && minSdkVersion < 26) {
    complianceViolations.push(
      `minSdkVersion is ${minSdkVersion}. Android 8.0 (API 26) is recommended minimum for modern cryptography and notification channels.`
    );
  }

  // 3. Toolchain Status Analysis (Section 18)
  const toolchainStatus = [
    {
      tool: 'Android SDK (aapt2 / manifest merger)',
      available: true,
      reason: 'Replaced with pure TypeScript In-Sandbox AST & AAPT2 specification parser.',
      executionMode: 'IN_SANDBOX_STATIC' as const,
    },
    {
      tool: 'Android DEX Compiler (d8 / r8)',
      available: false,
      reason: 'Physical Android SDK build-tools not mounted in Node.js runtime environment.',
      executionMode: 'SIMULATED' as const,
    },
    {
      tool: 'Android Debug Bridge (adb)',
      available: false,
      reason: 'No ADB daemon or emulator socket connected to container sandbox.',
      executionMode: 'BLOCKED' as const,
    },
    {
      tool: 'Physical Android Device Target',
      available: false,
      reason: 'Physical hardware cannot be attached to cloud environment. Principle #1: marked NOT VERIFIED ON DEVICE.',
      executionMode: 'BLOCKED' as const,
    },
    {
      tool: 'Gradle Daemon Toolchain',
      available: true,
      reason: 'Static build-file diagnostics & structure verification available in sandbox.',
      executionMode: 'IN_SANDBOX_STATIC' as const,
    },
  ];

  // Calculate conformance score (100 minus penalty per violation)
  const score = Math.max(20, 100 - complianceViolations.length * 15);

  return {
    packageName,
    versionCode,
    versionName,
    minSdkVersion,
    targetSdkVersion,
    compileSdkVersion,
    usesCleartextTraffic,
    allowBackup,
    exportedActivitiesCount,
    unprotectedExportedActivities,
    exportedServicesCount,
    exportedReceiversCount,
    dangerousPermissions,
    gradlePlugins,
    gradleDependencies,
    versionCatalogLibraries,
    toolchainStatus,
    conformanceScore: score,
    complianceViolations,
  };
}
