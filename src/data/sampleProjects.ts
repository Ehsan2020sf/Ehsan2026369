import JSZip from 'jszip';
import { Project, ProjectFile } from '../types';
import { calculateSha256 } from '../utils/crypto';

export async function createNovinNexusSampleFiles(): Promise<ProjectFile[]> {
  const rawFiles: { path: string; content: string; role: ProjectFile['role'] }[] = [
    {
      path: 'settings.gradle.kts',
      role: 'BUILD_SCRIPT',
      content: `pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}
rootProject.name = "NovinNexus"
include(":app")
include(":core:ai")
include(":core:database")
`,
    },
    {
      path: 'build.gradle.kts',
      role: 'BUILD_SCRIPT',
      content: `plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.kotlin.android) apply false
    alias(libs.plugins.kotlin.compose) apply false
}
`,
    },
    {
      path: 'app/build.gradle.kts',
      role: 'BUILD_SCRIPT',
      content: `plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
    id("kotlin-kapt")
}

android {
    namespace = "ai.novin.nexus"
    compileSdk = 34

    defaultConfig {
        applicationId = "ai.novin.nexus"
        minSdk = 26
        targetSdk = 34
        versionCode = 104
        versionName = "1.4.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
        }
        debug {
            isDebuggable = true
        }
    }

    buildFeatures {
        compose = true
        buildConfig = true
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.7.0")
    implementation("androidx.activity:activity-compose:1.8.2")
    implementation(platform("androidx.compose:compose-bom:2024.02.00"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.room:room-runtime:2.6.1")
    kapt("androidx.room:room-compiler:2.6.1")
    implementation("com.google.ai.client.generativeai:generativeai:0.2.0")
    testImplementation("junit:junit:4.13.2")
}
`,
    },
    {
      path: 'app/src/main/AndroidManifest.xml',
      role: 'MANIFEST',
      content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="ai.novin.nexus">

    <!-- Permissions -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.RECORD_AUDIO" />

    <application
        android:name=".NovinApplication"
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="NOVIN NEXUS"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.NovinNexus"
        android:usesCleartextTraffic="true">

        <!-- Main Launcher Activity -->
        <activity
            android:name=".ui.MainActivity"
            android:exported="true"
            android:theme="@style/Theme.NovinNexus">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <!-- Exported Diagnostics Activity without custom permission (Security flaw to test repair) -->
        <activity
            android:name=".ui.DiagnosticsActivity"
            android:exported="true"
            android:label="Diagnostics Screen" />

        <!-- Background Sync Service -->
        <service
            android:name=".service.NovinSyncService"
            android:exported="false" />

    </application>
</manifest>
`,
    },
    {
      path: 'app/src/main/java/ai/novin/nexus/NovinApplication.kt',
      role: 'SOURCE',
      content: `package ai.novin.nexus

import android.app.Application
import ai.novin.nexus.core.ai.GeminiAgentOrchestrator

class NovinApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        GeminiAgentOrchestrator.initialize(this)
    }
}
`,
    },
    {
      path: 'app/src/main/java/ai/novin/nexus/ui/MainActivity.kt',
      role: 'SOURCE',
      content: `package ai.novin.nexus.ui

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import ai.novin.nexus.core.ai.GeminiAgentOrchestrator

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            NovinNexusApp()
        }
    }
}

@Composable
fun NovinNexusApp() {
    var agentStatus by remember { mutableStateOf("Standby") }

    Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(text = "NOVIN NEXUS Workbench", style = MaterialTheme.typography.headlineMedium)
            Spacer(modifier = Modifier.height(8.dp))
            Text(text = "Agent Engine State: $agentStatus", style = MaterialTheme.typography.bodyLarge)
            Spacer(modifier = Modifier.height(16.dp))
            Button(onClick = { agentStatus = "Active Orchestration" }) {
                Text("Engage Autonomous Assistant")
            }
        }
    }
}
`,
    },
    {
      path: 'app/src/main/java/ai/novin/nexus/ui/DiagnosticsActivity.kt',
      role: 'SOURCE',
      content: `package ai.novin.nexus.ui

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.compose.material3.Text

class DiagnosticsActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // Internal diagnostic interface
    }
}
`,
    },
    {
      path: 'app/src/main/java/ai/novin/nexus/core/ai/GeminiAgentOrchestrator.kt',
      role: 'SOURCE',
      content: `package ai.novin.nexus.core.ai

import android.content.Context
import com.google.ai.client.generativeai.GenerativeModel

object GeminiAgentOrchestrator {
    // SECURITY RISK TEST: Hardcoded Google API key to test automated detection and repair
    private const val DEFAULT_API_KEY = "AIzaSyB9X_kL14289047129840192840192"

    private var generativeModel: GenerativeModel? = null

    fun initialize(context: Context) {
        generativeModel = GenerativeModel(
            modelName = "gemini-1.5-pro",
            apiKey = DEFAULT_API_KEY
        )
    }

    suspend fun executeTask(prompt: String): String {
        val model = generativeModel ?: throw IllegalStateException("Model not initialized")
        val response = model.generateContent(prompt)
        return response.text ?: "No response generated"
    }
}
`,
    },
    {
      path: 'app/src/main/java/ai/novin/nexus/core/database/NovinDatabase.kt',
      role: 'SOURCE',
      content: `package ai.novin.nexus.core.database

import androidx.room.Database
import androidx.room.RoomDatabase
import androidx.room.Entity
import androidx.room.PrimaryKey
import androidx.room.Dao
import androidx.room.Insert
import androidx.room.Query

@Entity(tableName = "project_audit_log")
data class AuditLogEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val timestamp: Long,
    val action: String,
    val status: String,
    val sha256Digest: String
)

@Dao
interface AuditLogDao {
    @Insert
    suspend fun insert(log: AuditLogEntity)

    @Query("SELECT * FROM project_audit_log ORDER BY timestamp DESC")
    suspend fun getAllLogs(): List<AuditLogEntity>
}

@Database(entities = [AuditLogEntity::class], version = 1)
abstract class NovinDatabase : RoomDatabase() {
    abstract fun auditLogDao(): AuditLogDao
}
`,
    },
    {
      path: 'app/src/main/java/ai/novin/nexus/core/database/AuditRepository.kt',
      role: 'SOURCE',
      content: `package ai.novin.nexus.core.database

class AuditRepository(private val dao: AuditLogDao) {
    suspend fun recordEvent(action: String, status: String, sha: String) {
        dao.insert(AuditLogEntity(timestamp = System.currentTimeMillis(), action = action, status = status, sha256Digest = sha))
    }

    suspend fun fetchHistory(): List<AuditLogEntity> = dao.getAllLogs()
}
`,
    },
    {
      path: 'app/src/test/java/ai/novin/nexus/NexusArchitectureUnitTest.kt',
      role: 'TEST',
      content: `package ai.novin.nexus

import org.junit.Test
import org.junit.Assert.*

class NexusArchitectureUnitTest {
    @Test
    fun verifyAgentInitializationState() {
        assertNotNull("Verifying test environment", "NOVIN-NEXUS")
    }

    @Test
    fun verifyAuditLogHashingContract() {
        val mockHash = "a".repeat(64)
        assertEquals(64, mockHash.length)
    }
}
`,
    },
    {
      path: 'app/src/main/res/values/strings.xml',
      role: 'RESOURCE',
      content: `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">NOVIN NEXUS</string>
    <string name="welcome_message">Welcome to NOVIN NEXUS Android Engineering</string>
</resources>
`,
    },
    {
      path: 'app/src/main/res/values-fa/strings.xml',
      role: 'RESOURCE',
      content: `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">نوین نکسوس</string>
    <string name="welcome_message">به محیط مهندسی اندروید نوین نکسوس خوش آمدید</string>
</resources>
`,
    },
    {
      path: 'app/src/main/java/ai/novin/nexus/utils/BackupHelper.kt',
      role: 'SOURCE',
      content: `package ai.novin.nexus.utils

// DUPLICATE CODE CANDIDATE 1 (to test duplicate detection engine)
class BackupHelper {
    fun calculateChecksum(input: String): String {
        return input.hashCode().toString()
    }

    fun syncSnapshot(target: String): Boolean {
        return target.isNotBlank()
    }
}
`,
    },
    {
      path: 'core/database/src/main/java/ai/novin/nexus/database/LegacyBackupHelper.kt',
      role: 'SOURCE',
      content: `package ai.novin.nexus.database

// DUPLICATE CODE CANDIDATE 2 (similar class name and identical logic)
class LegacyBackupHelper {
    fun calculateChecksum(input: String): String {
        return input.hashCode().toString()
    }

    fun syncSnapshot(target: String): Boolean {
        return target.isNotBlank()
    }
}
`,
    },
  ];

  const files: ProjectFile[] = [];
  for (const item of rawFiles) {
    const sha = await calculateSha256(item.content);
    files.push({
      path: item.path,
      name: item.path.split('/').pop() || '',
      extension: item.path.split('.').pop() || '',
      size: new Blob([item.content]).size,
      sha256: sha,
      content: item.content,
      isBinary: false,
      role: item.role,
    });
  }

  return files;
}

/**
 * Creates a real downloadable ZIP archive for any set of project files.
 */
export async function packageFilesIntoZip(files: ProjectFile[]): Promise<Blob> {
  const zip = new JSZip();
  for (const file of files) {
    zip.file(file.path, file.content);
  }
  return await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
}
