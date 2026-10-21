import { ExecutionStatus, ManifestData, ProjectFile, SecurityFinding } from '../types';

export function runSecurityAudit(files: ProjectFile[], manifest?: ManifestData): SecurityFinding[] {
  const findings: SecurityFinding[] = [];
  let findingCounter = 1;

  // 1. Android Manifest Checks
  if (manifest) {
    // A. Cleartext Traffic
    if (manifest.usesCleartextTraffic) {
      findings.push({
        id: `SEC-${findingCounter++}`,
        severity: 'HIGH',
        title: 'Cleartext HTTP Traffic Allowed',
        category: 'NETWORK',
        filePath: 'AndroidManifest.xml',
        evidence: 'android:usesCleartextTraffic="true"',
        description: 'Application permits unencrypted HTTP transmission, exposing user data and tokens to Man-in-the-Middle (MitM) attacks.',
        remediation: 'Set android:usesCleartextTraffic="false" and enforce TLS (HTTPS) via network_security_config.xml.',
        verificationStatus: 'FAIL',
      });
    }

    // B. Exported Activities without Permission
    manifest.activities.forEach((act) => {
      if (act.exported && !act.isLauncher) {
        findings.push({
          id: `SEC-${findingCounter++}`,
          severity: 'HIGH',
          title: `Exported Activity Without Permission: ${act.name}`,
          category: 'EXPORTED_COMPONENT',
          filePath: 'AndroidManifest.xml',
          evidence: `<activity android:name="${act.name}" android:exported="true">`,
          description: `Activity '${act.name}' is exported to other applications without requiring a custom permission, allowing malicious apps to launch it directly.`,
          remediation: 'Set android:exported="false" unless inter-app communication is explicitly intended, or require an android:permission.',
          verificationStatus: 'FAIL',
        });
      }
    });

    // C. Exported Services or Receivers
    manifest.services.forEach((srv) => {
      if (srv.exported) {
        findings.push({
          id: `SEC-${findingCounter++}`,
          severity: 'HIGH',
          title: `Exported Service Without Protection: ${srv.name}`,
          category: 'EXPORTED_COMPONENT',
          filePath: 'AndroidManifest.xml',
          evidence: `<service android:name="${srv.name}" android:exported="true">`,
          description: `Service '${srv.name}' can be bound or started by any application on the device.`,
          remediation: 'Set android:exported="false" or bind with a signature-level permission.',
          verificationStatus: 'FAIL',
        });
      }
    });

    manifest.receivers.forEach((rec) => {
      if (rec.exported) {
        findings.push({
          id: `SEC-${findingCounter++}`,
          severity: 'MEDIUM',
          title: `Exported BroadcastReceiver: ${rec.name}`,
          category: 'EXPORTED_COMPONENT',
          filePath: 'AndroidManifest.xml',
          evidence: `<receiver android:name="${rec.name}" android:exported="true">`,
          description: `BroadcastReceiver '${rec.name}' listens to broadcasts from arbitrary external apps.`,
          remediation: 'Ensure input validation on received intents or set android:exported="false".',
          verificationStatus: 'PARTIAL',
        });
      }
    });

    // D. Dangerous Permissions
    const highRiskPermissions: Record<string, string> = {
      'android.permission.SEND_SMS': 'Allows sending SMS messages silently which may incur carrier costs.',
      'android.permission.RECEIVE_SMS': 'Allows intercepting sensitive SMS verification OTPs.',
      'android.permission.READ_CONTACTS': 'Accesses private address book and contacts data.',
      'android.permission.RECORD_AUDIO': 'Can record background audio without visual cues.',
      'android.permission.ACCESS_FINE_LOCATION': 'Tracks precise GPS coordinates.',
      'android.permission.CAMERA': 'Accesses camera hardware directly.',
      'android.permission.WRITE_EXTERNAL_STORAGE': 'Legacy storage permission allows arbitrary shared storage manipulation.',
    };

    manifest.permissions.forEach((perm) => {
      if (highRiskPermissions[perm]) {
        findings.push({
          id: `SEC-${findingCounter++}`,
          severity: 'MEDIUM',
          title: `High-Risk Permission Requested: ${perm.replace('android.permission.', '')}`,
          category: 'ANDROID_PERMISSION',
          filePath: 'AndroidManifest.xml',
          evidence: `<uses-permission android:name="${perm}" />`,
          description: highRiskPermissions[perm],
          remediation: 'Verify whether this permission is strictly necessary for core functionality and implement runtime permission dialogs with rationale.',
          verificationStatus: 'PARTIAL',
        });
      }
    });
  }

  // 2. Source Code & Configuration Inspection
  const secretPatterns = [
    {
      regex: /(?:AIzaSy[0-9A-Za-z-_]{33})/,
      title: 'Exposed Google / Firebase API Key',
      severity: 'CRITICAL' as const,
      category: 'SECRET' as const,
      remediation: 'Revoke and rotate the exposed API key in Google Cloud Console. Use server-side proxy or restricted client keys.',
    },
    {
      regex: /(?:AKIA[0-9A-Z]{16})/,
      title: 'Exposed AWS Access Key ID',
      severity: 'CRITICAL' as const,
      category: 'SECRET' as const,
      remediation: 'Revoke immediately in AWS IAM console and move secrets to AWS Secrets Manager or environment variables.',
    },
    {
      regex: /-----BEGIN (?:RSA )?PRIVATE KEY-----/,
      title: 'Hardcoded Private Key',
      severity: 'CRITICAL' as const,
      category: 'SECRET' as const,
      remediation: 'Never commit cryptographic private keys into repository archives. Use Android KeyStore or secure vault.',
    },
    {
      regex: /(?:Bearer\s+[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*)/,
      title: 'Hardcoded JWT / Bearer Token',
      severity: 'HIGH' as const,
      category: 'SECRET' as const,
      remediation: 'Remove hardcoded authorization tokens; obtain tokens dynamically during authentication.',
    },
    {
      regex: /(?:password|passwd|api_key|secret)\s*=\s*["'][a-zA-Z0-9!@#$%^&*()_+]{8,}["']/i,
      title: 'Potential Hardcoded Secret / Credential',
      severity: 'MEDIUM' as const,
      category: 'SECRET' as const,
      remediation: 'Store credentials in encrypted local storage (EncryptedSharedPreferences) or inject via buildConfig.',
    },
  ];

  for (const file of files) {
    if (file.isBinary) continue;

    const lines = file.content.split('\n');

    // Secrets scan
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Ignore comments or examples in tests/docs if appropriate
      for (const pattern of secretPatterns) {
        const match = line.match(pattern.regex);
        if (match) {
          findings.push({
            id: `SEC-${findingCounter++}`,
            severity: pattern.severity,
            title: pattern.title,
            category: pattern.category,
            filePath: file.path,
            lineNumber: i + 1,
            evidence: line.trim().slice(0, 100),
            description: `Potential hardcoded secret discovered at line ${i + 1} of ${file.path}.`,
            remediation: pattern.remediation,
            verificationStatus: 'FAIL',
          });
          break;
        }
      }

      // Shell execution risk
      if (line.includes('Runtime.getRuntime().exec(') || line.includes('ProcessBuilder(')) {
        findings.push({
          id: `SEC-${findingCounter++}`,
          severity: 'HIGH',
          title: 'Unsafe Native Process Execution',
          category: 'INJECTION',
          filePath: file.path,
          lineNumber: i + 1,
          evidence: line.trim(),
          description: 'Spawning shell processes via Runtime.exec or ProcessBuilder can lead to command injection if input is tainted.',
          remediation: 'Avoid raw shell execution. Use Android framework APIs or strictly validate and sanitize parameters.',
          verificationStatus: 'FAIL',
        });
      }

      // Insecure WebView
      if (line.includes('.setJavaScriptEnabled(true)') || line.includes('javaScriptEnabled = true')) {
        findings.push({
          id: `SEC-${findingCounter++}`,
          severity: 'MEDIUM',
          title: 'Insecure WebView JavaScript Execution',
          category: 'CODE_SAFETY',
          filePath: file.path,
          lineNumber: i + 1,
          evidence: line.trim(),
          description: 'Enabling JavaScript in WebView without strict URL whitelist controls allows Cross-Site Scripting (XSS) and intent scheme hijacking.',
          remediation: 'Disable JavaScript if not strictly needed or restrict loaded origins using WebViewClient.shouldOverrideUrlLoading.',
          verificationStatus: 'PARTIAL',
        });
      }
    }
  }

  return findings;
}
