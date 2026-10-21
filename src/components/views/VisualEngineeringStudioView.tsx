import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import {
  Layers,
  Box,
  Eye,
  Sliders,
  CheckCircle2,
  XCircle,
  Sparkles,
  Upload,
  Image as ImageIcon,
  Code2,
  Cpu,
  Monitor,
  Smartphone,
  Shield,
  Activity,
  Maximize2,
  RotateCcw,
  Palette,
  Terminal,
} from 'lucide-react';
import { Project } from '../../types';
import { Language, translations } from '../../i18n/translations';

interface VisualEngineeringStudioViewProps {
  project: Project;
  lang: Language;
  onNavigate?: (view: any) => void;
}

type VisualizationMode = '2D_PREVIEW' | '3D_SPATIAL';

export const VisualEngineeringStudioView: React.FC<VisualEngineeringStudioViewProps> = ({
  project,
  lang,
  onNavigate,
}) => {
  const [mode, setMode] = useState<VisualizationMode>('2D_PREVIEW');
  const [deviceViewport, setDeviceViewport] = useState<'DESKTOP' | 'MOBILE'>('DESKTOP');
  const [selectedLayer, setSelectedLayer] = useState<string>('presentation');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [imageAnalysis, setImageAnalysis] = useState<{
    palette: string[];
    typography: string;
    hierarchy: string[];
    components: string[];
  } | null>(null);

  const [activeProposalTitle, setActiveProposalTitle] = useState('پیشنهاد رابط کاربری: داشبورد خودکار مهندسی نوین');
  const [proposalStatus, setProposalStatus] = useState<'AWAITING_APPROVAL' | 'APPROVED' | 'CANCELLED'>('AWAITING_APPROVAL');

  // Three.js container
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Initialize Three.js when in 3D mode
  useEffect(() => {
    if (mode !== '3D_SPATIAL' || !canvasRef.current) return;

    const container = canvasRef.current;
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 400;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020617); // Slate 950
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 5, 12);
    camera.lookAt(0, 0, 0);

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x10b981, 1.5);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);

    const pointLight = new THREE.PointLight(0x0ea5e9, 2, 20);
    pointLight.position.set(-5, 3, 5);
    scene.add(pointLight);

    // 5. Grid Helper
    const grid = new THREE.GridHelper(16, 16, 0x10b981, 0x1e293b);
    grid.position.y = -1;
    scene.add(grid);

    // 6. 3D Architectural Nodes representing NOVIN Monolith Layers
    const layersData = [
      { name: 'UI / Presentation', color: 0x10b981, x: -4, y: 1, z: 0 },
      { name: 'Intelligence / Agents', color: 0x38bdf8, x: -1.5, y: 2, z: -1 },
      { name: 'Core Engine / AST', color: 0xa855f7, x: 1.5, y: 2, z: 1 },
      { name: 'Android Native / Capacitor', color: 0xf59e0b, x: 4, y: 1, z: 0 },
    ];

    const meshes: THREE.Mesh[] = [];

    layersData.forEach((layer) => {
      const geometry = new THREE.BoxGeometry(1.6, 0.8, 1.2);
      const material = new THREE.MeshStandardMaterial({
        color: layer.color,
        roughness: 0.3,
        metalness: 0.6,
        wireframe: false,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(layer.x, layer.y, layer.z);
      scene.add(mesh);
      meshes.push(mesh);
    });

    // Central Core Sphere (Avatar / Kernel)
    const sphereGeo = new THREE.SphereGeometry(0.9, 32, 32);
    const sphereMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      roughness: 0.1,
      metalness: 0.9,
      emissive: 0x064e3b,
    });
    const centerSphere = new THREE.Mesh(sphereGeo, sphereMat);
    centerSphere.position.set(0, 1.5, 0);
    scene.add(centerSphere);

    // 7. Render Loop
    let angle = 0;
    const animate = () => {
      angle += 0.008;
      meshes.forEach((m, idx) => {
        m.rotation.y += 0.01;
        m.position.y += Math.sin(angle + idx) * 0.003;
      });
      centerSphere.rotation.y += 0.015;
      camera.position.x = Math.sin(angle * 0.3) * 11;
      camera.position.z = Math.cos(angle * 0.3) * 11;
      camera.lookAt(0, 1, 0);

      renderer.render(scene, camera);
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      if (!container || !renderer) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      renderer.dispose();
      if (container) container.innerHTML = '';
    };
  }, [mode]);

  // Handle Mock Image Upload & Analysis (Section 10)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setUploadedImage(reader.result as string);
      // Vision Analysis simulation
      setImageAnalysis({
        palette: ['#020617', '#0f172a', '#10b981', '#38bdf8', '#f59e0b'],
        typography: 'Inter / Vazirmatn (Modern Clean RTL/LTR)',
        hierarchy: ['Top Control Ribbon', 'Left Context Stream', 'Main Dynamic Stage', 'Evidence Ledger'],
        components: ['Status Badges', 'Sovereign Action Buttons', 'Audio Waveform', 'Metric Cards'],
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 font-sans" dir={lang === 'fa' ? 'rtl' : 'ltr'}>
      {/* Studio Header */}
      <div className="border-b border-slate-800 bg-slate-900/90 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Layers className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-slate-100">
                {lang === 'fa' ? 'استودیو مهندسی بصری نوین' : 'NOVIN Visual Engineering Studio'}
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                NN-OMEGA-01
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {lang === 'fa'
                ? 'پیش‌نمایش تعاملی دو بعدی، مدل‌سازی فضایی سه‌بعدی Three.js و تبدیل عکس به رابط کاربری'
                : '2D interactive preview, Three.js 3D spatial visualization & image-to-interface synthesis'}
            </p>
          </div>
        </div>

        {/* Viewport & Mode Toggle */}
        <div className="flex items-center gap-2">
          {/* Mode Switcher */}
          <div className="flex items-center rounded-lg border border-slate-700 bg-slate-800 p-0.5">
            <button
              onClick={() => setMode('2D_PREVIEW')}
              className={`px-3 py-1 rounded text-xs font-bold flex items-center gap-1.5 transition-colors ${
                mode === '2D_PREVIEW'
                  ? 'bg-emerald-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>{lang === 'fa' ? 'پیش‌نمایش ۲ بعدی' : '2D Interactive'}</span>
            </button>
            <button
              onClick={() => setMode('3D_SPATIAL')}
              className={`px-3 py-1 rounded text-xs font-bold flex items-center gap-1.5 transition-colors ${
                mode === '3D_SPATIAL'
                  ? 'bg-emerald-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              <span>{lang === 'fa' ? 'فضای سه‌بعدی (3D)' : '3D Spatial'}</span>
            </button>
          </div>

          {/* Viewport size (for 2D) */}
          {mode === '2D_PREVIEW' && (
            <div className="flex items-center rounded-lg border border-slate-800 bg-slate-900 p-0.5">
              <button
                onClick={() => setDeviceViewport('DESKTOP')}
                className={`p-1.5 rounded transition-colors ${
                  deviceViewport === 'DESKTOP' ? 'bg-slate-800 text-emerald-400' : 'text-slate-500 hover:text-slate-300'
                }`}
                title="Desktop Viewport"
              >
                <Monitor className="w-4 h-4" />
              </button>
              <button
                onClick={() => setDeviceViewport('MOBILE')}
                className={`p-1.5 rounded transition-colors ${
                  deviceViewport === 'MOBILE' ? 'bg-slate-800 text-emerald-400' : 'text-slate-500 hover:text-slate-300'
                }`}
                title="Mobile Viewport (Redmi Note 11)"
              >
                <Smartphone className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Studio Canvas & Inspector Grid */}
      <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-0">
        {/* Stage Area (Col 8 or 9) */}
        <div className="lg:col-span-8 flex flex-col h-full border-r border-slate-800 overflow-y-auto p-4 space-y-4">
          {/* Proposal Summary & Sovereign Approval Bar (Section 7) */}
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800">
                  CHANGE PROPOSAL INSPECTOR
                </span>
                <h3 className="text-xs font-bold text-slate-100 mt-1">{activeProposalTitle}</h3>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  proposalStatus === 'APPROVED'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : proposalStatus === 'CANCELLED'
                    ? 'bg-rose-950 text-rose-300 border border-rose-800'
                    : 'bg-amber-950 text-amber-300 border border-amber-800 animate-pulse'
                }`}
              >
                {proposalStatus}
              </span>
            </div>

            {/* Sovereign 4 Action Buttons (Section 7) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-800/80">
              <button
                onClick={() => setProposalStatus('APPROVED')}
                className="py-1.5 px-3 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{lang === 'fa' ? 'تأیید و اجرا' : 'Approve & Execute'}</span>
              </button>
              <button
                onClick={() => alert('طرح جهت اصلاح پارامترها به حالت ویرایش بازگشت.')}
                className="py-1.5 px-3 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>{lang === 'fa' ? 'ویرایش طرح' : 'Edit Plan'}</span>
              </button>
              <button
                onClick={() => alert('نمایش خط‌به‌خط تفاوت‌های کد فعال شد.')}
                className="py-1.5 px-3 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>{lang === 'fa' ? 'مشاهده تفاوت‌ها' : 'View Diff'}</span>
              </button>
              <button
                onClick={() => setProposalStatus('CANCELLED')}
                className="py-1.5 px-3 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>{lang === 'fa' ? 'لغو' : 'Cancel'}</span>
              </button>
            </div>
          </div>

          {/* Active Canvas / Preview Stage */}
          {mode === '2D_PREVIEW' ? (
            <div
              className={`mx-auto rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl transition-all duration-300 ${
                deviceViewport === 'MOBILE' ? 'w-[360px] min-h-[580px]' : 'w-full min-h-[460px]'
              }`}
            >
              {/* Simulated Device Frame Header */}
              <div className="px-3 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  {deviceViewport === 'MOBILE' ? 'Xiaomi Redmi Note 11 (WebView)' : 'Desktop Studio Canvas'}
                </span>
                <span className="text-[10px] text-slate-500">60 FPS • THREE.JS READY</span>
              </div>

              {/* Live Rendered 2D Component Mockup */}
              <div className="p-4 space-y-4">
                {/* Metric Strip */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-500 block">CPU Thermal</span>
                    <span className="text-xs font-bold text-emerald-400 font-mono">36.5°C</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-500 block">Memory</span>
                    <span className="text-xs font-bold text-sky-400 font-mono">1.8 / 8 GB</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-500 block">Active Layers</span>
                    <span className="text-xs font-bold text-amber-400 font-mono">12 / 12</span>
                  </div>
                </div>

                {/* Simulated Visual Interface Card */}
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-200">مدیریت ماموریت‌های چندلایه نوین</h4>
                    <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                      LIVE SIMULATION
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    این نما نمونه‌ای تعاملی از چیدمان پیشنهادی برای پایش بلادرنگ وظایف و کنترل ایجنت‌های هوش مصنوعی نوین است.
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <button className="px-3 py-1.5 rounded bg-emerald-500 text-slate-950 font-bold text-xs">
                      شروع شبیه‌سازی
                    </button>
                    <button className="px-3 py-1.5 rounded bg-slate-800 text-slate-300 text-xs">
                      بررسی قراردادها
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Mode B: Real 3D Three.js Spatial Scene */
            <div className="relative rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl h-[480px]">
              <div ref={canvasRef} className="w-full h-full" />
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded bg-slate-900/80 border border-slate-800 text-[10px] font-mono text-emerald-400 backdrop-blur">
                THREE.JS WEBGL RENDERER • SPATIAL NODE MAPPING
              </div>
              <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded bg-slate-900/80 border border-slate-800 text-[10px] font-mono text-slate-400 backdrop-blur">
                Rotate: Auto Orbit | Pan: Mouse Drag
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar: Image-to-Interface & Vision Analysis (Col 4) */}
        <div className="lg:col-span-4 flex flex-col h-full bg-slate-950 p-4 space-y-4 overflow-y-auto">
          {/* 1. Image-to-Interface Intake (Section 10) */}
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-sky-400" />
                {lang === 'fa' ? 'تبدیل تصویر به رابط کاربری' : 'Image-to-Interface Intake'}
              </span>
              <span className="text-[10px] font-mono text-slate-500">VISION ENGINE</span>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              {lang === 'fa'
                ? 'اسکرین‌شات یا طرح بصری را بارگذاری کنید تا چیدمان، رنگ‌ها، سلسله‌مراتب و اجزای UI استخراج شوند.'
                : 'Upload a screenshot or mockup to extract layout hierarchy, palette, typography, and UI specs.'}
            </p>

            <label className="flex flex-col items-center justify-center p-4 rounded-lg border-2 border-dashed border-slate-700 bg-slate-950 hover:border-emerald-500/50 cursor-pointer transition-colors">
              <Upload className="w-6 h-6 text-slate-500 mb-1" />
              <span className="text-[11px] text-slate-400">
                {lang === 'fa' ? 'انتخاب تصویر اسکرین‌شات' : 'Select UI Screenshot'}
              </span>
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>

            {uploadedImage && (
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="rounded-lg overflow-hidden border border-slate-800 max-h-36">
                  <img src={uploadedImage} alt="Uploaded UI" className="w-full h-full object-cover" />
                </div>
                {imageAnalysis && (
                  <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-[11px] space-y-1.5 font-mono">
                    <span className="text-emerald-400 font-bold block">تحلیل سلسله‌مراتب و رنگ‌ها:</span>
                    <div className="flex items-center gap-1">
                      {imageAnalysis.palette.map((c, i) => (
                        <div key={i} className="w-5 h-5 rounded border border-slate-700" style={{ backgroundColor: c }} />
                      ))}
                    </div>
                    <p className="text-slate-400 text-[10px]">{imageAnalysis.typography}</p>
                    <ul className="text-slate-500 text-[9px] list-disc list-inside">
                      {imageAnalysis.hierarchy.map((h, i) => (
                        <li key={i}>{h}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 2. Hardware Graphics Disclosure */}
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
            <span className="font-bold text-slate-200 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              {lang === 'fa' ? 'شفافیت پروفایل گرافیکی ران‌تایم' : 'Runtime Graphics Profile'}
            </span>
            <div className="space-y-1 text-[11px] text-slate-400 font-mono">
              <div className="flex justify-between">
                <span>WebGL Layer:</span>
                <span className="text-emerald-400">HARDWARE ACCELERATED</span>
              </div>
              <div className="flex justify-between">
                <span>MIUI Force-Dark Guard:</span>
                <span className="text-emerald-400">FORCE_DARK_OFF</span>
              </div>
              <div className="flex justify-between">
                <span>Physical Redmi Note 11:</span>
                <span className="text-amber-400">NOT VERIFIED ON DEVICE</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
