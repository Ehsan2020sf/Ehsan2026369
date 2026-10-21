import { ManifestData, ProjectFile, ProjectType } from '../types';

export interface ProjectIdentificationResult {
  projectType: ProjectType;
  detectedFrameworks: string[];
  detectedLanguages: string[];
  buildSystem: string;
  manifestData?: ManifestData;
  modules: string[];
  packageManifests: string[];
}

export function parseAndroidManifest(manifestContent: string): ManifestData {
  const permissions: string[] = [];
  const activities: { name: string; exported: boolean; isLauncher: boolean }[] = [];
  const services: { name: string; exported: boolean }[] = [];
  const receivers: { name: string; exported: boolean }[] = [];

  // Extract package
  const pkgMatch = manifestContent.match(/package\s*=\s*"([^"]+)"/);
  const packageName = pkgMatch ? pkgMatch[1] : undefined;

  // Extract versionCode & versionName
  const versionCodeMatch = manifestContent.match(/android:versionCode\s*=\s*"([^"]+)"/);
  const versionNameMatch = manifestContent.match(/android:versionName\s*=\s*"([^"]+)"/);

  // Extract usesCleartextTraffic
  const cleartextMatch = manifestContent.match(/android:usesCleartextTraffic\s*=\s*"([^"]+)"/);
  const usesCleartextTraffic = cleartextMatch ? cleartextMatch[1] === 'true' : false;

  // Extract permissions
  const permRegex = /<uses-permission[^>]+android:name\s*=\s*"([^"]+)"/g;
  let permMatch: RegExpExecArray | null;
  while ((permMatch = permRegex.exec(manifestContent)) !== null) {
    if (!permissions.includes(permMatch[1])) {
      permissions.push(permMatch[1]);
    }
  }

  // Extract activities
  const activityRegex = /<activity\b([^>]*)>([\s\S]*?)<\/activity>|<activity\b([^>]*)\/>/g;
  let actMatch: RegExpExecArray | null;
  while ((actMatch = activityRegex.exec(manifestContent)) !== null) {
    const attrs = actMatch[1] || actMatch[3] || '';
    const inner = actMatch[2] || '';
    const nameMatch = attrs.match(/android:name\s*=\s*"([^"]+)"/);
    const exportedMatch = attrs.match(/android:exported\s*=\s*"([^"]+)"/);
    const isLauncher = inner.includes('android.intent.action.MAIN') && inner.includes('android.intent.category.LAUNCHER');

    if (nameMatch) {
      activities.push({
        name: nameMatch[1],
        exported: exportedMatch ? exportedMatch[1] === 'true' : false,
        isLauncher,
      });
    }
  }

  // Extract services
  const serviceRegex = /<service\b([^>]*)>([\s\S]*?)<\/service>|<service\b([^>]*)\/>/g;
  let srvMatch: RegExpExecArray | null;
  while ((srvMatch = serviceRegex.exec(manifestContent)) !== null) {
    const attrs = srvMatch[1] || srvMatch[3] || '';
    const nameMatch = attrs.match(/android:name\s*=\s*"([^"]+)"/);
    const exportedMatch = attrs.match(/android:exported\s*=\s*"([^"]+)"/);
    if (nameMatch) {
      services.push({
        name: nameMatch[1],
        exported: exportedMatch ? exportedMatch[1] === 'true' : false,
      });
    }
  }

  // Extract receivers
  const receiverRegex = /<receiver\b([^>]*)>([\s\S]*?)<\/receiver>|<receiver\b([^>]*)\/>/g;
  let recMatch: RegExpExecArray | null;
  while ((recMatch = receiverRegex.exec(manifestContent)) !== null) {
    const attrs = recMatch[1] || recMatch[3] || '';
    const nameMatch = attrs.match(/android:name\s*=\s*"([^"]+)"/);
    const exportedMatch = attrs.match(/android:exported\s*=\s*"([^"]+)"/);
    if (nameMatch) {
      receivers.push({
        name: nameMatch[1],
        exported: exportedMatch ? exportedMatch[1] === 'true' : false,
      });
    }
  }

  return {
    packageName,
    versionCode: versionCodeMatch ? versionCodeMatch[1] : undefined,
    versionName: versionNameMatch ? versionNameMatch[1] : undefined,
    permissions,
    activities,
    services,
    receivers,
    usesCleartextTraffic,
  };
}

export function identifyProject(files: ProjectFile[]): ProjectIdentificationResult {
  const frameworks = new Set<string>();
  const languages = new Set<string>();
  const modules = new Set<string>();
  const packageManifests: string[] = [];

  let hasGradle = false;
  let hasGradleKts = false;
  let hasKotlin = false;
  let hasJava = false;
  let hasCompose = false;
  let hasAndroidManifest = false;
  let manifestContent = '';
  let hasPackageJson = false;
  let hasTsConfig = false;
  let hasPython = false;
  let hasFlutter = false;
  let hasRust = false;
  let hasGo = false;

  for (const file of files) {
    const path = file.path.toLowerCase();
    const ext = file.extension.toLowerCase();

    // Module detection from path
    const parts = file.path.split('/');
    if (parts.length > 2 && (parts[0] === 'app' || parts[0] === 'core' || parts[0] === 'feature' || parts[0] === 'module')) {
      modules.add(parts[0]);
    }

    // Android & Gradle evidence
    if (path.endsWith('build.gradle.kts') || path.endsWith('settings.gradle.kts')) {
      hasGradleKts = true;
      hasGradle = true;
      packageManifests.push(file.path);
    } else if (path.endsWith('build.gradle') || path.endsWith('settings.gradle')) {
      hasGradle = true;
      packageManifests.push(file.path);
    }

    if (path.endsWith('androidmanifest.xml')) {
      hasAndroidManifest = true;
      manifestContent = file.content;
      packageManifests.push(file.path);
    }

    // Languages
    if (ext === 'kt') {
      hasKotlin = true;
      languages.add('Kotlin');
      if (file.content.includes('@Composable') || file.content.includes('androidx.compose')) {
        hasCompose = true;
        frameworks.add('Jetpack Compose');
      }
      if (file.content.includes('@Entity') || file.content.includes('@Dao') || file.content.includes('RoomDatabase')) {
        frameworks.add('Room Database (SQLite)');
      }
      if (file.content.includes('ViewModel') || file.content.includes('androidx.lifecycle')) {
        frameworks.add('Android Architecture Components');
      }
      if (file.content.includes('Retrofit') || file.content.includes('OkHttp')) {
        frameworks.add('Retrofit / OkHttp Networking');
      }
      if (file.content.includes('GenerativeModel') || file.content.includes('google.ai.client.generativeai')) {
        frameworks.add('Gemini AI Android SDK');
      }
    } else if (ext === 'java') {
      hasJava = true;
      languages.add('Java');
    } else if (ext === 'ts' || ext === 'tsx') {
      languages.add('TypeScript');
    } else if (ext === 'js' || ext === 'jsx') {
      languages.add('JavaScript');
    } else if (ext === 'py') {
      hasPython = true;
      languages.add('Python');
    } else if (ext === 'dart') {
      hasFlutter = true;
      languages.add('Dart');
    } else if (ext === 'rs') {
      hasRust = true;
      languages.add('Rust');
    } else if (ext === 'go') {
      hasGo = true;
      languages.add('Go');
    }

    if (path.endsWith('package.json')) {
      hasPackageJson = true;
      packageManifests.push(file.path);
      if (file.content.includes('react')) frameworks.add('React');
      if (file.content.includes('tailwindcss')) frameworks.add('Tailwind CSS');
      if (file.content.includes('express')) frameworks.add('Express.js');
    }
    if (path.endsWith('tsconfig.json')) hasTsConfig = true;
    if (path.endsWith('pubspec.yaml')) {
      hasFlutter = true;
      frameworks.add('Flutter');
    }
    if (path.endsWith('cargo.toml')) hasRust = true;
  }

  // Parse Manifest if present
  let manifestData: ManifestData | undefined;
  if (hasAndroidManifest && manifestContent) {
    manifestData = parseAndroidManifest(manifestContent);
  }

  // Determine Project Type by evidence weight
  let projectType: ProjectType = 'unknown';
  let buildSystem = 'None detected';

  if (hasAndroidManifest || hasGradle || (hasKotlin && hasJava)) {
    if (hasCompose) {
      projectType = 'android_kotlin_compose';
      frameworks.add('Android SDK');
      buildSystem = hasGradleKts ? 'Gradle (Kotlin DSL)' : 'Gradle (Groovy DSL)';
    } else if (hasKotlin) {
      projectType = 'android_gradle';
      frameworks.add('Android SDK');
      buildSystem = hasGradleKts ? 'Gradle (Kotlin DSL)' : 'Gradle (Groovy DSL)';
    } else if (hasJava && hasAndroidManifest) {
      projectType = 'android_java';
      frameworks.add('Android SDK');
      buildSystem = 'Gradle (Groovy)';
    } else {
      projectType = 'android_gradle';
      buildSystem = 'Gradle';
    }
  } else if (hasPackageJson && (hasTsConfig || languages.has('TypeScript'))) {
    projectType = 'react_typescript';
    buildSystem = 'npm / Vite / Node.js';
  } else if (hasPackageJson) {
    projectType = 'node_javascript';
    buildSystem = 'npm / Node.js';
  } else if (hasPython) {
    projectType = 'python';
    buildSystem = 'pip / pyproject';
  } else if (hasFlutter) {
    projectType = 'flutter_dart';
    buildSystem = 'Flutter Build System';
  } else if (hasRust) {
    projectType = 'rust';
    buildSystem = 'Cargo';
  } else if (hasGo) {
    projectType = 'go';
    buildSystem = 'Go Modules';
  }

  if (modules.size > 1) {
    frameworks.add('Multi-Module Architecture');
  }

  return {
    projectType,
    detectedFrameworks: Array.from(frameworks),
    detectedLanguages: Array.from(languages),
    buildSystem,
    manifestData,
    modules: Array.from(modules),
    packageManifests,
  };
}
