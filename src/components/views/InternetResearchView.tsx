import React, { useState } from 'react';
import {
  SearchCode,
  Globe,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  BookOpen,
  Search,
} from 'lucide-react';
import { Language, translations } from '../../i18n/translations';

export const InternetResearchView: React.FC<{ lang: Language }> = ({ lang }) => {
  const t = translations[lang];

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([
    {
      title: 'Android 12+ Explicit Component Exporting (API 31)',
      url: 'https://developer.android.com/about/versions/12/behavior-changes-12#exported',
      source: 'Official Android Developers Documentation',
      summary: 'Activities, services, and broadcast receivers containing intent filters must explicitly set android:exported="true" or "false". Missing attributes cause AAPT2 installation failures on Android 12.',
      versionInfo: 'Android 12 (API level 31+)',
      relevance: 'Manifest specification verification',
      confidence: 0.99,
    },
    {
      title: 'Network Security Config & Cleartext Traffic Policy',
      url: 'https://developer.android.com/privacy-and-security/security-config',
      source: 'Official Android Developers Documentation',
      summary: 'Android 9.0 (API 28) disallows cleartext HTTP traffic by default. Explicit android:usesCleartextTraffic="true" exposes tokens to MitM interception.',
      versionInfo: 'Android 9.0+ (API level 28+)',
      relevance: 'Security audit remediation',
      confidence: 0.98,
    },
    {
      title: 'Google Generative AI SDK for Android (Gemini)',
      url: 'https://ai.google.dev/gemini-api/docs/quickstart?lang=android',
      source: 'Google AI Developers Documentation',
      summary: 'The official Kotlin client SDK allows calling Gemini 1.5 Pro and Flash directly in Android apps via GenerativeModel with client-side or server proxy.',
      versionInfo: 'SDK 0.2.0+',
      relevance: 'Autonomous Agent Architecture',
      confidence: 0.96,
    },
    {
      title: 'Jetpack Compose State Hoisting & ViewModel Architecture',
      url: 'https://developer.android.com/develop/ui/compose/architecture',
      source: 'Android Jetpack Documentation',
      summary: 'Best practice pattern of separating UI rendering from state storage. ViewModels manage asynchronous coroutine flows without leaking Activity context.',
      versionInfo: 'Compose BOM 2024.02+',
      relevance: 'Architecture drift detection',
      confidence: 0.97,
    },
  ]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    try {
      const res = await fetch(`/api/research?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.results);
      }
    } catch {
      // Offline fallback
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <SearchCode className="w-5 h-5 text-amber-400" />
            <span>{t.nav_research}</span>
          </h1>
          <p className="text-xs text-slate-400">
            Controlled technical research and dependency intelligence. Queries official Android, Kotlin, and Gradle registries with strict data privacy boundaries.
          </p>
        </div>

        <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
          Official Docs Grounded
        </span>
      </div>

      {/* Controlled Search Form */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search official Android, Kotlin, or Gradle documentation (e.g., 'usesCleartextTraffic' or 'RoomDatabase')..."
            className="w-full pl-9 pr-3.5 py-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
        </div>
        <button
          type="submit"
          disabled={isSearching}
          className="px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs"
        >
          {isSearching ? 'Querying...' : 'Search'}
        </button>
      </form>

      {/* Results List */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Intelligence Findings ({results.length})
        </h2>

        {results.map((res, idx) => (
          <div key={idx} className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] text-cyan-400 font-mono block">{res.source}</span>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5 mt-0.5">
                  <span>{res.title}</span>
                  <a
                    href={res.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-slate-500 hover:text-amber-400"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </h3>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-amber-300">
                  {res.versionInfo}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300">
                  {Math.round(res.confidence * 100)}% Conf
                </span>
              </div>
            </div>

            <p className="text-slate-300 leading-relaxed text-[11px] bg-slate-950/60 p-2.5 rounded border border-slate-800/80">
              {res.summary}
            </p>

            <div className="text-[10px] text-slate-500 font-mono flex justify-between">
              <span>Task Relevance: {res.relevance}</span>
              <span className="truncate max-w-xs">{res.url}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
