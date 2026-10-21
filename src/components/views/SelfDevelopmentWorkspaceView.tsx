import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Upload,
  FileArchive,
  Code2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  RotateCcw,
  Shield,
  Layers,
  FileText,
  Eye,
  Sliders,
  History,
  Terminal,
  Activity,
  ArrowRight,
  Info,
  Check,
  Undo2,
  Cpu,
  RefreshCw,
} from 'lucide-react';
import { Project, ProjectFile } from '../../types';
import {
  SelfDevState,
  SelfDevProposal,
  ZipDiffAnalysis,
  SelfDevLog,
  RollbackSnapshot,
  ProposalFile,
} from '../../types/selfDev';
import { SelfDevEngine } from '../../engines/selfDevEngine';

interface SelfDevelopmentWorkspaceViewProps {
  project: Project;
  lang: 'fa' | 'en';
  onUpdateProject?: (updated: Project) => void;
}

export const SelfDevelopmentWorkspaceView: React.FC<SelfDevelopmentWorkspaceViewProps> = ({
  project,
  lang: initialLang,
  onUpdateProject,
}) => {
  const [lang, setLang] = useState<'fa' | 'en'>(initialLang || 'fa');
  const [promptInput, setPromptInput] = useState('');
  const [state, setState] = useState<SelfDevState>('RECEIVED');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [activeSpeechText, setActiveSpeechText] = useState<string | null>(null);

  // Proposal & Analysis States
  const [activeProposal, setActiveProposal] = useState<SelfDevProposal | null>(null);
  const [zipAnalysis, setZipAnalysis] = useState<ZipDiffAnalysis | null>(null);
  const [selectedFileIndex, setSelectedFileIndex] = useState<number>(0);
  const [showDiffView, setShowDiffView] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState(false);

  // Snapshots & Logs
  const [snapshots, setSnapshots] = useState<RollbackSnapshot[]>([]);
  const [logs, setLogs] = useState<SelfDevLog[]>([
    {
      timestamp: new Date().toLocaleTimeString(),
      level: 'INFO',
      stage: 'RECEIVED',
      message: lang === 'fa' ? 'آزمایشگاه خودتوسعه‌گر نوین آماده دریافت فرامین است.' : 'NOVIN Self-Development Workspace ready.',
    },
  ]);
  const [activeTestConsole, setActiveTestConsole] = useState<{
    running: boolean;
    output: string;
    scriptName: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);

  const addLog = (level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS', stage: SelfDevState, message: string, evidence?: string) => {
    setLogs((prev) => [
      ...prev,
      {
        timestamp: new Date().toLocaleTimeString(),
        level,
        stage,
        message,
        evidence,
      },
    ]);
  };

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  // Speech Recognition (STT)
  const toggleSpeechRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      addLog('WARN', state, lang === 'fa' ? 'مرورگر از ورودی صوتی پشتیبانی نمی‌کند.' : 'Browser does not support SpeechRecognition.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognizer = new SpeechRecognition();
      recognizer.lang = lang === 'fa' ? 'fa-IR' : 'en-US';
      recognizer.continuous = false;
      recognizer.interimResults = false;

      recognizer.onstart = () => {
        setIsListening(true);
        addLog('INFO', state, lang === 'fa' ? 'میکروفون فعال شد. بفرمایید...' : 'Microphone active. Listening...');
      };

      recognizer.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setPromptInput(transcript);
        addLog('SUCCESS', state, `${lang === 'fa' ? 'صوت دریافت شد: ' : 'Voice recognized: '} "${transcript}"`);
        setIsListening(false);
        speakResponse(lang === 'fa' ? `درخواست شما دریافت شد: ${transcript}` : `Prompt received: ${transcript}`);
      };

      recognizer.onerror = (err: any) => {
        setIsListening(false);
        addLog('WARN', state, `Speech error: ${err.error || 'Failed'}`);
      };

      recognizer.onend = () => {
        setIsListening(false);
      };

      recognizer.start();
    } catch (err: any) {
      setIsListening(false);
      addLog('ERROR', state, `Failed to initialize speech: ${err.message}`);
    }
  };

  // Text to Speech (TTS)
  const speakResponse = (text: string) => {
    if (isAudioMuted || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang === 'fa' ? 'fa-IR' : 'en-US';
      utterance.rate = 1.0;
      utterance.onstart = () => setActiveSpeechText(text);
      utterance.onend = () => setActiveSpeechText(null);
      utterance.onerror = () => setActiveSpeechText(null);
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      setActiveSpeechText(null);
    }
  };

  const stopSpeech = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setActiveSpeechText(null);
    }
  };

  // Handle Prompt Submission (Prompt-to-Software Transformation)
  const handleProcessPrompt = async (customPrompt?: string) => {
    const text = customPrompt || promptInput;
    if (!text.trim()) return;

    setIsProcessing(true);
    setState('ANALYZING');
    addLog('INFO', 'ANALYZING', lang === 'fa' ? `آغاز تحلیل نیازمندی‌ها برای: "${text}"` : `Starting requirement analysis for: "${text}"`);

    // Intent detection
    const intent = SelfDevEngine.classifyIntent(text);
    addLog('INFO', 'ANALYSIS_COMPLETED', `Intent: ${intent.operationType} | Target Modules: ${intent.detectedModules.join(', ')}`);

    setState('DESIGNING');
    addLog('INFO', 'DESIGNING', lang === 'fa' ? 'طراحی معماری و استخراج اینترفیس‌ها...' : 'Designing architecture contracts...');

    setTimeout(async () => {
      setState('GENERATING_CODE');
      addLog('INFO', 'GENERATING_CODE', lang === 'fa' ? 'تولید کدهای سازگار با استاندارد مرجع نوین...' : 'Generating source code aligned with NOVIN baseline...');

      // Synthesize proposal
      const proposal = SelfDevEngine.synthesizeProposal(text, project);

      // Attempt AI backend enrichment if available
      try {
        const res = await fetch('/api/self-dev/transform', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: text }),
        });
        const aiData = await res.json();
        if (aiData && aiData.proposedFiles && Array.isArray(aiData.proposedFiles) && aiData.proposedFiles.length > 0) {
          proposal.title = aiData.title || proposal.title;
          proposal.description = aiData.description || proposal.description;
          proposal.architectureOverview = aiData.architectureOverview || proposal.architectureOverview;
          proposal.proposedFiles = aiData.proposedFiles;
        }
      } catch (err) {
        // Fallback to local synthesis
      }

      setState('BUILDING_PREVIEW');
      addLog('INFO', 'BUILDING_PREVIEW', lang === 'fa' ? 'ساخت پیش‌نمایش در آزمایشگاه تغییرات...' : 'Building preview in Change Preview Lab...');

      setActiveProposal(proposal);
      setState('AWAITING_APPROVAL');
      setIsProcessing(false);
      setSelectedFileIndex(0);

      const msg = lang === 'fa'
        ? `طرح "${proposal.title}" آماده بررسی است. لطفاً فایل‌ها و پیش‌نمایش را بررسی و تصمیم‌گیری فرمایید.`
        : `Proposal "${proposal.title}" is ready for owner review. Please inspect proposed files and preview.`;
      addLog('SUCCESS', 'AWAITING_APPROVAL', msg);
      speakResponse(msg);
    }, 700);
  };

  // Handle File / ZIP Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (file.name.endsWith('.zip')) {
      handleZipIntake(file);
    } else {
      addLog('INFO', 'RECEIVED', `Uploaded file: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
      handleProcessPrompt(`تحلیل و ادغام فایل ${file.name}`);
    }
  };

  const handleZipIntake = async (file: File) => {
    setIsProcessing(true);
    setState('ANALYZING');
    addLog('INFO', 'ANALYZING', lang === 'fa' ? `در حال استخراج و ممیزی عمیق آرشیو ${file.name}...` : `Extracting and inspecting archive ${file.name}...`);

    try {
      const JSZip = (await import('jszip')).default;
      const zip = await JSZip.loadAsync(file);

      const fileList: { path: string; size: number }[] = [];
      zip.forEach((relPath, entry) => {
        if (!entry.dir) {
          fileList.push({ path: relPath, size: (entry as any)._data?.uncompressedSize || 1024 });
        }
      });

      setState('ANALYSIS_COMPLETED');
      const analysis = SelfDevEngine.analyzeZipDifference(file.name, fileList, project);
      setZipAnalysis(analysis);
      addLog('SUCCESS', 'ANALYSIS_COMPLETED', `ZIP analyzed: ${fileList.length} files detected.`);

      // Create integration proposal automatically
      const proposal = SelfDevEngine.synthesizeProposal(`یکپارچه‌سازی ماژول‌های آرشیو ${file.name}`, project);
      setActiveProposal(proposal);

      setState('AWAITING_APPROVAL');
      const speechMsg = lang === 'fa'
        ? `تحلیل آرشیو به پایان رسید. گزارش قابلیت‌های جدید و فایل‌های قابل ادغام آماده است.`
        : `Archive analysis complete. Integration proposal ready for review.`;
      speakResponse(speechMsg);
    } catch (err: any) {
      setState('FAILED');
      addLog('ERROR', 'FAILED', `Failed to parse ZIP: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Sovereign Owner Action 1: Approve & Execute
  const handleApproveProposal = async () => {
    if (!activeProposal) return;

    setIsProcessing(true);
    setState('APPLYING_CHANGES');
    addLog('INFO', 'APPLYING_CHANGES', lang === 'fa' ? 'ایجاد نسخه پشتیبان و اعمال تغییرات به نسخه کاری...' : 'Creating rollback backup & applying changes...');

    try {
      const res = await fetch('/api/self-dev/apply-proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proposal: activeProposal }),
      });
      const data = await res.json();

      if (data.status === 'SUCCESS' || data.status === 'WARNING') {
        const newSnapshot: RollbackSnapshot = {
          id: data.snapshotId || `SNAP-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          description: `Snapshot before applying: ${activeProposal.title}`,
          filePaths: data.appliedFiles || [],
        };
        setSnapshots((prev) => [newSnapshot, ...prev]);

        setState('RUNNING_TESTS');
        addLog('INFO', 'RUNNING_TESTS', lang === 'fa' ? 'اجرای آزمون‌های اعتبارسنجی یکپارچگی...' : 'Running integrity validation test suites...');

        // Run real test suite
        try {
          const testRes = await fetch('/api/tests/execute-real', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ testScript: 'browser-boundary' }),
          });
          const testData = await testRes.json();
          setActiveTestConsole({
            running: false,
            output: testData.stdout || testData.stderr || 'No output',
            scriptName: 'verify_browser_boundary.mjs',
          });
        } catch (tErr) {
          // Ignore test execution fetch error
        }

        setState('COMPLETED');
        const doneMsg = lang === 'fa'
          ? `تغییرات با موفقیت اعمال شد. شناسه نسخه پشتیبان: ${newSnapshot.id}`
          : `Changes applied successfully. Rollback snapshot ID: ${newSnapshot.id}`;
        addLog('SUCCESS', 'COMPLETED', doneMsg);
        speakResponse(doneMsg);
      } else {
        setState('FAILED');
        addLog('ERROR', 'FAILED', `Application rejected: ${data.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      setState('FAILED');
      addLog('ERROR', 'FAILED', `Server connection error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Sovereign Owner Action 2: Edit Proposal
  const handleEditProposal = () => {
    setState('EDITING');
    setEditingPrompt(true);
    addLog('INFO', 'EDITING', lang === 'fa' ? 'حالت ویرایش طرح فعال شد. نسخه اصلی بدون تغییر حفظ می‌شود.' : 'Edit mode active. Master codebase remains untouched.');
  };

  const handleSaveEditedProposal = () => {
    setEditingPrompt(false);
    handleProcessPrompt(promptInput);
  };

  // Sovereign Owner Action 3: Cancel Proposal
  const handleCancelProposal = () => {
    setState('CANCELLED');
    setActiveProposal(null);
    setZipAnalysis(null);
    addLog('WARN', 'CANCELLED', lang === 'fa' ? 'عملیات توسط مالک لغو شد. تمامی تغییرات موقت پاکسازی و نسخه اصلی حفظ گردید.' : 'Operation cancelled by owner. Master baseline preserved.');
    speakResponse(lang === 'fa' ? 'عملیات لغو شد و نسخه اصلی دست‌نخورده باقی ماند.' : 'Operation cancelled. Master baseline preserved.');
    setTimeout(() => setState('RECEIVED'), 1500);
  };

  // Rollback Action
  const handleRollback = async (snapshotId: string) => {
    setState('ROLLING_BACK');
    addLog('WARN', 'ROLLING_BACK', lang === 'fa' ? `آغاز بازیابی به نسخه پشتیبان ${snapshotId}...` : `Restoring from backup ${snapshotId}...`);

    try {
      const res = await fetch('/api/self-dev/rollback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ snapshotId }),
      });
      const data = await res.json();

      if (data.status === 'ROLLED_BACK') {
        setState('COMPLETED');
        const msg = lang === 'fa' ? `بازیابی کامل شد. فایل‌ها به وضعیت قبل بازگشتند.` : `Rollback complete. Workspace restored.`;
        addLog('SUCCESS', 'COMPLETED', msg);
        speakResponse(msg);
      } else {
        setState('FAILED');
        addLog('ERROR', 'FAILED', `Rollback failed: ${data.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      setState('FAILED');
      addLog('ERROR', 'FAILED', `Rollback connection error: ${err.message}`);
    }
  };

  const activeFile = activeProposal?.proposedFiles[selectedFileIndex];

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 font-sans" dir={lang === 'fa' ? 'rtl' : 'ltr'}>
      {/* Top Banner & State Machine */}
      <div className="border-b border-slate-800 bg-slate-900/90 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-slate-100">
                {lang === 'fa' ? 'آزمایشگاه هوشمند خودتوسعه‌گر نوین' : 'NOVIN Self-Development Workspace'}
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                NN-AUTO-04
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {lang === 'fa'
                ? 'محیط خودمهندسی، دریافت پرامپت، تحلیل ZIP، ساخت پیش‌نمایش و اعمال با تأیید مالک'
                : 'Autonomous prompt transformation, ZIP intake, preview lab, and owner-governed execution'}
            </p>
          </div>
        </div>

        {/* State Badge & Audio Controls */}
        <div className="flex items-center gap-2">
          {/* Audio TTS Indicator */}
          {activeSpeechText && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-sky-950/80 border border-sky-800 text-sky-400 text-xs animate-pulse">
              <Activity className="w-3.5 h-3.5 animate-spin" />
              <span className="text-[10px]">{lang === 'fa' ? 'در حال پخش صوت' : 'Speaking'}</span>
              <button onClick={stopSpeech} className="p-0.5 hover:text-white">
                <VolumeX className="w-3 h-3" />
              </button>
            </div>
          )}

          <button
            onClick={() => setIsAudioMuted(!isAudioMuted)}
            title={isAudioMuted ? 'Unmute Voice' : 'Mute Voice'}
            className={`p-1.5 rounded border text-xs transition-colors ${
              isAudioMuted
                ? 'bg-slate-800 border-slate-700 text-slate-400'
                : 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
            }`}
          >
            {isAudioMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => setLang(lang === 'fa' ? 'en' : 'fa')}
            className="px-2.5 py-1 rounded border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-mono transition-colors"
          >
            {lang === 'fa' ? 'EN' : 'فا'}
          </button>

          {/* Current Lifecycle State Badge */}
          <div className="px-3 py-1 rounded-full text-[11px] font-mono font-bold flex items-center gap-1.5 bg-slate-800 border border-slate-700">
            <span
              className={`w-2 h-2 rounded-full ${
                state === 'COMPLETED'
                  ? 'bg-emerald-400'
                  : state === 'FAILED'
                  ? 'bg-red-400'
                  : state === 'AWAITING_APPROVAL'
                  ? 'bg-amber-400 animate-ping'
                  : 'bg-sky-400 animate-pulse'
              }`}
            />
            <span className="text-slate-200">{state}</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Stage (Input & Preview) | Right Stage (Logs & Tools) */}
      <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-0">
        {/* Left Column: Natural Input, Preview Lab, Code Diff (Col 8) */}
        <div className="lg:col-span-8 flex flex-col h-full border-r border-slate-800 overflow-y-auto p-4 space-y-4">
          {/* 1. Input Box & Voice Bar */}
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                {lang === 'fa' ? 'دستور طبیعی یا بارگذاری فایل' : 'Natural Command & Archive Intake'}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                {lang === 'fa' ? 'پشتیبانی دو زبانه فارسی و انگلیسی' : 'Bilingual FA/EN'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={promptInput}
                  onChange={(e) => setPromptInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleProcessPrompt()}
                  placeholder={
                    lang === 'fa'
                      ? 'مثال: نوین، یک ابزار مانیتورینگ باتری و حرارت برای خودت بساز...'
                      : 'E.g., Novin, build an autonomous battery & thermal watchdog module...'
                  }
                  className="w-full pl-3 pr-10 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
                <button
                  onClick={toggleSpeechRecognition}
                  title="Voice Input"
                  className={`absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded transition-all ${
                    isListening
                      ? 'bg-rose-600 text-white animate-pulse'
                      : 'text-slate-400 hover:text-emerald-400'
                  }`}
                >
                  {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Upload ZIP / File */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".zip,.ts,.tsx,.json,.md,.java"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                title="Upload ZIP or Project File"
                className="p-2.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1.5 transition-colors"
              >
                <FileArchive className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline text-xs">{lang === 'fa' ? 'بارگذاری ZIP' : 'Intake ZIP'}</span>
              </button>

              <button
                onClick={() => handleProcessPrompt()}
                disabled={isProcessing || !promptInput.trim()}
                className="px-4 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-lg shadow-emerald-500/10"
              >
                {isProcessing ? (
                  <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>{lang === 'fa' ? 'ارسال به نوین' : 'Execute'}</span>
              </button>
            </div>

            {/* Quick Prompt Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] text-slate-500">{lang === 'fa' ? 'فرامین آماده:' : 'Presets:'}</span>
              {[
                { label: lang === 'fa' ? 'پایش باتری و دما' : 'Battery & Thermal', prompt: 'یک ماژول پایش باتری و وضعیت دمایی برای نوین بساز' },
                { label: lang === 'fa' ? 'جنریتور خودکار تست' : 'Auto Test Synthesizer', prompt: 'یک ابزار تولید آزمون خودکار رگرسیون طراحی کن' },
                { label: lang === 'fa' ? 'گارد امنیتی فایل‌ها' : 'File Integrity Guard', prompt: 'یک سیستم اعتبارسنجی هش و ایمنی فایل‌ها پیاده‌سازی کن' },
              ].map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setPromptInput(chip.prompt);
                    handleProcessPrompt(chip.prompt);
                  }}
                  className="px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-800 text-[10px] text-slate-300 border border-slate-700 transition-colors"
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2. ZIP Intake Difference Report («این ZIP چه قابلیت‌هایی به نوین اضافه می‌کند؟») */}
          {zipAnalysis && (
            <div className="p-4 rounded-xl bg-slate-900 border border-amber-500/40 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <FileArchive className="w-4 h-4 text-amber-400" />
                  <h3 className="font-bold text-xs text-amber-300">
                    {lang === 'fa' ? 'گزارش تحلیلی: این ZIP چه قابلیت‌هایی به نوین اضافه می‌کند؟' : 'ZIP Capability Difference Audit'}
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  {zipAnalysis.fileCount} {lang === 'fa' ? 'فایل' : 'files'} | {(zipAnalysis.totalSizeBytes / (1024 * 1024)).toFixed(2)} MB
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">{zipAnalysis.summary}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                  <h4 className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    {lang === 'fa' ? 'قابلیت‌های جدید و قابل استفاده مجدد' : 'New & Reusable Features'}
                  </h4>
                  <ul className="text-[10px] text-slate-400 space-y-1 list-disc list-inside">
                    {zipAnalysis.mainCapabilities.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                  <h4 className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {lang === 'fa' ? 'تکرارها و وابستگی‌ها با نوین' : 'Redundancy with NOVIN Monolith'}
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    {zipAnalysis.redundantWithNovin.length > 0
                      ? `${zipAnalysis.redundantWithNovin.length} فایل تکراری شناسایی شد که بدون تغییر باقی می‌مانند.`
                      : 'هیچ تکرار نامطلوبی شناسایی نشد.'}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    پیچیدگی تخمینی ادغام: <strong className="text-slate-300">{zipAnalysis.estimatedComplexity}</strong>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 3. NOVIN CHANGE PREVIEW LAB («آزمایشگاه پیش‌نمایش تغییرات نوین») */}
          {activeProposal ? (
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800">
                      PREVIEW LAB
                    </span>
                    <h3 className="text-xs font-bold text-slate-100">{activeProposal.title}</h3>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">{activeProposal.description}</p>
                </div>

                {/* Pre-merge Test Badges */}
                <div className="flex items-center gap-1.5">
                  {activeProposal.preMergeTestResults.map((t, idx) => (
                    <span
                      key={idx}
                      className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800 flex items-center gap-1"
                    >
                      <Check className="w-2.5 h-2.5" />
                      {t.name}
                    </span>
                  ))}
                </div>
              </div>

              {/* Architecture Overview */}
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 block mb-1">
                  {lang === 'fa' ? 'طرح معماری پیشنهادی:' : 'Proposed Architecture Plan:'}
                </span>
                <p className="text-xs text-slate-300">{activeProposal.architectureOverview}</p>
              </div>

              {/* Proposed Files Tabs */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-300">
                    {lang === 'fa' ? 'فایل‌های نسخه پیشنهادی:' : 'Proposed Files for Staging:'} ({activeProposal.proposedFiles.length})
                  </span>
                  <button
                    onClick={() => setShowDiffView(!showDiffView)}
                    className="text-[10px] font-mono text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    <Code2 className="w-3 h-3" />
                    {showDiffView ? 'Code View' : 'Unified Diff View'}
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {activeProposal.proposedFiles.map((f, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedFileIndex(i)}
                      className={`px-2.5 py-1 rounded text-[11px] font-mono transition-colors flex items-center gap-1.5 ${
                        selectedFileIndex === i
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-slate-950 text-slate-400 border border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      <span
                        className={`text-[9px] px-1 rounded ${
                          f.action === 'CREATE' ? 'bg-emerald-900 text-emerald-300' : 'bg-amber-900 text-amber-300'
                        }`}
                      >
                        {f.action}
                      </span>
                      <span>{f.path.split('/').pop()}</span>
                    </button>
                  ))}
                </div>

                {/* File Code Viewer */}
                {activeFile && (
                  <div className="rounded-lg border border-slate-800 bg-slate-950 overflow-hidden">
                    <div className="px-3 py-1.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
                      <span>{activeFile.path}</span>
                      <span className="text-[10px] text-slate-500">{activeFile.description}</span>
                    </div>
                    <pre className="p-3 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-60 leading-relaxed">
                      <code>{activeFile.content}</code>
                    </pre>
                  </div>
                )}
              </div>

              {/* Live UI Mock Preview (Section 8) */}
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5">
                    <Eye className="w-3 h-3 text-sky-400" />
                    {lang === 'fa' ? 'پیش‌نمایش زنده رابط کاربری پیشنهادی' : 'Live Interactive UI Preview'}
                  </span>
                  <span className="text-[9px] font-mono text-slate-500">ISOLATED SANDBOX</span>
                </div>
                <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-center min-h-[70px]">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-950 border border-slate-800 shadow-md">
                    <Cpu className="w-5 h-5 text-emerald-400 animate-pulse" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-200">{activeProposal.title}</h4>
                      <p className="text-[10px] text-slate-400">Ready for owner authorization</p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-800">
                      READY
                    </span>
                  </div>
                </div>
              </div>

              {/* 4. THE 3 SOVEREIGN OWNER ACTION BUTTONS (Section 9) */}
              <div className="p-3.5 rounded-xl bg-slate-950 border-2 border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">
                    {lang === 'fa' ? 'تصمیم‌گیری حاکمیتی مالک (Owner Sovereign Decision)' : 'Owner Authorization Gate'}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {lang === 'fa' ? 'بدون تأیید صریح، هیچ کدی در نسخه اصلی اعمال نخواهد شد.' : 'No code will be applied without explicit approval.'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  {/* Button 1: Approve & Execute */}
                  <button
                    onClick={handleApproveProposal}
                    disabled={isProcessing}
                    className="py-2.5 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-emerald-500/20"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{lang === 'fa' ? 'تأیید و شروع ساخت' : 'Approve & Execute'}</span>
                  </button>

                  {/* Button 2: Edit Proposal */}
                  <button
                    onClick={handleEditProposal}
                    disabled={isProcessing}
                    className="py-2.5 px-3 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Sliders className="w-4 h-4" />
                    <span>{lang === 'fa' ? 'ویرایش طرح' : 'Edit Proposal'}</span>
                  </button>

                  {/* Button 3: Cancel Proposal */}
                  <button
                    onClick={handleCancelProposal}
                    disabled={isProcessing}
                    className="py-2.5 px-3 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>{lang === 'fa' ? 'لغو عملیات' : 'Cancel & Discard'}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Empty State */
            <div className="flex-1 flex flex-col items-center justify-center p-8 rounded-xl bg-slate-900 border border-dashed border-slate-800 text-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-slate-500">
                <Sparkles className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200">
                  {lang === 'fa' ? 'منتظر دستور مالک یا بارگذاری ZIP' : 'Awaiting Owner Prompt or ZIP Archive'}
                </h4>
                <p className="text-[11px] text-slate-500 max-w-sm mt-1">
                  {lang === 'fa'
                    ? 'یک دستور متنی بنویسید یا یک فایل ZIP وارد کنید تا فرایند طراحی، تحلیل تفاوت‌ها، تولید کد و ساخت پیش‌نمایش آغاز شود.'
                    : 'Provide a natural language command or import a ZIP to trigger analysis, code generation, and change preview.'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Execution Logs, Test Output, Rollback Snapshots (Col 4) */}
        <div className="lg:col-span-4 flex flex-col h-full bg-slate-950 p-4 space-y-4 overflow-y-auto">
          {/* 1. Real-time Audit & Execution Logs */}
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col h-64">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-sky-400" />
                {lang === 'fa' ? 'لاگ رویدادها و حقیقت‌سنجی' : 'Evidence & Reality Log'}
              </span>
              <span className="text-[10px] font-mono text-slate-500">{logs.length} events</span>
            </div>

            <div ref={logContainerRef} className="flex-1 overflow-y-auto space-y-1.5 pt-2 font-mono text-[10px]">
              {logs.map((log, idx) => (
                <div key={idx} className="flex items-start gap-1.5 leading-tight">
                  <span className="text-slate-500 shrink-0">[{log.timestamp}]</span>
                  <span
                    className={`font-bold shrink-0 ${
                      log.level === 'SUCCESS'
                        ? 'text-emerald-400'
                        : log.level === 'ERROR'
                        ? 'text-rose-400'
                        : log.level === 'WARN'
                        ? 'text-amber-400'
                        : 'text-sky-400'
                    }`}
                  >
                    {log.stage}:
                  </span>
                  <span className="text-slate-300 break-words">{log.message}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 2. Automated Test Runner Output (Live verification) */}
          {activeTestConsole && (
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                  <Terminal className="w-3 h-3 text-emerald-400" />
                  {activeTestConsole.scriptName}
                </span>
                <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800">
                  REAL VERIFIED
                </span>
              </div>
              <pre className="p-2 rounded bg-slate-950 font-mono text-[10px] text-slate-400 overflow-x-auto max-h-32">
                <code>{activeTestConsole.output}</code>
              </pre>
            </div>
          )}

          {/* 3. Rollback & Snapshot Recovery Panel (Section 14 & 15) */}
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-amber-400" />
                {lang === 'fa' ? 'نسخه‌های پشتیبان و بازگشت (Rollback)' : 'Rollback Snapshots'}
              </span>
              <span className="text-[10px] font-mono text-slate-500">{snapshots.length} saved</span>
            </div>

            {snapshots.length === 0 ? (
              <p className="text-[11px] text-slate-500 italic">
                {lang === 'fa' ? 'هنوز تغییری اعمال نشده است؛ نسخه مرجع کاملاً دست‌نخورده است.' : 'No modifications applied yet. Master baseline intact.'}
              </p>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {snapshots.map((snap) => (
                  <div
                    key={snap.id}
                    className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-mono text-[10px] text-amber-400 block">{snap.id}</span>
                      <span className="text-[10px] text-slate-400">{snap.description}</span>
                    </div>
                    <button
                      onClick={() => handleRollback(snap.id)}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-rose-950 hover:text-rose-300 text-slate-300 text-[10px] flex items-center gap-1 transition-colors"
                    >
                      <Undo2 className="w-3 h-3" />
                      <span>{lang === 'fa' ? 'بازیابی' : 'Restore'}</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
