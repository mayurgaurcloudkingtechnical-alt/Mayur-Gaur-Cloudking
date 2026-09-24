"use client";

import * as React from "react";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import {
  GraduationCap,
  Sparkles,
  Award,
  ShieldCheck,
  BookOpen,
  Building2,
  CheckCircle2,
  ChevronRight,
  Flame,
  Globe2,
} from "lucide-react";
import { openCareerCounselingModal } from "@/components/public/career-counseling-modal";

type FacultyMode = "tech" | "mgmt" | "pharma" | "phd";

interface FacultyData {
  title: string;
  badge: string;
  degrees: string;
  highlightColor: number;
  glowClass: string;
  courses: string[];
}

const FACULTIES: Record<FacultyMode, FacultyData> = {
  tech: {
    title: "Engineering & Technology",
    badge: "AICTE & UGC Aligned",
    degrees: "B.Tech • M.Tech • Polytechnic",
    highlightColor: 0x38bdf8, // Sky Blue
    glowClass: "from-sky-500/20 to-blue-600/20 text-sky-300 border-sky-400/40",
    courses: ["Computer Science (AI & ML)", "Civil Engineering", "Mechanical", "Electrical & Electronics"],
  },
  mgmt: {
    title: "Management & Legal Studies",
    badge: "BCI & Statutory Approved",
    degrees: "MBA • BBA • LLB • BA-LLB • B.Com",
    highlightColor: 0xf59e0b, // Amber Gold
    glowClass: "from-amber-500/20 to-orange-600/20 text-amber-300 border-amber-400/40",
    courses: ["Business Administration (MBA)", "Corporate Law (BA-LLB)", "Financial Accounting", "Executive Leadership"],
  },
  pharma: {
    title: "Pharmacy & Applied Sciences",
    badge: "PCI Approved",
    degrees: "B.Pharma • D.Pharma • B.Sc • M.Sc",
    highlightColor: 0x10b981, // Emerald Green
    glowClass: "from-emerald-500/20 to-teal-600/20 text-emerald-300 border-emerald-400/40",
    courses: ["Bachelor of Pharmacy (PCI)", "Diploma in Pharmacy", "Biotechnology", "Microbiology & Chemistry"],
  },
  phd: {
    title: "Doctoral & Advanced Research",
    badge: "UGC NET / RET Track",
    degrees: "Ph.D (Technical & Non-Technical)",
    highlightColor: 0xa855f7, // Royal Purple
    glowClass: "from-purple-500/20 to-indigo-600/20 text-purple-300 border-purple-400/40",
    courses: ["Ph.D in Computer Science", "Ph.D in Management", "Ph.D in Humanities & Law", "Sponsored Corporate Research"],
  },
};

export function University3DAcademicVisual() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeFaculty, setActiveFaculty] = useState<FacultyMode>("tech");
  const [webglSupported, setWebglSupported] = useState(true);

  const activeData = FACULTIES[activeFaculty];

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    // Check WebGL support
    try {
      const test = document.createElement("canvas");
      const gl = test.getContext("webgl") || test.getContext("experimental-webgl");
      if (!gl) {
        setWebglSupported(false);
        return;
      }
    } catch {
      setWebglSupported(false);
      return;
    }

    let animationFrameId: number;
    const width = container.clientWidth || 480;
    const height = container.clientHeight || 460;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 8.5);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(activeData.highlightColor, 4, 30);
    pointLight.position.set(3, 4, 5);
    scene.add(pointLight);

    const secondaryLight = new THREE.PointLight(0x38bdf8, 3, 30);
    secondaryLight.position.set(-4, -3, 4);
    scene.add(secondaryLight);

    // Group for entire rotating academic hologram
    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // 1. Central Core: Academic Sphere / Icosahedron
    const coreGeo = new THREE.IcosahedronGeometry(1.6, 2);
    const coreMat = new THREE.MeshPhongMaterial({
      color: 0x091426,
      emissive: 0x0c2144,
      wireframe: true,
      transparent: true,
      opacity: 0.85,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    rootGroup.add(coreMesh);

    // Inner Glowing Core
    const innerGeo = new THREE.SphereGeometry(1.1, 32, 32);
    const innerMat = new THREE.MeshBasicMaterial({
      color: activeData.highlightColor,
      transparent: true,
      opacity: 0.35,
      wireframe: true,
    });
    const innerMesh = new THREE.Mesh(innerGeo, innerMat);
    rootGroup.add(innerMesh);

    // 2. Orbital Rings (3 Celestial Academic Orbits)
    const ringMat1 = new THREE.MeshBasicMaterial({
      color: activeData.highlightColor,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
    });
    const ringGeo1 = new THREE.RingGeometry(2.3, 2.36, 64);
    const ring1 = new THREE.Mesh(ringGeo1, ringMat1);
    ring1.rotation.x = Math.PI / 3;
    rootGroup.add(ring1);

    const ringMat2 = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide,
    });
    const ringGeo2 = new THREE.RingGeometry(2.7, 2.75, 64);
    const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
    ring2.rotation.y = Math.PI / 4;
    ring2.rotation.x = -Math.PI / 5;
    rootGroup.add(ring2);

    const ringMat3 = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
    });
    const ringGeo3 = new THREE.RingGeometry(3.1, 3.14, 64);
    const ring3 = new THREE.Mesh(ringGeo3, ringMat3);
    ring3.rotation.x = Math.PI / 2;
    rootGroup.add(ring3);

    // 3. Orbiting Satellites / Academic Nodes (5 Nodes)
    const nodeGeo = new THREE.SphereGeometry(0.18, 16, 16);
    const nodeCount = 5;
    const nodes: THREE.Mesh[] = [];
    for (let i = 0; i < nodeCount; i++) {
      const nodeMat = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? activeData.highlightColor : 0x38bdf8,
      });
      const node = new THREE.Mesh(nodeGeo, nodeMat);
      rootGroup.add(node);
      nodes.push(node);
    }

    // 4. Stardust Particles (180 Floating Knowledge Points)
    const particleCount = 200;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 12;
      particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 12;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }
    particleGeo.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: activeData.highlightColor,
      size: 0.05,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });
    const particleField = new THREE.Points(particleGeo, particleMat);
    scene.add(particleField);

    // Animation Loop
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Root rotation
      rootGroup.rotation.y = elapsed * 0.25;
      rootGroup.rotation.x = Math.sin(elapsed * 0.15) * 0.15;

      // Inner pulsating
      const scale = 1 + Math.sin(elapsed * 2) * 0.04;
      innerMesh.scale.set(scale, scale, scale);

      // Rings counter-rotation
      ring1.rotation.z = elapsed * 0.3;
      ring2.rotation.z = -elapsed * 0.25;
      ring3.rotation.z = elapsed * 0.2;

      // Position orbiting nodes
      for (let i = 0; i < nodeCount; i++) {
        const angle = elapsed * 0.6 + (i * Math.PI * 2) / nodeCount;
        const radius = 2.7;
        nodes[i].position.x = Math.cos(angle) * radius;
        nodes[i].position.y = Math.sin(angle * 1.5) * 0.8;
        nodes[i].position.z = Math.sin(angle) * radius;
      }

      // Slowly rotate background particles
      particleField.rotation.y = elapsed * 0.05;

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth || 480;
      const newHeight = container.clientHeight || 460;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      coreGeo.dispose();
      innerGeo.dispose();
      ringGeo1.dispose();
      ringGeo2.dispose();
      ringGeo3.dispose();
      nodeGeo.dispose();
      particleGeo.dispose();
    };
  }, [activeFaculty]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[480px] sm:h-[520px] rounded-3xl overflow-hidden border border-sky-500/30 bg-gradient-to-br from-slate-950 via-[#071224] to-[#040914] shadow-2xl backdrop-blur-xl flex flex-col justify-between p-5 sm:p-6"
    >
      {/* Background Ambience Glow */}
      <div className="absolute -top-20 -right-20 w-60 h-60 bg-sky-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-sky-400/5 via-transparent to-transparent pointer-events-none" />

      {/* 3D WebGL Canvas Layer */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
      />

      {/* Floating Top Header Overlay */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-sky-600 via-indigo-600 to-sky-400 p-0.5 shadow-md shadow-sky-500/30">
            <div className="h-full w-full rounded-xl bg-slate-950 flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-sky-300" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                UGC 2(f) Recognized
              </span>
            </div>
            <h4 className="text-sm font-black text-white tracking-tight">
              Dr. Preeti Global University
            </h4>
          </div>
        </div>

        <span className="text-[11px] font-mono font-bold text-sky-300 bg-sky-950/80 border border-sky-500/40 px-2.5 py-1 rounded-full shadow-xs">
          Session 2026-27
        </span>
      </div>

      {/* Faculty Mode Interactive Switcher (Center-Bottom) */}
      <div className="relative z-10 space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 bg-slate-950/70 p-1 rounded-xl border border-slate-800/80 backdrop-blur-md">
          <button
            type="button"
            onClick={() => setActiveFaculty("tech")}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all text-center ${
              activeFaculty === "tech"
                ? "bg-sky-500 text-slate-950 shadow-md font-black"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Engineering
          </button>
          <button
            type="button"
            onClick={() => setActiveFaculty("mgmt")}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all text-center ${
              activeFaculty === "mgmt"
                ? "bg-amber-500 text-slate-950 shadow-md font-black"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Management & Law
          </button>
          <button
            type="button"
            onClick={() => setActiveFaculty("pharma")}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all text-center ${
              activeFaculty === "pharma"
                ? "bg-emerald-500 text-slate-950 shadow-md font-black"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Pharmacy
          </button>
          <button
            type="button"
            onClick={() => setActiveFaculty("phd")}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all text-center ${
              activeFaculty === "phd"
                ? "bg-purple-500 text-slate-950 shadow-md font-black"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Ph.D Research
          </button>
        </div>

        {/* Dynamic Faculty Showcase Card */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-md space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              {activeData.title}
            </span>
            <span className="text-[10px] font-bold text-slate-400 font-mono">
              {activeData.badge}
            </span>
          </div>

          <div className="text-[11px] font-semibold text-emerald-400">
            {activeData.degrees}
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {activeData.courses.map((c, idx) => (
              <span
                key={idx}
                className="text-[10px] bg-slate-950/80 border border-slate-800 text-slate-300 px-2 py-0.5 rounded-md"
              >
                {c}
              </span>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              SoftLab Global Facilitation Center
            </span>
            <button
              type="button"
              onClick={() => openCareerCounselingModal("Dr. Preeti Global University Programs")}
              className="inline-flex items-center gap-1 text-xs font-bold text-sky-400 hover:text-sky-300 transition"
            >
              Apply / Counsel Desk <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
